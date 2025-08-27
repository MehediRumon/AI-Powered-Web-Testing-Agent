const PlaywrightTestService = require('../src/services/playwright');

async function testSelectorBuilding() {
    console.log('Testing selector building logic...');
    
    const testService = new PlaywrightTestService();
    
    // Test the buildAlternativeSelectors method directly
    const text = "Login";
    
    console.log('Test 1: Building selectors with elementType=button');
    const buttonSelectors = testService.buildAlternativeSelectors(text, 'button');
    console.log('Button selectors:', buttonSelectors.slice(0, 5)); // First 5 for readability
    
    console.log('\nTest 2: Building selectors with elementType=link');
    const linkSelectors = testService.buildAlternativeSelectors(text, 'link');
    console.log('Link selectors:', linkSelectors.slice(0, 5)); // First 5 for readability
    
    console.log('\nTest 3: Building selectors without elementType');
    const defaultSelectors = testService.buildAlternativeSelectors(text);
    console.log('Default selectors:', defaultSelectors.slice(0, 5)); // First 5 for readability
    
    // Verify prioritization
    console.log('\n✅ Verifying prioritization:');
    
    // For button type, first selector should be button-related
    const firstButtonSelector = buttonSelectors[0];
    if (firstButtonSelector.includes('button:has-text')) {
        console.log('✅ Button elementType correctly prioritizes button selectors');
    } else {
        console.log('❌ Button elementType prioritization failed');
    }
    
    // For link type, first selector should be link-related
    const firstLinkSelector = linkSelectors[0];
    if (firstLinkSelector.includes('a:has-text')) {
        console.log('✅ Link elementType correctly prioritizes link selectors');
    } else {
        console.log('❌ Link elementType prioritization failed');
    }
    
    // Default should start with button (our default priority)
    const firstDefaultSelector = defaultSelectors[0];
    if (firstDefaultSelector.includes('button:has-text')) {
        console.log('✅ Default behavior correctly prioritizes button selectors');
    } else {
        console.log('❌ Default behavior prioritization unexpected');
    }
    
    console.log('\n🎉 Selector building tests completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
    testSelectorBuilding().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testSelectorBuilding };