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
            if (this.isPageAvailable()) {
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                result.screenshotPath = screenshotPath;
            }

            result.executionTime = Date.now() - startTime;
            
        } catch (error) {
            console.error('Test execution error:', error);
            result.status = 'failed';
            result.errorMessage = error.message;
            result.executionTime = Date.now() - startTime;

            // Take screenshot on failure
            try {
                if (this.isPageAvailable()) {
                    const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
                    if (!fs.existsSync(screenshotDir)) {
                        fs.mkdirSync(screenshotDir, { recursive: true });
                    }
                    const screenshotPath = path.join(screenshotDir, `error-${testCase.id || Date.now()}-${Date.now()}.png`);
                    await this.page.screenshot({ path: screenshotPath, fullPage: true });
                    result.screenshotPath = screenshotPath;
                }
            } catch (screenshotError) {
                console.error('Failed to take error screenshot:', screenshotError);
            }
        }

        return result;
    }

    async executeAction(action) {
        const { type, selector, locator, value, options = {}, expectedUrl } = action;
        
        // Check if page is still available before executing action
        if (!this.isPageAvailable()) {
            throw new Error('Page, context or browser has been closed');
        }
        
        // Support both 'selector' and 'locator' for compatibility
        const elementSelector = locator || selector;

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
                await this.page.fill(elementSelector, value, options);
                break;
            case 'click':
                await this.page.click(elementSelector, options);
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
                await this.page.selectOption(elementSelector, value, options);
                break;
            case 'check':
                await this.page.check(elementSelector, options);
                break;
            case 'uncheck':
                await this.page.uncheck(elementSelector, options);
                break;
            case 'hover':
                await this.page.hover(elementSelector, options);
                break;
            case 'scroll':
                await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                break;
            case 'wait':
                if (value) {
                    await this.page.waitForTimeout(parseInt(value));
                } else if (elementSelector) {
                    await this.page.waitForSelector(elementSelector, options);
                }
                break;
            case 'assert_visible':
                await this.page.waitForSelector(elementSelector, { state: 'visible', ...options });
                break;
            case 'assert_text':
                const element = await this.page.waitForSelector(elementSelector, options);
                const text = await element.textContent();
                if (!text.includes(value)) {
                    throw new Error(`Expected element to contain text '${value}' but got '${text}'`);
                }
                break;
            default:
                console.warn(`Unknown action type: ${type}`);
        }
    }

    // Helper method to check if browser/page/context are still available
    isPageAvailable() {
        try {
            return this.page && !this.page.isClosed() && this.context && this.browser && this.browser.isConnected();
        } catch (error) {
            return false;
        }
    }

    async close() {
        try {
            if (this.page && !this.page.isClosed()) {
                await this.page.close();
                this.page = null;
            }
            if (this.context) {
                await this.context.close();
                this.context = null;
            }
            if (this.browser && this.browser.isConnected()) {
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

        // Check if the target page is still available
        try {
            if (targetPage.isClosed()) {
                throw new Error('Page has been closed');
            }
        } catch (error) {
            throw new Error('Page is not available for element detection');
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