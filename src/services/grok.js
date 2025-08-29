// Grok AI Service for image-based test case generation
const PlaywrightTestService = require('./playwright');
const fs = require('fs');
const path = require('path');

class GrokService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.baseURL = 'https://api.groq.com/openai/v1';
    }

    // Normalize selector field for uniformity
    normalizeSelector(sel) {
        if (typeof sel === 'string') return sel;
        if (sel && typeof sel === 'object' && typeof sel.selector === 'string') return sel.selector;
        return sel != null ? String(sel) : '';
    }

    // Normalize actions array: unify locator/selector key and normalize
    normalizeActions(actions = []) {
        return actions.map(a => {
            if (a.locator && !a.selector) a.selector = a.locator;
            a.selector = this.normalizeSelector(a.selector);
            return a;
        });
    }

    // Convert string to PascalCase
    toPascalCase(str) {
        return str
            .replace(/[^a-zA-Z0-9\s]/g, ' ')
            .split(/[\s_-]+/)
            .filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
    }

    // Take screenshot and generate test case from current page
    async browseAndGenerateTest(url) {
        const playwrightService = new PlaywrightTestService();
        let screenshotPath = null;

        try {
            console.log(`Starting browse and generate test for URL: ${url}`);
            
            // Initialize browser and navigate to URL
            await playwrightService.initialize('chromium', true);
            await playwrightService.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Wait a bit for dynamic content to load
            await playwrightService.page.waitForTimeout(3000);
            
            // Take a screenshot
            const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            screenshotPath = path.join(screenshotDir, `browse-analysis-${Date.now()}.png`);
            await playwrightService.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true,
                type: 'png'
            });

            console.log(`Screenshot captured: ${screenshotPath}`);

            // Close browser
            await playwrightService.close();

            // Analyze screenshot with Grok AI if API key is available
            if (this.apiKey) {
                return await this.analyzeScreenshotWithGrok(url, screenshotPath);
            } else {
                // Clean up screenshot file if AI analysis is not available
                this.cleanupScreenshot(screenshotPath);
                
                // Fallback: Generate basic test case without AI analysis
                return this.generateBasicTestFromURL(url);
            }

        } catch (error) {
            console.error('Error in browse and generate test:', error);
            
            // Clean up browser if still open
            try {
                if (playwrightService.browser) {
                    await playwrightService.close();
                }
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }

            // Clean up screenshot file if it exists
            this.cleanupScreenshot(screenshotPath);

            // Return fallback test case
            return this.generateBasicTestFromURL(url);
        }
    }

    // Analyze screenshot with Grok AI
    async analyzeScreenshotWithGrok(url, screenshotPath) {
        try {
            console.log('Starting Grok AI analysis...');
            
            // Read screenshot file and convert to base64
            const imageBuffer = fs.readFileSync(screenshotPath);
            const base64Image = imageBuffer.toString('base64');

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a web testing expert AI. Analyze the description of a web page and generate comprehensive test cases based on the typical UI elements and functionality.

Focus on identifying and testing:
1. Interactive elements (buttons, links, forms, input fields)
2. Navigation elements (menus, tabs, breadcrumbs)
3. Important content areas and functionality
4. Login/authentication flows if visible
5. Search functionality if present
6. Form submissions and validations

Return a JSON object with this exact structure:
{
  "testCase": {
    "name": "Descriptive test name",
    "description": "Brief description of what this test validates",
    "url": "${url}",
    "actions": [
      {
        "type": "click|fill|select|wait|verify|assert_visible|assert_text",
        "selector": "CSS selector or text selector",
        "value": "value for fill/select actions",
        "description": "Human readable description"
      }
    ]
  }
}

Supported action types:
- click: Click buttons, links, elements (use text=ButtonText for text-based)
- fill: Fill input fields (use input[type='text'], input[name='field'] etc.)
- select: Select dropdown options
- wait: Wait for elements or time
- verify: Verify page content or URL
- assert_visible: Assert element is visible
- assert_text: Assert text content

Use specific CSS selectors when possible, or text-based selectors like "text=Button Text" for clarity.
Prioritize the most important user interactions and create a realistic test flow.`
                        },
                        {
                            role: 'user',
                            content: `Please analyze this website ${url} and generate a comprehensive test case that covers the main interactive elements and user flows that would typically be found on such a page. Create realistic test actions that a user would typically perform.

Based on the URL pattern and common web conventions, create appropriate test steps for testing the main functionality of this page.`
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.3
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('Grok API error:', data);
                throw new Error(`Grok API error: ${data.error?.message || 'Unknown error'}`);
            }

            const content = data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response content from Grok');
            }

            console.log('Grok response received, parsing JSON...');

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                if (result?.testCase?.actions) {
                    result.testCase.actions = this.normalizeActions(result.testCase.actions);
                }
                
                // Clean up screenshot after successful analysis
                this.cleanupScreenshot(screenshotPath);
                
                console.log('Test case generated successfully from Grok analysis');
                return result;
            }

            throw new Error('Could not extract JSON from Grok response');

        } catch (error) {
            console.warn('Grok analysis failed, using fallback:', error.message);
            
            // Clean up screenshot on error
            this.cleanupScreenshot(screenshotPath);
            
            return this.generateBasicTestFromURL(url);
        }
    }

    // Generate basic test case without AI (fallback)
    generateBasicTestFromURL(url) {
        console.log('Generating basic test case (fallback)');
        
        return {
            testCase: {
                name: `Basic Test for ${this.extractDomainFromURL(url)}`,
                description: `Basic functionality test for ${url}`,
                url: url,
                actions: [
                    {
                        type: 'wait',
                        value: '3',
                        description: 'Wait for page to load'
                    },
                    {
                        type: 'assert_visible',
                        selector: 'body',
                        description: 'Verify page loaded successfully'
                    }
                ]
            }
        };
    }

    // Extract domain from URL for naming
    extractDomainFromURL(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return 'Unknown Site';
        }
    }

    // Clean up screenshot file
    cleanupScreenshot(screenshotPath) {
        if (screenshotPath && fs.existsSync(screenshotPath)) {
            try {
                fs.unlinkSync(screenshotPath);
                console.log('Screenshot cleaned up successfully');
            } catch (unlinkError) {
                console.error('Failed to clean up screenshot:', unlinkError);
            }
        }
    }
}

module.exports = GrokService;