const OpenAIService = require('../src/services/openai');

async function testButtonClickParsing() {
    console.log('Testing button click parsing fix...');
    
    const openaiService = new OpenAIService();
    
    // Test Case 1: "click Login Button" should extract "Login" text, not generic button selector
    console.log('\nTest 1: Testing "click Login Button" parsing');
    const testInstruction1 = 'click Login Button';
    const result1 = openaiService.fallbackParse(testInstruction1);
    
    console.log('Input:', testInstruction1);
    console.log('Parsed actions:', JSON.stringify(result1.testCase.actions, null, 2));
    
    const action1 = result1.testCase.actions[0];
    if (action1 && action1.type === 'click') {
        console.log('✅ Action type is correct: click');
        
        // Check if selector is text-based (should be "text=Login")
        if (action1.selector && action1.selector.startsWith('text=')) {
            console.log('✅ Selector is text-based:', action1.selector);
        } else {
            console.log('❌ Selector should be text-based but got:', action1.selector);
        }
        
        // Check if elementType is set to button
        if (action1.elementType === 'button') {
            console.log('✅ ElementType is correctly set to button');
        } else {
            console.log('❌ ElementType should be "button" but got:', action1.elementType);
        }
    } else {
        console.log('❌ No click action found or wrong type');
    }
    
    // Test Case 2: "click Submit" should work without "Button" keyword
    console.log('\nTest 2: Testing "click Submit" parsing');
    const testInstruction2 = 'click Submit';
    const result2 = openaiService.fallbackParse(testInstruction2);
    
    console.log('Input:', testInstruction2);
    console.log('Parsed actions:', JSON.stringify(result2.testCase.actions, null, 2));
    
    const action2 = result2.testCase.actions[0];
    if (action2 && action2.type === 'click' && action2.selector === 'text=Submit') {
        console.log('✅ Simple click parsing works correctly');
    } else {
        console.log('❌ Simple click parsing failed:', action2);
    }
    
    // Test Case 3: "click Login link" should set elementType to link
    console.log('\nTest 3: Testing "click Login link" parsing');
    const testInstruction3 = 'click Login link';
    const result3 = openaiService.fallbackParse(testInstruction3);
    
    console.log('Input:', testInstruction3);
    console.log('Parsed actions:', JSON.stringify(result3.testCase.actions, null, 2));
    
    const action3 = result3.testCase.actions[0];
    if (action3 && action3.elementType === 'link') {
        console.log('✅ Link elementType parsing works correctly');
    } else {
        console.log('❌ Link elementType should be set but got:', action3?.elementType);
    }
    
    console.log('\n🎯 Test completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
    testButtonClickParsing().then(() => {
        console.log('✅ Button click parsing test completed!');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testButtonClickParsing };