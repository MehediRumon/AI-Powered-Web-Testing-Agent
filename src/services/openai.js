// openAIService.js
const PlaywrightTestService = require('./playwright');
const { getDatabase } = require('../database/init');
const fs = require('fs');
const path = require('path');
const { getOptimizedImageBase64, cleanupResizedImage } = require('../utils/imageUtils');

class OpenAIService {
    constructor(userApiKey = null) {
        this.apiKey = userApiKey || process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
    }

    // Get user's API key from database
    static async getUserApiKey(userId) {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            
            db.get(
                'SELECT openai_api_key FROM api_configs WHERE user_id = ?',
                [userId],
                (err, row) => {
                    db.close();
                    
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row ? row.openai_api_key : null);
                    }
                }
            );
        });
    }

    // Create instance with user's API key
    static async createForUser(userId) {
        try {
            const userApiKey = await OpenAIService.getUserApiKey(userId);
            return new OpenAIService(userApiKey);
        } catch (error) {
            console.error('Failed to get user API key:', error);
            return new OpenAIService();
        }
    }

    // Normalize selector field for uniformity
    normalizeSelector(sel) {
        if (typeof sel === 'string') return sel;
        if (sel && typeof sel === 'object' && typeof sel.selector === 'string') return sel.selector;
        return sel != null ? String(sel) : '';
    }

    // Enhance AI-generated selectors using system logic
    enhanceAIGeneratedSelectors(testCase) {
        if (!testCase || !testCase.actions) {
            return testCase;
        }

        const enhancedActions = testCase.actions.map(action => {
            // Apply selector enhancement for different action types
            if (action.type === 'select' && action.description) {
                // Check if this looks like a dropdown instruction
                const lowerDesc = action.description.toLowerCase();
                if (this.isDropdownAction(lowerDesc)) {
                    const enhanced = this.parseSelectInstruction(action.description);
                    if (enhanced.selector && enhanced.selector !== 'select, [role="combobox"], [role="listbox"]') {
                        // Generate multi-selector pattern for known dropdown types
                        action.selector = this.generateMultiSelectorPattern(enhanced.selector, action.description);
                    }
                    if (enhanced.value) {
                        action.value = enhanced.value;
                    }
                }
            } else if (action.type === 'fill' && action.description) {
                // Enhance input field selectors
                if (action.selector === 'input' || !action.selector || action.selector.trim() === '') {
                    const enhanced = this.extractSelector(action.description, 'input');
                    if (enhanced && enhanced !== 'input' && !enhanced.includes('=')) {
                        action.selector = enhanced;
                    } else {
                        // Generate semantic selector based on description
                        const lowerDesc = action.description.toLowerCase();
                        if (lowerDesc.includes('email')) {
                            action.selector = 'input[type="email"], input[name="email"], #email, #Email';
                        } else if (lowerDesc.includes('password')) {
                            action.selector = 'input[type="password"], input[name="password"], #password, #Password';
                        } else if (lowerDesc.includes('username') || lowerDesc.includes('user name')) {
                            action.selector = 'input[name="username"], input[name="user"], #username, #userName';
                        } else if (lowerDesc.includes('name')) {
                            action.selector = 'input[name="name"], input[name="fullname"], #name, #fullName';
                        } else {
                            action.selector = 'input[type="text"], input:not([type]), .form-control';
                        }
                    }
                }
            } else if (action.type === 'click' && action.description) {
                // Enhance click selectors
                if (action.selector === 'button' || !action.selector || action.selector.trim() === '') {
                    const enhanced = this.extractSelector(action.description, 'button');
                    if (enhanced && enhanced !== 'button' && enhanced.startsWith('text=')) {
                        action.selector = enhanced;
                    } else {
                        // Generate semantic selector based on description
                        const lowerDesc = action.description.toLowerCase();
                        if (lowerDesc.includes('submit')) {
                            action.selector = 'button[type="submit"], input[type="submit"], text=Submit, .btn-submit';
                        } else if (lowerDesc.includes('login') || lowerDesc.includes('sign in')) {
                            action.selector = 'text=Login, text=Sign In, #login, .btn-login';
                        } else if (lowerDesc.includes('register') || lowerDesc.includes('sign up')) {
                            action.selector = 'text=Register, text=Sign Up, #register, .btn-register';
                        } else if (lowerDesc.includes('save')) {
                            action.selector = 'text=Save, button:contains("Save"), .btn-save';
                        } else if (lowerDesc.includes('cancel')) {
                            action.selector = 'text=Cancel, button:contains("Cancel"), .btn-cancel';
                        } else {
                            // Extract button text from description
                            const buttonTextMatch = action.description.match(/click\s+(?:the\s+)?[\"']?([^\"']+)[\"']?\s*(?:button|link)?/i);
                            if (buttonTextMatch) {
                                const buttonText = buttonTextMatch[1].trim();
                                action.selector = `text=${buttonText}, button:contains("${buttonText}"), a:contains("${buttonText}")`;
                            } else {
                                action.selector = 'button, input[type="button"], input[type="submit"], .btn';
                            }
                        }
                    }
                }
            }

            return action;
        });

        return {
            ...testCase,
            actions: this.normalizeActions(enhancedActions)
        };
    }

    // Generate multi-selector pattern for enhanced reliability
    generateMultiSelectorPattern(primarySelector, description) {
        // Extract field name from description or selector
        let fieldName = '';
        
        const fieldMatch = description.match(/from\s+(?:the\s+)?(.+?)\s+dropdown/i);
        if (fieldMatch) {
            fieldName = fieldMatch[1].trim();
        } else if (primarySelector.startsWith('#')) {
            fieldName = primarySelector.slice(1);
        }

        if (!fieldName) {
            return primarySelector;
        }

        const lowerFieldName = fieldName.toLowerCase();
        
        // Generate fallback patterns based on field name
        const fallbackPatterns = [];
        const cleanName = fieldName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const camelCaseName = this.toCamelCase(fieldName);
        const pascalCaseName = this.toPascalCase(fieldName);

        // Add standard fallback patterns
        fallbackPatterns.push(`#${cleanName}Type`);
        fallbackPatterns.push(`select[name="${cleanName}"]`);
        fallbackPatterns.push(`select[name="${cleanName}Type"]`);
        
        // Add camelCase variations
        if (camelCaseName !== cleanName) {
            fallbackPatterns.push(`#${camelCaseName}`);
            fallbackPatterns.push(`#${camelCaseName}Type`);
        }

        // Add PascalCase variations
        if (pascalCaseName !== camelCaseName) {
            fallbackPatterns.push(`#${pascalCaseName}`);
            fallbackPatterns.push(`#${pascalCaseName}Type`);
        }

        // Combine primary selector with fallbacks
        return [primarySelector, ...fallbackPatterns.slice(0, 5)].join(', ');
    }
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

    // Convert string to camelCase
    toCamelCase(str) {
        const pascalCase = this.toPascalCase(str);
        return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
    }

    // Generate system-based selector guidance for AI
    generateSelectorGuidance() {
        return `
SELECTOR LEVEL HIERARCHY (Use in order of preference):

Level 1 (Highest Priority) - Unique Identifiers:
- #elementId (most preferred)
- [data-testid="value"]
- [data-cy="value"]
- [id="elementId"]

Level 2 - Semantic/Structural Selectors:
- input[type="email"]
- button[type="submit"]
- select[name="fieldName"]
- textarea[name="description"]
- a[href="/path"]

Level 3 - Class-based Selectors:
- .btn-primary
- .form-control
- .nav-link
- button.btn-success

Level 4 - Dropdown Multi-Selector Patterns:
For dropdowns, use our system's multi-selector approach:
- Primary: #fieldName (e.g., #MobileBankingType, #teachergrade, #religion)
- Fallback pattern: "#fieldName, #fieldNameType, select[name=fieldName], select[name=fieldNameType]"
- Examples:
  * "#teachergrade, #teachergradeType, select[name=teachergrade], select[name=teachergradeType]"
  * "#religion, #religionType, select[name=religion], select[name=religionType]"

Level 5 - Text-based Selectors (Fallback):
- text=Button Text
- text=Link Text
- [placeholder="Enter email"]

PLACEHOLDER PATTERNS (when specific selectors cannot be determined):
- Forms: "form input[type='text']", "form input[type='email']", "form select"
- Buttons: "button:contains('Submit')", "input[type='submit']", ".btn"
- Links: "a:contains('Login')", "nav a", ".nav-link"
- Dropdowns: "select", "[role='combobox']", "[role='listbox']"

SYSTEM-SPECIFIC CONVENTIONS:
1. Use PascalCase for IDs: #MobileBankingType, #TeacherGrade
2. Prefer descriptive names over generic ones
3. Include fallback selectors for critical elements
4. Use semantic HTML attributes when available
5. Always prefer accessibility attributes (aria-label, role) when present`;
    }

    // Parse dropdown/select instructions
    parseSelectInstruction(line) {
        const valueMatch = line.match(/['"]([^'"]+)['"]/);
        const value = valueMatch ? valueMatch[1].trim() : '';

        const fieldMatch =
            line.match(/from\s+the\s+(.+?)\s+dropdown/i) ||
            line.match(/from\s+(.+?)\s+dropdown/i);

        const field = fieldMatch ? fieldMatch[1].trim() : '';
        const selector = field
            ? `#${this.toPascalCase(field)}`
            : 'select, [role="combobox"], [role="listbox"]';

        return { selector, value };
    }

    // Parse search suggestion instruction (IMPROVED)
    parseSuggestInstruction(line) {
        const valueMatch = line.match(/['"]([^'"]+)['"]/g);
        const values = valueMatch ? valueMatch.map(m => m.slice(1, -1)) : [];

        // Get the value to select (usually the last quoted value)
        const value = values.length > 0 ? values[values.length - 1].trim() : '';

        // Get search term if different from selection value
        const searchTerm = values.length > 1 ? values[0].trim() : value;

        const fieldMatch =
            line.match(/from\s+the\s+(.+?)\s+suggestion/i) ||
            line.match(/in\s+the\s+(.+?)\s+field/i) ||
            line.match(/search\s+(.+?)\s+for/i);

        const field = fieldMatch ? fieldMatch[1].trim() : '';
        const selector = field ? `#${this.toPascalCase(field)}` : 'input[type="text"]';

        return {
            selector,
            value,
            searchTerm: searchTerm !== value ? searchTerm : undefined
        };
    }

    async parseTestInstructions(instructions) {
        if (!this.apiKey) {
            return this.fallbackParse(instructions);
        }

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a web testing expert. Parse natural language test instructions and convert them to structured test actions.`
                        },
                        {
                            role: 'user',
                            content: instructions
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1000
                })
            });

            const data = await response.json();

            if (!response.ok) {
                // Check for specific error types to provide better user experience
                const errorType = data.error?.type || 'unknown';
                const errorCode = data.error?.code || 'unknown';
                const errorMessage = data.error?.message || 'Unknown error';
                
                if (errorType === 'insufficient_quota' || errorCode === 'insufficient_quota') {
                    console.warn('OpenAI API quota exceeded for instruction parsing, falling back to rule-based parsing');
                    throw new Error(`quota_exceeded:${errorMessage}`);
                } else if (response.status === 429) {
                    console.warn('OpenAI API rate limit exceeded for instruction parsing, falling back to rule-based parsing');
                    throw new Error(`rate_limit:${errorMessage}`);
                } else {
                    console.error('OpenAI API error during instruction parsing:', data);
                    throw new Error(`OpenAI API error: ${errorMessage}`);
                }
            }

            const content = data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response content from OpenAI');
            }

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                if (result?.testCase?.actions) {
                    result.testCase.actions = this.normalizeActions(result.testCase.actions);
                }
                return result;
            }

            throw new Error('Could not extract JSON from OpenAI response');

        } catch (error) {
            // Check if this is a quota or rate limit error for better user messaging
            if (error.message.startsWith('quota_exceeded:')) {
                console.warn('Gracefully falling back to rule-based parsing due to quota limits');
            } else if (error.message.startsWith('rate_limit:')) {
                console.warn('Gracefully falling back to rule-based parsing due to rate limits');
            } else {
                console.warn('OpenAI parsing failed, using fallback:', error.message);
            }
            
            const fallbackResult = this.fallbackParse(instructions);
            
            // Add metadata about fallback usage
            if (error.message.startsWith('quota_exceeded:') || error.message.startsWith('rate_limit:')) {
                fallbackResult.metadata = {
                    usedFallback: true,
                    fallbackReason: error.message.startsWith('quota_exceeded:') ? 'quota_exceeded' : 'rate_limit',
                    originalError: error.message.split(':')[1] || 'Unknown error'
                };
            }
            
            return fallbackResult;
        }
    }

    fallbackParse(instructions) {
        const lines = instructions.split('\n').filter(line => line.trim());
        const actions = [];

        let testName = 'AI Parsed Test';
        let testUrl = '';
        let testDescription = '';

        for (const rawLine of lines) {
            const line = rawLine.trim();
            const lowerLine = line.toLowerCase();

            const urlMatch = line.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                testUrl = urlMatch[0];
                continue;
            }

            if (lowerLine.includes('test:') || lowerLine.includes('name:')) {
                testName = line.split(':')[1]?.trim() || testName;
                continue;
            }

            if (lowerLine.includes('click')) {
                const selector = this.extractSelector(line, 'button');
                const action = { type: 'click', selector, description: line };

                if (lowerLine.includes('button')) action.elementType = 'button';
                else if (lowerLine.includes('link')) action.elementType = 'link';

                if (selector.startsWith('text=')) action.timeout = 90000;
                actions.push(action);
            } else if (this.isSuggestAction(lowerLine)) {  // CHECK SUGGESTIONS FIRST
                const { selector, value, searchTerm } = this.parseSuggestInstruction(line);

                // Break down suggestion into multiple standard actions
                // 1. First, fill the input field with search term or value
                actions.push({
                    type: 'fill',
                    selector,
                    value: searchTerm || value,
                    description: `Type "${searchTerm || value}" in search field`
                });

                // 2. Wait for suggestions to appear
                actions.push({
                    type: 'wait',
                    value: '1000',
                    description: 'Wait for suggestions to load'
                });

                // 3. Click the matching suggestion
                actions.push({
                    type: 'click',
                    selector: `text=${value}`,
                    description: `Select "${value}" from suggestions`,
                    timeout: 10000
                });
            } else if (this.isDropdownAction(lowerLine)) {  // THEN CHECK DROPDOWNS
                const { selector, value } = this.parseSelectInstruction(line);
                actions.push({ type: 'select', selector, value, description: line });
            } else if (this.isInputAction(lowerLine)) {
                const value = this.extractValue(line);
                const selector = this.extractSelector(line, 'input');
                actions.push({ type: 'fill', selector, value, description: line });
            } else if (lowerLine.includes('wait')) {
                const waitTime = line.match(/\d+/)?.[0] || '2000';
                actions.push({ type: 'wait', value: waitTime, description: line });
            } else if (lowerLine.includes('check') && !lowerLine.includes('uncheck')) {
                const selector = this.extractSelector(line, 'input[type="checkbox"]');
                actions.push({ type: 'check', selector, description: line });
            } else if (lowerLine.includes('scroll')) {
                actions.push({ type: 'scroll', description: line });
            }
        }

        return {
            testCase: {
                name: testName,
                description: testDescription || instructions.substring(0, 100) + '...',
                url: testUrl || 'https://example.com',
                actions: this.normalizeActions(actions)
            }
        };
    }

    extractSelector(line, defaultSelector) {
        const lowerLine = line.toLowerCase();

        if (defaultSelector === 'select' && this.isDropdownAction(lowerLine)) {
            return this.parseSelectInstruction(line).selector;
        }

        if (this.isSuggestAction(lowerLine)) {
            return this.parseSuggestInstruction(line).selector;
        }

        const allQuotedMatches = line.match(/["']([^"']+)["']/g);
        if (allQuotedMatches && allQuotedMatches.length > 0) {
            const quotedValues = allQuotedMatches.map(m => m.slice(1, -1));
            const first = quotedValues[0];
            return first.includes('#') || first.includes('.') || first.includes('[')
                ? first
                : `text=${first}`;
        }

        if (lowerLine.includes('button') || lowerLine.includes('link')) {
            const textPattern = /click\s+(.+?)\s+(button|link)/i;
            const match = line.match(textPattern);
            if (match) return `text=${match[1].trim()}`;
        }

        if (lowerLine.startsWith('click ')) {
            const textAfterClick = line.slice(6).trim();
            if (textAfterClick) return `text=${textAfterClick}`;
        }

        return defaultSelector;
    }

    extractValue(line) {
        const allQuotedMatches = line.match(/["']([^"']+)["']/g);
        if (allQuotedMatches && allQuotedMatches.length > 0) {
            return allQuotedMatches.map(m => m.slice(1, -1)).pop();
        }
        return '';
    }

    isInputAction(lowerLine) {
        return (
            lowerLine.includes('type in') ||
            lowerLine.includes('type into') ||
            lowerLine.includes('enter') ||
            lowerLine.includes('input') ||
            lowerLine.includes('fill')
        ) && !this.isDropdownAction(lowerLine) && !this.isSuggestAction(lowerLine);
    }

    // IMPROVED: More specific dropdown detection
    isDropdownAction(lowerLine) {
        return (lowerLine.includes('dropdown') ||
            (lowerLine.includes('select') && !lowerLine.includes('suggestion')) ||
            (lowerLine.includes('choose') && !lowerLine.includes('suggestion')) ||
            (lowerLine.includes('pick') && !lowerLine.includes('suggestion'))) &&
            !this.isSuggestAction(lowerLine);
    }

    // IMPROVED: Better suggestion detection
    isSuggestAction(lowerLine) {
        return lowerLine.includes('suggestion') ||
            lowerLine.includes('autocomplete') ||
            lowerLine.includes('type and select suggestion') ||
            (lowerLine.includes('type') && lowerLine.includes('suggestion')) ||
            (lowerLine.includes('search') && lowerLine.includes('select'));
    }

    // Generate test case from URL using AI vision analysis
    async generateTestFromURL(url) {
        const playwrightService = new PlaywrightTestService();
        let screenshotPath = null;

        try {
            // Initialize browser and navigate to URL (non-headless for visual display)
            await playwrightService.initialize('chromium', false);
            await playwrightService.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Wait a bit for dynamic content to load
            await playwrightService.page.waitForTimeout(2000);
            
            // Take a screenshot
            const screenshotDir = path.join(process.cwd(), 'reports', 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            screenshotPath = path.join(screenshotDir, `url-analysis-${Date.now()}.png`);
            await playwrightService.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true,
                type: 'png'
            });

            // Close browser
            await playwrightService.close();

            // Analyze screenshot with AI if API key is available
            if (this.apiKey) {
                return await this.analyzeScreenshotWithAI(url, screenshotPath);
            } else {
                // Clean up screenshot file if AI analysis is not available
                if (screenshotPath && fs.existsSync(screenshotPath)) {
                    try {
                        fs.unlinkSync(screenshotPath);
                    } catch (unlinkError) {
                        console.error('Failed to clean up screenshot:', unlinkError);
                    }
                }
                
                // Fallback: Generate basic test case without AI analysis
                return this.generateBasicTestFromURL(url);
            }

        } catch (error) {
            console.error('Error generating test from URL:', error);
            
            // Clean up browser if still open
            try {
                if (playwrightService.browser) {
                    await playwrightService.close();
                }
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }

            // Clean up screenshot file if it exists
            if (screenshotPath && fs.existsSync(screenshotPath)) {
                try {
                    fs.unlinkSync(screenshotPath);
                } catch (unlinkError) {
                    console.error('Failed to clean up screenshot:', unlinkError);
                }
            }

            // Return fallback test case
            return this.generateBasicTestFromURL(url);
        }
    }

    // Analyze screenshot with GPT-4 Vision
    async analyzeScreenshotWithAI(url, screenshotPath) {
        let resizedImagePath = null;
        try {
            // Resize and optimize image for AI analysis to reduce token costs
            console.log(`🔧 Optimizing screenshot for AI analysis to reduce token costs...`);
            const imageData = await getOptimizedImageBase64(screenshotPath, 500);
            const { base64: base64Image, mimeType, resizedPath } = imageData;
            resizedImagePath = resizedPath;

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Using gpt-4o-mini for better cost efficiency
                    messages: [
                        {
                            role: 'system',
                            content: `You are a web testing expert. Analyze the screenshot of a web page and generate comprehensive test cases based on the visible UI elements, following our system's selector conventions and level-based hierarchy.

Focus on:
1. Interactive elements (buttons, links, forms, inputs, dropdowns)
2. Navigation elements
3. Important content areas
4. Login/authentication flows if visible
5. Search functionality if present
6. Form validation workflows

${this.generateSelectorGuidance()}

Return a JSON object with this exact structure:
{
  "testCase": {
    "name": "Descriptive test name",
    "description": "Brief description of what this test validates",
    "url": "${url}",
    "actions": [
      {
        "type": "click|fill|select|wait|verify|assert_visible|assert_text",
        "selector": "CSS selector following level hierarchy",
        "value": "value for fill/select actions",
        "description": "Human readable description"
      }
    ]
  }
}

Supported action types:
- navigate: Navigate to URL
- click: Click buttons, links, elements  
- fill: Fill input fields
- select: Select dropdown options (use multi-selector patterns for dropdowns)
- wait: Wait for elements or time
- verify: Verify page content or URL
- assert_visible: Assert element is visible
- assert_text: Assert text content
- hover: Hover over elements
- scroll: Scroll the page

IMPORTANT: 
- Follow the selector level hierarchy (Level 1-5)
- Use multi-selector patterns for dropdowns
- Include placeholder selectors when specific ones cannot be determined
- Generate realistic test scenarios that validate key functionality
- Prefer system-specific conventions (PascalCase IDs, semantic selectors)`
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Please analyze this screenshot of ${url} and generate a comprehensive test case that covers the main interactive elements and user flows visible on the page.`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Image}`,
                                        detail: 'high'
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.3
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                // Check for specific error types to provide better user experience
                const errorType = data.error?.type || 'unknown';
                const errorCode = data.error?.code || 'unknown';
                const errorMessage = data.error?.message || 'Unknown error';
                
                if (errorType === 'insufficient_quota' || errorCode === 'insufficient_quota') {
                    console.warn('OpenAI API quota exceeded for screenshot analysis, falling back to basic test generation');
                    throw new Error(`quota_exceeded:${errorMessage}`);
                } else if (response.status === 429) {
                    console.warn('OpenAI API rate limit exceeded for screenshot analysis, falling back to basic test generation');
                    throw new Error(`rate_limit:${errorMessage}`);
                } else {
                    console.error('OpenAI API error during screenshot analysis:', data);
                    throw new Error(`OpenAI API error: ${errorMessage}`);
                }
            }

            const content = data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response content from OpenAI');
            }

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                if (result?.testCase?.actions) {
                    result.testCase.actions = this.normalizeActions(result.testCase.actions);
                    // Apply system-based selector enhancement
                    result.testCase = this.enhanceAIGeneratedSelectors(result.testCase);
                }
                
                // Clean up screenshot file after successful analysis
                try {
                    fs.unlinkSync(screenshotPath);
                } catch (unlinkError) {
                    console.error('Failed to clean up screenshot:', unlinkError);
                }
                
                // Clean up resized image if it was created
                if (resizedImagePath !== screenshotPath) {
                    cleanupResizedImage(resizedImagePath);
                }
                
                return result;
            } else {
                throw new Error('Could not extract JSON from AI response');
            }

        } catch (error) {
            console.error('AI screenshot analysis failed:', error);
            
            // Check if this is a quota or rate limit error for better user messaging
            let usedFallback = false;
            let fallbackReason = '';
            
            if (error.message.startsWith('quota_exceeded:')) {
                console.warn('Gracefully falling back to basic test generation due to quota limits');
                usedFallback = true;
                fallbackReason = 'quota_exceeded';
            } else if (error.message.startsWith('rate_limit:')) {
                console.warn('Gracefully falling back to basic test generation due to rate limits');
                usedFallback = true;
                fallbackReason = 'rate_limit';
            }
            
            // Clean up screenshot file
            if (fs.existsSync(screenshotPath)) {
                try {
                    fs.unlinkSync(screenshotPath);
                } catch (unlinkError) {
                    console.error('Failed to clean up screenshot:', unlinkError);
                }
            }
            
            // Clean up resized image if it was created
            if (resizedImagePath && resizedImagePath !== screenshotPath) {
                cleanupResizedImage(resizedImagePath);
            }
            
            // Fallback to basic test generation
            const fallbackResult = this.generateBasicTestFromURL(url);
            
            // Add metadata about fallback usage
            if (usedFallback) {
                fallbackResult.metadata = {
                    usedFallback: true,
                    fallbackReason: fallbackReason,
                    originalError: error.message.split(':')[1] || 'Unknown error'
                };
            }
            
            return fallbackResult;
        }
    }

    // Analyze uploaded image with GPT-4 Vision
    async analyzeUploadedImage(imagePath, originalName) {
        let resizedImagePath = null;
        try {
            // Resize and optimize image for AI analysis to reduce token costs
            console.log(`🔧 Optimizing uploaded image for AI analysis to reduce token costs...`);
            const imageData = await getOptimizedImageBase64(imagePath, 500);
            const { base64: base64Image, mimeType, resizedPath } = imageData;
            resizedImagePath = resizedPath;

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
                    messages: [
                        {
                            role: 'system',
                            content: `You are a web testing expert. Analyze the uploaded screenshot/image of a web interface and generate comprehensive test cases based on the visible UI elements, following our system's selector conventions and level-based hierarchy.

Focus on:
1. Interactive elements (buttons, links, forms, inputs, dropdowns)
2. Navigation elements (menus, breadcrumbs, tabs)
3. Important content areas (headers, sections, cards)
4. Login/authentication flows if visible
5. Search functionality if present
6. Form elements and their validation
7. Modal dialogs or popups if visible

${this.generateSelectorGuidance()}

Return a JSON object with this exact structure:
{
  "testCase": {
    "name": "Descriptive test name based on the interface",
    "description": "Brief description of what this test validates",
    "url": "https://example.com",
    "actions": [
      {
        "type": "click|fill|select|wait|verify|assert_visible|assert_text",
        "selector": "CSS selector following level hierarchy",
        "value": "value for fill/select actions",
        "description": "Human readable description"
      }
    ]
  }
}

Supported action types:
- navigate: Navigate to URL
- click: Click buttons, links, elements  
- fill: Fill input fields
- select: Select dropdown options (use multi-selector patterns for dropdowns)
- wait: Wait for elements or time
- verify: Verify page content or URL
- assert_visible: Assert element is visible
- assert_text: Assert text content
- hover: Hover over elements
- scroll: Scroll the page

IMPORTANT:
- Follow the selector level hierarchy (Level 1-5)
- Use multi-selector patterns for dropdowns
- Include placeholder selectors when specific ones cannot be determined
- Generate realistic test scenarios that validate key functionality
- Prefer system-specific conventions (PascalCase IDs, semantic selectors)`
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Please analyze this screenshot/image and generate a comprehensive test case that covers the main interactive elements and user flows visible in the interface. Focus on realistic testing scenarios that would validate the functionality shown.`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64Image}`,
                                        detail: 'high'
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1500,
                    temperature: 0.3
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                // Check for specific error types to provide better user experience
                const errorType = data.error?.type || 'unknown';
                const errorCode = data.error?.code || 'unknown';
                const errorMessage = data.error?.message || 'Unknown error';
                
                if (errorType === 'insufficient_quota' || errorCode === 'insufficient_quota') {
                    console.warn('OpenAI API quota exceeded for image analysis, falling back to basic test generation');
                    throw new Error(`quota_exceeded:${errorMessage}`);
                } else if (response.status === 429) {
                    console.warn('OpenAI API rate limit exceeded for image analysis, falling back to basic test generation');
                    throw new Error(`rate_limit:${errorMessage}`);
                } else {
                    console.error('OpenAI API error during image analysis:', data);
                    throw new Error(`OpenAI API error: ${errorMessage}`);
                }
            }

            const content = data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response content from OpenAI');
            }

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                if (result?.testCase?.actions) {
                    result.testCase.actions = this.normalizeActions(result.testCase.actions);
                    // Apply system-based selector enhancement
                    result.testCase = this.enhanceAIGeneratedSelectors(result.testCase);
                }
                
                // Clean up resized image if it was created and different from original
                if (resizedImagePath !== imagePath) {
                    cleanupResizedImage(resizedImagePath);
                }
                
                return result;
            } else {
                throw new Error('Could not extract JSON from AI response');
            }

        } catch (error) {
            console.error('AI image analysis failed:', error);
            
            // Check if this is a quota or rate limit error for better user messaging
            let usedFallback = false;
            let fallbackReason = '';
            
            if (error.message.startsWith('quota_exceeded:')) {
                console.warn('Gracefully falling back to basic test generation due to quota limits');
                usedFallback = true;
                fallbackReason = 'quota_exceeded';
            } else if (error.message.startsWith('rate_limit:')) {
                console.warn('Gracefully falling back to basic test generation due to rate limits');
                usedFallback = true;
                fallbackReason = 'rate_limit';
            }
            
            // Clean up resized image if it was created and different from original
            if (resizedImagePath && resizedImagePath !== imagePath) {
                cleanupResizedImage(resizedImagePath);
            }
            
            // Fallback: Generate basic test case for uploaded image
            const fallbackResult = this.generateBasicTestFromImage(originalName);
            
            // Add metadata about fallback usage
            if (usedFallback) {
                fallbackResult.metadata = {
                    usedFallback: true,
                    fallbackReason: fallbackReason,
                    originalError: error.message.split(':')[1] || 'Unknown error'
                };
            }
            
            return fallbackResult;
        }
    }

    // Generate a basic test case for uploaded image (fallback)
    generateBasicTestFromImage(originalName) {
        const testName = `UI Test from ${originalName}`;
        
        return {
            testCase: {
                name: testName,
                description: `Test case generated from uploaded image: ${originalName}`,
                url: 'https://example.com',
                actions: [
                    {
                        type: 'navigate',
                        selector: '',
                        value: 'https://example.com',
                        description: 'Navigate to the application'
                    },
                    {
                        type: 'wait',
                        value: '3000',
                        description: 'Wait for page to load'
                    },
                    {
                        type: 'assert_visible',
                        selector: 'body',
                        description: 'Verify page is loaded'
                    }
                ]
            }
        };
    }
    generateBasicTestFromURL(url) {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const testName = `Basic Navigation Test for ${domain}`;
        
        return {
            testCase: {
                name: testName,
                description: `Basic navigation and interaction test for ${url}`,
                url: url,
                actions: [
                    {
                        type: 'navigate',
                        selector: '',
                        value: url,
                        description: `Navigate to ${url}`
                    },
                    {
                        type: 'wait',
                        value: '3000',
                        description: 'Wait for page to load'
                    },
                    {
                        type: 'assert_visible',
                        selector: 'body',
                        description: 'Verify page is loaded'
                    }
                ]
            }
        };
    }
}

module.exports = OpenAIService;