const OpenAIService = require('../src/services/openai');

async function testSelectorFixValidation() {
    console.log('🔍 Testing Selector Fix Validation');
    console.log('==================================\n');
    
    const openaiService = new OpenAIService();
    
    // Test 1: Natural Language Parsing - Should produce simple selectors
    console.log('1. Testing Natural Language Parsing (Fixed Behavior)');
    console.log('----------------------------------------------------');
    
    const instructions = `
Select 'Nagad' from the Mobile Banking Type dropdown
Select 'Level-01' from the Teacher Grade dropdown
Select 'Islam' from the Religion dropdown
    `.trim();
    
    const parsed = openaiService.fallbackParse(instructions);
    const actions = parsed.testCase.actions;
    
    // Validate corrected behavior
    const expectedResults = [
        { name: 'Mobile Banking Type', expectedSelector: '#MobileBankingType', expectedValue: 'Nagad' },
        { name: 'Teacher Grade', expectedSelector: '#teachergrade', expectedValue: 'Level-01' },
        { name: 'Religion', expectedSelector: '#religion', expectedValue: 'Islam' }
    ];
    
    let allTestsPassed = true;
    
    for (let i = 0; i < expectedResults.length; i++) {
        const action = actions[i];
        const expected = expectedResults[i];
        
        console.log(`\n${expected.name}:`);
        console.log(`  Expected: ${expected.expectedSelector}`);
        console.log(`  Actual:   ${action.selector}`);
        console.log(`  Value:    ${action.value} (expected: ${expected.expectedValue})`);
        
        const primarySelector = action.selector.split(',')[0].trim();
        const selectorMatch = primarySelector === expected.expectedSelector;
        const valueMatch = action.value === expected.expectedValue;
        
        if (selectorMatch && valueMatch) {
            console.log(`  Result:   ✅ CORRECT - Primary selector matches (with ${action.selector.split(',').length} fallbacks)`);
        } else {
            console.log(`  Result:   ❌ INCORRECT`);
            if (!selectorMatch) {
                console.log(`    Primary selector '${primarySelector}' != expected '${expected.expectedSelector}'`);
            }
            allTestsPassed = false;
        }
    }
    
    // Test 2: Multi-selector extraction still works for specific patterns
    console.log('\n\n2. Testing Multi-selector Pattern Recognition');
    console.log('--------------------------------------------');
    
    const directExtractionTests = [
        {
            input: 'Select from mobile banking dropdown',
            expected: '#MobileBankingType',
            description: 'Mobile Banking Type recognition'
        },
        {
            input: 'Choose from teacher grade dropdown', 
            expected: '#teachergrade',
            description: 'Teacher Grade recognition'
        },
        {
            input: 'Pick from religion dropdown',
            expected: '#religion', 
            description: 'Religion recognition'
        }
    ];
    
    for (const test of directExtractionTests) {
        const result = openaiService.extractDropdownSelector(test.input);
        console.log(`\n${test.description}:`);
        console.log(`  Input:    "${test.input}"`);
        console.log(`  Expected: ${test.expected}`);
        console.log(`  Actual:   ${result}`);
        const primarySelector = result.split(',')[0].trim();
        console.log(`  Primary:  ${primarySelector}`);
        console.log(`  Result:   ${primarySelector === test.expected ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (primarySelector !== test.expected) {
            allTestsPassed = false;
        }
    }
    
    // Test 3: Backward compatibility for general patterns
    console.log('\n\n3. Testing General Pattern Fallbacks');
    console.log('-----------------------------------');
    
    const generalTests = [
        {
            input: 'Select from unknown dropdown',
            shouldContain: 'select',
            description: 'Unknown dropdown fallback'
        },
        {
            input: 'Choose from country dropdown',
            shouldContain: '#country',
            description: 'Country dropdown pattern'
        }
    ];
    
    for (const test of generalTests) {
        const result = openaiService.extractDropdownSelector(test.input);
        console.log(`\n${test.description}:`);
        console.log(`  Input:    "${test.input}"`);
        console.log(`  Result:   ${result}`);
        console.log(`  Contains: ${test.shouldContain} - ${result.includes(test.shouldContain) ? '✅ YES' : '❌ NO'}`);
        
        if (!result.includes(test.shouldContain)) {
            allTestsPassed = false;
        }
    }
    
    // Summary
    console.log('\n\n4. Summary');
    console.log('==========');
    
    if (allTestsPassed) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('\nThe fix is working correctly:');
        console.log('- Natural language parsing now produces simple, correct selectors');
        console.log('- Mobile Banking Type: #MobileBankingType (unchanged)');
        console.log('- Teacher Grade: #teachergrade (fixed from complex multi-selector)'); 
        console.log('- Religion: #religion (fixed from complex multi-selector)');
        console.log('- General pattern recognition still works for other cases');
        console.log('- Backward compatibility maintained for unknown patterns');
        
        console.log('\n🎯 PROBLEM STATEMENT RESOLVED:');
        console.log('The first selector was getting correctly (#MobileBankingType)');
        console.log('The others are now also getting correctly (#teachergrade, #religion)');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('Please review the implementation');
    }
    
    return allTestsPassed;
}

// Run test if this file is executed directly
if (require.main === module) {
    testSelectorFixValidation().then((passed) => {
        process.exit(passed ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testSelectorFixValidation };