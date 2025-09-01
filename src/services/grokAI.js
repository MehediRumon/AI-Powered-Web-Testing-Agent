// Grok AI Service (xAI) for image-based test case generation
const PlaywrightTestService = require('./playwright');
const fs = require('fs');
const path = require('path');

// Ensure fetch is available (Node.js 18+ has global fetch, fallback for older versions)
const fetch = globalThis.fetch || require('node-fetch');

class GrokAIService {
    constructor() {
        this.apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
        this.baseURL = 'https://api.x.ai/v1'; // xAI/Grok API endpoint
        this.isConnected = false;
        this.connectionError = null;
    }

    // Test API connectivity
    async testConnection() {
        if (!this.apiKey || this.apiKey === 'your-grok-api-key-here') {
            this.isConnected = false;
            this.connectionError = 'Grok API key not configured';
            return false;
        }

        try {
            console.log(`🔍 Testing Grok AI API connection...`);
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
                console.log(`✅ Grok AI API connection successful`);
                return true;
            } else {
                this.isConnected = false;
                this.connectionError = `Grok API responded with status ${response.status}`;
                console.log(`❌ Grok AI API connection failed: ${this.connectionError}`);
                return false;
            }
        } catch (error) {
            this.isConnected = false;
            this.connectionError = error.message;
            console.log(`❌ Grok AI API connection error: ${error.message}`);
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

    // Take screenshot and generate test case from current page using Grok AI vision
    async browseAndGenerateTest(url) {
        const playwrightService = new PlaywrightTestService();
        let screenshotPath = null;

        try {
            console.log(`🚀 Starting Grok AI browse and generate test for URL: ${url}`);
            
            // Initialize browser in non-headless mode as required
            console.log(`🌐 Opening browser in visible mode for Grok AI analysis...`);
            await playwrightService.initialize('chromium', false);
            console.log(`✅ Browser opened successfully in visible mode for Grok AI`);
            
            console.log(`🔗 Navigating to URL: ${url}`);
            await playwrightService.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            console.log(`✅ Successfully navigated to ${url}`);
            
            // Wait a bit for dynamic content to load
            console.log(`⏳ Waiting for dynamic content to load...`);
            await playwrightService.page.waitForTimeout(3000);
            console.log(`✅ Page content loaded, ready for screenshot`);
            
            // Take a screenshot for Grok AI analysis
            console.log(`📸 Preparing to capture screenshot for Grok AI...`);
            const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
                console.log(`📁 Created screenshot directory: ${screenshotDir}`);
            }
            
            screenshotPath = path.join(screenshotDir, `grok-analysis-${Date.now()}.png`);
            console.log(`📸 Taking full-page screenshot for Grok AI: ${screenshotPath}`);
            
            // Take high-quality screenshot with optimized settings
            await playwrightService.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true,
                type: 'png',
                quality: 90,
                timeout: 30000  // 30 second timeout for large pages
            });

            // Verify screenshot was created successfully
            if (!fs.existsSync(screenshotPath)) {
                throw new Error('Screenshot file was not created successfully');
            }
            
            const screenshotStats = fs.statSync(screenshotPath);
            console.log(`✅ Screenshot captured successfully: ${screenshotPath} (${(screenshotStats.size / 1024).toFixed(2)} KB)`);

            // Close browser
            console.log(`🔒 Closing browser...`);
            await playwrightService.close();
            console.log(`✅ Browser closed successfully`);

            // Test API connection before attempting AI analysis
            const isConnected = await this.testConnection();
            
            // Analyze screenshot with Grok AI if API key is available and working
            if (isConnected) {
                console.log(`🤖 Grok AI connected, starting vision-based analysis...`);
                return await this.analyzeScreenshotWithGrokAI(url, screenshotPath);
            } else {
                console.log(`⚠️  Grok AI not connected: ${this.connectionError || 'Unknown error'}`);
                console.log(`💡 To enable Grok AI-powered test generation:`);
                console.log(`   1. Get a Grok API key from https://console.x.ai/`);
                console.log(`   2. Add GROK_API_KEY=your-actual-key to your .env file`);
                console.log(`   3. Restart the application`);
                console.log(`🔄 Using intelligent fallback test generation instead...`);
                
                // Clean up screenshot file if AI analysis is not available
                this.cleanupScreenshot(screenshotPath);
                
                // Fallback: Generate basic test case without AI analysis
                return this.generateBasicTestFromURL(url);
            }

        } catch (error) {
            console.error(`❌ Error in Grok AI browse and generate test: ${error.message}`);
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

    // Analyze screenshot with Grok AI vision model
    async analyzeScreenshotWithGrokAI(url, screenshotPath) {
        try {
            console.log(`🤖 Starting Grok AI vision analysis for URL: ${url}`);
            
            // Read screenshot file and convert to base64
            const imageBuffer = fs.readFileSync(screenshotPath);
            const fileSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2);
            console.log(`📷 Screenshot loaded: ${screenshotPath} (${fileSizeMB} MB)`);
            
            // Validate file size (Grok AI has limits on image size)
            if (imageBuffer.length > 20 * 1024 * 1024) { // 20MB limit
                console.warn(`⚠️  Screenshot is large (${fileSizeMB} MB). This may affect processing time or cause API limits.`);
            }
            
            const base64Image = imageBuffer.toString('base64');
            console.log(`📷 Screenshot converted to base64 successfully (${base64Image.length} characters)`);

            console.log(`📡 Sending screenshot to Grok AI vision model...`);
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'grok-vision-beta', // Grok's vision model
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert web testing AI assistant. Analyze the provided screenshot of a website and generate comprehensive test cases based on the visible UI elements and user interactions.

Your analysis should focus on:
1. Interactive elements (buttons, links, forms, input fields)
2. Navigation components (menus, tabs, breadcrumbs)
3. Important content areas and functionality
4. Login/authentication flows if visible
5. Search functionality if present
6. Form submissions and validations
7. Core user workflows and interactions

Generate realistic test scenarios that a user would typically perform on this type of website.

IMPORTANT: Return ONLY a JSON object with this exact structure:
{
  "testCase": {
    "name": "Descriptive test name based on what you see",
    "description": "Brief description of what this test validates",
    "url": "${url}",
    "actions": [
      {
        "type": "action_type",
        "selector": "css_selector_or_text_selector",
        "value": "input_value_for_fill_actions",
        "description": "Human readable description of this step"
      }
    ]
  }
}

Supported action types:
- navigate: Navigate to a URL
- click: Click buttons, links, elements (use "text=Button Text" for visible text)
- fill: Fill input fields with text
- select: Select dropdown options
- wait: Wait for elements or time (value in seconds)
- verify: Verify page content or URL redirections
- assert_visible: Assert element is visible
- assert_text: Assert specific text content

Use specific CSS selectors when possible, or text-based selectors like "text=Button Text" for clarity.
Create a comprehensive test flow with 5-10 actions that cover the main functionality visible in the screenshot.
Make sure every action has a clear, descriptive explanation.`
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Please analyze this screenshot of ${url} and generate a comprehensive test case that covers the main interactive elements and user flows visible on the page. Focus on what a real user would do when visiting this website.`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/png;base64,${base64Image}`,
                                        detail: 'high'
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 2000,
                    temperature: 0.2
                })
            });

            console.log(`📬 Grok AI vision request sent, waiting for response...`);
            
            const data = await response.json();
            
            if (!response.ok) {
                console.error(`❌ Grok AI API error - Status: ${response.status}`);
                console.error(`❌ Error details:`, data);
                
                // Provide specific error messages based on status codes
                let errorMessage = `Grok AI API error: ${data.error?.message || 'Unknown error'}`;
                if (response.status === 401) {
                    errorMessage = 'Grok AI authentication failed. Please check your API key.';
                } else if (response.status === 429) {
                    errorMessage = 'Grok AI rate limit exceeded. Please try again later.';
                } else if (response.status === 413) {
                    errorMessage = 'Screenshot too large for Grok AI processing. Try a smaller page or different settings.';
                }
                
                throw new Error(errorMessage);
            }

            console.log(`✅ Received response from Grok AI vision model`);
            const content = data.choices[0]?.message?.content;
            if (!content) {
                console.error(`❌ No response content from Grok AI`);
                throw new Error('No response content from Grok AI');
            }

            console.log(`🔍 Grok AI response received, parsing JSON...`);
            console.log(`📝 Response preview: ${content.substring(0, 200)}...`);

            // Extract and parse JSON from response with enhanced error handling
            let jsonMatch = content.match(/\{[\s\S]*\}/);
            
            // Try alternative JSON extraction patterns if first fails
            if (!jsonMatch) {
                // Try extracting JSON between ```json blocks
                jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
                if (jsonMatch) jsonMatch = [jsonMatch[1]];
                
                // Try extracting JSON after "testCase:" keyword
                if (!jsonMatch) {
                    const testCaseMatch = content.match(/testCase['":\s]*(\{[\s\S]*\})/i);
                    if (testCaseMatch) jsonMatch = [testCaseMatch[1]];
                }
            }
            
            if (jsonMatch) {
                console.log(`✅ JSON pattern found in Grok AI response, parsing...`);
                try {
                    const result = JSON.parse(jsonMatch[0]);
                    
                    // Ensure proper structure
                    if (!result.testCase && result.name && result.actions) {
                        // If response is a flat structure, wrap it in testCase
                        const wrappedResult = { testCase: result };
                        result = wrappedResult;
                    }
                    
                    if (result?.testCase?.actions) {
                        result.testCase.actions = this.normalizeActions(result.testCase.actions);
                        console.log(`✅ Test case generated with ${result.testCase.actions.length} actions from Grok AI vision analysis`);
                        
                        // Auto-parse validation
                        this.validateTestCase(result.testCase);
                    }
                    
                    // Clean up screenshot after successful analysis
                    this.cleanupScreenshot(screenshotPath);
                    
                    console.log(`🎉 Test case generated successfully from Grok AI vision analysis`);
                    return result;
                } catch (parseError) {
                    console.error(`❌ JSON parsing failed: ${parseError.message}`);
                    console.error(`📝 Raw JSON content: ${jsonMatch[0].substring(0, 500)}...`);
                    throw new Error(`Failed to parse Grok AI response JSON: ${parseError.message}`);
                }
            }

            console.error(`❌ Could not extract JSON from Grok AI response`);
            throw new Error('Could not extract JSON from Grok AI response');

        } catch (error) {
            console.warn(`⚠️  Grok AI vision analysis failed: ${error.message}`);
            console.error(`🔍 Full error details:`, error);
            
            // Clean up screenshot on error
            this.cleanupScreenshot(screenshotPath);
            
            console.log(`🔄 Falling back to intelligent basic test generation`);
            return this.generateBasicTestFromURL(url);
        }
    }

    // Validate generated test case structure (auto-parsing validation)
    validateTestCase(testCase) {
        console.log(`🔍 Validating auto-parsed test case structure...`);
        
        const issues = [];
        
        if (!testCase.name || typeof testCase.name !== 'string') {
            issues.push('Missing or invalid test name');
        }
        
        if (!testCase.url || typeof testCase.url !== 'string') {
            issues.push('Missing or invalid test URL');
        }
        
        if (!Array.isArray(testCase.actions)) {
            issues.push('Actions must be an array');
        } else {
            testCase.actions.forEach((action, index) => {
                if (!action.type) {
                    issues.push(`Action ${index + 1}: Missing action type`);
                }
                if (!action.description) {
                    issues.push(`Action ${index + 1}: Missing description`);
                }
                if (['fill', 'select'].includes(action.type) && !action.value) {
                    issues.push(`Action ${index + 1}: Missing value for ${action.type} action`);
                }
            });
        }
        
        if (issues.length > 0) {
            console.warn(`⚠️  Test case validation issues found:`);
            issues.forEach(issue => console.warn(`   - ${issue}`));
        } else {
            console.log(`✅ Test case structure validated successfully`);
        }
        
        return issues.length === 0;
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

module.exports = GrokAIService;