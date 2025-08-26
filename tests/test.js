const http = require('http');
const app = require('../server');

// Simple test to verify the server starts
async function testServer() {
    try {
        console.log('Testing AI-Powered Web Testing Agent...');
        
        // Test health endpoint
        const response = await fetch('http://localhost:3000/health');
        const data = await response.json();
        
        if (response.ok && data.status === 'OK') {
            console.log('✅ Health check passed');
            console.log('✅ Server is running correctly');
        } else {
            console.log('❌ Health check failed');
            process.exit(1);
        }
        
        console.log('\n🎉 All basic tests passed!');
        console.log('📝 Manual testing steps:');
        console.log('1. Open http://localhost:3000 in your browser');
        console.log('2. Register/login with a test account');
        console.log('3. Check browser installation status');
        console.log('4. Create a test case manually or with AI');
        console.log('5. Execute the test case');
        console.log('6. Generate and download reports');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Only run test if this file is executed directly
if (require.main === module) {
    // Wait a moment for server to start
    setTimeout(testServer, 2000);
}