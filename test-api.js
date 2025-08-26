const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPIEndpoint() {
    const instructions = `Navigate to the login page URL https://ums-2.osl.team/Account/Login

Enter a valid email address in the "User Email" field "rumon.onnorokom@gmail.com".

Enter a valid password in the "Password" field.

Click the "Log in" button.`;

    try {
        // First, we need to register/login to get a token
        const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser',
                email: 'test@example.com',
                password: 'testpassword'
            })
        });

        let token;
        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            token = registerData.token;
            console.log('Registered successfully');
        } else {
            // Try login instead
            const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'testpassword'
                })
            });
            
            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                token = loginData.token;
                console.log('Logged in successfully');
            } else {
                console.error('Failed to authenticate');
                return;
            }
        }

        // Test AI parsing endpoint
        const parseResponse = await fetch('http://localhost:3000/api/test/ai/parse', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ instructions })
        });

        if (parseResponse.ok) {
            const parseData = await parseResponse.json();
            console.log('\n--- API Parsing Result ---');
            console.log(JSON.stringify(parseData, null, 2));
        } else {
            const error = await parseResponse.text();
            console.error('Parse API error:', error);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testAPIEndpoint();