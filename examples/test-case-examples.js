// Test Case Format Examples - Comprehensive Natural Language Scenarios
// This file demonstrates all scenarios for generating parsed test cases

const examples = {
    // Basic Navigation Examples
    navigation: [
        {
            input: "Navigate to https://example.com",
            expected: {
                testCase: {
                    name: "Navigation Test",
                    description: "Navigate to example.com",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "navigate",
                            locator: "",
                            value: "https://example.com",
                            description: "Navigate to https://example.com"
                        }
                    ]
                }
            }
        },
        {
            input: "Go to /login page",
            expected: {
                testCase: {
                    name: "Login Page Navigation",
                    description: "Navigate to login page",
                    url: "/login",
                    actions: [
                        {
                            type: "navigate",
                            locator: "",
                            value: "/login",
                            description: "Navigate to login page"
                        }
                    ]
                }
            }
        }
    ],

    // Input Field Examples
    inputFields: [
        {
            input: "Enter 'john@example.com' in the email field",
            expected: {
                testCase: {
                    name: "Email Input Test",
                    description: "Enter email address",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "input",
                            locator: "input[name='email']",
                            value: "john@example.com",
                            description: "Enter email"
                        }
                    ]
                }
            }
        },
        {
            input: "Type 'password123' in password field",
            expected: {
                testCase: {
                    name: "Password Input Test",
                    description: "Enter password",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "input",
                            locator: "input[name='password']",
                            value: "password123",
                            description: "Enter password"
                        }
                    ]
                }
            }
        }
    ],

    // Click Action Examples
    clickActions: [
        {
            input: "Click the Login button",
            expected: {
                testCase: {
                    name: "Button Click Test",
                    description: "Click login button",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "click",
                            locator: "button:contains('Login')",
                            description: "Click the Login button"
                        }
                    ]
                }
            }
        },
        {
            input: "Click the Login link in navbar",
            expected: {
                testCase: {
                    name: "Link Click Test",
                    description: "Click login link",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "click",
                            locator: "text=Login",
                            elementType: "link",
                            description: "Click the Login link in navbar"
                        }
                    ]
                }
            }
        }
    ],

    // Verification Examples
    verification: [
        {
            input: "Verify redirected to dashboard",
            expected: {
                testCase: {
                    name: "Dashboard Redirect Test",
                    description: "Verify navigation to dashboard",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "verify",
                            locator: "",
                            expectedUrl: "/dashboard",
                            description: "Verify redirected to dashboard"
                        }
                    ]
                }
            }
        },
        {
            input: "Check that welcome message is visible",
            expected: {
                testCase: {
                    name: "Welcome Message Test",
                    description: "Verify welcome message visibility",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "assert_visible",
                            locator: ".welcome-message",
                            description: "Check that welcome message is visible"
                        }
                    ]
                }
            }
        }
    ],

    // Wait Action Examples
    waitActions: [
        {
            input: "Wait 3 seconds",
            expected: {
                testCase: {
                    name: "Wait Test",
                    description: "Wait for 3 seconds",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "wait",
                            value: "3000",
                            description: "Wait 3 seconds"
                        }
                    ]
                }
            }
        },
        {
            input: "Wait for loading spinner",
            expected: {
                testCase: {
                    name: "Loading Wait Test",
                    description: "Wait for loading element",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "wait",
                            locator: ".loading-spinner",
                            description: "Wait for loading spinner"
                        }
                    ]
                }
            }
        }
    ],

    // Complex Multi-Step Examples
    complexScenarios: [
        {
            input: "Navigate to /login, enter username 'testuser', enter password 'password123', click Login, verify redirected to dashboard",
            expected: {
                testCase: {
                    name: "Login Flow Test",
                    description: "Complete login process verification",
                    url: "/login",
                    actions: [
                        {
                            type: "navigate",
                            locator: "",
                            value: "/login",
                            description: "Navigate to login page"
                        },
                        {
                            type: "input",
                            locator: "input[name='username']",
                            value: "testuser",
                            description: "Enter username"
                        },
                        {
                            type: "input",
                            locator: "input[name='password']",
                            value: "password123",
                            description: "Enter password"
                        },
                        {
                            type: "click",
                            locator: "button:contains('Login')",
                            description: "Click login button"
                        },
                        {
                            type: "verify",
                            locator: "",
                            expectedUrl: "/dashboard",
                            description: "Verify redirected to dashboard"
                        }
                    ]
                }
            }
        },
        {
            input: "Go to /register, fill first name 'John', fill last name 'Doe', enter email 'john@example.com', check terms checkbox, click Register, wait for success message",
            expected: {
                testCase: {
                    name: "Registration Flow Test",
                    description: "Complete user registration process",
                    url: "/register",
                    actions: [
                        {
                            type: "navigate",
                            locator: "",
                            value: "/register",
                            description: "Navigate to registration page"
                        },
                        {
                            type: "input",
                            locator: "input[name='firstName']",
                            value: "John",
                            description: "Fill first name"
                        },
                        {
                            type: "input",
                            locator: "input[name='lastName']",
                            value: "Doe",
                            description: "Fill last name"
                        },
                        {
                            type: "input",
                            locator: "input[name='email']",
                            value: "john@example.com",
                            description: "Enter email"
                        },
                        {
                            type: "check",
                            locator: "input[name='terms']",
                            description: "Check terms checkbox"
                        },
                        {
                            type: "click",
                            locator: "button:contains('Register')",
                            description: "Click Register"
                        },
                        {
                            type: "wait",
                            locator: ".success-message",
                            description: "Wait for success message"
                        }
                    ]
                }
            }
        }
    ],

    // Form Interaction Examples
    formInteractions: [
        {
            input: "Select 'United States' from country dropdown, choose 'Premium' from plan, check newsletter subscription",
            expected: {
                testCase: {
                    name: "Form Selection Test",
                    description: "Test form dropdown and checkbox interactions",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "select",
                            locator: "select[name='country']",
                            value: "United States",
                            description: "Select country"
                        },
                        {
                            type: "select",
                            locator: "select[name='plan']",
                            value: "Premium",
                            description: "Choose plan"
                        },
                        {
                            type: "check",
                            locator: "input[name='newsletter']",
                            description: "Check newsletter subscription"
                        }
                    ]
                }
            }
        }
    ],

    // Advanced Interaction Examples
    advancedInteractions: [
        {
            input: "Hover over profile menu, click settings, scroll to bottom, verify privacy section visible",
            expected: {
                testCase: {
                    name: "Advanced Interaction Test",
                    description: "Test hover, click, scroll, and verify actions",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "hover",
                            locator: ".profile-menu",
                            description: "Hover over profile menu"
                        },
                        {
                            type: "click",
                            locator: "text=Settings",
                            description: "Click settings"
                        },
                        {
                            type: "scroll",
                            description: "Scroll to bottom"
                        },
                        {
                            type: "assert_visible",
                            locator: ".privacy-section",
                            description: "Verify privacy section visible"
                        }
                    ]
                }
            }
        }
    ],

    // E-commerce Examples
    ecommerce: [
        {
            input: "Navigate to /products, search for 'laptop', click first result, click add to cart, go to cart, verify item added, proceed to checkout",
            expected: {
                testCase: {
                    name: "E-commerce Shopping Test",
                    description: "Complete shopping flow from search to checkout",
                    url: "/products",
                    actions: [
                        {
                            type: "navigate",
                            locator: "",
                            value: "/products",
                            description: "Navigate to products page"
                        },
                        {
                            type: "input",
                            locator: "input[name='search']",
                            value: "laptop",
                            description: "Search for laptop"
                        },
                        {
                            type: "click",
                            locator: ".product-item:first-child",
                            description: "Click first result"
                        },
                        {
                            type: "click",
                            locator: "button:contains('Add to Cart')",
                            description: "Click add to cart"
                        },
                        {
                            type: "navigate",
                            locator: "",
                            value: "/cart",
                            description: "Go to cart"
                        },
                        {
                            type: "assert_visible",
                            locator: ".cart-item",
                            description: "Verify item added"
                        },
                        {
                            type: "click",
                            locator: "button:contains('Checkout')",
                            description: "Proceed to checkout"
                        }
                    ]
                }
            }
        }
    ],

    // Error Handling Examples
    errorHandling: [
        {
            input: "Try to login with invalid credentials, verify error message appears, check error text contains 'Invalid'",
            expected: {
                testCase: {
                    name: "Error Handling Test",
                    description: "Test error message display for invalid login",
                    url: "https://example.com",
                    actions: [
                        {
                            type: "input",
                            locator: "input[name='username']",
                            value: "invalid",
                            description: "Enter invalid username"
                        },
                        {
                            type: "input",
                            locator: "input[name='password']",
                            value: "invalid",
                            description: "Enter invalid password"
                        },
                        {
                            type: "click",
                            locator: "button:contains('Login')",
                            description: "Try to login"
                        },
                        {
                            type: "assert_visible",
                            locator: ".error-message",
                            description: "Verify error message appears"
                        },
                        {
                            type: "assert_text",
                            locator: ".error-message",
                            value: "Invalid",
                            description: "Check error text contains 'Invalid'"
                        }
                    ]
                }
            }
        }
    ]
};

// Function to test the parsing with all examples
async function testAllExamples() {
    console.log('🧪 Testing All Natural Language Parsing Examples\n');
    
    const categories = Object.keys(examples);
    let totalTests = 0;
    let passedTests = 0;
    
    for (const category of categories) {
        console.log(`📁 Category: ${category.toUpperCase()}`);
        console.log('='.repeat(50));
        
        const categoryExamples = examples[category];
        
        for (let i = 0; i < categoryExamples.length; i++) {
            const example = categoryExamples[i];
            totalTests++;
            
            console.log(`\n📝 Test ${i + 1}: ${example.input.substring(0, 50)}...`);
            console.log(`Expected Test Name: ${example.expected.testCase.name}`);
            console.log(`Expected Actions: ${example.expected.testCase.actions.length}`);
            
            // In a real test, you would call the parsing API here
            // For demonstration, we'll just validate the structure
            const isValid = validateTestCaseStructure(example.expected.testCase);
            
            if (isValid) {
                console.log('✅ Structure validation passed');
                passedTests++;
            } else {
                console.log('❌ Structure validation failed');
            }
        }
        
        console.log('\n');
    }
    
    console.log('📊 SUMMARY');
    console.log('='.repeat(30));
    console.log(`Total Examples: ${totalTests}`);
    console.log(`Passed Validation: ${passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    return { totalTests, passedTests };
}

// Helper function to validate test case structure
function validateTestCaseStructure(testCase) {
    if (!testCase || typeof testCase !== 'object') return false;
    if (!testCase.name || typeof testCase.name !== 'string') return false;
    if (!testCase.url || typeof testCase.url !== 'string') return false;
    if (!Array.isArray(testCase.actions)) return false;
    
    const validActionTypes = [
        'navigate', 'input', 'click', 'verify', 'wait', 
        'assert_visible', 'assert_text', 'fill', 'type', 
        'select', 'check', 'uncheck', 'hover', 'scroll'
    ];
    
    for (const action of testCase.actions) {
        if (!action.type || !validActionTypes.includes(action.type)) return false;
        if (!action.description || typeof action.description !== 'string') return false;
    }
    
    return true;
}

// Example usage patterns for different complexity levels
const usagePatterns = {
    beginner: [
        "Click login",
        "Enter email",
        "Go to homepage",
        "Wait 2 seconds"
    ],
    intermediate: [
        "Navigate to /login, enter username 'admin', click submit",
        "Fill form fields, check terms, submit registration",
        "Search for 'products', select first result, add to cart"
    ],
    advanced: [
        "Navigate to e-commerce site, search for items, filter by price, sort by rating, select product, add to cart, checkout with credit card payment",
        "Test complete user journey: register account, verify email, login, update profile, change password, logout",
        "Perform accessibility testing: check page navigation with keyboard, verify ARIA labels, test screen reader compatibility"
    ]
};

// Export for use in testing
module.exports = {
    examples,
    testAllExamples,
    validateTestCaseStructure,
    usagePatterns
};

// Run tests if this file is executed directly
if (require.main === module) {
    testAllExamples().then(result => {
        console.log('\n🎉 All example tests completed!');
        
        if (result.passedTests === result.totalTests) {
            console.log('✨ Perfect score! All examples are properly structured.');
        } else {
            console.log(`⚠️  ${result.totalTests - result.passedTests} examples need review.`);
        }
        
        console.log('\n📖 Usage Guide:');
        console.log('1. Use these examples as templates for creating your own test cases');
        console.log('2. Start with simple actions and build up to complex scenarios');
        console.log('3. Always include navigation as the first action when testing specific pages');
        console.log('4. Use descriptive names and clear action descriptions');
        console.log('5. Test edge cases and error conditions for robust coverage');
    }).catch(error => {
        console.error('❌ Error running tests:', error);
    });
}