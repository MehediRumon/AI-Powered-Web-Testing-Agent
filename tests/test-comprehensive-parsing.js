const OpenAIService = require('../src/services/openai');

async function testComprehensiveParsing() {
    console.log('Testing comprehensive parsing functionality...');
    
    const openaiService = new OpenAIService();
    
    // Test existing functionality to ensure no regression
    const testCases = [
        // Test case 1: Original button click issue
        {
            input: 'click Login Button',
            expectedSelector: 'text=Login',
            expectedElementType: 'button',
            description: 'Original button click issue'
        },
        // Test case 2: Link clicks
        {
            input: 'click Home link',
            expectedSelector: 'text=Home',
            expectedElementType: 'link',
            description: 'Link click parsing'
        },
        // Test case 3: Simple clicks without element type
        {
            input: 'click Submit',
            expectedSelector: 'text=Submit',
            expectedElementType: undefined,
            description: 'Simple click without element type'
        },
        // Test case 4: Quoted text should work as before
        {
            input: 'click "Log In"',
            expectedSelector: 'text=Log In',
            expectedElementType: undefined,
            description: 'Quoted text should work'
        },
        // Test case 5: CSS selector should work as before
        {
            input: 'click "#submit-btn"',
            expectedSelector: '#submit-btn',
            expectedElementType: undefined,
            description: 'CSS selector should work'
        },
        // Test case 6: Input field parsing should still work
        {
            input: 'enter "username" in "Email"',
            expectedType: 'fill',
            description: 'Input field parsing should work'
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        console.log(`\n🧪 Testing: ${testCase.description}`);
        console.log(`   Input: "${testCase.input}"`);
        
        try {
            const result = openaiService.fallbackParse(testCase.input);
            const action = result.testCase.actions[0];
            
            if (!action) {
                console.log(`   ❌ No action parsed`);
                failed++;
                continue;
            }
            
            // Test action type
            if (testCase.expectedType && action.type !== testCase.expectedType) {
                console.log(`   ❌ Expected type "${testCase.expectedType}" but got "${action.type}"`);
                failed++;
                continue;
            }
            
            // Test selector (only for click actions)
            if (action.type === 'click' && testCase.expectedSelector && action.selector !== testCase.expectedSelector) {
                console.log(`   ❌ Expected selector "${testCase.expectedSelector}" but got "${action.selector}"`);
                failed++;
                continue;
            }
            
            // Test element type
            if (testCase.expectedElementType !== undefined && action.elementType !== testCase.expectedElementType) {
                console.log(`   ❌ Expected elementType "${testCase.expectedElementType}" but got "${action.elementType}"`);
                failed++;
                continue;
            }
            
            console.log(`   ✅ PASSED`);
            console.log(`      Selector: ${action.selector}`);
            console.log(`      ElementType: ${action.elementType || 'undefined'}`);
            console.log(`      Type: ${action.type}`);
            passed++;
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! The fix works correctly and preserves existing functionality.');
    } else {
        console.log('\n⚠️  Some tests failed. Need to review the implementation.');
    }
    
    return failed === 0;
}

// Run test if this file is executed directly
if (require.main === module) {
    testComprehensiveParsing().then((success) => {
        process.exit(success ? 0 : 1);
    }).catch((error) => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testComprehensiveParsing };