/**
 * Test the exact problem statement test cases
 * Testing the exact parsed test case structure from the problem statement
 */

const PlaywrightTestService = require('../src/services/playwright');

// Mock the exact HTML structure from the test pages
class ExactMockPage {
    constructor() {
        // Exact dropdown structures from test-page-multi-dropdown.html
        this.mockDropdowns = {
            // Mobile Banking Type (single dropdown)
            '#MobileBankingType': [
                { value: '', text: 'Select Type' },
                { value: '20', text: 'Nagad' },
                { value: '10', text: 'bKash' },
                { value: '30', text: 'Rocket' }
            ],
            // Teacher Grade (primary dropdown)
            '#teachergrade': [
                { value: '', text: 'Select Grade' },
                { value: 'level-01', text: 'Level-01' },
                { value: 'level-02', text: 'Level-02' },
                { value: 'level-03', text: 'Level-03' }
            ],
            // Teacher Grade Type (alternative dropdown)
            '#teachergradeType': [
                { value: '', text: 'Select Grade Type' },
                { value: 'level-01', text: 'Level-01' },
                { value: 'level-02', text: 'Level-02' },
                { value: 'level-03', text: 'Level-03' }
            ],
            // Religion (primary dropdown)
            '#religion': [
                { value: '', text: 'Select Religion' },
                { value: 'islam', text: 'Islam' },
                { value: 'christianity', text: 'Christianity' },
                { value: 'hinduism', text: 'Hinduism' },
                { value: 'buddhism', text: 'Buddhism' }
            ],
            // Religion Type (alternative dropdown)
            '#religionType': [
                { value: '', text: 'Select Religion Type' },
                { value: 'islam', text: 'Islam' },
                { value: 'christianity', text: 'Christianity' },
                { value: 'hinduism', text: 'Hinduism' },
                { value: 'buddhism', text: 'Buddhism' }
            ]
        };
        this.selectedValues = {};
        this.callLog = [];
    }

    async waitForSelector(selector, options) {
        this.callLog.push(`waitForSelector: ${selector}`);
        if (!this.mockDropdowns[selector]) {
            throw new Error(`Element not found: ${selector}`);
        }
        return true;
    }

    async isEnabled(selector) {
        this.callLog.push(`isEnabled: ${selector}`);
        return true;
    }

    async waitForTimeout(ms) {
        this.callLog.push(`waitForTimeout: ${ms}ms`);
        return true;
    }

    async selectOption(selector, valueOrOptions, options = {}) {
        this.callLog.push(`selectOption: ${selector}, ${JSON.stringify(valueOrOptions)}`);
        
        const dropdown = this.mockDropdowns[selector];
        if (!dropdown) {
            throw new Error(`Dropdown not found: ${selector}`);
        }

        let matchingOption = null;

        if (typeof valueOrOptions === 'string') {
            // Try to match by value first
            matchingOption = dropdown.find(opt => opt.value === valueOrOptions);
            if (matchingOption) {
                this.selectedValues[selector] = matchingOption.value;
                return;
            }
        } else if (valueOrOptions && valueOrOptions.label) {
            // Try to match by label/text
            const labelToMatch = valueOrOptions.label;
            matchingOption = dropdown.find(opt => opt.text === labelToMatch);
            if (matchingOption) {
                this.selectedValues[selector] = matchingOption.value;
                return;
            }
        }

        // If no match found, throw error
        const availableOptions = dropdown.map(opt => `"${opt.value}":"${opt.text}"`).join(', ');
        throw new Error(`Option not found. Available: ${availableOptions}`);
    }

    async evaluate(fn, ...args) {
        const [selector, value] = args;
        this.callLog.push(`evaluate: case-insensitive matching for ${selector}, ${value}`);
        
        const dropdown = this.mockDropdowns[selector];
        if (!dropdown) {
            return { success: false, error: 'Element not found' };
        }

        // Simulate case-insensitive text matching
        const matchingOption = dropdown.find(opt => 
            opt.text.toLowerCase() === value.toLowerCase()
        );

        if (matchingOption) {
            this.selectedValues[selector] = matchingOption.value;
            return { 
                success: true, 
                matchedText: matchingOption.text, 
                matchedValue: matchingOption.value 
            };
        }

        return { success: false, error: 'No case-insensitive text match found' };
    }
}

async function testExactProblemStatement() {
    console.log('🎯 Testing Exact Problem Statement Test Cases');
    console.log('============================================\n');

    // The exact parsed test cases from the problem statement
    const problemStatementTestCases = [
        {
            type: "select",
            selector: "#MobileBankingType",
            value: "Nagad",
            description: "Select 'Nagad' from the Mobile Banking Type dropdown"
        },
        {
            type: "select",
            selector: "#teachergrade, #teachergradeType, select[name=teachergrade], select[name=teachergradeType]",
            value: "Level-01",
            description: "Select 'Level-01' from the Teacher Grade dropdown"
        },
        {
            type: "select",
            selector: "#religion, #religionType, select[name=religion], select[name=religionType]",
            value: "Islam",
            description: "Select 'Islam' from the Religion dropdown"
        }
    ];

    const playwrightService = new PlaywrightTestService();
    playwrightService.page = new ExactMockPage();
    
    // Mock getAvailableSelectOptions
    playwrightService.getAvailableSelectOptions = async (selector) => {
        const dropdown = playwrightService.page.mockDropdowns[selector];
        if (!dropdown) return 'Element not found';
        return dropdown.map(opt => `"${opt.value}":"${opt.text}"`).join(', ');
    };

    let allTestsPassed = true;

    for (let i = 0; i < problemStatementTestCases.length; i++) {
        const testCase = problemStatementTestCases[i];
        console.log(`📋 Test Case ${i + 1}: ${testCase.description}`);
        console.log(`   Type: ${testCase.type}`);
        console.log(`   Selector: ${testCase.selector}`);
        console.log(`   Value: "${testCase.value}"`);

        try {
            // Clear previous call logs
            playwrightService.page.callLog = [];
            
            await playwrightService.handleSelectAction(testCase.selector, testCase.value);
            
            console.log(`   ✅ SUCCESS: Test case ${i + 1} passed`);
            
            // Show the selection results
            const selectedValues = Object.entries(playwrightService.page.selectedValues)
                .filter(([selector, value]) => value) // Only show non-empty selections
                .map(([selector, value]) => `${selector}="${value}"`)
                .join(', ');
            
            if (selectedValues) {
                console.log(`   📊 Selected: ${selectedValues}`);
            }
            
        } catch (error) {
            console.log(`   ❌ FAILED: Test case ${i + 1} - ${error.message}`);
            allTestsPassed = false;
        }
        
        console.log(''); // Add spacing
    }

    console.log('📈 Detailed Analysis');
    console.log('===================\n');

    // Test each case individually to understand the behavior
    const detailedTests = [
        {
            name: 'Mobile Banking Type (Single Selector)',
            selector: '#MobileBankingType',
            value: 'Nagad',
            expectedBehavior: 'Should select by label since value="20" ≠ "Nagad"'
        },
        {
            name: 'Teacher Grade (First of Multi-Selector)',
            selector: '#teachergrade',
            value: 'Level-01', 
            expectedBehavior: 'Should select by label since value="level-01" ≠ "Level-01"'
        },
        {
            name: 'Teacher Grade Type (Alternative)',
            selector: '#teachergradeType',
            value: 'Level-01',
            expectedBehavior: 'Should select by label since value="level-01" ≠ "Level-01"'
        },
        {
            name: 'Religion (First of Multi-Selector)',
            selector: '#religion',
            value: 'Islam',
            expectedBehavior: 'Should select by label since value="islam" ≠ "Islam"'
        },
        {
            name: 'Religion Type (Alternative)',
            selector: '#religionType',
            value: 'Islam',
            expectedBehavior: 'Should select by label since value="islam" ≠ "Islam"'
        }
    ];

    for (const test of detailedTests) {
        console.log(`🔍 Detailed Test: ${test.name}`);
        console.log(`   Expected: ${test.expectedBehavior}`);
        
        const mockPage = new ExactMockPage();
        const service = new PlaywrightTestService();
        service.page = mockPage;
        service.getAvailableSelectOptions = async () => 'Mock options';

        try {
            await service.handleSelectAction(test.selector, test.value);
            const selectedValue = mockPage.selectedValues[test.selector];
            console.log(`   ✅ Result: Selected value="${selectedValue}"`);
            
            // Show the selection strategy that worked
            const callLog = mockPage.callLog;
            const selectCalls = callLog.filter(call => call.startsWith('selectOption:'));
            if (selectCalls.length > 1) {
                console.log(`   📋 Selection strategy: Tried ${selectCalls.length} approaches, succeeded on attempt ${selectCalls.length}`);
            } else {
                console.log(`   📋 Selection strategy: Succeeded on first attempt`);
            }
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            allTestsPassed = false;
        }
        
        console.log('');
    }

    console.log('🎯 Problem Statement Analysis');
    console.log('=============================\n');
    
    if (allTestsPassed) {
        console.log('✅ ALL PROBLEM STATEMENT REQUIREMENTS ARE MET:');
        console.log('   1. ✅ Mobile Banking Type: "Nagad" selection works');
        console.log('   2. ✅ Teacher Grade: "Level-01" selection works with multi-selector');
        console.log('   3. ✅ Religion: "Islam" selection works with multi-selector');
        console.log('');
        console.log('🎉 The current implementation correctly:');
        console.log('   • Maps dropdown selections to label names (display text)');
        console.log('   • Handles multi-selector fallbacks for Teacher Grade and Religion');
        console.log('   • Uses proper text-based selection when value ≠ display text');
        console.log('');
        console.log('🔧 No changes are needed - the system is working as specified!');
    } else {
        console.log('❌ SOME REQUIREMENTS ARE NOT MET - NEEDS FIXES');
    }

    return allTestsPassed;
}

// Run test if this file is executed directly
if (require.main === module) {
    testExactProblemStatement()
        .then((passed) => {
            if (passed) {
                console.log('\n✅ All tests passed! Problem statement requirements are satisfied.');
                process.exit(0);
            } else {
                console.log('\n❌ Some tests failed. Requirements need attention.');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testExactProblemStatement };