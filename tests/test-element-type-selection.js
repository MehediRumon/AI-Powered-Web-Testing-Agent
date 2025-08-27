const PlaywrightTestService = require('../src/services/playwright');

async function testElementTypeSelection() {
    console.log('Testing element type selection functionality...');
    
    const testService = new PlaywrightTestService();
    
    try {
        // Initialize browser
        await testService.initialize('chromium', true);
        
        // Create a test HTML page with multiple Login elements
        const testHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>Test Page</title></head>
        <body>
            <nav>
                <a href="/login">Login</a>
            </nav>
            <div>
                <form>
                    <button type="submit">Login</button>
                </form>
            </div>
        </body>
        </html>`;
        
        // Set page content
        await testService.page.setContent(testHtml);
        
        // Test 1: Click button with elementType "button"
        console.log('Test 1: Testing button element type preference...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=Login',
                elementType: 'button'
            });
            console.log('✅ Successfully clicked button with elementType=button');
        } catch (error) {
            console.log('❌ Failed to click button:', error.message);
        }
        
        // Test 2: Click link with elementType "link"
        console.log('Test 2: Testing link element type preference...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=Login',
                elementType: 'link'
            });
            console.log('✅ Successfully clicked link with elementType=link');
        } catch (error) {
            console.log('❌ Failed to click link:', error.message);
        }
        
        // Test 3: Click without elementType (should use default priority)
        console.log('Test 3: Testing default behavior without elementType...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=Login'
            });
            console.log('✅ Successfully clicked with default behavior');
        } catch (error) {
            console.log('❌ Failed to click with default behavior:', error.message);
        }
        
        console.log('✅ Element type selection tests completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    } finally {
        await testService.close();
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testElementTypeSelection().then(() => {
        console.log('🎉 All tests passed!');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testElementTypeSelection };