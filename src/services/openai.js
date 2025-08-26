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

            // Parse actions
            if (lowerLine.includes('click')) {
                const selector = this.extractSelector(line, 'button');
                actions.push({
                    type: 'click',
                    selector: selector,
                    description: line.trim()
                });
            } else if (lowerLine.includes('type') || lowerLine.includes('enter') || lowerLine.includes('input')) {
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
        // Try to extract quoted text as selector
        const quotedMatch = line.match(/["']([^"']+)["']/);
        if (quotedMatch) {
            const text = quotedMatch[1];
            if (text.includes('#') || text.includes('.') || text.includes('[')) {
                return text; // Looks like a CSS selector
            } else {
                // Convert text to selector
                return `*:contains("${text}")`;
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
        // Try to extract quoted value
        const quotedMatch = line.match(/["']([^"']+)["']/);
        if (quotedMatch) {
            return quotedMatch[1];
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