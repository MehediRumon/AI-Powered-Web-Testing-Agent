// openAIService.js
class OpenAIService {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseURL = 'https://api.openai.com/v1';
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
                throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
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
            console.warn('OpenAI parsing failed, using fallback:', error.message);
            return this.fallbackParse(instructions);
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
}

module.exports = OpenAIService;