const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');

class PlaywrightTestService {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async initialize(browserType = 'chromium', headless = true) {
        try {
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
            throw new Error(`Browser initialization failed: ${error.message}`);
        }
    }

    async runTest(testCase) {
        const startTime = Date.now();
        let result = {
            status: 'success',
            executionTime: 0,
            errorMessage: null,
            screenshotPath: null,
            steps: []
        };

        try {
            if (!this.page) {
                await this.initialize();
            }

            // Navigate to the URL
            await this.page.goto(testCase.url, { waitUntil: 'networkidle' });
            result.steps.push(`Navigated to ${testCase.url}`);

            // Execute actions if provided
            if (testCase.actions && Array.isArray(testCase.actions)) {
                for (let i = 0; i < testCase.actions.length; i++) {
                    const action = testCase.actions[i];
                    try {
                        await this.executeAction(action);
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
                await this.page.fill(elementSelector, value, actionOptions);
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

            // For text-based selectors, use special handling with retry logic
            if (elementSelector.startsWith('text=')) {
                await this.handleTextBasedClick(elementSelector, options);
                return;
            }
            
            // For regular selectors, wait for element to be visible and enabled
            await this.page.waitForSelector(elementSelector, { 
                state: 'visible', 
                timeout: options.timeout || 60000 
            });

            // Check if element is enabled before clicking
            const isEnabled = await this.page.isEnabled(elementSelector);
            if (!isEnabled) {
                throw new Error(`Element '${elementSelector}' is not enabled for clicking`);
            }

            // Perform the click
            await this.page.click(elementSelector, options);
        } catch (error) {
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
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Wait for any text matching the selector to be present
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

                // Try to click the element using the original selector first
                await this.page.click(textSelector, { ...options, timeout: 10000 });
                console.log(`Successfully clicked using original selector: ${textSelector}`);
                return; // Success, exit retry loop
                
            } catch (error) {
                console.warn(`Click attempt ${attempt}/${maxRetries} failed for ${textSelector}: ${error.message}`);
                
                if (attempt === maxRetries) {
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
                            // First check if element exists and is visible
                            const element = await this.page.locator(altSelector).first();
                            const isVisible = await element.isVisible().catch(() => false);
                            
                            if (isVisible) {
                                await element.click({ ...options, timeout: 5000 });
                                console.log(`Successfully clicked using alternative selector: ${altSelector}`);
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