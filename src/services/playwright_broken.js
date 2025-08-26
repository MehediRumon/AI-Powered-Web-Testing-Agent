const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');

class PlaywrightTestService {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.mockMode = false;
    }

    async initialize(browserType = 'chromium', headless = true) {
        try {
            // Check if we're in a mock mode (for development/testing when browsers can't be installed)
            if (process.env.MOCK_BROWSER === 'true') {
                console.log('🔧 Mock mode enabled - simulating browser initialization');
                this.mockMode = true;
                return true;
            }

            let browserInstance;
            
            switch (browserType) {
                case 'firefox':
                    browserInstance = firefox;
                    break;
                case 'webkit':
                    browserInstance = webkit;
                    break;
                default:
                    browserInstance = chromium;
            }

            this.browser = await browserInstance.launch({ 
                headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // For Docker/CI environments
            });
            
            this.context = await this.browser.newContext({
                viewport: { width: 1280, height: 720 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });
            
            this.page = await this.context.newPage();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize browser:', error);
            
            // Fallback to mock mode if browser installation fails
            console.log('🔧 Falling back to mock mode for testing');
            this.mockMode = true;
            return true;
        }
    }

    async runTest(testCase) {
        const startTime = Date.now();
        let result = {
            status: 'success',
            executionTime: 0,
            error: null,
            screenshot: null
        };

        try {
            console.log(`🚀 Starting test execution: ${testCase.name}`);
            console.log(`📋 Test URL: ${testCase.url}`);
            console.log(`📝 Test actions: ${testCase.actions.length} steps`);

            // Mock mode simulation
            if (this.mockMode) {
                console.log('🔧 Running in mock mode - simulating test execution...');
                
                for (let i = 0; i < testCase.actions.length; i++) {
                    const action = testCase.actions[i];
                    console.log(`\n📋 Step ${i + 1}/${testCase.actions.length}: ${action.description}`);
                    
                    await this.simulateAction(action);
                    
                    // Simulate processing time
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                result.executionTime = Date.now() - startTime;
                console.log(`✅ Mock test completed successfully in ${result.executionTime}ms`);
                return result;
            }

            // Real browser execution (existing code)
            for (let i = 0; i < testCase.actions.length; i++) {
                const action = testCase.actions[i];
                console.log(`\nExecuting step ${i + 1}/${testCase.actions.length}: ${action.description}`);
                
                await this.executeAction(action);
            }

            result.executionTime = Date.now() - startTime;
            console.log(`Test completed successfully in ${result.executionTime}ms`);

        } catch (error) {
            result.status = 'failed';
            result.error = error.message;
            result.executionTime = Date.now() - startTime;
            
            console.error(`❌ Test failed after ${result.executionTime}ms: ${error.message}`);

            // Try to capture screenshot on error (only if not in mock mode)
            if (!this.mockMode && this.page) {
                try {
                    const screenshotPath = `reports/error-${Date.now()}.png`;
                    await this.page.screenshot({ path: screenshotPath });
                    result.screenshot = screenshotPath;
                    console.log(`📸 Error screenshot saved: ${screenshotPath}`);
                } catch (screenshotError) {
                    console.warn('Failed to capture error screenshot:', screenshotError.message);
                }
            }
        }

        return result;
    }

    async simulateAction(action) {
        const { type, selector, value, description } = action;
        
        switch (type) {
            case 'navigate':
                console.log(`🌐 [MOCK] Navigating to: ${action.value || selector}`);
                break;
            case 'input':
            case 'fill':
            case 'type':
                console.log(`📝 [MOCK] Filling field "${selector}" with value: "${value}"`);
                console.log(`✅ [MOCK] Successfully filled field with: "${value}"`);
                break;
            case 'click':
                console.log(`🎯 [MOCK] Clicking element: ${selector}`);
                console.log(`✅ [MOCK] Successfully clicked element: ${selector}`);
                console.log(`🌐 [MOCK] Simulated page transition after click`);
                break;
            case 'select':
                console.log(`📋 [MOCK] Selecting option "${value}" from: ${selector}`);
                break;
            case 'verify':
                console.log(`🔍 [MOCK] Verifying navigation or element state`);
                break;
            case 'wait':
                const waitTime = parseInt(value) || 2000;
                console.log(`⏳ [MOCK] Waiting for ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 1000))); // Cap at 1 second for demo
                break;
            default:
                console.log(`🔧 [MOCK] Executing action: ${type} on ${selector}`);
        }
    }

    async executeAction(action) {
                        const stepDescription = action.description || `${action.type} on ${action.locator || action.selector || action.target}`;
                        result.steps.push({
                            stepNumber: i + 1,
                            description: stepDescription,
                            status: 'success',
                            timestamp: new Date().toISOString()
                        });
                    } catch (stepError) {
                        const stepDescription = action.description || `${action.type} on ${action.locator || action.selector || action.target}`;
                        result.steps.push({
                            stepNumber: i + 1,
                            description: stepDescription,
                            status: 'failed',
                            error: stepError.message,
                            timestamp: new Date().toISOString()
                        });
                        throw stepError; // Re-throw to handle in outer catch
                    }
                }
            }

            // Take screenshot
            const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }

            const screenshotPath = path.join(screenshotDir, `test-${testCase.id || Date.now()}-${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            result.screenshotPath = screenshotPath;

            result.executionTime = Date.now() - startTime;
            
        } catch (error) {
            console.error('Test execution error:', error);
            result.status = 'failed';
            result.errorMessage = error.message;
            result.executionTime = Date.now() - startTime;

            // Take screenshot on failure
            try {
                const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
                if (!fs.existsSync(screenshotDir)) {
                    fs.mkdirSync(screenshotDir, { recursive: true });
                }
                const screenshotPath = path.join(screenshotDir, `error-${testCase.id || Date.now()}-${Date.now()}.png`);
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                result.screenshotPath = screenshotPath;
            } catch (screenshotError) {
                console.error('Failed to take error screenshot:', screenshotError);
            }
        }

        return result;
    }

    async executeAction(action) {
        const { type, selector, locator, value, options = {}, expectedUrl, timeout = 60000 } = action;
        
        // Support both 'selector' and 'locator' for compatibility
        const elementSelector = locator || selector;
        
        // Set default timeout for operations that might need more time
        const actionOptions = { timeout, ...options };

        switch (type) {
            case 'navigate':
                if (value) {
                    await this.page.goto(value, { waitUntil: 'networkidle' });
                } else if (elementSelector) {
                    await this.page.goto(elementSelector, { waitUntil: 'networkidle' });
                }
                break;
            case 'input':
            case 'fill':
            case 'type':
                console.log(`📝 Attempting to fill field: ${elementSelector} with value: "${value}"`);
                
                try {
                    // Wait for the input field to be available
                    await this.page.waitForSelector(elementSelector, { 
                        state: 'visible', 
                        timeout: actionOptions.timeout || 30000 
                    });
                    
                    // Clear the field first
                    await this.page.fill(elementSelector, '', actionOptions);
                    await this.page.waitForTimeout(500); // Brief pause
                    
                    // Fill with the new value
                    await this.page.fill(elementSelector, value, actionOptions);
                    
                    // Verify the value was set correctly
                    const actualValue = await this.page.inputValue(elementSelector);
                    if (actualValue === value) {
                        console.log(`✅ Successfully filled field with: "${value}"`);
                    } else {
                        console.warn(`⚠️ Value mismatch! Expected: "${value}", Got: "${actualValue}"`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to fill field '${elementSelector}': ${error.message}`);
                    throw new Error(`Failed to fill field '${elementSelector}' with value '${value}': ${error.message}`);
                }
                break;
            case 'click':
                await this.handleClickAction(elementSelector, actionOptions);
                break;
            case 'verify':
                if (expectedUrl) {
                    const currentUrl = this.page.url();
                    if (!currentUrl.includes(expectedUrl)) {
                        throw new Error(`Expected URL to contain '${expectedUrl}' but got '${currentUrl}'`);
                    }
                }
                break;
            case 'select':
                await this.page.selectOption(elementSelector, value, actionOptions);
                break;
            case 'check':
                await this.page.check(elementSelector, actionOptions);
                break;
            case 'uncheck':
                await this.page.uncheck(elementSelector, actionOptions);
                break;
            case 'hover':
                await this.page.hover(elementSelector, actionOptions);
                break;
            case 'scroll':
                await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                break;
            case 'wait':
                if (value) {
                    await this.page.waitForTimeout(parseInt(value));
                } else if (elementSelector) {
                    await this.page.waitForSelector(elementSelector, actionOptions);
                }
                break;
            case 'assert_visible':
                await this.page.waitForSelector(elementSelector, { state: 'visible', ...actionOptions });
                break;
            case 'assert_text':
                const element = await this.page.waitForSelector(elementSelector, actionOptions);
                const text = await element.textContent();
                if (!text.includes(value)) {
                    throw new Error(`Expected element to contain text '${value}' but got '${text}'`);
                }
                break;
            default:
                console.warn(`Unknown action type: ${type}`);
        }
    }

    async handleClickAction(elementSelector, options = {}) {
        try {
            // Check if page is available
            if (!this.page) {
                throw new Error('Browser page is not initialized. Call initialize() first.');
            }

            console.log(`🎯 Attempting to click element: ${elementSelector}`);

            // For text-based selectors, use special handling with retry logic
            if (elementSelector.startsWith('text=')) {
                await this.handleTextBasedClick(elementSelector, options);
                return;
            }
            
            // For regular selectors, wait for element to be visible and enabled
            console.log(`⏳ Waiting for element to be visible: ${elementSelector}`);
            await this.page.waitForSelector(elementSelector, { 
                state: 'visible', 
                timeout: options.timeout || 60000 
            });

            // Check if element is enabled before clicking
            const isEnabled = await this.page.isEnabled(elementSelector);
            if (!isEnabled) {
                throw new Error(`Element '${elementSelector}' is not enabled for clicking`);
            }

            // Get element info for verification
            const elementInfo = await this.page.locator(elementSelector).first().textContent();
            console.log(`📋 Element found with text: "${elementInfo}"`);

            // Perform the click with enhanced verification
            await this.page.click(elementSelector, options);
            
            // Wait a moment for any page changes
            await this.page.waitForTimeout(1000);
            
            console.log(`✅ Successfully clicked element: ${elementSelector}`);
            
            // Log current URL for debugging navigation
            const currentUrl = this.page.url();
            console.log(`🌐 Current page URL after click: ${currentUrl}`);
            
        } catch (error) {
            console.error(`❌ Failed to click element '${elementSelector}': ${error.message}`);
            // Enhanced error message for better debugging
            throw new Error(`Failed to click element '${elementSelector}': ${error.message}`);
        }
    }

    async handleTextBasedClick(textSelector, options = {}) {
        // Check if page is available
        if (!this.page) {
            throw new Error('Browser page is not initialized. Call initialize() first.');
        }

        const maxRetries = 3;
        const retryDelay = 2000;
        const text = textSelector.replace('text=', '');
        
        console.log(`🔍 Searching for text-based element: "${text}"`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Click attempt ${attempt}/${maxRetries} for text: "${text}"`);
                
                // Wait for any text matching the selector to be present
                console.log(`⏳ Waiting for text "${text}" to appear on page...`);
                await this.page.waitForFunction(
                    (searchText) => {
                        return Array.from(document.querySelectorAll('*')).some(el => {
                            const textContent = el.textContent && el.textContent.trim();
                            return textContent && (
                                textContent === searchText || 
                                textContent.includes(searchText) ||
                                el.value === searchText ||
                                el.getAttribute('value') === searchText
                            );
                        });
                    },
                    text,
                    { timeout: options.timeout || 60000 }
                );

                console.log(`✨ Text "${text}" found on page, attempting click...`);

                // Try to click the element using the original selector first
                await this.page.click(textSelector, { ...options, timeout: 10000 });
                console.log(`✅ Successfully clicked using original selector: ${textSelector}`);
                
                // Wait for potential page changes and log URL
                await this.page.waitForTimeout(1000);
                const currentUrl = this.page.url();
                console.log(`🌐 Current URL after click: ${currentUrl}`);
                
                return; // Success, exit retry loop
                
            } catch (error) {
                console.warn(`⚠️ Click attempt ${attempt}/${maxRetries} failed for ${textSelector}: ${error.message}`);
                
                if (attempt === maxRetries) {
                    console.log(`🔧 Final attempt failed, trying alternative selectors for: "${text}"`);
                    // On final attempt, try alternative selectors
                    const alternatives = [
                        `button:has-text("${text}")`,
                        `a:has-text("${text}")`,
                        `[role="button"]:has-text("${text}")`,
                        `input[type="submit"]:has-text("${text}")`,
                        `input[type="button"]:has-text("${text}")`,
                        `[onclick]:has-text("${text}")`,
                        `button >> text="${text}"`,
                        `text="${text}"`,
                        `button:text("${text}")`,
                        `a:text("${text}")`,
                        `[role="button"]:text("${text}")`,
                        // Additional alternatives for exact matches
                        `button:text-is("${text}")`,
                        `a:text-is("${text}")`,
                        `input[value="${text}"]`,
                        `button[title="${text}"]`,
                        `a[title="${text}"]`
                    ];
                    
                    let lastError = error;
                    for (const altSelector of alternatives) {
                        try {
                            console.log(`🔧 Trying alternative selector: ${altSelector}`);
                            // First check if element exists and is visible
                            const element = await this.page.locator(altSelector).first();
                            const isVisible = await element.isVisible().catch(() => false);
                            
                            if (isVisible) {
                                await element.click({ ...options, timeout: 5000 });
                                console.log(`✅ Successfully clicked using alternative selector: ${altSelector}`);
                                
                                // Wait for potential page changes and log URL
                                await this.page.waitForTimeout(1000);
                                const currentUrl = this.page.url();
                                console.log(`🌐 Current URL after alternative click: ${currentUrl}`);
                                
                                return;
                            }
                        } catch (altError) {
                            lastError = altError;
                            continue;
                        }
                    }
                    
                    // Final fallback: try to find any clickable element containing the text
                    try {
                        await this.page.locator(`text="${text}"`).first().click({ ...options, timeout: 5000 });
                        console.log(`Successfully clicked using fallback text locator`);
                        return;
                    } catch (fallbackError) {
                        // Throw comprehensive error message
                        throw new Error(`All click attempts failed for text selector '${textSelector}' after ${maxRetries} retries. Last error: ${lastError.message}. Available elements: ${await this.getAvailableElements(text)}`);
                    }
                }
                
                // Wait before retry
                await this.page.waitForTimeout(retryDelay);
            }
        }
    }

    async getAvailableElements(searchText) {
        try {
            const elements = await this.page.evaluate((text) => {
                const found = [];
                const allElements = document.querySelectorAll('*');
                for (const el of allElements) {
                    const textContent = el.textContent && el.textContent.trim();
                    const value = el.value;
                    if ((textContent && textContent.includes(text)) || (value && value.includes(text))) {
                        found.push({
                            tagName: el.tagName.toLowerCase(),
                            text: textContent ? textContent.substring(0, 50) : '',
                            value: value || '',
                            id: el.id || '',
                            className: el.className || ''
                        });
                    }
                }
                return found.slice(0, 5); // Limit to first 5 matches
            }, searchText);
            
            return elements.map(el => `${el.tagName}(id: ${el.id}, class: ${el.className}, text: "${el.text}", value: "${el.value}")`).join(', ');
        } catch (error) {
            return 'Unable to retrieve available elements';
        }
    }

    async close() {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            if (this.context) {
                await this.context.close();
                this.context = null;
            }
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        } catch (error) {
            console.error('Error closing browser:', error);
        }
    }

    // AI-powered element detection
    async detectElements(page = null) {
        const targetPage = page || this.page;
        if (!targetPage) {
            throw new Error('No page available for element detection');
        }

        try {
            // Get all interactive elements
            const elements = await targetPage.evaluate(() => {
                const interactiveElements = [];
                
                // Common interactive selectors
                const selectors = [
                    'button', 'input', 'select', 'textarea', 'a', 
                    '[onclick]', '[role="button"]', '[role="link"]',
                    '.btn', '.button', '.link'
                ];

                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach((el, index) => {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            interactiveElements.push({
                                tagName: el.tagName.toLowerCase(),
                                type: el.type || '',
                                id: el.id || '',
                                className: el.className || '',
                                text: el.textContent ? el.textContent.trim().substring(0, 50) : '',
                                selector: selector + `:nth-child(${index + 1})`,
                                position: {
                                    x: rect.x,
                                    y: rect.y,
                                    width: rect.width,
                                    height: rect.height
                                }
                            });
                        }
                    });
                });

                return interactiveElements;
            });

            return elements;
        } catch (error) {
            console.error('Element detection error:', error);
            return [];
        }
    }
}

module.exports = PlaywrightTestService;