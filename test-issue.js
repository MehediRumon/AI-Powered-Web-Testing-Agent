const { default: fetch } = require('node-fetch');

async function testIssue() {
    try {
        // Register a test user
        const username = 'testuser_' + Date.now();
        const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                email: `test${Date.now()}@example.com`,
                password: 'testpass123'
            })
        });
        
        if (!registerResponse.ok) {
            const error = await registerResponse.json();
            throw new Error(`Registration failed: ${error.error}`);
        }
        
        const registerData = await registerResponse.json();
        const authToken = registerData.token;
        console.log('✅ Test user created');

        // Test with the problematic URL
        console.log('🧪 Testing with problematic URL: https://online.udvash-unmesh.com/');
        const generateResponse = await fetch('http://localhost:3000/api/test/ai/generate-from-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                url: 'https://online.udvash-unmesh.com/',
                autoExecute: false
            })
        });

        const generateData = await generateResponse.json();
        if (!generateResponse.ok) {
            console.log(`❌ Error: ${generateData.error}`);
            if (generateData.fallback) console.log(`💡 Fallback: ${generateData.fallback}`);
            if (generateData.suggestion) console.log(`💡 Suggestion: ${generateData.suggestion}`);
        } else {
            console.log('✅ Success!');
            console.log(`   Name: ${generateData.testCase.name}`);
            console.log(`   URL: ${generateData.testCase.url}`);
            console.log(`   Actions: ${generateData.testCase.actions.length} actions`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testIssue();