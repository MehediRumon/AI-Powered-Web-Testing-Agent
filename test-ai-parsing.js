const OpenAIService = require('./src/services/openai');

async function testAIParsing() {
    const aiService = new OpenAIService();
    
    // Test the exact scenario from the problem statement
    const instructions = `Navigate to the login page URL https://ums-2.osl.team/Account/Login

Enter a valid email address in the "User Email" field "rumon.onnorokom@gmail.com".

Enter a valid password in the "Password" field.

Click the "Log in" button.`;

    console.log('Testing AI parsing with instructions:');
    console.log(instructions);
    console.log('\n--- Parsing Result ---');
    
    try {
        const result = await aiService.parseTestInstructions(instructions);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAIParsing();