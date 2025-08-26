const OpenAIService = require('./src/services/openai');

async function debugMultiLineParsing() {
    const aiService = new OpenAIService();
    
    const instructions = `Navigate to the login page URL https://ums-2.osl.team/Account/Login

Enter a valid email address in the "User Email" field "rumon.onnorokom@gmail.com".

Enter a valid password in the "Password" field.

Click the "Log in" button.`;

    console.log('Testing multi-line instructions...');
    
    // Let's trace what happens to each line
    const lines = instructions.split('\n').filter(line => line.trim());
    console.log('\nLines to process:');
    lines.forEach((line, i) => {
        console.log(`${i + 1}: "${line}"`);
        const lowerLine = line.toLowerCase().trim();
        console.log(`   - contains 'enter': ${lowerLine.includes('enter')}`);
        console.log(`   - contains 'email': ${lowerLine.includes('email')}`);
        console.log(`   - contains 'password': ${lowerLine.includes('password')}`);
        console.log(`   - contains 'click': ${lowerLine.includes('click')}`);
        
        if (lowerLine.includes('enter') && (lowerLine.includes('email') || lowerLine.includes('user email'))) {
            console.log(`   -> Should match EMAIL condition`);
            console.log(`   -> Selector: ${aiService.extractSelector(line, 'input')}`);
            console.log(`   -> Value: ${aiService.extractValue(line)}`);
        } else if (lowerLine.includes('enter') && lowerLine.includes('password')) {
            console.log(`   -> Should match PASSWORD condition`);
            console.log(`   -> Selector: ${aiService.extractSelector(line, 'input')}`);
            console.log(`   -> Value: ${aiService.extractValue(line)}`);
        }
    });

    try {
        const result = await aiService.parseTestInstructions(instructions);
        console.log('\n--- Final Result ---');
        console.log('Actions:');
        result.testCase.actions.forEach((action, i) => {
            console.log(`${i + 1}:`, JSON.stringify(action, null, 2));
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugMultiLineParsing();