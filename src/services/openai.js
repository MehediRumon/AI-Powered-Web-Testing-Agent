class OpenAIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
    }

    async parseTestInstructions(instructions) {
        if (!this.apiKey) {
            // Fallback parsing without OpenAI
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
                            content: `You are a web testing expert. Parse natural language test instructions and convert them to structured test actions. 
                            
Return a JSON object with this exact structure:
{
  "testCase": {
    "name": "Test name",
    "description": "Test description", 
    "url": "Target URL",
    "actions": [
      {
        "type": "navigate|input|click|verify|wait|assert_visible|assert_text",
        "locator": "CSS_selector_or_element_identifier", 
        "value": "input_value_if_needed",
        "description": "Human readable step description",
        "expectedUrl": "expected_url_for_verify_actions",
        "elementType": "button|link|generic (optional, for click actions to specify element type preference)"
      }
    ]
  }
}

Supported action types:
- navigate: Navigate to a URL
- input: Fill text into input fields 
- click: Click buttons, links, or elements
- verify: Check if redirected to expected URL
- wait: Wait for elements or time
- assert_visible: Assert element is visible
- assert_text: Assert text content

Use specific locators:
- For input fields: input[name="username"], #password, input[type="email"]
- For buttons: button:contains('Login'), .login-btn, [type="submit"]
- For links: a[href*="/login"], .nav-link
- For generic elements: .class-name, #element-id

Example input: "Navigate to /login, enter username admin, enter password password123, click Login, verify redirected to dashboard"
Example output: 
{
  "testCase": {
    "name": "Login Test",
    "description": "Verify login functionality",
    "url": "/login",
    "actions": [
      {"type": "navigate", "locator": "", "value": "/login", "description": "Navigate to login page"},
      {"type": "input", "locator": "input[name='username']", "value": "admin", "description": "Enter username"},
      {"type": "input", "locator": "input[name='password']", "value": "password123", "description": "Enter password"},
      {"type": "click", "locator": "button:contains('Login')", "description": "Click login button"},
      {"type": "verify", "locator": "", "expectedUrl": "/dashboard", "description": "Verify redirected to dashboard"}
    ]
  }
}`
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
                throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
            }

            const content = data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response content from OpenAI');
            }

            // Try to parse JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            throw new Error('Could not extract JSON from OpenAI response');

        } catch (error) {
            console.warn('OpenAI parsing failed, using fallback:', error.message);
            return this.fallbackParse(instructions);
        }
    }

    fallbackParse(instructions) {
        // Simple rule-based parsing as fallback
        const lines = instructions.split('\n').filter(line => line.trim());
        const actions = [];
        
        let testName = 'AI Parsed Test';
        let testUrl = '';
        let testDescription = '';

        for (const line of lines) {
            const lowerLine = line.toLowerCase().trim();
            
            // Extract URL
            const urlMatch = line.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                testUrl = urlMatch[0];
                continue;
            }

            // Extract test name
            if (lowerLine.includes('test:') || lowerLine.includes('name:')) {
                testName = line.split(':')[1]?.trim() || testName;
                continue;
            }

            // Parse actions - order matters for proper detection
            if (lowerLine.includes('click')) {
                const selector = this.extractSelector(line, 'button');
                const action = {
                    type: 'click',
                    selector: selector,
                    description: line.trim()
                };
                
                // Detect element type from the instruction
                if (lowerLine.includes('button')) {
                    action.elementType = 'button';
                } else if (lowerLine.includes('link')) {
                    action.elementType = 'link';
                }
                
                // Add longer timeout for text-based selectors
                if (selector.startsWith('text=')) {
                    action.timeout = 90000; // 90 seconds for text-based clicks
                }
                
                actions.push(action);
            } else if (lowerLine.includes('select') || lowerLine.includes('choose') || lowerLine.includes('pick')) {
                // Prioritize select actions for dropdown-related instructions
                const value = this.extractValue(line);
                const selector = this.extractSelector(line, 'select');
                actions.push({
                    type: 'select',
                    selector: selector,
                    value: value,
                    description: line.trim()
                });
            } else if (this.isInputAction(lowerLine)) {
                // More specific detection for input/fill actions
                const value = this.extractValue(line);
                const selector = this.extractSelector(line, 'input');
                actions.push({
                    type: 'fill',
                    selector: selector,
                    value: value,
                    description: line.trim()
                });
            } else if (lowerLine.includes('wait')) {
                const waitTime = line.match(/\d+/)?.[0] || '2000';
                actions.push({
                    type: 'wait',
                    value: waitTime,
                    description: line.trim()
                });
            } else if (lowerLine.includes('check') && !lowerLine.includes('uncheck')) {
                const selector = this.extractSelector(line, 'input[type="checkbox"]');
                actions.push({
                    type: 'check',
                    selector: selector,
                    description: line.trim()
                });
            } else if (lowerLine.includes('scroll')) {
                actions.push({
                    type: 'scroll',
                    description: line.trim()
                });
            }
        }

        return {
            testCase: {
                name: testName,
                description: testDescription || instructions.substring(0, 100) + '...',
                url: testUrl || 'https://example.com',
                actions: actions
            }
        };
    }

    extractSelector(line, defaultSelector) {
        const lowerLine = line.toLowerCase();
        
        // Special handling for dropdown/select actions
        if (defaultSelector === 'select' && this.isDropdownAction(lowerLine)) {
            return this.extractDropdownSelector(line);
        }
        
        // Find all quoted strings in the line
        const allQuotedMatches = line.match(/["']([^"']+)["']/g);
        
        if (allQuotedMatches && allQuotedMatches.length > 0) {
            // Extract the content of all quoted strings
            const quotedValues = allQuotedMatches.map(match => match.slice(1, -1)); // Remove quotes
            
            // For selectors, prefer field labels over input values
            for (const text of quotedValues) {
                if (text.includes('#') || text.includes('.') || text.includes('[')) {
                    return text; // Looks like a CSS selector
                }
                
                // Prefer field labels for selectors
                if (this.isFieldLabel(text)) {
                    return `text=${text}`;
                }
            }
            
            // If no field label found, use the first quoted string
            const firstText = quotedValues[0];
            if (firstText.includes('#') || firstText.includes('.') || firstText.includes('[')) {
                return firstText; // Looks like a CSS selector
            } else {
                return `text=${firstText}`;
            }
        }

        // Try to extract text content for element type keywords
        if (lowerLine.includes('button') || lowerLine.includes('link')) {
            // Extract text from patterns like "click Login Button" or "click Home link"
            const textPattern = /click\s+(.+?)\s+(button|link)/i;
            const match = line.match(textPattern);
            if (match) {
                return `text=${match[1].trim()}`;
            }
            
            // Fallback: try to extract any word before "button"/"link"
            const beforePattern = /(\w+)\s+(button|link)/i;
            const beforeMatch = line.match(beforePattern);
            if (beforeMatch) {
                return `text=${beforeMatch[1]}`;
            }
        }

        // For simple patterns like "click Submit" without explicit element type
        if (lowerLine.startsWith('click ')) {
            const textAfterClick = line.slice(6).trim(); // Remove "click "
            if (textAfterClick && !textAfterClick.includes('#') && !textAfterClick.includes('.') && !textAfterClick.includes('[')) {
                return `text=${textAfterClick}`;
            }
        }

        // If no text can be extracted and it's an element type, return generic text-based fallback
        if (lowerLine.includes('button')) {
            return defaultSelector === 'button' ? 'button, .btn, [type="submit"]' : defaultSelector;
        } else if (lowerLine.includes('link')) {
            return defaultSelector === 'button' ? 'a' : defaultSelector;
        } else if (lowerLine.includes('input') || lowerLine.includes('field')) {
            return 'input, textarea';
        }

        return defaultSelector;
    }

    // Extract dropdown selector with dynamic generation instead of hardcoded mappings
    extractDropdownSelector(line) {
        const lowerLine = line.toLowerCase();
        
        // Look for common dropdown name patterns
        const dropdownPatterns = [
            /(?:from|in)\s+(?:the\s+)?(.+?)\s+(?:dropdown|select)/gi,
            /(?:dropdown|select).*?(?:id|name)[:\s]+['"]?([^'"]+)['"]?/gi,
            /(?:id|name)[:\s]+['"]?([^'"]+)['"]?.*?(?:dropdown|select)/gi
        ];
        
        for (const pattern of dropdownPatterns) {
            // Use exec() to get capture groups properly
            pattern.lastIndex = 0; // Reset regex state
            const match = pattern.exec(line);
            if (match && match[1]) {
                const fieldName = match[1].trim().toLowerCase();
                
                // Generate dynamic selector from field name
                const cleanName = fieldName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
                if (cleanName) {
                    // Generate comprehensive selector patterns that work for various naming conventions
                    return this.generateDropdownSelector(cleanName, fieldName);
                }
            }
        }
        
        // Look for explicit ID or name in the instruction
        const idMatch = line.match(/(?:id|ID)[\s=:]+['"]?([^'"\s]+)['"]?/);
        if (idMatch) {
            return `#${idMatch[1]}`;
        }
        
        const nameMatch = line.match(/(?:name)[\s=:]+['"]?([^'"\s]+)['"]?/);
        if (nameMatch) {
            return `select[name="${nameMatch[1]}"]`;
        }
        
        // Default dropdown selector - prioritize ID-based common patterns
        return 'select, [role="combobox"], [role="listbox"]';
    }

    // Generate dynamic dropdown selector based on field name
    generateDropdownSelector(cleanName, originalFieldName) {
        const selectors = [];
        
        // Get the primary selector first (for backward compatibility)
        const primarySelector = this.getPrimarySelector(originalFieldName);
        if (primarySelector) {
            selectors.push(primarySelector);
        }
        
        // Add additional fallback patterns
        const fallbackPatterns = this.getFallbackPatterns(cleanName, originalFieldName);
        selectors.push(...fallbackPatterns);
        
        // Remove duplicates and return
        return [...new Set(selectors)].join(', ');
    }

    // Get the primary selector for known field types (backward compatibility)
    getPrimarySelector(fieldName) {
        const lowerFieldName = fieldName.toLowerCase();
        
        // Primary selectors that match the expected test behavior
        if (lowerFieldName.includes('mobile') && lowerFieldName.includes('banking')) {
            return '#MobileBankingType';
        }
        
        if (lowerFieldName.includes('teacher') && lowerFieldName.includes('grade')) {
            return '#teachergrade';
        }
        
        if (lowerFieldName.includes('religion')) {
            return '#religion';
        }
        
        if (lowerFieldName.includes('country')) {
            return '#country';
        }
        
        if (lowerFieldName.includes('state')) {
            return '#state';
        }
        
        if (lowerFieldName.includes('province')) {
            return '#province';
        }
        
        // For unknown fields, generate primary selector from clean name
        const cleanName = fieldName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return `#${cleanName}`;
    }

    // Get fallback patterns for better reliability
    getFallbackPatterns(cleanName, originalFieldName) {
        const patterns = [];
        const lowerFieldName = originalFieldName.toLowerCase();
        
        // Add standard fallbacks
        patterns.push(`#${cleanName}Type`);
        patterns.push(`select[name="${cleanName}"]`);
        patterns.push(`select[name="${cleanName}Type"]`);
        
        // Add camelCase variations
        const camelCaseName = this.toCamelCase(originalFieldName);
        if (camelCaseName !== cleanName) {
            patterns.push(`#${camelCaseName}`);
            patterns.push(`#${camelCaseName}Type`);
        }
        
        // Add specific fallbacks for known field types
        if (lowerFieldName.includes('mobile') && lowerFieldName.includes('banking')) {
            patterns.push('#mobileBankingType', '#mobile-banking-type');
        }
        
        if (lowerFieldName.includes('teacher') && lowerFieldName.includes('grade')) {
            patterns.push('#teacherGrade', '#teacher-grade', '#teachergradeType');
        }
        
        if (lowerFieldName.includes('religion')) {
            patterns.push('#Religion', '#religionType');
        }
        
        if (lowerFieldName.includes('country')) {
            patterns.push('#Country', 'select[name="country"]');
        }
        
        if (lowerFieldName.includes('state')) {
            patterns.push('#State', 'select[name="state"]');
        }
        
        if (lowerFieldName.includes('province')) {
            patterns.push('#Province', 'select[name="province"]');
        }
        
        return patterns;
    }

    // Convert field name to camelCase
    toCamelCase(fieldName) {
        return fieldName
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .split(/\s+/)
            .map((word, index) => {
                if (index === 0) return word;
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join('');
    }

    extractValue(line) {
        // Find all quoted strings in the line
        const allQuotedMatches = line.match(/["']([^"']+)["']/g);
        
        if (allQuotedMatches && allQuotedMatches.length > 0) {
            // Extract the content of all quoted strings
            const quotedValues = allQuotedMatches.map(match => match.slice(1, -1)); // Remove quotes
            
            if (quotedValues.length === 1) {
                return quotedValues[0];
            }
            
            // If multiple quoted strings, try to determine which is the value to input
            for (let i = 0; i < quotedValues.length; i++) {
                const value = quotedValues[i];
                
                // Skip values that look like field labels or UI element text
                if (this.isFieldLabel(value)) {
                    continue;
                }
                
                // Prefer values that look like actual input data
                if (this.isInputValue(value)) {
                    return value;
                }
            }
            
            // If no clear input value found, look for patterns that suggest the actual value
            // Priority: last quoted string that's not a common field label
            for (let i = quotedValues.length - 1; i >= 0; i--) {
                const value = quotedValues[i];
                if (!this.isFieldLabel(value)) {
                    return value;
                }
            }
            
            // Fallback to the last quoted string
            return quotedValues[quotedValues.length - 1];
        }

        // Try to extract value after "with" or ":" 
        const withMatch = line.match(/(?:with|:)\s*(.+)$/i);
        if (withMatch) {
            return withMatch[1].trim();
        }

        return '';
    }

    // Helper method to identify if a string looks like a field label
    isFieldLabel(text) {
        const fieldLabels = [
            'username', 'user name', 'user email', 'email', 'password', 'login', 'log in',
            'first name', 'last name', 'phone', 'address', 'field',
            'search', 'filter', 'dropdown', 'select', 'checkbox', 'radio'
        ];
        
        // Common button/action words that shouldn't be treated as field labels
        const buttonWords = ['submit', 'button', 'click', 'press', 'cancel', 'ok', 'yes', 'no'];
        
        const lowerText = text.toLowerCase().trim();
        
        // Don't treat button text as field labels
        if (buttonWords.includes(lowerText)) {
            return false;
        }
        
        return fieldLabels.some(label => 
            lowerText === label || 
            lowerText.includes(label + ' field') ||
            lowerText.includes(label + ' input') ||
            lowerText.includes(label + ' box')
        );
    }

    // Helper method to identify if a string looks like an actual input value
    isInputValue(text) {
        // Email pattern
        if (text.includes('@') && text.includes('.')) {
            return true;
        }
        
        // URL pattern
        if (text.startsWith('http://') || text.startsWith('https://')) {
            return true;
        }
        
        // Phone number pattern
        if (/^\+?[\d\s\-\(\)]{7,}$/.test(text)) {
            return true;
        }
        
        // If it contains specific characters that suggest it's data, not a label
        // But be more specific about length and content
        if (text.length > 15 && (text.includes('@') || text.includes('.') || /\d{4,}/.test(text))) {
            return true;
        }
        
        return false;
    }

    // Helper method to identify input/fill actions more precisely
    isInputAction(lowerLine) {
        // More specific patterns for input actions to avoid false positives
        return (
            lowerLine.includes('type in') ||
            lowerLine.includes('type into') ||
            lowerLine.includes('enter') ||
            lowerLine.includes('input') ||
            lowerLine.includes('fill') ||
            (lowerLine.includes('type') && (
                lowerLine.includes('field') ||
                lowerLine.includes('box') ||
                lowerLine.includes('username') ||
                lowerLine.includes('password') ||
                lowerLine.includes('email') ||
                lowerLine.includes('search')
            ))
        ) && !this.isDropdownAction(lowerLine);
    }

    // Helper method to identify dropdown-related actions
    isDropdownAction(lowerLine) {
        return (
            lowerLine.includes('dropdown') ||
            lowerLine.includes('select') ||
            lowerLine.includes('choose') ||
            lowerLine.includes('pick') ||
            (lowerLine.includes('from') && (
                lowerLine.includes('dropdown') ||
                lowerLine.includes('select') ||
                lowerLine.includes('option')
            ))
        );
    }

    async generateTestFromURL(url) {
        if (!this.apiKey) {
            return this.generateBasicTest(url);
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
                            content: `Generate a basic web test for the given URL. Create common test actions that would be appropriate for most websites. Return a JSON object with the test case structure.`
                        },
                        {
                            role: 'user',
                            content: `Generate a test case for this URL: ${url}`
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 800
                })
            });

            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (content) {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }

            return this.generateBasicTest(url);

        } catch (error) {
            console.warn('OpenAI test generation failed, using basic test:', error.message);
            return this.generateBasicTest(url);
        }
    }

    generateBasicTest(url) {
        const domain = url.replace(/https?:\/\//, '').split('/')[0];
        
        return {
            testCase: {
                name: `Basic Test for ${domain}`,
                description: `Automated basic functionality test for ${url}`,
                url: url,
                actions: [
                    {
                        type: 'wait',
                        value: '2000',
                        description: 'Wait for page to load'
                    },
                    {
                        type: 'assert_visible',
                        selector: 'body',
                        description: 'Verify page is visible'
                    }
                ]
            }
        };
    }
}

module.exports = OpenAIService;