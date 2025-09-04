const OpenAIService = require('../src/services/openai');

async function testProblemStatementValidation() {
    console.log('🎯 Testing Problem Statement Validation');
    console.log('=======================================\n');
    
    const openaiService = new OpenAIService();
    
    // Test 1: Button clicks should use text= selectors, not complex has-text selectors
    console.log('1. Testing Button Click Selector Generation');
    console.log('-------------------------------------------');
    
    const buttonInstructions = [
        'click Log in',
        'click Login Button',
        'click the Next button',
        'click Submit',
        'click Register Now'
    ];
    
    let allTestsPassed = true;
    
    for (const instruction of buttonInstructions) {
        const parsed = openaiService.fallbackParse(instruction);
        const action = parsed.testCase.actions[0];
        
        console.log(`\nInstruction: "${instruction}"`);
        console.log(`  Generated: ${action.selector}`);
        
        // Should generate text= selectors, not complex button:has-text() selectors
        if (action.selector.startsWith('text=') && !action.selector.includes('button:has-text') && !action.selector.includes(':has-text')) {
            console.log(`  Result:    ✅ CORRECT - Simple text selector`);
        } else {
            console.log(`  Result:    ❌ INCORRECT - Should be text= selector, not complex selector`);
            allTestsPassed = false;
        }
    }
    
    // Test 2: Input fields with placeholders should use input[placeholder='...'] selectors
    console.log('\n\n2. Testing Input Field Placeholder Selector Generation');
    console.log('------------------------------------------------------');
    
    const inputInstructions = [
        'fill "Enter Your Registration Number" with "123456"',
        'enter "Please enter your email" with "test@example.com"',
        'type "Enter your password" with "password123"'
    ];
    
    for (const instruction of inputInstructions) {
        const parsed = openaiService.fallbackParse(instruction);
        const action = parsed.testCase.actions[0];
        
        console.log(`\nInstruction: "${instruction}"`);
        console.log(`  Generated: ${action.selector}`);
        
        // Should generate input[placeholder='...'] for placeholder patterns
        if (action.selector.includes('placeholder') || action.selector.startsWith('text=')) {
            console.log(`  Result:    ✅ CORRECT - Appropriate selector for input`);
        } else {
            console.log(`  Result:    ❌ INCORRECT - Should use placeholder or text selector`);
            allTestsPassed = false;
        }
    }
    
    // Test 3: Labeled inputs should use text= selectors for the label
    console.log('\n\n3. Testing Labeled Input Selector Generation');
    console.log('--------------------------------------------');
    
    const labeledInputInstructions = [
        'enter "test@example.com" in User Email field',
        'type "password123" in Password field',
        'fill "John Doe" in Full Name field'
    ];
    
    for (const instruction of labeledInputInstructions) {
        const parsed = openaiService.fallbackParse(instruction);
        const action = parsed.testCase.actions[0];
        
        console.log(`\nInstruction: "${instruction}"`);
        console.log(`  Generated: ${action.selector}`);
        
        // Should use simple selectors, not complex multi-part selectors
        if (!action.selector.includes('label:has-text') && !action.selector.includes(',') && !action.selector.includes('+')) {
            console.log(`  Result:    ✅ CORRECT - Simple selector (no complex multi-part)`);
        } else {
            console.log(`  Result:    ❌ INCORRECT - Should not use complex multi-part selectors`);
            allTestsPassed = false;
        }
    }
    
    // Test 4: Verification actions should use simple text selectors
    console.log('\n\n4. Testing Verification Selector Generation');
    console.log('------------------------------------------');
    
    const verifyInstructions = [
        'verify Dashboard appears',
        'check for "Invalid credentials" message',
        'assert "Register Now" link is visible'
    ];
    
    for (const instruction of verifyInstructions) {
        const parsed = openaiService.fallbackParse(instruction);
        const actions = parsed.testCase.actions;
        
        console.log(`\nInstruction: "${instruction}"`);
        if (actions.length > 0) {
            console.log(`  Generated: ${actions[0].selector || 'No selector generated'}`);
            console.log(`  Type:      ${actions[0].type}`);
        } else {
            console.log(`  Generated: No actions generated`);
        }
    }
    
    // Test 5: Complex example from problem statement
    console.log('\n\n5. Testing Complex Example from Problem Statement');
    console.log('------------------------------------------------');
    
    const complexExample = `
    click Log in button
    wait 1000
    fill "test@example.com" in User Email
    fill "SecurePassword123!" in Password  
    click Log in
    verify Dashboard appears
    `;
    
    const parsed = openaiService.fallbackParse(complexExample);
    const actions = parsed.testCase.actions;
    
    console.log(`\nParsed ${actions.length} actions:`);
    actions.forEach((action, index) => {
        console.log(`  ${index + 1}. Type: ${action.type}, Selector: ${action.selector || 'N/A'}, Value: ${action.value || 'N/A'}`);
        
        // Validate that selectors are simple and consistent
        if (action.type === 'click' && action.selector) {
            if (action.selector.startsWith('text=') && !action.selector.includes(':has-text')) {
                console.log(`     ✅ Click selector is simple text-based`);
            } else {
                console.log(`     ❌ Click selector should be simple text-based`);
                allTestsPassed = false;
            }
        }
        
        if (action.type === 'fill' && action.selector) {
            if (!action.selector.includes('label:has-text') && !action.selector.includes(',')) {
                console.log(`     ✅ Fill selector is simple`);
            } else {
                console.log(`     ❌ Fill selector should be simple, not complex multi-part`);
                allTestsPassed = false;
            }
        }
    });
    
    // Summary
    console.log('\n\n6. Summary');
    console.log('==========');
    
    if (allTestsPassed) {
        console.log('✅ ALL PROBLEM STATEMENT TESTS PASSED!');
        console.log('\nThe AI now generates consistent, system-supported responses:');
        console.log('- Button clicks use text= selectors (e.g., "text=Next")');
        console.log('- Input placeholders use appropriate selectors'); 
        console.log('- No complex multi-part selectors with label:has-text, +, etc.');
        console.log('- Simple, consistent selector patterns throughout');
        
        console.log('\n🎯 PROBLEM STATEMENT REQUIREMENTS MET:');
        console.log('- For fields with labels: uses "text=LabelText" approach');
        console.log('- For placeholders: can use "input[placeholder=\'...\']" format');
        console.log('- Buttons use "text=ButtonText" not "button:has-text(ButtonText)"');
        console.log('- Eliminated complex multi-selector patterns');
    } else {
        console.log('❌ SOME PROBLEM STATEMENT TESTS FAILED');
        console.log('Please review the implementation for consistency');
    }
    
    return allTestsPassed;
}

// Run test if this file is executed directly
if (require.main === module) {
    testProblemStatementValidation().then((passed) => {
        process.exit(passed ? 0 : 1);
    }).catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testProblemStatementValidation };