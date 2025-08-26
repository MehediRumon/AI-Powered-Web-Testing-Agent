const OpenAIService = require('./src/services/openai');

async function debugParsing() {
    const aiService = new OpenAIService();
    
    const instructions = `Enter a valid email address in the "User Email" field "rumon.onnorokom@gmail.com".`;

    console.log('Testing specific line:', instructions);
    console.log('Using parseTestInstructions...');
    
    try {
        const result = await aiService.parseTestInstructions(instructions);
        console.log('Actions:', JSON.stringify(result.testCase.actions, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugParsing();