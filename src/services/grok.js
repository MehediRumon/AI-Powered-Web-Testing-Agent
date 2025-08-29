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

    // Analyze screenshot with Grok AI or fallback to text-based analysis
    async analyzeScreenshotWithGrok(url, screenshotPath) {
        try {
            console.log('Starting Grok AI analysis...');
            
            // Read screenshot file for potential future use
            let imageAnalysisPrompt = '';
            
            // Check if the screenshot exists and get basic page information
            if (fs.existsSync(screenshotPath)) {
                // For now, we'll use text-based analysis since Groq models may not support vision
                // In the future, this could be enhanced to support vision models if available
                imageAnalysisPrompt = `\n\nNote: A screenshot was taken of the page for context, showing the current state of the UI.`;
                console.log('Screenshot available for analysis context');
            }

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
                            content: `You are a web testing expert AI. Analyze a website URL and generate comprehensive test cases based on common UI patterns and functionality for this type of website.

Focus on identifying and testing:
1. Interactive elements (buttons, links, forms, input fields)
2. Navigation elements (menus, tabs, breadcrumbs)
3. Important content areas and functionality
4. Login/authentication flows if typical for this site type
5. Search functionality if commonly found on such sites
6. Form submissions and validations
7. Core user workflows and interactions

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
- wait: Wait for elements or time (value in seconds)
- verify: Verify page content or URL
- assert_visible: Assert element is visible
- assert_text: Assert text content

Use specific CSS selectors when possible, or text-based selectors like "text=Button Text" for clarity.
Create realistic test actions that a user would typically perform on this type of website.
Focus on the most important user interactions and create a comprehensive test flow.`
                        },
                        {
                            role: 'user',
                            content: `Please analyze this website ${url} and generate a comprehensive test case that covers the main interactive elements and user flows that would typically be found on such a page.

Based on the URL pattern, domain, and common web conventions, create appropriate test steps for testing the main functionality of this page. Consider what type of website this appears to be and what users typically do on such sites.${imageAnalysisPrompt}

Generate test actions that cover:
1. Page loading and basic navigation
2. Key interactive elements typical for this type of site
3. Common user workflows
4. Form interactions if applicable
5. Important functionality verification

Make the test comprehensive but realistic for this specific URL.`
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
        
        const domain = this.extractDomainFromURL(url);
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        // Create more intelligent basic tests based on URL patterns
        const actions = [
            {
                type: 'wait',
                value: '3',
                description: 'Wait for page to load completely'
            },
            {
                type: 'assert_visible',
                selector: 'body',
                description: 'Verify page loaded successfully'
            }
        ];

        // Add common test actions based on URL patterns
        if (domain.includes('github') || domain.includes('gitlab')) {
            actions.push(
                {
                    type: 'assert_visible',
                    selector: 'nav, header',
                    description: 'Verify navigation is visible'
                },
                {
                    type: 'click',
                    selector: 'text=Sign in',
                    description: 'Click sign in button if available'
                }
            );
        } else if (domain.includes('google') || domain.includes('bing')) {
            actions.push(
                {
                    type: 'assert_visible',
                    selector: 'input[type="search"], input[name*="q"]',
                    description: 'Verify search box is visible'
                },
                {
                    type: 'fill',
                    selector: 'input[type="search"], input[name*="q"]',
                    value: 'test search',
                    description: 'Enter test search query'
                }
            );
        } else if (domain.includes('shop') || domain.includes('store') || domain.includes('amazon') || domain.includes('ebay')) {
            actions.push(
                {
                    type: 'assert_visible',
                    selector: 'input[type="search"], [placeholder*="search"]',
                    description: 'Verify search functionality is available'
                },
                {
                    type: 'click',
                    selector: 'text=Cart, text=Basket, [data-testid*="cart"]',
                    description: 'Check shopping cart accessibility'
                }
            );
        } else {
            // Generic website actions
            actions.push(
                {
                    type: 'assert_visible',
                    selector: 'nav, .nav, #nav, .navigation, .menu',
                    description: 'Verify main navigation is present'
                },
                {
                    type: 'click',
                    selector: 'a[href*="about"], text=About, text=About Us',
                    description: 'Navigate to About page if available'
                },
                {
                    type: 'click',
                    selector: 'a[href*="contact"], text=Contact, text=Contact Us',
                    description: 'Check contact page accessibility'
                }
            );
        }

        return {
            testCase: {
                name: `Smart Basic Test for ${domain}`,
                description: `Intelligent basic functionality test for ${url} with URL-pattern based actions`,
                url: url,
                actions: actions
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