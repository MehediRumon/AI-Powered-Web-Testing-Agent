// Sample test cases for demonstration purposes

const sampleTests = {
    umsLogin: {
        name: "UMS Login Test",
        description: "Test login functionality for UMS system with email field",
        url: "https://ums-2.osl.team/Account/Login",
        actions: [
            {
                type: "navigate",
                value: "https://ums-2.osl.team/Account/Login",
                description: "Navigate to the login page URL"
            },
            {
                type: "fill",
                selector: "input[type=\"email\"], input[name*=\"email\"], input[id*=\"email\"], input[name*=\"Email\"], input[id*=\"Email\"], input[placeholder*=\"email\"], input[placeholder*=\"Email\"]",
                value: "rumon.onnorokom@gmail.com",
                description: "Enter a valid email address in the \"User Email\" field"
            },
            {
                type: "fill", 
                selector: "input[type=\"password\"], input[name*=\"password\"], input[id*=\"password\"], input[placeholder*=\"password\"]",
                value: "your_password_here",
                description: "Enter a valid password in the \"Password\" field"
            },
            {
                type: "click",
                selector: "button:has-text(\"Log in\"), button:has-text(\"Login\"), button:has-text(\"Sign in\"), input[type=\"submit\"], button[type=\"submit\"], .btn-login, #login-button",
                description: "Click the \"Log in\" button"
            },
            {
                type: "wait",
                value: "3000", 
                description: "Wait for login to process"
            },
            {
                type: "assert_visible",
                selector: "body",
                description: "Verify page loaded successfully"
            }
        ]
    },

    genericLogin: {
        name: "Generic Login Test Template",
        description: "Template for testing login functionality with email field",
        url: "https://example.com/login",
        actions: [
            {
                type: "navigate", 
                value: "https://example.com/login",
                description: "Navigate to login page"
            },
            {
                type: "fill",
                selector: "input[type=\"email\"], input[name*=\"email\"], input[id*=\"email\"]",
                value: "test@example.com",
                description: "Enter email address"
            },
            {
                type: "fill",
                selector: "input[type=\"password\"], input[name*=\"password\"], input[id*=\"password\"]", 
                value: "password123",
                description: "Enter password"
            },
            {
                type: "click",
                selector: "button:has-text(\"Login\"), button:has-text(\"Log in\"), input[type=\"submit\"]",
                description: "Click login button"
            }
        ]
    }
};

module.exports = sampleTests;