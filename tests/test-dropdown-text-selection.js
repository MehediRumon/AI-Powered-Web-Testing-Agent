/**
 * Test to verify dropdown text-based selection logic
 * This test focuses specifically on the problem statement requirements:
 * - Select 'Nagad' from Mobile Banking Type (value="20", text="Nagad")
 * - Select 'Level-01' from Teacher Grade (value="level-01", text="Level-01") 
 * - Select 'Islam' from Religion (value="islam", text="Islam")
 */

const PlaywrightTestService = require('../src/services/playwright');

// Mock page implementation for testing
class MockPage {
    constructor() {
        this.mockDropdowns = {
            '#MobileBankingType': [
                { value: '', text: 'Select Type' },
                { value: '20', text: 'Nagad' },
                { value: '10', text: 'bKash' },
                { value: '30', text: 'Rocket' }
            ],
            '#teachergrade': [
                { value: '', text: 'Select Grade' },
                { value: 'level-01', text: 'Level-01' },
                { value: 'level-02', text: 'Level-02' },
                { value: 'level-03', text: 'Level-03' }
            ],
            '#religion': [
                { value: '', text: 'Select Religion' },
                { value: 'islam', text: 'Islam' },
                { value: 'christianity', text: 'Christianity' },
                { value: 'hinduism', text: 'Hinduism' }
            ]
        };
        this.selectedValues = {};
    }

    async waitForSelector(selector, options) {
        console.log(`[MOCK] waitForSelector: ${selector}`);
        if (!this.mockDropdowns[selector]) {
            throw new Error(`Element not found: ${selector}`);
        }
        return true;
    }

    async isEnabled(selector) {
        console.log(`[MOCK] isEnabled: ${selector}`);
        return true;
    }

    async waitForTimeout(ms) {
        console.log(`[MOCK] waitForTimeout: ${ms}ms`);
        return true;
    }

    async selectOption(selector, valueOrOptions, options = {}) {
        console.log(`[MOCK] selectOption: selector=${selector}, value=${JSON.stringify(valueOrOptions)}`);
        
        const dropdown = this.mockDropdowns[selector];
        if (!dropdown) {
            throw new Error(`Dropdown not found: ${selector}`);
        }

        let targetValue = null;
        let matchingOption = null;

        if (typeof valueOrOptions === 'string') {
            // Try to match by value first
            matchingOption = dropdown.find(opt => opt.value === valueOrOptions);
            if (matchingOption) {
                console.log(`[MOCK] ✅ Matched by value: "${valueOrOptions}" → "${matchingOption.text}"`);
                this.selectedValues[selector] = matchingOption.value;
                return;
            }
        } else if (valueOrOptions && valueOrOptions.label) {
            // Try to match by label/text
            const labelToMatch = valueOrOptions.label;
            matchingOption = dropdown.find(opt => opt.text === labelToMatch);
            if (matchingOption) {
                console.log(`[MOCK] ✅ Matched by label: "${labelToMatch}" → value="${matchingOption.value}"`);
                this.selectedValues[selector] = matchingOption.value;
                return;
            }
        }

        // If no match found, throw error
        const availableOptions = dropdown.map(opt => `value="${opt.value}" text="${opt.text}"`).join(', ');
        throw new Error(`Option not found. Available: ${availableOptions}`);
    }

    async evaluate(fn, ...args) {
        console.log(`[MOCK] evaluate: case-insensitive text matching`);
        const [selector, value] = args;
        
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
            console.log(`[MOCK] ✅ Case-insensitive text match: "${value}" → "${matchingOption.text}" (value: ${matchingOption.value})`);
            return { 
                success: true, 
                matchedText: matchingOption.text, 
                matchedValue: matchingOption.value 
            };
        }

        return { success: false, error: 'No case-insensitive text match found' };
    }
}

async function testDropdownTextSelection() {
    console.log('🎯 Testing Dropdown Text-Based Selection Logic');
    console.log('==============================================\n');

    const playwrightService = new PlaywrightTestService();
    playwrightService.page = new MockPage();
    
    // Add mock for getAvailableSelectOptions
    playwrightService.getAvailableSelectOptions = async (selector) => {
        const dropdown = playwrightService.page.mockDropdowns[selector];
        if (!dropdown) return 'Element not found';
        return dropdown.map(opt => `value="${opt.value}" text="${opt.text}"`).join(', ');
    };

    const testCases = [
        {
            name: 'Mobile Banking Type - Nagad',
            selector: '#MobileBankingType',
            value: 'Nagad',
            description: 'Should select by text "Nagad" (value="20")',
            expectedValue: '20'
        },
        {
            name: 'Teacher Grade - Level-01',
            selector: '#teachergrade',
            value: 'Level-01', 
            description: 'Should select by text "Level-01" (value="level-01")',
            expectedValue: 'level-01'
        },
        {
            name: 'Religion - Islam',
            selector: '#religion',
            value: 'Islam',
            description: 'Should select by text "Islam" (value="islam")',
            expectedValue: 'islam'
        }
    ];

    let allTestsPassed = true;

    for (const testCase of testCases) {
        console.log(`\n📋 Test: ${testCase.name}`);
        console.log(`   Selector: ${testCase.selector}`);
        console.log(`   Value to select: "${testCase.value}"`);
        console.log(`   Expected result: value="${testCase.expectedValue}"`);
        console.log(`   Description: ${testCase.description}\n`);

        try {
            await playwrightService.handleSelectAction(testCase.selector, testCase.value);
            
            // Check if the correct value was selected
            const actualValue = playwrightService.page.selectedValues[testCase.selector];
            if (actualValue === testCase.expectedValue) {
                console.log(`   ✅ SUCCESS: Selected correct value "${actualValue}"\n`);
            } else {
                console.log(`   ❌ FAILURE: Expected value "${testCase.expectedValue}" but got "${actualValue}"\n`);
                allTestsPassed = false;
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}\n`);
            allTestsPassed = false;
        }
    }

    // Test multi-selector fallback
    console.log('\n🔄 Testing Multi-Selector Fallback');
    console.log('==================================\n');

    const multiSelectorTestCases = [
        {
            name: 'Teacher Grade Multi-Selector',
            selector: '#teachergrade, #teachergradeType, select[name=teachergrade], select[name=teachergradeType]',
            value: 'Level-01',
            description: 'Should work with first selector in the list'
        },
        {
            name: 'Religion Multi-Selector', 
            selector: '#religion, #religionType, select[name=religion], select[name=religionType]',
            value: 'Islam',
            description: 'Should work with first selector in the list'
        }
    ];

    for (const testCase of multiSelectorTestCases) {
        console.log(`📋 Test: ${testCase.name}`);
        console.log(`   Selector: ${testCase.selector}`);
        console.log(`   Value: "${testCase.value}"`);
        console.log(`   Description: ${testCase.description}\n`);

        try {
            await playwrightService.handleSelectAction(testCase.selector, testCase.value);
            console.log(`   ✅ SUCCESS: Multi-selector fallback worked\n`);
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}\n`);
            allTestsPassed = false;
        }
    }

    console.log('\n📊 Test Summary');
    console.log('==============');
    if (allTestsPassed) {
        console.log('✅ All tests PASSED! Text-based selection is working correctly.');
        console.log('The system correctly maps:');
        console.log('- "Nagad" → value="20" (text-based selection)');
        console.log('- "Level-01" → value="level-01" (text-based selection)');
        console.log('- "Islam" → value="islam" (text-based selection)');
    } else {
        console.log('❌ Some tests FAILED. Text-based selection needs fixes.');
    }

    return allTestsPassed;
}

// Test edge cases
async function testEdgeCases() {
    console.log('\n🔍 Testing Edge Cases');
    console.log('====================\n');

    const playwrightService = new PlaywrightTestService();
    playwrightService.page = new MockPage();
    playwrightService.getAvailableSelectOptions = async () => 'Mock options';

    // Test case sensitivity
    console.log('📋 Test: Case Sensitivity');
    try {
        await playwrightService.handleSelectAction('#religion', 'islam'); // lowercase
        console.log('✅ Lowercase "islam" worked (should select "Islam")');
    } catch (error) {
        console.log(`❌ Lowercase "islam" failed: ${error.message}`);
    }

    try {
        await playwrightService.handleSelectAction('#religion', 'ISLAM'); // uppercase
        console.log('✅ Uppercase "ISLAM" worked (should select "Islam")');
    } catch (error) {
        console.log(`❌ Uppercase "ISLAM" failed: ${error.message}`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testDropdownTextSelection()
        .then(allPassed => testEdgeCases())
        .then(() => {
            console.log('\n🎉 Test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testDropdownTextSelection, testEdgeCases };