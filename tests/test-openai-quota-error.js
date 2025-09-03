// Test for OpenAI quota error handling
const OpenAIService = require('../src/services/openai');
const fs = require('fs');
const path = require('path');

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

async function testQuotaErrorHandling() {
    console.log('🧪 Testing OpenAI quota error handling...');
    
    try {
        // Test 1: parseTestInstructions with quota error
        console.log('\n1. Testing parseTestInstructions with quota error...');
        mockQuotaError();
        
        const openaiService = new OpenAIService('test-api-key');
        const result1 = await openaiService.parseTestInstructions('Click the login button');
        
        if (result1 && result1.testCase) {
            console.log('✅ parseTestInstructions handled quota error gracefully');
            console.log(`   Generated fallback test case: ${result1.testCase.name}`);
        } else {
            console.log('❌ parseTestInstructions did not return a valid fallback');
        }
        
        // Test 2: analyzeUploadedImage with quota error
        console.log('\n2. Testing analyzeUploadedImage with quota error...');
        
        // Create a test image file
        const testImagePath = path.join(__dirname, 'test-image.png');
        const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(testImagePath, testImageData);
        
        try {
            const result2 = await openaiService.analyzeUploadedImage(testImagePath, 'test-image.png');
            
            if (result2 && result2.testCase) {
                console.log('✅ analyzeUploadedImage handled quota error gracefully');
                console.log(`   Generated fallback test case: ${result2.testCase.name}`);
            } else {
                console.log('❌ analyzeUploadedImage did not return a valid fallback');
            }
        } catch (error) {
            console.log('❌ analyzeUploadedImage threw error instead of falling back:');
            console.log(`   Error: ${error.message}`);
        } finally {
            // Clean up test file
            if (fs.existsSync(testImagePath)) {
                fs.unlinkSync(testImagePath);
            }
        }
        
        restoreFetch();
        
        console.log('\n🎯 Test completed. Check results above.');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        restoreFetch();
        return false;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testQuotaErrorHandling()
        .then(success => {
            if (success) {
                console.log('\n✨ Quota error handling test completed');
            } else {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n❌ Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = { testQuotaErrorHandling, mockQuotaError, restoreFetch };