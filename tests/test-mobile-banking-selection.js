const PlaywrightTestService = require('../src/services/playwright');
const path = require('path');

async function testMobileBankingSelection() {
    console.log('🎯 Testing Mobile Banking Type "Nagad" Selection');
    console.log('================================================\n');
    
    const testService = new PlaywrightTestService();
    
    try {
        // Initialize browser
        console.log('Initializing browser...');
        try {
            await testService.initialize('chromium', true); // Run headless
            console.log('✅ Browser initialized successfully\n');
        } catch (error) {
            console.log('⚠️  Browser initialization failed, analyzing selector logic only');
            console.log('Error:', error.message);
            
            // Test selector building logic without browser
            await testSelectorLogic();
            return;
        }
        
        // Load the test page
        const testPagePath = path.resolve(__dirname, 'test-page-mobile-banking.html');
        const testPageUrl = 'file://' + testPagePath;
        
        console.log('Loading test page:', testPageUrl);
        await testService.page.goto(testPageUrl, { waitUntil: 'networkidle' });
        console.log('✅ Test page loaded\n');
        
        // Wait for page to be ready
        await testService.page.waitForTimeout(1000);
        
        // Test Case 1: Direct select by ID with value
        console.log('Test 1: Select Nagad using direct select action with value...');
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#mobile-banking-type',
                value: 'nagad',
                description: 'Select Nagad from Mobile Banking Type dropdown'
            });
            
            // Check result
            await testService.page.waitForTimeout(1000);
            const result1 = await testService.page.textContent('#result');
            console.log('Result:', result1);
            
            if (result1.includes('Selected Mobile Banking Type: Nagad')) {
                console.log('✅ Test 1 PASSED: Direct select with value works\n');
            } else {
                console.log('❌ Test 1 FAILED: Direct select with value did not work\n');
            }
        } catch (error) {
            console.log('❌ Test 1 ERROR:', error.message, '\n');
        }
        
        // Wait and reset
        await testService.page.waitForTimeout(6000);
        
        // Test Case 2: Select by text value
        console.log('Test 2: Select Nagad using select action with text value...');
        try {
            await testService.executeAction({
                type: 'select',
                selector: 'select[name="mobile-banking-type"]',
                value: 'Nagad',
                description: 'Select Nagad by text value'
            });
            
            // Check result
            await testService.page.waitForTimeout(1000);
            const result2 = await testService.page.textContent('#result');
            console.log('Result:', result2);
            
            if (result2.includes('Selected Mobile Banking Type: Nagad')) {
                console.log('✅ Test 2 PASSED: Select with text value works\n');
            } else {
                console.log('❌ Test 2 FAILED: Select with text value did not work\n');
            }
        } catch (error) {
            console.log('❌ Test 2 ERROR:', error.message, '\n');
        }
        
        // Wait and reset
        await testService.page.waitForTimeout(6000);
        
        // Test Case 3: Click option with elementType="select"
        console.log('Test 3: Click Nagad option using elementType="select"...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=Nagad',
                elementType: 'select',
                description: 'Click Nagad option in Mobile Banking Type dropdown'
            });
            
            // Check result
            await testService.page.waitForTimeout(1000);
            const result3 = await testService.page.textContent('#result');
            console.log('Result:', result3);
            
            if (result3.includes('Selected Mobile Banking Type: Nagad')) {
                console.log('✅ Test 3 PASSED: Click with elementType select works\n');
            } else {
                console.log('❌ Test 3 FAILED: Click with elementType select did not work\n');
            }
        } catch (error) {
            console.log('❌ Test 3 ERROR:', error.message, '\n');
        }
        
        // Wait and reset
        await testService.page.waitForTimeout(6000);
        
        // Test Case 4: Click option without elementType (should fail or be inconsistent)
        console.log('Test 4: Click Nagad option without elementType (for comparison)...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=Nagad',
                description: 'Click Nagad option without specifying elementType'
            });
            
            // Check result
            await testService.page.waitForTimeout(1000);
            const result4 = await testService.page.textContent('#result');
            console.log('Result:', result4);
            
            if (result4.includes('Selected Mobile Banking Type: Nagad')) {
                console.log('✅ Test 4 RESULT: Click without elementType works (unexpected but good)\n');
            } else {
                console.log('❌ Test 4 RESULT: Click without elementType did not work (expected)\n');
            }
        } catch (error) {
            console.log('❌ Test 4 ERROR:', error.message, '\n');
        }
        
        console.log('🔍 ANALYSIS SUMMARY:');
        console.log('If any tests failed, we need to improve the select handling logic.');
        console.log('The most reliable approach should be Test 1 (direct select with value).');
        console.log('Test 3 (click with elementType) should also work for consistency.');
        
        // Keep browser open for manual inspection
        console.log('\n⏸️  Browser will stay open for 10 seconds for manual inspection...');
        await testService.page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('💥 Test execution failed:', error.message);
        throw error;
    } finally {
        await testService.close();
        console.log('\n🏁 Test completed');
    }
}

async function testSelectorLogic() {
    console.log('🔍 Testing selector building logic for "Nagad" selection...\n');
    
    const testService = new PlaywrightTestService();
    
    // Test how selectors are built for "Nagad" with different elementTypes
    const text = "Nagad";
    
    console.log('1. Default selectors (no elementType):');
    const defaultSelectors = testService.buildAlternativeSelectors(text);
    defaultSelectors.slice(0, 5).forEach((selector, index) => {
        console.log(`   ${index + 1}. ${selector}`);
    });
    
    console.log('\n2. Select elementType selectors:');
    const selectSelectors = testService.buildAlternativeSelectors(text, 'select');
    selectSelectors.slice(0, 8).forEach((selector, index) => {
        console.log(`   ${index + 1}. ${selector}`);
    });
    
    console.log('\n3. Button elementType selectors:');
    const buttonSelectors = testService.buildAlternativeSelectors(text, 'button');
    buttonSelectors.slice(0, 5).forEach((selector, index) => {
        console.log(`   ${index + 1}. ${selector}`);
    });
    
    console.log('\n📋 ANALYSIS:');
    console.log('- Select elementType should prioritize option and select related selectors');
    console.log('- Key selectors for dropdown options:');
    console.log('  • option:has-text("Nagad")');
    console.log('  • select >> option:has-text("Nagad")');
    console.log('  • option:text("Nagad")');
    console.log('  • select option:text("Nagad")');
    
    return true;
}

// Run test if this file is executed directly
if (require.main === module) {
    testMobileBankingSelection().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testMobileBankingSelection };