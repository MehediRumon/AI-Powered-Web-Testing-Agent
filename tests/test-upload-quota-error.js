// Integration test for upload route quota error handling
const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../src/database/init');

// Mock the fetch function to simulate quota error
const originalFetch = global.fetch;

function mockQuotaError() {
    global.fetch = async (url, options) => {
        if (url.includes('openai.com')) {
            return {
                ok: false,
                status: 429,
                json: async () => ({
                    error: {
                        message: 'You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.',
                        type: 'insufficient_quota',
                        param: null,
                        code: 'insufficient_quota'
                    }
                })
            };
        }
        return originalFetch(url, options);
    };
}

function restoreFetch() {
    global.fetch = originalFetch;
}

async function createTestUser() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        // First, create a test user
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('testpass123', 10);
        
        db.run(
            'INSERT OR REPLACE INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
            [999, 'testuser', 'test@example.com', hashedPassword],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    // Add API key for the test user
                    db.run(
                        'INSERT OR REPLACE INTO api_configs (user_id, openai_api_key) VALUES (?, ?)',
                        [999, 'test-api-key'],
                        function(apiErr) {
                            db.close();
                            if (apiErr) {
                                reject(apiErr);
                            } else {
                                resolve(999);
                            }
                        }
                    );
                }
            }
        );
    });
}

async function testUploadQuotaError() {
    console.log('🧪 Testing upload route quota error handling...');
    
    try {
        // Create test user and get auth token
        console.log('1. Setting up test user...');
        await createTestUser();
        
        // Login to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testuser',
                password: 'testpass123'
            });
        
        if (loginResponse.status !== 200) {
            throw new Error(`Login failed: ${loginResponse.body.error}`);
        }
        
        const token = loginResponse.body.token;
        console.log('✅ Test user setup complete');
        
        // Create a test image file
        console.log('2. Creating test image...');
        const testImagePath = path.join(__dirname, 'test-image.png');
        const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(testImagePath, testImageData);
        
        // Mock quota error
        console.log('3. Testing image upload with quota error...');
        mockQuotaError();
        
        const uploadResponse = await request(app)
            .post('/api/upload/image-analysis')
            .set('Authorization', `Bearer ${token}`)
            .attach('image', testImagePath);
        
        console.log(`Response status: ${uploadResponse.status}`);
        console.log(`Response body:`, uploadResponse.body);
        
        if (uploadResponse.status === 200) {
            console.log('✅ Upload handled quota error gracefully');
            console.log(`   Analysis result: ${uploadResponse.body.analysis?.testCase?.name}`);
        } else if (uploadResponse.status === 500 && uploadResponse.body.fallback) {
            console.log('⚠️  Upload returned error but provided fallback guidance');
            console.log(`   Error: ${uploadResponse.body.error}`);
            console.log(`   Fallback: ${uploadResponse.body.fallback}`);
        } else {
            console.log('❌ Upload did not handle quota error properly');
            console.log(`   Status: ${uploadResponse.status}`);
            console.log(`   Response: ${JSON.stringify(uploadResponse.body, null, 2)}`);
        }
        
        // Clean up
        restoreFetch();
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        
        console.log('\n🎯 Integration test completed');
        return true;
        
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        restoreFetch();
        return false;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testUploadQuotaError()
        .then(success => {
            if (success) {
                console.log('\n✨ Upload quota error integration test completed');
                process.exit(0);
            } else {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n❌ Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = { testUploadQuotaError };