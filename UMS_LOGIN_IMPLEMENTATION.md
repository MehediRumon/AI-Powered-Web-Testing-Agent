# UMS Login Test Implementation

## Overview
This implementation successfully adds support for the UMS login test scenario as specified:

1. Navigate to the login page URL https://ums-2.osl.team/Account/Login
2. Enter a valid email address "rumon.onnorokom@gmail.com" in the "User Email" field
3. Enter a valid password in the "Password" field
4. Click the "Log in" button

## Features Implemented

### Enhanced AI Parsing
- **Email Field Detection**: Enhanced the AI parsing to properly identify "User Email" fields with robust CSS selectors
- **Value Extraction**: Improved email address extraction from natural language instructions
- **Password Handling**: Added secure password field targeting with placeholder support
- **Button Targeting**: Enhanced login button detection with multiple selector fallbacks

### Robust CSS Selectors
The implementation uses comprehensive CSS selectors for reliable field targeting:

**Email Fields:**
```css
input[type="email"], input[name*="email"], input[id*="email"], input[name*="Email"], input[id*="Email"], input[placeholder*="email"], input[placeholder*="Email"]
```

**Password Fields:**
```css
input[type="password"], input[name*="password"], input[id*="password"], input[placeholder*="password"]
```

**Login Buttons:**
```css
button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in"), input[type="submit"], button[type="submit"], .btn-login, #login-button
```

### Sample Test Cases
Added predefined sample test cases including:
- UMS Login Test (specific to https://ums-2.osl.team/Account/Login)
- Generic Login Test Template

### API Enhancements
- **New Endpoints**: Added `/api/test/sample/ums-login` and `/api/test/samples`
- **Enhanced Validation**: Updated validation to preserve quotes in CSS selectors
- **Improved Parsing**: Enhanced fallback parsing for robust field detection

## Test Case Structure
The generated test case includes:

```json
{
  "name": "UMS Login Test",
  "description": "Test login functionality for UMS system with email field",
  "url": "https://ums-2.osl.team/Account/Login",
  "actions": [
    {
      "type": "navigate",
      "value": "https://ums-2.osl.team/Account/Login",
      "description": "Navigate to the login page URL"
    },
    {
      "type": "fill",
      "selector": "input[type=\"email\"], input[name*=\"email\"], input[id*=\"email\"], input[name*=\"Email\"], input[id*=\"Email\"], input[placeholder*=\"email\"], input[placeholder*=\"Email\"]",
      "value": "rumon.onnorokom@gmail.com",
      "description": "Enter a valid email address in the \"User Email\" field"
    },
    {
      "type": "fill",
      "selector": "input[type=\"password\"], input[name*=\"password\"], input[id*=\"password\"], input[placeholder*=\"password\"]",
      "value": "your_password_here",
      "description": "Enter a valid password in the \"Password\" field"
    },
    {
      "type": "click",
      "selector": "button:has-text(\"Log in\"), button:has-text(\"Login\"), button:has-text(\"Sign in\"), input[type=\"submit\"], button[type=\"submit\"], .btn-login, #login-button",
      "description": "Click the \"Log in\" button"
    }
  ]
}
```

## Usage

### Using AI Parsing
Users can now input natural language instructions like:
```
Navigate to the login page URL https://ums-2.osl.team/Account/Login

Enter a valid email address in the "User Email" field "rumon.onnorokom@gmail.com".

Enter a valid password in the "Password" field.

Click the "Log in" button.
```

### Using Sample Test Cases
Developers can use the sample test case endpoint:
```javascript
POST /api/test/sample/ums-login
{
  "password": "MyActualPassword123!"
}
```

### Manual Test Creation
Test cases can be manually created with the enhanced field targeting capabilities.

## Verification
The implementation has been tested and verified to:
- ✅ Parse the exact instruction format specified
- ✅ Generate appropriate CSS selectors for email fields
- ✅ Extract email addresses correctly
- ✅ Handle password field targeting
- ✅ Support login button clicking
- ✅ Store test cases in the database
- ✅ Support test execution (browser installation required)

## Files Modified
- `src/services/openai.js` - Enhanced AI parsing logic
- `src/routes/test.js` - Added sample endpoints and improved validation
- `src/utils/sampleTests.js` - New sample test case definitions

The implementation successfully supports the UMS login test scenario format and provides a robust foundation for similar login testing scenarios.