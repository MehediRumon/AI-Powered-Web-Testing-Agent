// Test to verify 5-second delay between interactions
const PlaywrightTestService = require('../src/services/playwright.js');

async function testInteractionDelay() {
    console.log('Testing 5-second delay between interactions...');
    
    const service = new PlaywrightTestService();
    
    try {
        // Initialize the browser
        await service.initialize('chromium', true);
        
        // Create a mock test case with multiple actions
        const testCase = {
            id: 'delay-test',
            url: 'data:text/html,<html><body><button id="btn1">Button 1</button><button id="btn2">Button 2</button><input id="input1" type="text"/></body></html>',
            actions: [
                { type: 'click', selector: '#btn1' },
                { type: 'fill', selector: '#input1', value: 'test text' },
                { type: 'click', selector: '#btn2' }
            ]
        };
        
        console.log('Starting test with 3 actions (should take approximately 10+ seconds with delays)...');
        const startTime = Date.now();
        
        const result = await service.runTest(testCase);
        
        const endTime = Date.now();
        const totalExecutionTime = endTime - startTime;
        
        console.log(`✅ Test completed in ${totalExecutionTime}ms`);
        console.log(`✅ Test status: ${result.status}`);
        console.log(`✅ Number of steps: ${result.steps.length}`);
        
        // Expect at least 10 seconds for 3 actions with 2 delays (5s each)
        // Adding some buffer for browser initialization and action execution
        const expectedMinTime = 10000; // 2 delays × 5 seconds each
        
        if (totalExecutionTime >= expectedMinTime) {
            console.log(`✅ Timing verification passed: ${totalExecutionTime}ms >= ${expectedMinTime}ms`);
            console.log('✅ 5-second delays are working correctly between interactions');
        } else {
            console.log(`❌ Timing verification failed: ${totalExecutionTime}ms < ${expectedMinTime}ms`);
            console.log('❌ The 5-second delays may not be working properly');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    } finally {
        await service.close();
    }
}

// Run the test
testInteractionDelay()
    .then(success => {
        if (success) {
            console.log('\n🎉 Interaction delay test passed!');
            console.log('📝 The system now waits 5 seconds between each interaction');
        } else {
            console.log('\n❌ Interaction delay test failed!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('❌ Test error:', error);
        process.exit(1);
    });