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
                        
                        // Add 5-second delay between interactions (except after the last action)
                        if (i < testCase.actions.length - 1) {
                            await this.page.waitForTimeout(5000);
                        }
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
        const { type, selector, locator, value, options = {}, expectedUrl, timeout = 60000, elementType } = action;
        
        // Support both 'selector' and 'locator' for compatibility
        const elementSelector = locator || selector;
        
        // Set default timeout for operations that might need more time
        const actionOptions = { timeout, elementType, ...options };

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
                await this.showInteractionIndicator(elementSelector, 'Typing');
                await this.page.fill(elementSelector, value, actionOptions);
                break;
            case 'click':
                await this.showInteractionIndicator(elementSelector, 'Clicking');
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
                await this.showInteractionIndicator(elementSelector, 'Selecting');
                await this.handleSelectAction(elementSelector, value, actionOptions);
                break;
            case 'check':
                await this.showInteractionIndicator(elementSelector, 'Checking');
                await this.page.check(elementSelector, actionOptions);
                break;
            case 'uncheck':
                await this.showInteractionIndicator(elementSelector, 'Unchecking');
                await this.page.uncheck(elementSelector, actionOptions);
                break;
            case 'hover':
                await this.showInteractionIndicator(elementSelector, 'Hovering');
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
                await this.showInteractionIndicator(elementSelector, 'Checking visibility');
                await this.page.waitForSelector(elementSelector, { state: 'visible', ...actionOptions });
                break;
            case 'assert_text':
                await this.showInteractionIndicator(elementSelector, 'Checking text');
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

        // If elementType is specified, use prioritized selectors immediately
        if (options.elementType) {
            const alternatives = this.buildAlternativeSelectors(text, options.elementType);
            
            for (const altSelector of alternatives) {
                try {
                    // First check if element exists and is visible
                    const element = await this.page.locator(altSelector).first();
                    const isVisible = await element.isVisible().catch(() => false);
                    
                    if (isVisible) {
                        await element.click({ ...options, timeout: 5000 });
                        console.log(`Successfully clicked using prioritized selector: ${altSelector}`);
                        return;
                    }
                } catch (error) {
                    // Continue trying other selectors
                    continue;
                }
            }
            
            // If prioritized selectors failed, throw error with available elements info
            throw new Error(`Failed to click element with type '${options.elementType}' and text '${text}'. Available elements: ${await this.getAvailableElements(text)}`);
        }

        // If no elementType specified, use original retry logic for backward compatibility
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Try to click the element using the original selector first
                await this.page.click(textSelector, { ...options, timeout: 10000 });
                console.log(`Successfully clicked using original selector: ${textSelector}`);
                return; // Success, exit retry loop
                
            } catch (error) {
                console.warn(`Click attempt ${attempt}/${maxRetries} failed for ${textSelector}: ${error.message}`);
                
                if (attempt === maxRetries) {
                    // On final attempt, try alternative selectors
                    const alternatives = this.buildAlternativeSelectors(text);
                    
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

    // Build alternative selectors with element type prioritization
    buildAlternativeSelectors(text, elementType) {
        // Define selectors grouped by element type
        const selectorsByType = {
            button: [
                `button:has-text("${text}")`,
                `button:text("${text}")`,
                `button:text-is("${text}")`,
                `button >> text="${text}"`,
                `input[type="submit"]:has-text("${text}")`,
                `input[type="button"]:has-text("${text}")`,
                `[role="button"]:has-text("${text}")`,
                `[role="button"]:text("${text}")`,
                `input[value="${text}"]`,
                `button[title="${text}"]`
            ],
            link: [
                `a:has-text("${text}")`,
                `a:text("${text}")`,
                `a:text-is("${text}")`,
                `a >> text="${text}"`,
                `[role="link"]:has-text("${text}")`,
                `[role="link"]:text("${text}")`,
                `a[title="${text}"]`
            ],
            select: [
                `select:has-text("${text}")`,
                `select >> option:has-text("${text}")`,
                `select option:text("${text}")`,
                `select option:text-is("${text}")`,
                `option:has-text("${text}")`,
                `option:text("${text}")`,
                `option:text-is("${text}")`,
                `[role="combobox"]:has-text("${text}")`,
                `[role="listbox"]:has-text("${text}")`,
                `select[title="${text}"]`
            ],
            generic: [
                `[onclick]:has-text("${text}")`,
                `text="${text}"`,
                `*:has-text("${text}")`,
                `[title="${text}"]`
            ]
        };

        // If elementType is specified, prioritize that type
        if (elementType) {
            const normalizedType = elementType.toLowerCase();
            if (selectorsByType[normalizedType]) {
                // Put the specified type first, then add others
                return [
                    ...selectorsByType[normalizedType],
                    ...selectorsByType.button.filter(s => !selectorsByType[normalizedType].includes(s)),
                    ...selectorsByType.link.filter(s => !selectorsByType[normalizedType].includes(s)),
                    ...selectorsByType.select.filter(s => !selectorsByType[normalizedType].includes(s)),
                    ...selectorsByType.generic
                ];
            }
        }

        // Default order: button, link, select, then generic
        return [
            ...selectorsByType.button,
            ...selectorsByType.link,
            ...selectorsByType.select,
            ...selectorsByType.generic
        ];
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

    // Visual indicator helper methods
    async injectVisualIndicatorStyles() {
        try {
            await this.page.addStyleTag({
                content: `
                    .test-interaction-indicator {
                        border: 3px solid #28a745 !important;
                        box-shadow: 0 0 10px rgba(40, 167, 69, 0.6) !important;
                        transition: border 0.3s ease, box-shadow 0.3s ease !important;
                    }
                    .test-interaction-indicator::before {
                        content: "🤖 Testing..." !important;
                        position: absolute !important;
                        top: -25px !important;
                        left: 0 !important;
                        background: #28a745 !important;
                        color: white !important;
                        padding: 2px 8px !important;
                        font-size: 12px !important;
                        border-radius: 3px !important;
                        z-index: 10000 !important;
                        pointer-events: none !important;
                    }
                `
            });
        } catch (error) {
            console.warn('Failed to inject visual indicator styles:', error.message);
        }
    }

    async addVisualIndicator(selector) {
        try {
            // Inject styles if not already done
            await this.injectVisualIndicatorStyles();
            
            // Add the indicator class to the element
            await this.page.evaluate((sel) => {
                let element = null;
                
                // Handle different selector types
                if (sel.startsWith('text=')) {
                    const text = sel.substring(5);
                    // Try multiple strategies to find text-based elements
                    element = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'))
                                   .find(el => el.textContent && el.textContent.trim().includes(text)) ||
                             Array.from(document.querySelectorAll('*'))
                                   .find(el => el.textContent && el.textContent.trim() === text && 
                                             (el.onclick || el.tagName === 'BUTTON' || el.tagName === 'A'));
                } else {
                    // Regular CSS selector or XPath
                    try {
                        element = document.querySelector(sel);
                    } catch (e) {
                        // Try as XPath
                        try {
                            element = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        } catch (xe) {
                            console.warn('Could not evaluate selector:', sel);
                        }
                    }
                }
                
                if (element) {
                    element.classList.add('test-interaction-indicator');
                    // Ensure the element can show the indicator properly
                    const computedStyle = window.getComputedStyle(element);
                    if (computedStyle.position === 'static') {
                        element.style.position = 'relative';
                    }
                    return true;
                }
                return false;
            }, selector);
        } catch (error) {
            console.warn(`Failed to add visual indicator for ${selector}:`, error.message);
        }
    }

    async removeVisualIndicator(selector) {
        try {
            await this.page.evaluate((sel) => {
                let element = null;
                
                // Handle different selector types (same logic as addVisualIndicator)
                if (sel.startsWith('text=')) {
                    const text = sel.substring(5);
                    element = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'))
                                   .find(el => el.textContent && el.textContent.trim().includes(text)) ||
                             Array.from(document.querySelectorAll('*'))
                                   .find(el => el.textContent && el.textContent.trim() === text && 
                                             (el.onclick || el.tagName === 'BUTTON' || el.tagName === 'A'));
                } else {
                    try {
                        element = document.querySelector(sel);
                    } catch (e) {
                        try {
                            element = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        } catch (xe) {
                            console.warn('Could not evaluate selector:', sel);
                        }
                    }
                }
                
                if (element) {
                    element.classList.remove('test-interaction-indicator');
                }
            }, selector);
        } catch (error) {
            console.warn(`Failed to remove visual indicator for ${selector}:`, error.message);
        }
    }

    async showInteractionIndicator(selector, actionType, duration = 2000) {
        try {
            await this.addVisualIndicator(selector);
            
            // Update the indicator text based on action type
            // Wrap multiple arguments in an object to avoid "too many arguments" error
            await this.page.evaluate((args) => {
                const { sel, action, dur } = args;
                let element = null;
                
                // Handle different selector types (same logic as addVisualIndicator)
                if (sel.startsWith('text=')) {
                    const text = sel.substring(5);
                    element = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'))
                                   .find(el => el.textContent && el.textContent.trim().includes(text)) ||
                             Array.from(document.querySelectorAll('*'))
                                   .find(el => el.textContent && el.textContent.trim() === text && 
                                             (el.onclick || el.tagName === 'BUTTON' || el.tagName === 'A'));
                } else {
                    try {
                        element = document.querySelector(sel);
                    } catch (e) {
                        try {
                            element = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        } catch (xe) {
                            console.warn('Could not evaluate selector:', sel);
                        }
                    }
                }
                
                if (element && element.classList.contains('test-interaction-indicator')) {
                    const style = document.createElement('style');
                    style.textContent = `
                        .test-interaction-indicator::before {
                            content: "🤖 ${action}..." !important;
                        }
                    `;
                    document.head.appendChild(style);
                    
                    // Remove the style after a short time to reset
                    setTimeout(() => {
                        if (style.parentNode) {
                            style.parentNode.removeChild(style);
                        }
                    }, dur);
                }
            }, { sel: selector, action: actionType, dur: duration });
            
            // Remove indicator after duration
            setTimeout(async () => {
                await this.removeVisualIndicator(selector);
            }, duration);
            
        } catch (error) {
            console.warn(`Failed to show interaction indicator for ${selector}:`, error.message);
        }
    }

    // Handle select actions with fallback from value to label and multiple selectors
    async handleSelectAction(elementSelector, value, options = {}) {
        // Split comma-separated selectors and try each one
        const selectors = elementSelector.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        let lastError = null;
        const allAttempts = [];
        
        for (const selector of selectors) {
            try {
                // Try the fallback strategies for this selector
                await this.trySelectWithFallbacks(selector, value, options);
                console.log(`Successfully selected '${value}' using selector: ${selector}`);
                return; // Success - exit early
            } catch (selectorError) {
                allAttempts.push(`${selector}: ${selectorError.message}`);
                lastError = selectorError;
                console.warn(`Selector '${selector}' failed: ${selectorError.message}`);
            }
        }
        
        // All selectors failed
        throw new Error(
            `Failed to select option '${value}' using any of the provided selectors. ` +
            `Attempted selectors: [${selectors.join(', ')}]. ` +
            `Detailed attempts: ${allAttempts.join(' | ')}`
        );
    }

    // Helper method to try selection with fallbacks for a single selector
    async trySelectWithFallbacks(selector, value, options = {}) {
        try {
            // First try to select by value (maintains backward compatibility)
            await this.page.selectOption(selector, value, options);
            console.log(`Successfully selected option by value: ${value}`);
        } catch (valueError) {
            console.warn(`Selection by value '${value}' failed: ${valueError.message}`);
            
            try {
                // Fallback: try to select by label/text
                await this.page.selectOption(selector, { label: value }, options);
                console.log(`Successfully selected option by label: ${value}`);
            } catch (labelError) {
                console.warn(`Selection by label '${value}' failed: ${labelError.message}`);
                
                try {
                    // Second fallback: try case-insensitive value match
                    const lowerValue = value.toLowerCase();
                    await this.page.selectOption(selector, lowerValue, options);
                    console.log(`Successfully selected option by lowercase value: ${lowerValue}`);
                } catch (caseError) {
                    // Final fallback: provide detailed error information
                    const availableOptions = await this.getAvailableSelectOptions(selector);
                    throw new Error(
                        `Failed to select option '${value}' in dropdown. ` +
                        `Tried: value='${value}', label='${value}', value='${value.toLowerCase()}'. ` +
                        `Available options: ${availableOptions}`
                    );
                }
            }
        }
    }

    // Get available options from a select element for debugging
    async getAvailableSelectOptions(selector) {
        try {
            const options = await this.page.evaluate((sel) => {
                const selectElement = document.querySelector(sel);
                if (!selectElement) return 'Select element not found';
                
                const optionElements = selectElement.querySelectorAll('option');
                return Array.from(optionElements).map(opt => ({
                    value: opt.value,
                    text: opt.textContent.trim(),
                    selected: opt.selected
                }));
            }, selector);
            
            return JSON.stringify(options, null, 2);
        } catch (error) {
            return `Error getting options: ${error.message}`;
        }
    }
}

module.exports = PlaywrightTestService;