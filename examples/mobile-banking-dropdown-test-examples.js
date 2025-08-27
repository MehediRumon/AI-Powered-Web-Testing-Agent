// Mobile Banking Dropdown Test Examples
// Demonstrates natural language test descriptions for the specific HTML element:
// <select id="MobileBankingType" name="MobileBankingType">
//   <option value="">Select Type</option>
//   <option value="20">Nagad</option>
// </select>

const mobileBankingDropdownExamples = {
    
    // Basic Selection Examples
    basicSelection: [
        {
            naturalLanguage: "Select 'Nagad' from the Mobile Banking Type dropdown",
            generated: {
                testCase: {
                    name: "Mobile Banking Type Selection",
                    description: "Select Nagad from Mobile Banking Type dropdown",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "select",
                            locator: "#MobileBankingType",
                            value: "Nagad",
                            description: "Select Nagad from Mobile Banking Type dropdown"
                        }
                    ]
                }
            }
        },
        {
            naturalLanguage: "Choose option with value '20' from MobileBankingType dropdown",
            generated: {
                testCase: {
                    name: "Mobile Banking Value Selection",
                    description: "Select option by value from Mobile Banking Type dropdown",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "select",
                            locator: "#MobileBankingType",
                            value: "20",
                            description: "Select option with value '20'"
                        }
                    ]
                }
            }
        }
    ],

    // Verification Examples
    verification: [
        {
            naturalLanguage: "Verify that 'Nagad' is selected in the Mobile Banking Type dropdown",
            generated: {
                testCase: {
                    name: "Mobile Banking Selection Verification",
                    description: "Verify Nagad is selected in dropdown",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "assert_text",
                            locator: "#MobileBankingType option:selected",
                            value: "Nagad",
                            description: "Verify Nagad is selected"
                        }
                    ]
                }
            }
        },
        {
            naturalLanguage: "Check that the Mobile Banking Type dropdown value is '20'",
            generated: {
                testCase: {
                    name: "Mobile Banking Value Verification",
                    description: "Verify dropdown value is 20",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "assert_text",
                            locator: "#MobileBankingType",
                            value: "20",
                            description: "Verify dropdown value is 20"
                        }
                    ]
                }
            }
        }
    ],

    // Complete Workflow Examples
    completeWorkflow: [
        {
            naturalLanguage: "Navigate to payment form, select 'Nagad' from Mobile Banking Type dropdown, and verify the selection",
            generated: {
                testCase: {
                    name: "Complete Mobile Banking Selection Test",
                    description: "Full workflow test for mobile banking type selection",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "navigate",
                            locator: "",
                            value: "https://example.com/payment-form",
                            description: "Navigate to payment form"
                        },
                        {
                            type: "select",
                            locator: "#MobileBankingType",
                            value: "Nagad",
                            description: "Select Nagad from Mobile Banking Type dropdown"
                        },
                        {
                            type: "assert_visible",
                            locator: "#MobileBankingType",
                            description: "Verify dropdown is visible"
                        },
                        {
                            type: "assert_text",
                            locator: "#MobileBankingType option:selected",
                            value: "Nagad",
                            description: "Verify Nagad is selected"
                        }
                    ]
                }
            }
        }
    ],

    // Edge Cases and Error Handling
    edgeCases: [
        {
            naturalLanguage: "Reset Mobile Banking Type dropdown to default 'Select Type' option",
            generated: {
                testCase: {
                    name: "Reset Mobile Banking Selection",
                    description: "Reset dropdown to default state",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "select",
                            locator: "#MobileBankingType",
                            value: "",
                            description: "Reset to default 'Select Type' option"
                        }
                    ]
                }
            }
        },
        {
            naturalLanguage: "Verify Mobile Banking Type dropdown contains 'Nagad' option",
            generated: {
                testCase: {
                    name: "Check Available Options",
                    description: "Verify Nagad option exists in dropdown",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "assert_visible",
                            locator: "#MobileBankingType option[value='20']",
                            description: "Verify Nagad option is available"
                        }
                    ]
                }
            }
        }
    ],

    // Alternative Selector Approaches
    alternativeSelectors: [
        {
            naturalLanguage: "Select 'Nagad' from dropdown by name 'MobileBankingType'",
            generated: {
                testCase: {
                    name: "Selection by Name Attribute",
                    description: "Select using name attribute selector",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "select",
                            locator: "select[name='MobileBankingType']",
                            value: "Nagad",
                            description: "Select Nagad using name selector"
                        }
                    ]
                }
            }
        },
        {
            naturalLanguage: "Click 'Nagad' option in Mobile Banking Type select element",
            generated: {
                testCase: {
                    name: "Click-based Selection",
                    description: "Select using click action with elementType",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "click",
                            locator: "text=Nagad",
                            elementType: "select",
                            description: "Click Nagad option in select element"
                        }
                    ]
                }
            }
        }
    ],

    // Form Context Examples
    formContext: [
        {
            naturalLanguage: "In the payment form, select Nagad as the mobile banking type and proceed to next step",
            generated: {
                testCase: {
                    name: "Payment Form Mobile Banking Selection",
                    description: "Select mobile banking type in payment context",
                    url: "https://example.com/payment-form",
                    actions: [
                        {
                            type: "select",
                            locator: "#MobileBankingType",
                            value: "Nagad",
                            description: "Select Nagad as mobile banking type"
                        },
                        {
                            type: "click",
                            locator: "button:contains('Next')",
                            description: "Proceed to next step"
                        }
                    ]
                }
            }
        }
    ]
};

// Function to demonstrate parsing logic
function demonstrateNaturalLanguageParsing() {
    console.log('🎯 Mobile Banking Dropdown Test Examples');
    console.log('=========================================\n');
    
    console.log('HTML Element being tested:');
    console.log('<select id="MobileBankingType" name="MobileBankingType">');
    console.log('  <option value="">Select Type</option>');
    console.log('  <option value="20">Nagad</option>');
    console.log('</select>\n');

    Object.keys(mobileBankingDropdownExamples).forEach(category => {
        console.log(`\n📂 ${category.toUpperCase()}:`);
        console.log('─'.repeat(50));
        
        mobileBankingDropdownExamples[category].forEach((example, index) => {
            console.log(`\n${index + 1}. Natural Language: "${example.naturalLanguage}"`);
            console.log('   Generated Actions:');
            example.generated.testCase.actions.forEach((action, actionIndex) => {
                console.log(`   ${actionIndex + 1}. ${action.type}: ${action.description}`);
                if (action.locator) console.log(`      Locator: ${action.locator}`);
                if (action.value) console.log(`      Value: ${action.value}`);
                if (action.elementType) console.log(`      ElementType: ${action.elementType}`);
            });
        });
    });

    console.log('\n✅ Summary:');
    console.log('• Natural language descriptions are converted to structured test actions');
    console.log('• Multiple selection strategies supported (by text, by value, by click)');
    console.log('• Verification actions ensure test reliability');
    console.log('• Various selector approaches accommodate different element structures');
    console.log('• Form context awareness for complete user workflows');
}

// Key insights for the specific HTML element
const elementInsights = {
    specificCharacteristics: {
        id: "MobileBankingType",
        name: "MobileBankingType", 
        className: "form-control valid",
        validation: "data-val-number (must be a number)",
        options: [
            { value: "", text: "Select Type" },
            { value: "20", text: "Nagad" }
        ]
    },
    
    testingChallenges: [
        "Value '20' vs display text 'Nagad' - need to handle both",
        "Numeric validation requirement from data-val-number attribute",
        "Default placeholder option with empty value",
        "Single option besides default - limited test scenarios"
    ],
    
    recommendedTests: [
        "Select Nagad and verify both value (20) and text (Nagad)",
        "Verify validation rules are enforced",
        "Test reset to default state",
        "Verify form submission with selected value",
        "Test keyboard navigation accessibility"
    ]
};

// Export for use in other modules
module.exports = {
    mobileBankingDropdownExamples,
    demonstrateNaturalLanguageParsing,
    elementInsights
};

// Run demonstration if this file is executed directly
if (require.main === module) {
    demonstrateNaturalLanguageParsing();
}