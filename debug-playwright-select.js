const { chromium } = require('playwright');

async function testPlaywrightSelect() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to our test page
    await page.goto('http://localhost:8080/test-select-issue.html');
    
    console.log('Testing Teacher Grade selection...');
    
    try {
        // Test 1: Try by value (should fail)
        await page.selectOption('#teachergrade', 'Level-01');
        console.log('✅ Selected by value: Level-01');
    } catch (error) {
        console.log('❌ Failed by value:', error.message);
        
        try {
            // Test 2: Try by label (should succeed)
            await page.selectOption('#teachergrade', { label: 'Level-01' });
            console.log('✅ Selected by label: Level-01');
        } catch (labelError) {
            console.log('❌ Failed by label:', labelError.message);
            
            try {
                // Test 3: Try case-insensitive value
                await page.selectOption('#teachergrade', 'level-01');
                console.log('✅ Selected by lowercase value: level-01');
            } catch (lowerError) {
                console.log('❌ Failed by lowercase value:', lowerError.message);
            }
        }
    }
    
    console.log('\nTesting Religion selection...');
    
    try {
        // Test 1: Try by value (should fail)
        await page.selectOption('#religion', 'Islam');
        console.log('✅ Selected by value: Islam');
    } catch (error) {
        console.log('❌ Failed by value:', error.message);
        
        try {
            // Test 2: Try by label (should succeed)
            await page.selectOption('#religion', { label: 'Islam' });
            console.log('✅ Selected by label: Islam');
        } catch (labelError) {
            console.log('❌ Failed by label:', labelError.message);
            
            try {
                // Test 3: Try case-insensitive value
                await page.selectOption('#religion', 'islam');
                console.log('✅ Selected by lowercase value: islam');
            } catch (lowerError) {
                console.log('❌ Failed by lowercase value:', lowerError.message);
            }
        }
    }
    
    // Let the browser stay open for a moment
    await page.waitForTimeout(3000);
    
    await browser.close();
}

testPlaywrightSelect().catch(console.error);