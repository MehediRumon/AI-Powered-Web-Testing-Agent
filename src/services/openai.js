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
        "expectedUrl": "expected_url_for_verify_actions"
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
        // Enhanced rule-based parsing as fallback
        const actions = [];
        
        let testName = 'UMS Login and Teacher Management Test';
        let testUrl = '';
        let testDescription = instructions.substring(0, 200) + '...';

        // Extract URL from anywhere in the instructions
        const urlMatch = instructions.match(/https?:\/\/[^\s\.]+(?:\.[^\s\.]*)*(?:\/[^\s]*)?/);
        if (urlMatch) {
            testUrl = urlMatch[0].replace(/\.$/, ''); // Remove trailing period
        }

        // Split instructions by sentence endings or periods, then filter and process
        const sentences = instructions.split(/[\.!]\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase().trim();
            
            // Skip empty sentences or URLs alone
            if (!lowerSentence || lowerSentence.startsWith('http')) {
                continue;
            }

            // Handle navigation
            if (lowerSentence.includes('navigate') && testUrl) {
                actions.push({
                    type: 'navigate',
                    selector: '',
                    value: testUrl,
                    description: `Navigate to ${testUrl}`
                });
                continue;
            }

            // Handle clicks - look for "click" followed by quoted text
            if (lowerSentence.includes('click')) {
                const buttonText = this.extractButtonText(sentence);
                if (buttonText) {
                    const action = {
                        type: 'click',
                        selector: `text=${buttonText}`,
                        description: `Click the "${buttonText}" button`,
                        timeout: 30000 // 30 seconds timeout for clicks
                    };
                    actions.push(action);
                }
                continue;
            }

            // Handle input/fill actions - look for "enter" followed by value and field
            if (lowerSentence.includes('enter') && (lowerSentence.includes('field') || lowerSentence.includes('in the'))) {
                const result = this.extractInputAction(sentence);
                if (result.value && result.fieldName) {
                    actions.push({
                        type: 'fill',
                        selector: this.generateInputSelector(result.fieldName),
                        value: result.value,
                        description: `Enter "${result.value}" in the "${result.fieldName}" field`
                    });
                }
                continue;
            }
        }

        return {
            testCase: {
                name: testName,
                description: testDescription,
                url: testUrl || 'https://example.com',
                actions: actions
            }
        };
    }

    // Helper method to extract button text from click instructions
    extractButtonText(sentence) {
        // Look for text in quotes after "click"
        const clickMatch = sentence.match(/click\s+(?:the\s+)?["']([^"']+)["']/i);
        if (clickMatch) {
            return clickMatch[1];
        }
        
        // Look for text after "click the" without quotes
        const clickTheMatch = sentence.match(/click\s+the\s+([^\.]+)/i);
        if (clickTheMatch) {
            return clickTheMatch[1].trim().replace(/\s+button$/, '');
        }
        
        return null;
    }

    // Helper method to extract input actions
    extractInputAction(sentence) {
        // Pattern: Enter "value" in the "field name" field
        const enterMatch = sentence.match(/enter\s+(?:email\s+)?["']([^"']+)["']\s+in\s+(?:the\s+)?["']([^"']+)["']/i);
        if (enterMatch) {
            return { value: enterMatch[1], fieldName: enterMatch[2] };
        }
        
        // Pattern: Enter email "value" in "field" (for email specifically)
        const emailMatch = sentence.match(/enter\s+email\s+["']([^"']+)["']\s+in\s+(?:the\s+)?["']([^"']+)["']/i);
        if (emailMatch) {
            return { value: emailMatch[1], fieldName: emailMatch[2] };
        }
        
        // Pattern: Enter password "value" in "field" (for password specifically)  
        const passwordMatch = sentence.match(/enter\s+password\s+["']([^"']+)["']\s+in\s+(?:the\s+)?["']([^"']+)["']/i);
        if (passwordMatch) {
            return { value: passwordMatch[1], fieldName: passwordMatch[2] };
        }
        
        // Pattern: Enter value in field (without quotes)
        const enterMatch2 = sentence.match(/enter\s+([^"'\s]+)\s+in\s+(?:the\s+)?(.+?)(?:\s+field)?$/i);
        if (enterMatch2) {
            return { value: enterMatch2[1], fieldName: enterMatch2[2].trim() };
        }
        
        return { value: null, fieldName: null };
    }

    // Helper method to generate appropriate input selectors
    generateInputSelector(fieldName) {
        const lowerField = fieldName.toLowerCase();
        
        // Map common field names to better selectors
        if (lowerField.includes('email') || lowerField.includes('user email')) {
            return 'input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"]';
        } else if (lowerField.includes('password')) {
            return 'input[type="password"], input[name*="password"], input[id*="password"]';
        } else if (lowerField.includes('username') || lowerField.includes('user name')) {
            return 'input[name*="username"], input[name*="user"], input[id*="username"], input[id*="user"]';
        } else if (lowerField.includes('nick name') || lowerField.includes('nickname')) {
            return 'input[name*="nick"], input[id*="nick"], input[placeholder*="nick"]';
        } else if (lowerField.includes('full name') || lowerField.includes('fullname')) {
            return 'input[name*="fullname"], input[name*="full"], input[id*="fullname"], input[id*="full"]';
        } else {
            // Generic selector based on field name
            const cleanField = fieldName.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
            return `input[name*="${cleanField}"], input[id*="${cleanField}"], input[placeholder*="${cleanField}"], text=${fieldName}`;
        }
    }

    extractSelector(line, defaultSelector) {
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

        // Try to extract element type
        if (line.toLowerCase().includes('button')) {
            return 'button, .btn, [type="submit"]';
        } else if (line.toLowerCase().includes('link')) {
            return 'a';
        } else if (line.toLowerCase().includes('input') || line.toLowerCase().includes('field')) {
            return 'input, textarea';
        }

        return defaultSelector;
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