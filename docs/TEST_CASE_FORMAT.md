# Test Case Format Documentation

## Complete Natural Language Test Case Format

This document provides a comprehensive guide to the test case format used by the AI-Powered Web Testing Agent, including all scenarios for generating parsed test cases from natural language descriptions.

## Test Case Structure

The system generates test cases with the following JSON structure:

```json
{
  "testCase": {
    "name": "Test Name",
    "description": "Test Description",
    "url": "Target URL",
    "actions": [
      {
        "type": "action_type",
        "locator": "element_selector",
        "selector": "alternative_selector", 
        "value": "input_value",
        "description": "Human readable description",
        "expectedUrl": "expected_url_for_verify",
        "elementType": "button|link|select|generic",
        "timeout": 60000,
        "options": {}
      }
    ]
  }
}
```

## Supported Action Types

### 1. Navigate Actions
Navigate to URLs or pages.

**Natural Language Examples:**
- "Navigate to https://example.com"
- "Go to /login page"
- "Visit the homepage"
- "Open the registration page"

**Generated Actions:**
```json
{
  "type": "navigate",
  "locator": "",
  "value": "https://example.com",
  "description": "Navigate to https://example.com"
}
```

### 2. Input/Fill Actions
Enter text into input fields.

**Natural Language Examples:**
- "Enter 'john@example.com' in the email field"
- "Type 'password123' in password"
- "Fill username with 'testuser'"
- "Input 'John Doe' into the name field"

**Generated Actions:**
```json
{
  "type": "input",
  "locator": "input[name='email']",
  "value": "john@example.com",
  "description": "Enter email"
}
```

### 3. Click Actions
Click buttons, links, and other elements.

**Natural Language Examples:**
- "Click the Login button"
- "Click on Submit"
- "Press the Save button"
- "Click the navigation link"

**Generated Actions:**
```json
{
  "type": "click",
  "locator": "button:contains('Login')",
  "description": "Click the Login button"
}
```

**With Element Type Specification:**
```json
{
  "type": "click",
  "locator": "text=Login",
  "elementType": "button",
  "description": "Click the Login button (prefer button elements)"
}
```

### 4. Verify Actions
Verify navigation and URL changes.

**Natural Language Examples:**
- "Verify redirected to dashboard"
- "Check that page navigates to /home"
- "Ensure URL contains 'success'"

**Generated Actions:**
```json
{
  "type": "verify",
  "locator": "",
  "expectedUrl": "/dashboard",
  "description": "Verify redirected to dashboard"
}
```

### 5. Wait Actions
Wait for elements or time delays.

**Natural Language Examples:**
- "Wait 3 seconds"
- "Wait for the loading spinner"
- "Wait until page loads"
- "Pause for 5000 milliseconds"

**Generated Actions:**
```json
{
  "type": "wait",
  "value": "3000",
  "description": "Wait 3 seconds"
}
```

### 6. Assert Visible Actions
Assert that elements are visible on the page.

**Natural Language Examples:**
- "Check that welcome message is visible"
- "Verify the error message appears"
- "Assert dashboard is displayed"

**Generated Actions:**
```json
{
  "type": "assert_visible",
  "locator": ".welcome-message",
  "description": "Check that welcome message is visible"
}
```

### 7. Assert Text Actions
Assert that elements contain specific text.

**Natural Language Examples:**
- "Verify text contains 'Welcome'"
- "Check that error shows 'Invalid credentials'"
- "Assert message says 'Success'"

**Generated Actions:**
```json
{
  "type": "assert_text",
  "locator": ".message",
  "value": "Welcome",
  "description": "Verify text contains 'Welcome'"
}
```

### 8. Select Actions
Select options from dropdowns.

**Natural Language Examples:**
- "Select 'United States' from country dropdown"
- "Choose 'Premium' from plan options"
- "Pick 'January' from month selector"
- "Select 'Nagad' from Mobile Banking Type dropdown"

**Generated Actions:**
```json
{
  "type": "select",
  "locator": "select[name='country']",
  "value": "United States",
  "description": "Select country"
}
```

**Enhanced Select Functionality:**
The select action now supports multiple selection strategies:
1. **By value** (original): `"value": "us"` matches `<option value="us">United States</option>`
2. **By text/label** (new): `"value": "United States"` matches the visible text
3. **Case-insensitive** (fallback): `"value": "NAGAD"` matches `<option value="nagad">Nagad</option>`

**Mobile Banking Example:**
```json
{
  "type": "select",
  "locator": "#mobile-banking-type",
  "value": "Nagad",
  "description": "Select Nagad from Mobile Banking Type dropdown"
}
```

**Alternative with elementType:**
```json
{
  "type": "click",
  "locator": "text=Nagad",
  "elementType": "select",
  "description": "Click Nagad option using select elementType"
}
```

### 9. Check/Uncheck Actions
Handle checkboxes and radio buttons.

**Natural Language Examples:**
- "Check the agree to terms checkbox"
- "Uncheck the newsletter subscription"
- "Select the remember me option"

**Generated Actions:**
```json
{
  "type": "check",
  "locator": "input[name='terms']",
  "description": "Check the agree to terms checkbox"
}
```

### 10. Hover Actions
Hover over elements.

**Natural Language Examples:**
- "Hover over the profile menu"
- "Mouse over the tooltip icon"
- "Hover on the dropdown trigger"

**Generated Actions:**
```json
{
  "type": "hover",
  "locator": ".profile-menu",
  "description": "Hover over the profile menu"
}
```

### 11. Scroll Actions
Scroll the page or elements.

**Natural Language Examples:**
- "Scroll to bottom of page"
- "Scroll down"
- "Scroll to the footer"

**Generated Actions:**
```json
{
  "type": "scroll",
  "description": "Scroll to bottom of page"
}
```

## Complete Test Case Examples

### Example 1: Login Flow
**Natural Language Input:**
```
Navigate to /login, enter username 'testuser', enter password 'password123', click Login button, verify redirected to dashboard
```

**Generated Test Case:**
```json
{
  "testCase": {
    "name": "Login Test",
    "description": "Verify login functionality",
    "url": "/login",
    "actions": [
      {
        "type": "navigate",
        "locator": "",
        "value": "/login",
        "description": "Navigate to login page"
      },
      {
        "type": "input",
        "locator": "input[name='username']",
        "value": "testuser",
        "description": "Enter username"
      },
      {
        "type": "input",
        "locator": "input[name='password']",
        "value": "password123",
        "description": "Enter password"
      },
      {
        "type": "click",
        "locator": "button:contains('Login')",
        "description": "Click login button"
      },
      {
        "type": "verify",
        "locator": "",
        "expectedUrl": "/dashboard",
        "description": "Verify redirected to dashboard"
      }
    ]
  }
}
```

### Example 2: Registration Form
**Natural Language Input:**
```
Go to /register, fill first name with 'John', fill last name with 'Doe', enter email 'john@example.com', type password 'securepass', check agree to terms, click Register, wait for success message, verify page shows 'Registration successful'
```

**Generated Test Case:**
```json
{
  "testCase": {
    "name": "Registration Test",
    "description": "Test user registration process",
    "url": "/register",
    "actions": [
      {
        "type": "navigate",
        "locator": "",
        "value": "/register",
        "description": "Navigate to registration page"
      },
      {
        "type": "input",
        "locator": "input[name='firstName']",
        "value": "John",
        "description": "Fill first name"
      },
      {
        "type": "input",
        "locator": "input[name='lastName']",
        "value": "Doe",
        "description": "Fill last name"
      },
      {
        "type": "input",
        "locator": "input[name='email']",
        "value": "john@example.com",
        "description": "Enter email"
      },
      {
        "type": "input",
        "locator": "input[name='password']",
        "value": "securepass",
        "description": "Type password"
      },
      {
        "type": "check",
        "locator": "input[name='terms']",
        "description": "Check agree to terms"
      },
      {
        "type": "click",
        "locator": "button:contains('Register')",
        "description": "Click Register"
      },
      {
        "type": "wait",
        "locator": ".success-message",
        "description": "Wait for success message"
      },
      {
        "type": "assert_text",
        "locator": ".message",
        "value": "Registration successful",
        "description": "Verify registration success"
      }
    ]
  }
}
```

### Example 3: E-commerce Checkout
**Natural Language Input:**
```
Navigate to /cart, verify cart contains items, click checkout, fill shipping address, select 'Credit Card' payment method, enter card number '4111111111111111', click place order, wait 5 seconds, verify order confirmation page
```

**Generated Test Case:**
```json
{
  "testCase": {
    "name": "Checkout Process Test",
    "description": "Test e-commerce checkout functionality",
    "url": "/cart",
    "actions": [
      {
        "type": "navigate",
        "locator": "",
        "value": "/cart",
        "description": "Navigate to cart"
      },
      {
        "type": "assert_visible",
        "locator": ".cart-item",
        "description": "Verify cart contains items"
      },
      {
        "type": "click",
        "locator": "button:contains('Checkout')",
        "description": "Click checkout"
      },
      {
        "type": "input",
        "locator": "input[name='address']",
        "value": "123 Main St",
        "description": "Fill shipping address"
      },
      {
        "type": "select",
        "locator": "select[name='payment']",
        "value": "Credit Card",
        "description": "Select payment method"
      },
      {
        "type": "input",
        "locator": "input[name='cardNumber']",
        "value": "4111111111111111",
        "description": "Enter card number"
      },
      {
        "type": "click",
        "locator": "button:contains('Place Order')",
        "description": "Click place order"
      },
      {
        "type": "wait",
        "value": "5000",
        "description": "Wait 5 seconds"
      },
      {
        "type": "verify",
        "locator": "",
        "expectedUrl": "/order-confirmation",
        "description": "Verify order confirmation page"
      }
    ]
  }
}
```

## Advanced Features

### Element Type Specification
When multiple elements have the same text, use elementType to specify preference:

**Natural Language Examples:**
- "Click the Login link in navigation" → `elementType: "link"`
- "Click the Login button in form" → `elementType: "button"`
- "Click the Country option in dropdown" → `elementType: "select"`
- "Press the generic Login element" → `elementType: "generic"`

### Complex Selectors
The system supports various selector types:

**CSS Selectors:**
- `input[name='username']`
- `.login-button`
- `#submit-btn`

**Text-based Selectors:**
- `text=Login`
- `button:contains('Submit')`
- `a[href*='/login']`

**Advanced Selectors:**
- `[role='button']:has-text('Login')`
- `input[type='email']`
- `.form-group >> input`

## Natural Language Patterns

### Input Pattern Recognition
The system recognizes various input patterns:

**Quoted Values:**
- 'single quotes'
- "double quotes"
- Mixed: "field name" with 'input value'

**Field Identification:**
- username, email, password (common field names)
- "enter X in Y field"
- "type X into Y"
- "fill Y with X"

**Action Triggers:**
- click, press, select, choose
- navigate, go to, visit
- wait, pause, delay
- verify, check, assert

### Fallback Parsing
When AI service is unavailable, the system uses rule-based parsing:

**Supported Patterns:**
- Navigate: "go to", "navigate", "visit"
- Input: "enter", "type", "fill", "input"
- Click: "click", "press", "tap"
- Wait: "wait", "pause", "delay"
- Verify: "verify", "check", "assert"

## Validation Rules

### Required Fields
- `name`: Test case name (1-255 characters)
- `url`: Valid HTTP/HTTPS URL or path starting with /
- `actions`: Array of valid action objects

### Action Validation
- `type`: Must be one of supported action types
- String fields are sanitized (HTML tags removed)
- URLs are validated for security
- Timeouts have reasonable defaults

### Security Features
- Input sanitization prevents XSS
- URL validation prevents malicious redirects
- Action type validation prevents code injection
- Field length limits prevent DoS attacks

## Error Handling

### Common Errors
- **Missing required fields**: Name or URL not provided
- **Invalid action type**: Unsupported action type specified
- **Invalid URL format**: URL doesn't match required pattern
- **AI service unavailable**: Falls back to rule-based parsing

### Error Response Format
```json
{
  "error": "Error description",
  "fallback": "Alternative solution when applicable"
}
```

## Usage Examples

### API Endpoint
```
POST /api/test/ai/parse
{
  "instructions": "Your natural language test description"
}
```

### Response Format
```json
{
  "message": "Instructions parsed successfully",
  "parsed": {
    "testCase": {
      // Generated test case object
    }
  }
}
```

This comprehensive format supports both simple and complex test scenarios, ensuring robust test automation through natural language processing.