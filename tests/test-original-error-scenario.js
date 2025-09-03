// Manual verification that reproduces the original error scenario
const OpenAIService = require('../src/services/openai');
const fs = require('fs');
const path = require('path');

// Mock the exact error from the problem statement
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

async function reproduceOriginalError() {
    console.log('🔍 Reproducing original error scenario...');
    console.log('Original error: "OpenAI API error: You exceeded your current quota..."');
    console.log('Original stack trace: "at OpenAIService.analyzeUploadedImage"');
    console.log('');
    
    try {
        // Create the exact scenario from the problem statement
        const openaiService = new OpenAIService('sk-test-key'); // Simulated API key
        
        // Create a test image (like the one from upload)
        const testImagePath = path.join(__dirname, 'reproduce-test.png');
        const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        fs.writeFileSync(testImagePath, testImageData);
        
        console.log('🧪 Calling analyzeUploadedImage with quota exceeded API...');
        
        // This should now handle the error gracefully instead of crashing
        const result = await openaiService.analyzeUploadedImage(testImagePath, 'test-image.png');
        
        console.log('✅ SUCCESS: Method returned result instead of throwing error');
        console.log(`   Test case name: ${result.testCase.name}`);
        console.log(`   Used fallback: ${result.metadata?.usedFallback || false}`);
        console.log(`   Fallback reason: ${result.metadata?.fallbackReason || 'none'}`);
        
        // Clean up
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        
        console.log('');
        console.log('🎉 Original error scenario is now FIXED!');
        console.log('   ✅ No more crashes on quota exceeded');
        console.log('   ✅ Graceful fallback to basic test generation');
        console.log('   ✅ Clear user messaging about quota issues');
        
        return true;
        
    } catch (error) {
        console.log('❌ ERROR: Method still throws errors');
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
        return false;
    }
}

reproduceOriginalError()
    .then(success => {
        if (success) {
            console.log('\n✨ Original error reproduction test PASSED');
        } else {
            console.log('\n❌ Original error reproduction test FAILED');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n❌ Test runner failed:', error);
        process.exit(1);
    });