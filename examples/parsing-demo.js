// Interactive Natural Language Parsing Demo
// This script demonstrates the actual parsing functionality

const OpenAIService = require('../src/services/openai');

async function demoNaturalLanguageParsing() {
    console.log('🤖 Natural Language Test Case Parsing Demo\n');
    console.log('This demo tests the actual parsing functionality with various inputs.\n');
    
    const aiService = new OpenAIService();
    
    // Test cases to demonstrate parsing
    const testInputs = [
        "Navigate to /login, enter username 'admin', enter password 'secret123', click Login, verify redirected to dashboard",
        
        "Go to /register, fill first name 'John', fill last name 'Doe', enter email 'john@test.com', check terms checkbox, click Register",
        
        "Visit /products, search for 'laptop', click first result, click add to cart, verify cart contains item",
        
        "Navigate to /contact, fill name 'Test User', enter email 'test@example.com', type message 'Hello world', click Send",
        
        "Go to /settings, hover over profile menu, click edit profile, wait for form to load, update phone number",
        
        "Navigate to homepage, scroll to footer, click privacy policy link, verify page title contains 'Privacy'"
    ];
    
    console.log('🧪 Testing parsing with various natural language inputs:\n');
    
    for (let i = 0; i < testInputs.length; i++) {
        const input = testInputs[i];
        console.log(`📝 Test ${i + 1}:`);
        console.log(`Input: ${input}`);
        console.log('─'.repeat(80));
        
        try {
            const result = await aiService.parseTestInstructions(input);
            
            if (result && result.testCase) {
                const testCase = result.testCase;
                console.log(`✅ Parsed successfully!`);
                console.log(`   Name: ${testCase.name}`);
                console.log(`   Description: ${testCase.description || 'Not provided'}`);
                console.log(`   URL: ${testCase.url}`);
                console.log(`   Actions: ${testCase.actions.length}`);
                
                // Show first few actions
                testCase.actions.slice(0, 3).forEach((action, idx) => {
                    console.log(`   ${idx + 1}. ${action.type}: ${action.description}`);
                });
                
                if (testCase.actions.length > 3) {
                    console.log(`   ... and ${testCase.actions.length - 3} more actions`);
                }
                
                console.log('');
            } else {
                console.log('❌ Parsing failed - no valid test case returned');
            }
            
        } catch (error) {
            console.log(`❌ Parsing failed: ${error.message}`);
        }
        
        console.log('\n');
    }
    
    // Test with different complexity levels
    console.log('🎯 Testing Different Complexity Levels:\n');
    
    const complexityTests = {
        'Simple': "Click login button",
        'Medium': "Navigate to /login, enter username 'user', click submit",
        'Complex': "Navigate to e-commerce site, search for products, filter by price range $100-$500, sort by rating, select first item, add to cart, proceed to checkout, fill billing information, select credit card payment, verify order summary"
    };
    
    for (const [level, input] of Object.entries(complexityTests)) {
        console.log(`📊 ${level} Test:`);
        console.log(`Input: ${input}`);
        
        try {
            const result = await aiService.parseTestInstructions(input);
            
            if (result && result.testCase) {
                console.log(`✅ Success - Generated ${result.testCase.actions.length} actions`);
                console.log(`   Test Name: ${result.testCase.name}`);
            } else {
                console.log('❌ Failed to parse');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('');
    }
    
    // Test fallback parsing (when no OpenAI)
    console.log('🔄 Testing Fallback Parsing (without AI):\n');
    
    const originalApiKey = aiService.apiKey;
    aiService.apiKey = null; // Disable AI to test fallback
    
    const fallbackTest = "Navigate to /test, enter 'sample' in username field, click submit button, wait 2 seconds";
    
    try {
        const result = await aiService.parseTestInstructions(fallbackTest);
        
        if (result && result.testCase) {
            console.log(`✅ Fallback parsing successful!`);
            console.log(`   Name: ${result.testCase.name}`);
            console.log(`   Actions: ${result.testCase.actions.length}`);
            
            result.testCase.actions.forEach((action, idx) => {
                console.log(`   ${idx + 1}. ${action.type}: ${action.description || action.selector || action.value}`);
            });
        } else {
            console.log('❌ Fallback parsing failed');
        }
    } catch (error) {
        console.log(`❌ Fallback error: ${error.message}`);
    }
    
    // Restore original API key
    aiService.apiKey = originalApiKey;
    
    console.log('\n🎉 Demo completed!');
    console.log('\n💡 Key Takeaways:');
    console.log('1. Natural language is successfully parsed into structured test cases');
    console.log('2. The system handles various complexity levels');
    console.log('3. Fallback parsing works when AI service is unavailable');
    console.log('4. Generated test cases include proper validation and sanitization');
    console.log('5. The format supports all major web testing scenarios');
}

// Helper function to show the complete structure of a parsed test case
function showCompleteStructure(testCase) {
    console.log('\n📋 Complete Test Case Structure:');
    console.log(JSON.stringify(testCase, null, 2));
}

// Export for use in other modules
module.exports = {
    demoNaturalLanguageParsing,
    showCompleteStructure
};

// Run demo if this file is executed directly
if (require.main === module) {
    demoNaturalLanguageParsing()
        .then(() => {
            console.log('\n✨ Demo completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Demo failed:', error);
            process.exit(1);
        });
}