const PlaywrightTestService = require('./src/services/playwright.js');

async function testExactServiceBehavior() {
    console.log('🔍 Testing exact PlaywrightTestService behavior');
    
    const testService = new PlaywrightTestService();
    
    try {
        await testService.initialize('chromium', false); // non-headless for debugging
        
        // Navigate to the test page
        await testService.page.goto('http://localhost:8081/test-page-multi-dropdown.html');
        
        console.log('\n1. Testing Teacher Grade with multi-selector...');
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#teachergrade, #teachergradeType, select[name=teachergrade], select[name=teachergradeType]',
                value: 'Level-01',
                description: 'Test Teacher Grade multi-selector'
            });
            console.log('✅ Teacher Grade selection succeeded');
        } catch (error) {
            console.log('❌ Teacher Grade selection failed:', error.message);
        }
        
        console.log('\n2. Testing Religion with multi-selector...');
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#religion, #religionType, select[name=religion], select[name=religionType]',
                value: 'Islam',
                description: 'Test Religion multi-selector'
            });
            console.log('✅ Religion selection succeeded');
        } catch (error) {
            console.log('❌ Religion selection failed:', error.message);
        }
        
        console.log('\n3. Testing Mobile Banking (should work)...');
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#MobileBankingType',
                value: 'Nagad',
                description: 'Test Mobile Banking'
            });
            console.log('✅ Mobile Banking selection succeeded');
        } catch (error) {
            console.log('❌ Mobile Banking selection failed:', error.message);
        }
        
        // Wait to see results
        await testService.page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('Test setup failed:', error);
    } finally {
        await testService.close();
        console.log('\n🏁 Test completed');
    }
}

testExactServiceBehavior().catch(console.error);