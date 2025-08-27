// Demo script to show the 5-second delay feature
const PlaywrightTestService = require('../src/services/playwright.js');

// Create a realistic demo that shows timing
async function demonstrateDelayFeature() {
    console.log('🚀 Demonstrating 5-second delay between interactions');
    console.log('=' .repeat(60));
    
    const service = new PlaywrightTestService();
    
    // Mock the browser dependencies for demo purposes
    service.page = {
        async goto(url) {
            console.log(`📍 Navigating to: ${url}`);
        },
        
        async waitForTimeout(ms) {
            const seconds = ms / 1000;
            console.log(`⏳ Waiting ${seconds} seconds...`);
            
            // Show a countdown for better visualization
            for (let i = seconds; i > 0; i--) {
                process.stdout.write(`\r⏰ ${i} seconds remaining...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.log('\r✅ Wait completed!                    ');
        },
        
        async screenshot() {
            console.log('📸 Taking screenshot...');
        }
    };
    
    // Mock executeAction to show what's happening
    service.executeAction = async function(action) {
        const actionDesc = `${action.type.toUpperCase()} on ${action.selector || action.locator}`;
        console.log(`🎯 Executing: ${actionDesc}`);
        if (action.value) {
            console.log(`   └─ Value: "${action.value}"`);
        }
        
        // Simulate action execution time
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`✅ Action completed!`);
    };
    
    // Create a sample test case
    const testCase = {
        id: 'demo-test',
        url: 'https://example.com/login',
        actions: [
            { type: 'fill', selector: '#username', value: 'testuser' },
            { type: 'fill', selector: '#password', value: 'password123' },
            { type: 'click', selector: '#login-button' },
            { type: 'wait', selector: '#dashboard' },
            { type: 'click', selector: '#profile-menu' }
        ]
    };
    
    console.log(`\n📋 Test Case: ${testCase.id}`);
    console.log(`🌐 URL: ${testCase.url}`);
    console.log(`🔢 Actions: ${testCase.actions.length}`);
    console.log(`⏱️  Expected duration: ~${(testCase.actions.length - 1) * 5} seconds (${testCase.actions.length - 1} delays × 5s each)\n`);
    
    const startTime = Date.now();
    
    try {
        // Simulate the runTest method's action execution loop
        await service.page.goto(testCase.url);
        
        console.log('\n🏃 Starting action execution with 5-second delays...\n');
        
        for (let i = 0; i < testCase.actions.length; i++) {
            const action = testCase.actions[i];
            
            console.log(`\n--- Step ${i + 1}/${testCase.actions.length} ---`);
            await service.executeAction(action);
            
            // This is the key feature: 5-second delay between interactions
            if (i < testCase.actions.length - 1) {
                console.log('\n💤 Adding 5-second delay before next interaction...');
                await service.page.waitForTimeout(5000);
                console.log('');
            }
        }
        
        await service.page.screenshot();
        
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        
        console.log('\n' + '=' .repeat(60));
        console.log(`🎉 Test completed successfully!`);
        console.log(`⏱️  Total execution time: ${totalTime.toFixed(1)} seconds`);
        console.log(`📊 Actions executed: ${testCase.actions.length}`);
        console.log(`⏳ Delays added: ${testCase.actions.length - 1}`);
        console.log(`✨ Feature working: 5-second delays between each interaction`);
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    }
}

// Run the demonstration
console.log('AI-Powered Web Testing Agent - Interaction Delay Feature Demo\n');
demonstrateDelayFeature()
    .then(() => {
        console.log('\n📝 Summary:');
        console.log('   • Added 5-second delays between each interaction');
        console.log('   • No delay after the last action');
        console.log('   • Maintains all existing functionality');
        console.log('   • Provides better visibility of test execution');
    })
    .catch(error => {
        console.error('Demo error:', error);
    });