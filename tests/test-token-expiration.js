// Test to verify token expiration handling
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/middleware/auth');

async function testTokenExpiration() {
    console.log('Testing token expiration handling...');
    
    try {
        // Create an expired token (expired 1 hour ago)
        const expiredToken = jwt.sign(
            { id: 1, username: 'testuser', role: 'user' },
            JWT_SECRET,
            { expiresIn: '-1h' } // Negative expiration = already expired
        );
        
        console.log('✅ Created expired token for testing');
        
        // Verify the token is actually expired
        try {
            jwt.verify(expiredToken, JWT_SECRET);
            console.log('❌ Token should be expired but verification passed');
            return false;
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                console.log('✅ Confirmed token is expired:', err.message);
            } else {
                console.log('❌ Unexpected error verifying token:', err.message);
                return false;
            }
        }
        
        // Test the authenticateToken middleware behavior
        const mockReq = {
            headers: {
                'authorization': `Bearer ${expiredToken}`
            }
        };
        
        const mockRes = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.responseData = data;
                return this;
            }
        };
        
        const { authenticateToken } = require('../src/middleware/auth');
        
        authenticateToken(mockReq, mockRes, () => {
            console.log('❌ Middleware should not call next() for expired token');
            return false;
        });
        
        // Check if middleware properly handled expired token
        if (mockRes.statusCode === 403 && 
            mockRes.responseData && 
            mockRes.responseData.error === 'Invalid or expired token') {
            console.log('✅ Middleware correctly returns 403 with proper error message');
            console.log('✅ Error message:', mockRes.responseData.error);
            return true;
        } else {
            console.log('❌ Middleware did not handle expired token correctly');
            console.log('   Status:', mockRes.statusCode);
            console.log('   Response:', mockRes.responseData);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Test token validation
async function testTokenValidation() {
    console.log('\nTesting token validation scenarios...');
    
    const { authenticateToken } = require('../src/middleware/auth');
    
    // Test 1: No token
    console.log('Test 1: No authorization header');
    const mockReq1 = { headers: {} };
    const mockRes1 = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.responseData = data; return this; }
    };
    
    authenticateToken(mockReq1, mockRes1, () => {});
    
    if (mockRes1.statusCode === 401 && mockRes1.responseData.error === 'Access token required') {
        console.log('✅ Correctly handles missing token');
    } else {
        console.log('❌ Failed to handle missing token properly');
        return false;
    }
    
    // Test 2: Invalid token format
    console.log('Test 2: Invalid token format');
    const mockReq2 = { headers: { 'authorization': 'Bearer invalid_token' } };
    const mockRes2 = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.responseData = data; return this; }
    };
    
    authenticateToken(mockReq2, mockRes2, () => {});
    
    if (mockRes2.statusCode === 403 && mockRes2.responseData.error === 'Invalid or expired token') {
        console.log('✅ Correctly handles invalid token format');
    } else {
        console.log('❌ Failed to handle invalid token format properly');
        return false;
    }
    
    return true;
}

// Run the tests
async function runAllTests() {
    console.log('🧪 Token Expiration Tests');
    console.log('=========================\n');
    
    const test1 = await testTokenExpiration();
    const test2 = await testTokenValidation();
    
    if (test1 && test2) {
        console.log('\n🎉 All token tests passed!');
        console.log('📝 The backend correctly handles expired and invalid tokens');
        console.log('📝 Frontend needs enhancement to handle these responses gracefully');
    } else {
        console.log('\n❌ Some token tests failed!');
        process.exit(1);
    }
}

runAllTests().catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
});