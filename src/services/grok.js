// Grok AI Service for image-based test case generation
const PlaywrightTestService = require('./playwright');
const fs = require('fs');
const path = require('path');

class GrokService {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.baseURL = 'https://api.groq.com/openai/v1';
        this.isConnected = false;
        this.connectionError = null;
    }

    // Test API connectivity
    async testConnection() {
        if (!this.apiKey || this.apiKey === 'your-groq-api-key-here') {
            this.isConnected = false;
            this.connectionError = 'API key not configured';
            return false;
        }

        try {
            console.log(`🔍 Testing Groq API connection...`);
            const response = await fetch(`${this.baseURL}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.isConnected = true;
                this.connectionError = null;
                console.log(`✅ Groq API connection successful`);
                return true;
            } else {
                this.isConnected = false;
                this.connectionError = `API responded with status ${response.status}`;
                console.log(`❌ Groq API connection failed: ${this.connectionError}`);
                return false;
            }
        } catch (error) {
            this.isConnected = false;
            this.connectionError = error.message;
            console.log(`❌ Groq API connection error: ${error.message}`);
            return false;
        }
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
            console.log(`🚀 Starting browse and generate test for URL: ${url}`);
            
            // Initialize browser and navigate to URL (use headless mode in production/CI environments)
            console.log(`🌐 Opening browser for URL analysis...`);
            const isHeadless = process.env.NODE_ENV === 'production' || !process.env.DISPLAY;
            await playwrightService.initialize('chromium', isHeadless);
            console.log(`✅ Browser opened successfully in ${isHeadless ? 'headless' : 'visible'} mode`);
            
            console.log(`🔗 Navigating to URL: ${url}`);
            await playwrightService.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            console.log(`✅ Successfully navigated to ${url}`);
            
            // Wait a bit for dynamic content to load
            console.log(`⏳ Waiting for dynamic content to load...`);
            await playwrightService.page.waitForTimeout(3000);
            console.log(`✅ Page content loaded, ready for screenshot`);
            
            // Take a screenshot
            console.log(`📸 Preparing to capture screenshot...`);
            const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
                console.log(`📁 Created screenshot directory: ${screenshotDir}`);
            }
            
            screenshotPath = path.join(screenshotDir, `browse-analysis-${Date.now()}.png`);
            console.log(`📸 Taking full-page screenshot: ${screenshotPath}`);
            await playwrightService.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true,
                type: 'png'
            });

            console.log(`✅ Screenshot captured successfully: ${screenshotPath}`);

            // Close browser
            console.log(`🔒 Closing browser...`);
            await playwrightService.close();
            console.log(`✅ Browser closed successfully`);

            // Test API connection before attempting AI analysis
            const isConnected = await this.testConnection();
            
            // Analyze screenshot with Grok AI if API key is available and working
            if (isConnected) {
                console.log(`🤖 Groq API connected, starting AI analysis...`);
                return await this.analyzeScreenshotWithGrok(url, screenshotPath);
            } else {
                console.log(`⚠️  Groq AI not connected: ${this.connectionError || 'Unknown error'}`);
                console.log(`💡 To enable AI-powered test generation:`);
                console.log(`   1. Get a Groq API key from https://console.groq.com/`);
                console.log(`   2. Add GROQ_API_KEY=your-actual-key to your .env file`);
                console.log(`   3. Restart the application`);
                console.log(`🔄 Using intelligent fallback test generation instead...`);
                
                // Clean up screenshot file if AI analysis is not available
                this.cleanupScreenshot(screenshotPath);
                
                // Fallback: Generate basic test case without AI analysis
                return this.generateBasicTestFromURL(url);
            }

        } catch (error) {
            console.error(`❌ Error in browse and generate test: ${error.message}`);
            console.error(`🔍 Full error details:`, error);
            
            // Clean up browser if still open
            try {
                if (playwrightService.browser) {
                    console.log(`🧹 Cleaning up browser connection...`);
                    await playwrightService.close();
                    console.log(`✅ Browser cleanup completed`);
                }
            } catch (cleanupError) {
                console.error(`❌ Cleanup error: ${cleanupError.message}`);
            }

            // Clean up screenshot file if it exists
            this.cleanupScreenshot(screenshotPath);

            console.log(`🔄 Falling back to basic test generation`);
            // Return fallback test case
            return this.generateBasicTestFromURL(url);
        }
    }

    // Analyze screenshot with Grok AI or fallback to text-based analysis
    async analyzeScreenshotWithGrok(url, screenshotPath) {
        try {
            console.log(`🤖 Starting Groq AI analysis for URL: ${url}`);
            
            // Read screenshot file for potential future use
            let imageAnalysisPrompt = '';
            
            // Check if the screenshot exists and get basic page information
            if (fs.existsSync(screenshotPath)) {
                // For now, we'll use text-based analysis since Groq models may not support vision
                // In the future, this could be enhanced to support vision models if available
                imageAnalysisPrompt = `\n\nNote: A screenshot was taken of the page for context, showing the current state of the UI.`;
                console.log(`📷 Screenshot available for analysis context: ${screenshotPath}`);
            }

            console.log(`📡 Sending request to Groq AI API...`);
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

            console.log(`📬 AI request sent, waiting for response...`);
            const data = await response.json();
            
            if (!response.ok) {
                console.error(`❌ Groq API error - Status: ${response.status}`);
                console.error(`❌ Error details:`, data);
                throw new Error(`Groq API error: ${data.error?.message || 'Unknown error'}`);
            }

            console.log(`✅ Received response from Groq AI`);
            const content = data.choices[0]?.message?.content;
            if (!content) {
                console.error(`❌ No response content from Groq`);
                throw new Error('No response content from Groq');
            }

            console.log(`🔍 Groq response received, parsing JSON...`);
            console.log(`📝 Response preview: ${content.substring(0, 200)}...`);

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                console.log(`✅ JSON pattern found in response, parsing...`);
                const result = JSON.parse(jsonMatch[0]);
                if (result?.testCase?.actions) {
                    result.testCase.actions = this.normalizeActions(result.testCase.actions);
                    console.log(`✅ Test case generated with ${result.testCase.actions.length} actions`);
                }
                
                // Clean up screenshot after successful analysis
                this.cleanupScreenshot(screenshotPath);
                
                console.log(`🎉 Test case generated successfully from Groq analysis`);
                return result;
            }

            console.error(`❌ Could not extract JSON from Groq response`);
            throw new Error('Could not extract JSON from Groq response');

        } catch (error) {
            console.warn(`⚠️  Groq analysis failed: ${error.message}`);
            console.error(`🔍 Full error details:`, error);
            
            // Clean up screenshot on error
            this.cleanupScreenshot(screenshotPath);
            
            console.log(`🔄 Falling back to intelligent basic test generation`);
            return this.generateBasicTestFromURL(url);
        }
    }

    // Generate basic test case without AI (fallback)
    generateBasicTestFromURL(url) {
        console.log(`🔧 Generating basic test case (fallback) for: ${url}`);
        
        const domain = this.extractDomainFromURL(url);
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        console.log(`🌐 Extracted domain: ${domain}, path: ${path}`);
        
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
            console.log(`🔧 Adding Git platform specific actions`);
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
            console.log(`🔍 Adding search engine specific actions`);
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
            console.log(`🛒 Adding e-commerce specific actions`);
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
            console.log(`🌐 Adding generic website actions`);
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

        console.log(`✅ Generated basic test case with ${actions.length} actions`);
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
                console.log(`🧹 Screenshot cleaned up successfully: ${screenshotPath}`);
            } catch (unlinkError) {
                console.error(`❌ Failed to clean up screenshot: ${unlinkError.message}`);
            }
        } else if (screenshotPath) {
            console.log(`ℹ️  Screenshot file not found for cleanup: ${screenshotPath}`);
        }
    }
}

module.exports = GrokService;