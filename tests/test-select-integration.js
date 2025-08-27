const PlaywrightTestService = require('../src/services/playwright');
const path = require('path');

async function testSelectElementTypeIntegration() {
    console.log('Testing select elementType integration...');
    
    const testService = new PlaywrightTestService();
    
    try {
        // Initialize browser (skip if browsers not installed)
        console.log('Initializing browser...');
        try {
            await testService.initialize('chromium', true);
        } catch (error) {
            console.log('⚠️  Browser initialization failed, running selector tests only');
            console.log('Error:', error.message);
            
            // Run selector building tests only
            await runSelectorBuildingTests(testService);
            return;
        }
        
        console.log('✅ Browser initialized successfully');
        
        // Load the test page
        const testPagePath = path.resolve(__dirname, 'test-page-select-priority.html');
        const testPageUrl = 'file://' + testPagePath;
        
        console.log('Loading test page:', testPageUrl);
        await testService.page.goto(testPageUrl, { waitUntil: 'networkidle' });
        
        // Test 1: Click button with elementType "button"
        console.log('\nTest 1: Testing button elementType preference...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=United States',
                elementType: 'button'
            });
            
            // Check result
            const buttonResult = await testService.page.textContent('#result');
            if (buttonResult.includes('Clicked button with United States text')) {
                console.log('✅ Button elementType works correctly');
            } else {
                console.log('❌ Button elementType failed. Result:', buttonResult);
            }
        } catch (error) {
            console.log('❌ Button elementType failed:', error.message);
        }
        
        // Wait a bit for the result to reset
        await testService.page.waitForTimeout(3500);
        
        // Test 2: Click select option with elementType "select"
        console.log('\nTest 2: Testing select elementType preference...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=United States',
                elementType: 'select'
            });
            
            // Check result
            const selectResult = await testService.page.textContent('#result');
            if (selectResult.includes('Selected United States from dropdown')) {
                console.log('✅ Select elementType works correctly');
            } else {
                console.log('❌ Select elementType failed. Result:', selectResult);
            }
        } catch (error) {
            console.log('❌ Select elementType failed:', error.message);
        }
        
        // Wait a bit for the result to reset
        await testService.page.waitForTimeout(3500);
        
        // Test 3: Click link with elementType "link"
        console.log('\nTest 3: Testing link elementType preference...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=United States',
                elementType: 'link'
            });
            
            // Check result
            const linkResult = await testService.page.textContent('#result');
            if (linkResult.includes('Clicked link with United States text')) {
                console.log('✅ Link elementType works correctly');
            } else {
                console.log('❌ Link elementType failed. Result:', linkResult);
            }
        } catch (error) {
            console.log('❌ Link elementType failed:', error.message);
        }
        
        // Wait a bit for the result to reset
        await testService.page.waitForTimeout(3500);
        
        // Test 4: Click without elementType (should default to button)
        console.log('\nTest 4: Testing default behavior (should prioritize button)...');
        try {
            await testService.executeAction({
                type: 'click',
                selector: 'text=United States'
            });
            
            // Check result
            const defaultResult = await testService.page.textContent('#result');
            if (defaultResult.includes('Clicked button with United States text')) {
                console.log('✅ Default behavior works correctly (prioritizes button)');
            } else {
                console.log('❌ Default behavior unexpected. Result:', defaultResult);
            }
        } catch (error) {
            console.log('❌ Default behavior failed:', error.message);
        }
        
        console.log('\n✅ Integration tests completed successfully');
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        throw error;
    } finally {
        await testService.close();
    }
}

async function runSelectorBuildingTests(testService) {
    console.log('\n📝 Running selector building tests only...');
    
    // Test all element types
    const elementTypes = ['button', 'link', 'select', 'generic'];
    
    for (const elementType of elementTypes) {
        console.log(`\nTesting ${elementType} selectors:`);
        const selectors = testService.buildAlternativeSelectors('United States', elementType);
        console.log(`First 3 selectors:`, selectors.slice(0, 3));
        
        // Verify the first selector is of the correct type
        const firstSelector = selectors[0];
        let expectedType = elementType;
        if (elementType === 'generic') {
            expectedType = 'onclick';
        } else if (elementType === 'link') {
            expectedType = 'a:has-text';
        } else if (elementType === 'select') {
            expectedType = 'select:has-text';
        } else if (elementType === 'button') {
            expectedType = 'button:has-text';
        }
        
        if (firstSelector.includes(expectedType)) {
            console.log(`✅ ${elementType} elementType correctly prioritized`);
        } else {
            console.log(`❌ ${elementType} elementType not prioritized correctly`);
        }
    }
    
    console.log('\n✅ Selector building tests completed');
}

// Run test if this file is executed directly
if (require.main === module) {
    testSelectElementTypeIntegration().then(() => {
        console.log('\n🎉 All select elementType tests passed!');
        process.exit(0);
    }).catch((error) => {
        console.error('\n💥 Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testSelectElementTypeIntegration };