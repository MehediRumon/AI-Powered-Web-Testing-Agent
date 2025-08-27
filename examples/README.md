# Natural Language Test Case Format - Usage Guide

## Overview

This guide provides comprehensive information about creating test cases using natural language descriptions that get automatically parsed into structured test cases for the AI-Powered Web Testing Agent.

## Quick Start

### Basic Usage

1. **Simple Action**: `"Click the Login button"`
2. **Input Data**: `"Enter 'john@example.com' in email field"`
3. **Navigation**: `"Navigate to /login page"`
4. **Verification**: `"Verify redirected to dashboard"`

### Complete Test Flow

```
Navigate to /login, enter username 'testuser', enter password 'password123', click Login button, verify redirected to dashboard
```

This generates a complete test case with 5 structured actions.

## Supported Natural Language Patterns

### 1. Navigation Commands
- `"Navigate to /login"`
- `"Go to https://example.com"`
- `"Visit the homepage"`
- `"Open /register page"`

### 2. Input Actions
- `"Enter 'value' in fieldname"`
- `"Type 'text' into input field"`
- `"Fill username with 'admin'"`
- `"Input 'data' in the form"`

### 3. Click Actions
- `"Click the Submit button"`
- `"Press Login"`
- `"Click on Save"`
- `"Click the link in navbar"` (with elementType: "link")

### 4. Form Interactions
- `"Select 'Option' from dropdown"`
- `"Choose 'Value' from menu"`
- `"Check the checkbox"`
- `"Uncheck newsletter"`

### 5. Verification & Assertions
- `"Verify redirected to /dashboard"`
- `"Check that message is visible"`
- `"Assert text contains 'Success'"`
- `"Verify page title contains 'Welcome'"`

### 6. Wait Commands
- `"Wait 3 seconds"`
- `"Wait for loading spinner"`
- `"Pause until page loads"`
- `"Wait for element to appear"`

### 7. Advanced Interactions
- `"Hover over menu"`
- `"Scroll to bottom"`
- `"Scroll to footer"`

## Generated Test Case Structure

Each natural language description generates a JSON test case:

```json
{
  "testCase": {
    "name": "Generated Test Name",
    "description": "Test description based on input",
    "url": "Target URL or path",
    "actions": [
      {
        "type": "action_type",
        "locator": "element_selector",
        "value": "input_value",
        "description": "Human readable description",
        "elementType": "button|link|generic (optional)"
      }
    ]
  }
}
```

## Action Types Reference

| Type | Purpose | Example Natural Language | Generated Locator |
|------|---------|--------------------------|-------------------|
| `navigate` | Page navigation | "Go to /login" | `""` (uses value field) |
| `input` | Text input | "Enter 'admin' in username" | `input[name='username']` |
| `click` | Click elements | "Click Login button" | `button:contains('Login')` |
| `select` | Dropdown selection | "Select 'US' from country" | `select[name='country']` |
| `check` | Check checkboxes | "Check terms checkbox" | `input[name='terms']` |
| `uncheck` | Uncheck checkboxes | "Uncheck newsletter" | `input[name='newsletter']` |
| `hover` | Hover over elements | "Hover over menu" | `.menu` |
| `scroll` | Page scrolling | "Scroll to bottom" | `""` |
| `wait` | Wait/delays | "Wait 3 seconds" | `""` (uses value field) |
| `verify` | URL verification | "Verify redirected to /home" | `""` (uses expectedUrl) |
| `assert_visible` | Element visibility | "Check element is visible" | `.element` |
| `assert_text` | Text content | "Verify text contains 'Welcome'" | `.message` |

## Complex Scenarios

### E-commerce Shopping Flow
```
Navigate to /products, search for 'laptop', click first result, add to cart, go to cart, verify item added, proceed to checkout, fill shipping address, select payment method, place order
```

### User Registration
```
Go to /register, fill first name 'John', fill last name 'Doe', enter email 'john@example.com', type password 'secure123', confirm password 'secure123', check terms agreement, click Register, wait for confirmation
```

### Login with Error Handling
```
Navigate to /login, enter invalid username 'baduser', enter wrong password 'wrongpass', click Login, verify error message appears, check error contains 'Invalid credentials'
```

## Advanced Features

### Element Type Specification

When multiple elements have the same text, specify element type:

- `"Click the Login button"` → Prefers `<button>` elements
- `"Click the Login link"` → Prefers `<a>` elements  
- `"Click Login element"` → Uses generic selector

### Smart Selector Generation

The system automatically generates appropriate selectors:

- **Form fields**: `input[name='fieldname']`, `input[type='email']`
- **Buttons**: `button:contains('Text')`, `[type='submit']`
- **Links**: `a[href*='/path']`, `text=LinkText`
- **Generic**: `.class-name`, `#element-id`

### Value Extraction

The parser intelligently extracts values from quoted text:

- `"Enter 'john@example.com' in email"` → Extracts email address
- `"Type 'password123' and 'confirm123'"` → Handles multiple values
- `"Fill 'First Name' with 'John'"` → Distinguishes field from value

## API Usage

### Endpoint
```
POST /api/test/ai/parse
```

### Request
```json
{
  "instructions": "Your natural language test description"
}
```

### Response
```json
{
  "message": "Instructions parsed successfully",
  "parsed": {
    "testCase": {
      "name": "Generated Test Name",
      "description": "Test description",
      "url": "Target URL",
      "actions": [...]
    }
  }
}
```

## Error Handling

### Common Issues

1. **Missing URL**: System defaults to "https://example.com"
2. **Invalid actions**: Validation prevents unsupported action types
3. **Security**: Input sanitization removes dangerous characters
4. **AI unavailable**: Falls back to rule-based parsing

### Error Responses
```json
{
  "error": "Error description",
  "fallback": "Alternative solution when applicable"
}
```

## Best Practices

### 1. Be Specific
❌ `"Click button"`
✅ `"Click the Submit button"`

### 2. Include Navigation
❌ `"Enter username, click login"`  
✅ `"Navigate to /login, enter username 'admin', click Login"`

### 3. Use Descriptive Values
❌ `"Enter text"`
✅ `"Enter 'john@example.com' in email field"`

### 4. Chain Related Actions
✅ `"Fill form, submit, verify success message"`

### 5. Test Edge Cases
✅ `"Enter invalid data, verify error handling"`

## Validation Rules

### Required Fields
- `name`: 1-255 characters
- `url`: Valid HTTP/HTTPS URL or path starting with "/"
- `actions`: Array of valid action objects

### Security Features
- HTML tag removal from inputs
- URL validation against malicious patterns
- Action type validation
- Field length limits

## Fallback Parsing

When AI service is unavailable, the system uses rule-based parsing:

### Supported Patterns
- **Navigate**: "go to", "navigate", "visit"
- **Input**: "enter", "type", "fill", "input"  
- **Click**: "click", "press", "tap"
- **Wait**: "wait", "pause", "delay"
- **Verify**: "verify", "check", "assert"

### Limitations
- Less sophisticated selector generation
- Simpler value extraction
- Basic action recognition

## Examples by Use Case

### Form Testing
```
Navigate to /contact, fill name 'John Doe', enter email 'john@example.com', select 'General' from inquiry type, type message 'Test message', click Send, verify success confirmation
```

### Authentication Testing  
```
Go to /login, enter username 'testuser', enter password 'wrongpass', click Login, verify error message, clear fields, enter correct credentials, submit, verify dashboard access
```

### E-commerce Testing
```
Visit /shop, search for 'shoes', filter by size '10', sort by price, select first item, choose color 'Black', add to cart, view cart, update quantity to 2, proceed to checkout
```

### Accessibility Testing
```
Navigate to homepage, check page title, verify main navigation is visible, test keyboard navigation, check form labels, verify color contrast, ensure responsive design
```

## Integration Examples

### With Test Frameworks
```javascript
// Jest/Mocha example
const { parseTestInstructions } = require('./ai-service');

test('should parse natural language to test case', async () => {
  const input = "Navigate to /login, enter credentials, verify success";
  const result = await parseTestInstructions(input);
  
  expect(result.testCase.actions).toHaveLength(3);
  expect(result.testCase.actions[0].type).toBe('navigate');
});
```

### With CI/CD
```yaml
# GitHub Actions example
- name: Generate and run tests
  run: |
    node scripts/parse-requirements.js
    npm run test:generated
```

This comprehensive format ensures reliable test automation through natural language processing, supporting both simple and complex web testing scenarios.