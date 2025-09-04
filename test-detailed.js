const { default: fetch } = require('node-fetch');

async function showDetailedTest() {
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
        
        const registerData = await registerResponse.json();
        const authToken = registerData.token;

        // Test with the problematic URL
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
        console.log('🧪 Complete Test Case Generated:');
        console.log(JSON.stringify(generateData, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

showDetailedTest();