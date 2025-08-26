const OpenAIService = require('./src/services/openai');

function testValueExtraction() {
    const aiService = new OpenAIService();
    
    const line = 'Enter a valid password in the "Password" field.';
    console.log('Testing line:', line);
    console.log('Extracted value:', aiService.extractValue(line));
}

testValueExtraction();