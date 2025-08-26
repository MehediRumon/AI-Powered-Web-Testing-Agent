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
        "type": "navigate|input|click|verify|wait|assert_visible|assert_text|fill",
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
- input/fill: Fill text into input fields 
- click: Click buttons, links, or elements
- verify: Check if redirected to expected URL
- wait: Wait for elements or time
- assert_visible: Assert element is visible
- assert_text: Assert text content

Use specific locators for common login scenarios:
- For email fields: input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"]
- For "User Email" fields: input[name*="Email"], input[id*="Email"], input[placeholder*="Email"]
- For password fields: input[type="password"], input[name*="password"], input[id*="password"]
- For login buttons: button:has-text("Log in"), button:has-text("Login"), input[type="submit"], button[type="submit"]
- For generic elements: .class-name, #element-id

Special handling for login flows:
- Always start with navigation to the URL if provided
- Use 'fill' type for entering text in input fields
- Target email fields with multiple selector options for reliability
- Use descriptive button selectors that match common login text

Example input: "Navigate to https://ums-2.osl.team/Account/Login, Enter rumon.onnorokom@gmail.com in User Email field, Enter password in Password field, Click Log in button"
Example output: 
{
  "testCase": {
    "name": "UMS Login Test",
    "description": "Test login functionality for UMS system",
    "url": "https://ums-2.osl.team/Account/Login",
    "actions": [
      {"type": "navigate", "locator": "", "value": "https://ums-2.osl.team/Account/Login", "description": "Navigate to login page"},
      {"type": "fill", "locator": "input[type=\"email\"], input[name*=\"email\"], input[id*=\"email\"], input[name*=\"Email\"], input[id*=\"Email\"]", "value": "rumon.onnorokom@gmail.com", "description": "Enter email address in User Email field"},
      {"type": "fill", "locator": "input[type=\"password\"], input[name*=\"password\"], input[id*=\"password\"]", "value": "your_password_here", "description": "Enter password in Password field"},
      {"type": "click", "locator": "button:has-text(\"Log in\"), button:has-text(\"Login\"), input[type=\"submit\"], button[type=\"submit\"]", "description": "Click the Log in button"}
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
                // Add navigation action if URL is mentioned in the instructions
                if (lowerLine.includes('navigate') || lowerLine.includes('go to') || lowerLine.includes('visit')) {
                    actions.push({
                        type: 'navigate',
                        value: urlMatch[0],
                        description: `Navigate to ${urlMatch[0]}`
                    });
                }
                continue;
            }

            // Extract test name
            if (lowerLine.includes('test:') || lowerLine.includes('name:')) {
                testName = line.split(':')[1]?.trim() || testName;
                continue;
            }

            // Parse actions with enhanced logic for login scenarios
            if (lowerLine.includes('click') || (lowerLine.includes('log in') && lowerLine.includes('button'))) {
                const selector = this.extractSelector(line, 'button');
                actions.push({
                    type: 'click',
                    selector: selector,
                    description: line.trim()
                });
            } else if (lowerLine.includes('enter') && (lowerLine.includes('email') || lowerLine.includes('user email'))) {
                const value = this.extractValue(line);
                const selector = this.extractSelector(line, 'input');
                actions.push({
                    type: 'fill',
                    selector: selector,
                    value: value,
                    description: line.trim()
                });
            } else if (lowerLine.includes('enter') && lowerLine.includes('password')) {
                let value = this.extractValue(line);
                const selector = this.extractSelector(line, 'input');
                // If no specific password was extracted, use placeholder
                if (!value || value === 'password' || value === 'Password' || value.toLowerCase().includes('valid')) {
                    value = 'your_password_here';
                }
                actions.push({
                    type: 'fill',
                    selector: selector,
                    value: value,
                    description: line.trim()
                });
            } else if (lowerLine.includes('type') || lowerLine.includes('input') || lowerLine.includes('fill')) {
                const value = this.extractValue(line);
                const selector = this.extractSelector(line, 'input');
                actions.push({
                    type: 'fill',
                    selector: selector,
                    value: value,
                    description: line.trim()
                });
            } else if (lowerLine.includes('select')) {
                const value = this.extractValue(line);
                const selector = this.extractSelector(line, 'select');
                actions.push({
                    type: 'select',
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

        // If URL found but no navigation action added, add it at the beginning
        if (testUrl && !actions.some(action => action.type === 'navigate')) {
            actions.unshift({
                type: 'navigate',
                value: testUrl,
                description: `Navigate to ${testUrl}`
            });
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
        // Enhanced field type detection for specific field names FIRST
        const lowerLine = line.toLowerCase();
        
        // Email field detection (prioritized)
        if (lowerLine.includes('user email') || lowerLine.includes('email address') || lowerLine.includes('email field')) {
            return 'input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"], input[name*="Email"], input[id*="Email"]';
        } else if (lowerLine.includes('email')) {
            return 'input[type="email"], input[name*="email"], input[id*="email"]';
        }
        
        // Password field detection (prioritized)
        if (lowerLine.includes('password') && lowerLine.includes('field')) {
            return 'input[type="password"], input[name*="password"], input[id*="password"]';
        }
        
        // Login button detection (prioritized)
        if (lowerLine.includes('log in') || (lowerLine.includes('login') && lowerLine.includes('button'))) {
            return 'button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in"), input[type="submit"], button[type="submit"]';
        }

        // Try to extract quoted text as selector (secondary)
        const quotedMatch = line.match(/["']([^"']+)["']/);
        if (quotedMatch) {
            const text = quotedMatch[1];
            // If it contains CSS selector characters, use as-is
            if (text.includes('#') || text.includes('.') || text.includes('[')) {
                return text; // Looks like a CSS selector
            }
            // If it's an email address, don't use it as selector
            if (!text.includes('@') && !lowerLine.includes('field')) {
                // Convert text to Playwright text locator for non-email, non-field text
                return `text=${text}`;
            }
        }
        
        // Generic detection
        if (lowerLine.includes('button')) {
            return 'button, .btn, [type="submit"]';
        } else if (lowerLine.includes('link')) {
            return 'a';
        } else if (lowerLine.includes('input') || lowerLine.includes('field')) {
            return 'input, textarea';
        }

        return defaultSelector;
    }

    extractValue(line) {
        // Try to extract email address first (anywhere in the line)
        const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
            return emailMatch[0];
        }

        // Try to extract quoted value (including values in quotes) but skip field names
        const quotedMatch = line.match(/["']([^"']+)["']/);
        if (quotedMatch) {
            const quotedValue = quotedMatch[1];
            // If the quoted value is just a field name, ignore it
            if (quotedValue.toLowerCase() === 'user email' || 
                quotedValue.toLowerCase() === 'password' || 
                quotedValue.toLowerCase() === 'email') {
                // Fall through to other extraction methods
            } else {
                return quotedValue;
            }
        }

        // Try to extract value after common phrases for login scenarios
        const lowerLine = line.toLowerCase();
        
        // For password entries - if it's a generic request, return placeholder
        if (lowerLine.includes('password') && lowerLine.includes('field') && 
            !lowerLine.match(/enter\s+[^\s]+\s+in.*password/)) {
            return 'your_password_here'; // Placeholder for password when no specific value given
        }

        // For specific password values mentioned
        if (lowerLine.includes('password')) {
            const passwordMatch = line.match(/enter\s+["']?([^"'\s]+)["']?\s+.*password/i);
            if (passwordMatch && passwordMatch[1] && 
                passwordMatch[1].toLowerCase() !== 'password' &&
                !passwordMatch[1].toLowerCase().includes('valid')) {
                return passwordMatch[1];
            }
        }

        // Try to extract value after "with" or ":" 
        const withMatch = line.match(/(?:with|:)\s*(.+)$/i);
        if (withMatch) {
            return withMatch[1].trim();
        }

        return '';
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