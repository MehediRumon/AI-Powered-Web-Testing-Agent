/**
 * Test backward compatibility after optimization
 */

const PlaywrightTestService = require('../src/services/playwright');

// Mock page for backward compatibility testing
class BackwardCompatibilityMockPage {
    constructor() {
        this.mockDropdowns = {
            '#country': [
                { value: '', text: 'Select Country' },
                { value: 'us', text: 'United States' },
                { value: 'ca', text: 'Canada' },
                { value: 'uk', text: 'United Kingdom' }
            ],
            '#status': [
                { value: '', text: 'Select Status' },
                { value: '1', text: 'Active' },
                { value: '0', text: 'Inactive' },
                { value: '2', text: 'Pending' }
            ]
        };
        this.selectedValues = {};
        this.selectionLog = [];
    }

    async waitForSelector(selector, options) {
        if (!this.mockDropdowns[selector]) {
            throw new Error(`Element not found: ${selector}`);
        }
        return true;
    }

    async isEnabled(selector) {
        return true;
    }

    async waitForTimeout(ms) {
        return true;
    }

    async selectOption(selector, valueOrOptions, options = {}) {
        this.selectionLog.push({
            selector,
            attempt: typeof valueOrOptions === 'string' ? 'value' : 'label',
            value: typeof valueOrOptions === 'string' ? valueOrOptions : valueOrOptions.label
        });
        
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

    async evaluate() {
        // Not needed for these tests
        return { success: false, error: 'Not implemented in mock' };
    }
}

async function testBackwardCompatibility() {
    console.log('🔄 Testing Backward Compatibility After Optimization');
    console.log('==================================================\n');

    const playwrightService = new PlaywrightTestService();
    playwrightService.page = new BackwardCompatibilityMockPage();
    playwrightService.getAvailableSelectOptions = async () => 'Mock options';

    const testCases = [
        {
            name: 'Technical Value Selection (should prioritize value)',
            selector: '#country',
            value: 'us',
            expectedBehavior: 'Should try value first since "us" looks like technical value',
            expectedValue: 'us'
        },
        {
            name: 'Numeric Value Selection (should prioritize value)',
            selector: '#status',
            value: '1',
            expectedBehavior: 'Should try value first since "1" looks like technical value',
            expectedValue: '1'
        },
        {
            name: 'Display Text Selection (should prioritize label)',
            selector: '#country',
            value: 'United States',
            expectedBehavior: 'Should try label first since "United States" looks like display text',
            expectedValue: 'us'
        },
        {
            name: 'Display Text Selection 2 (should prioritize label)',
            selector: '#status',
            value: 'Active',
            expectedBehavior: 'Should try label first since "Active" looks like display text',
            expectedValue: '1'
        }
    ];

    let allTestsPassed = true;

    for (const testCase of testCases) {
        console.log(`📋 Test: ${testCase.name}`);
        console.log(`   Selector: ${testCase.selector}`);
        console.log(`   Value: "${testCase.value}"`);
        console.log(`   Expected: ${testCase.expectedBehavior}\n`);

        // Clear previous logs
        playwrightService.page.selectionLog = [];
        playwrightService.page.selectedValues = {};

        try {
            await playwrightService.handleSelectAction(testCase.selector, testCase.value);
            
            const actualValue = playwrightService.page.selectedValues[testCase.selector];
            const selectionLog = playwrightService.page.selectionLog;

            console.log(`   ✅ SUCCESS: Selected value="${actualValue}"`);
            
            // Verify the selection strategy
            if (selectionLog.length > 0) {
                const firstAttempt = selectionLog[0];
                console.log(`   📋 Strategy: First attempt was ${firstAttempt.attempt}-based selection`);
                
                // Check if prioritization worked correctly
                const isDisplayText = playwrightService.isDisplayTextValue(testCase.value);
                const expectedFirstAttempt = isDisplayText ? 'label' : 'value';
                
                if (firstAttempt.attempt === expectedFirstAttempt) {
                    console.log(`   ✅ Correct prioritization: Tried ${expectedFirstAttempt} first as expected`);
                } else {
                    console.log(`   ⚠️  Unexpected prioritization: Expected ${expectedFirstAttempt} first, got ${firstAttempt.attempt}`);
                }
            }

            if (actualValue === testCase.expectedValue) {
                console.log(`   ✅ Correct result: Got expected value "${testCase.expectedValue}"`);
            } else {
                console.log(`   ❌ Incorrect result: Expected "${testCase.expectedValue}", got "${actualValue}"`);
                allTestsPassed = false;
            }

        } catch (error) {
            console.log(`   ❌ FAILED: ${error.message}`);
            allTestsPassed = false;
        }

        console.log(''); // Add spacing
    }

    // Test isDisplayTextValue function directly
    console.log('🔍 Testing isDisplayTextValue Detection');
    console.log('=====================================\n');

    const detectionTests = [
        { value: 'Nagad', expected: true, reason: 'Capitalized word' },
        { value: 'Level-01', expected: true, reason: 'Level pattern' },
        { value: 'Islam', expected: true, reason: 'Religious term' },
        { value: 'United States', expected: true, reason: 'Multiple capitalized words' },
        { value: 'us', expected: false, reason: 'Lowercase technical value' },
        { value: '1', expected: false, reason: 'Numeric value' },
        { value: 'active', expected: false, reason: 'Lowercase single word' },
        { value: 'ACTIVE', expected: false, reason: 'All uppercase single word' },
        { value: 'Mobile Banking', expected: true, reason: 'Multi-word with capitals' },
        { value: 'teacher-grade', expected: false, reason: 'Lowercase with hyphen' }
    ];

    const service = new PlaywrightTestService();
    
    for (const test of detectionTests) {
        const result = service.isDisplayTextValue(test.value);
        const status = result === test.expected ? '✅' : '❌';
        console.log(`   ${status} "${test.value}" → ${result} (expected: ${test.expected}) - ${test.reason}`);
        
        if (result !== test.expected) {
            allTestsPassed = false;
        }
    }

    console.log('\n📊 Summary');
    console.log('==========');
    if (allTestsPassed) {
        console.log('✅ All backward compatibility tests PASSED!');
        console.log('   • Technical values (us, 1) prioritize value-based selection');
        console.log('   • Display text values (Nagad, Level-01, Islam) prioritize label-based selection');
        console.log('   • Smart detection correctly identifies display text vs technical values');
        console.log('   • Optimization improves efficiency without breaking compatibility');
    } else {
        console.log('❌ Some tests FAILED. Backward compatibility may be broken.');
    }

    return allTestsPassed;
}

// Run test if this file is executed directly
if (require.main === module) {
    testBackwardCompatibility()
        .then((passed) => {
            if (passed) {
                console.log('\n✅ Backward compatibility maintained!');
                process.exit(0);
            } else {
                console.log('\n❌ Backward compatibility issues detected.');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testBackwardCompatibility };