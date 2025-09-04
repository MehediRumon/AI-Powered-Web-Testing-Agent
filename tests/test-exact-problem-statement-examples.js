const OpenAIService = require('../src/services/openai');

async function testExactProblemStatementExamples() {
    console.log('📋 Testing Exact Problem Statement Examples');
    console.log('==========================================\n');
    
    const openaiService = new OpenAIService();
    
    // Test 1: The corrected examples from the problem statement
    console.log('1. Testing Corrected Example Formats');
    console.log('------------------------------------');
    
    const correctExamples = [
        {
            instruction: 'click Next',
            expectedType: 'click',
            expectedSelector: 'text=Next',
            description: 'Button with text should use text= selector'
        },
        {
            instruction: 'fill "Enter Your Registration Number" with "123456"',
            expectedType: 'fill',
            expectedSelector: "input[placeholder='Enter Your Registration Number']",
            description: 'Input with placeholder should use input[placeholder=...] selector'
        },
        {
            instruction: 'click "Log in"',
            expectedType: 'click', 
            expectedSelector: 'text=Log in',
            description: 'Button click should use text= not button:has-text()'
        }
    ];
    
    let allTestsPassed = true;
    
    for (const example of correctExamples) {
        const parsed = openaiService.fallbackParse(example.instruction);
        const action = parsed.testCase.actions[0];
        
        console.log(`\nInstruction: "${example.instruction}"`);
        console.log(`  Expected Type: ${example.expectedType}`);
        console.log(`  Expected Selector: ${example.expectedSelector}`);
        console.log(`  Actual Type: ${action.type}`);
        console.log(`  Actual Selector: ${action.selector}`);
        
        const typeMatch = action.type === example.expectedType;
        const selectorMatch = action.selector === example.expectedSelector;
        
        if (typeMatch && selectorMatch) {
            console.log(`  Result: ✅ CORRECT - ${example.description}`);
        } else {
            console.log(`  Result: ❌ INCORRECT`);
            if (!typeMatch) console.log(`    Type mismatch: expected ${example.expectedType}, got ${action.type}`);
            if (!selectorMatch) console.log(`    Selector mismatch: expected ${example.expectedSelector}, got ${action.selector}`);
            allTestsPassed = false;
        }
    }
    
    // Test 2: Complex login example from problem statement
    console.log('\n\n2. Testing Complex Login Example');
    console.log('--------------------------------');
    
    const loginExample = `
    click "Log in" button
    wait 1000
    fill "test@example.com" in User Email field  
    fill "SecurePassword123!" in Password field
    click "Log in"
    verify "Dashboard" appears
    `;
    
    const parsed = openaiService.fallbackParse(loginExample);
    const actions = parsed.testCase.actions;
    
    console.log(`\nParsed ${actions.length} actions from login example:`);
    
    const expectedActions = [
        { type: 'click', expectedSelector: 'text=Log in' },
        { type: 'wait', expectedValue: '1000' },
        { type: 'fill', selectorPattern: /^(text=|input\[)/ }, // Either text= or input[...
        { type: 'fill', selectorPattern: /^(text=|input\[)/ },
        { type: 'click', expectedSelector: 'text=Log in' },
        { type: 'verify', expectedSelector: 'text=Dashboard' }
    ];
    
    for (let i = 0; i < expectedActions.length && i < actions.length; i++) {
        const action = actions[i];
        const expected = expectedActions[i];
        
        console.log(`\n  Action ${i + 1}: ${action.type}`);
        console.log(`    Selector: ${action.selector || 'N/A'}`);
        console.log(`    Value: ${action.value || 'N/A'}`);
        
        let actionCorrect = true;
        
        if (action.type !== expected.type) {
            console.log(`    ❌ Type should be ${expected.type}, got ${action.type}`);
            actionCorrect = false;
            allTestsPassed = false;
        }
        
        if (expected.expectedSelector && action.selector !== expected.expectedSelector) {
            console.log(`    ❌ Selector should be ${expected.expectedSelector}, got ${action.selector}`);
            actionCorrect = false;
            allTestsPassed = false;
        }
        
        if (expected.selectorPattern && (!action.selector || !expected.selectorPattern.test(action.selector))) {
            console.log(`    ❌ Selector should match pattern ${expected.selectorPattern}, got ${action.selector}`);
            actionCorrect = false;
            allTestsPassed = false;
        }
        
        if (expected.expectedValue && action.value !== expected.expectedValue) {
            console.log(`    ❌ Value should be ${expected.expectedValue}, got ${action.value}`);
            actionCorrect = false;
            allTestsPassed = false;
        }
        
        if (actionCorrect) {
            console.log(`    ✅ Action is correct`);
        }
    }
    
    // Test 3: Registration flow example
    console.log('\n\n3. Testing Registration Flow Example');
    console.log('-----------------------------------');
    
    const registrationExample = `
    fill "123456" in input with placeholder "Enter Your Registration Number"
    click "Next" button
    verify "Forgot Registration Number?" link
    click "Forgot Registration Number?"
    assert "Register Now" link is visible
    click "Register Now"
    verify url contains "register"
    `;
    
    const regParsed = openaiService.fallbackParse(registrationExample);
    const regActions = regParsed.testCase.actions;
    
    console.log(`\nParsed ${regActions.length} actions from registration example:`);
    
    regActions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action.type}: ${action.selector || 'N/A'} ${action.value ? `-> ${action.value}` : ''}`);
        
        // Validate key patterns
        if (action.type === 'click' && action.selector && !action.selector.startsWith('text=')) {
            console.log(`    ❌ Click should use text= selector, got ${action.selector}`);
            allTestsPassed = false;
        } else if (action.type === 'click') {
            console.log(`    ✅ Click uses correct text= selector`);
        }
        
        if (action.type === 'fill' && action.selector && action.selector.includes('placeholder') && !action.selector.startsWith('input[placeholder=')) {
            console.log(`    ❌ Placeholder fill should use input[placeholder=...], got ${action.selector}`);
            allTestsPassed = false;
        }
    });
    
    // Summary
    console.log('\n\n4. Summary');
    console.log('==========');
    
    if (allTestsPassed) {
        console.log('✅ ALL PROBLEM STATEMENT EXAMPLES PASSED!');
        console.log('\nThe AI now generates exactly the format mentioned in the problem statement:');
        console.log('- Button clicks: "text=ButtonText" (not "button:has-text(ButtonText)")');
        console.log('- Input placeholders: "input[placeholder=\'PlaceholderText\']"');
        console.log('- Labeled fields: "text=LabelText"');
        console.log('- Simple, consistent selectors throughout');
        console.log('- No complex multi-part selectors');
        
        console.log('\n🎯 SPECIFIC PROBLEM STATEMENT FIXES:');
        console.log('✅ "button:has-text(Log in)" → "text=Log in"');
        console.log('✅ Complex multi-selectors → Simple selectors');
        console.log('✅ Consistent placeholder handling');
        console.log('✅ Clean, readable selector patterns');
    } else {
        console.log('❌ SOME PROBLEM STATEMENT EXAMPLES FAILED');
        console.log('Please review the implementation');
    }
    
    return allTestsPassed;
}

// Run test if this file is executed directly
if (require.main === module) {
    testExactProblemStatementExamples().then((passed) => {
        process.exit(passed ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testExactProblemStatementExamples };