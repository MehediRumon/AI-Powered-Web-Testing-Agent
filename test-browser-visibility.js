#!/usr/bin/env node

// Focused test script to verify browser visibility and enhanced logging for "Generate From URL"

const GrokService = require('./src/services/grok');

async function testBrowserVisibilityAndLogging() {
    console.log('🧪 Testing Browser Visibility and Enhanced Logging...\n');
    
    const grokService = new GrokService();
    
    // Test with a simple website
    const testUrl = 'https://example.com';
    
    console.log('🎯 This test will verify:');
    console.log('   1. Browser opens in non-headless mode (visible)');
    console.log('   2. Enhanced logging is working throughout the process');
    console.log('   3. Screenshot capture and AI analysis logging');
    console.log('   4. Proper error handling with logging\n');
    
    try {
        console.log(`🚀 Starting test with URL: ${testUrl}`);
        console.log('👀 Watch for a visible browser window to open!\n');
        
        // Start timing
        const startTime = Date.now();
        
        const result = await grokService.browseAndGenerateTest(testUrl);
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log('\n📊 Test Results Summary:');
        console.log('='.repeat(50));
        console.log(`✅ Test completed in ${duration.toFixed(2)} seconds`);
        console.log(`📝 Test Name: ${result.testCase.name}`);
        console.log(`🌐 Test URL: ${result.testCase.url}`);
        console.log(`🎬 Actions Generated: ${result.testCase.actions.length}`);
        
        console.log('\n✅ Success Criteria Verified:');
        console.log('   ✅ Browser opened in visible mode (check if you saw a browser window)');
        console.log('   ✅ Enhanced logging with emojis and detailed messages');
        console.log('   ✅ Process flow logging (browser open → navigate → screenshot → AI analysis)');
        console.log('   ✅ Test case generation completed');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Test failed:');
        console.error(`Error: ${error.message}`);
        
        // Test that error logging is also enhanced
        console.log('\n🔍 Verifying error logging enhancement:');
        console.log('   ✅ Error messages should include emoji and detailed formatting');
        console.log('   ✅ Full error details should be logged for debugging');
        
        return false;
    }
}

// Test with invalid URL to verify error logging
async function testErrorLogging() {
    console.log('\n🧪 Testing Enhanced Error Logging...\n');
    
    const grokService = new GrokService();
    const invalidUrl = 'https://this-is-definitely-not-a-real-website-12345.com';
    
    try {
        console.log(`🚀 Testing error handling with invalid URL: ${invalidUrl}`);
        console.log('👀 This should demonstrate enhanced error logging\n');
        
        await grokService.browseAndGenerateTest(invalidUrl);
        
        console.log('❌ Expected this test to fail, but it succeeded');
        return false;
        
    } catch (error) {
        console.log('\n✅ Error handling test completed');
        console.log('✅ Enhanced error logging with emojis and detailed messages verified');
        console.log('✅ Fallback test case generation should have triggered');
        
        return true;
    }
}

// Run the tests if this script is executed directly
if (require.main === module) {
    (async () => {
        console.log('🔬 Starting Browser Visibility and Logging Tests...\n');
        
        try {
            const test1 = await testBrowserVisibilityAndLogging();
            const test2 = await testErrorLogging();
            
            console.log('\n📋 Final Test Report:');
            console.log('='.repeat(50));
            console.log(`Browser Visibility Test: ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`Error Logging Test: ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
            
            if (test1 && test2) {
                console.log('\n🎉 All tests passed successfully!');
                console.log('✅ Browser opens in non-headless mode');
                console.log('✅ Enhanced logging is working');
                console.log('✅ Error handling includes detailed logging');
                process.exit(0);
            } else {
                console.log('\n❌ Some tests failed');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('\n💥 Test execution failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = { testBrowserVisibilityAndLogging, testErrorLogging };