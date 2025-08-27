const PlaywrightTestService = require('../src/services/playwright');

async function testSelectElementType() {
    console.log('Testing select elementType functionality...');
    
    const testService = new PlaywrightTestService();
    
    // Test the buildAlternativeSelectors method directly for select
    const text = "Country";
    
    console.log('Test 1: Building selectors with elementType=select');
    const selectSelectors = testService.buildAlternativeSelectors(text, 'select');
    console.log('Select selectors:', selectSelectors.slice(0, 5)); // First 5 for readability
    
    console.log('\nTest 2: Building selectors without elementType (should include select in default)');
    const defaultSelectors = testService.buildAlternativeSelectors(text);
    console.log('Default selectors:', defaultSelectors.slice(0, 8)); // First 8 to see select elements
    
    // Verify prioritization
    console.log('\n✅ Verifying select prioritization:');
    
    // For select type, first selector should be select-related
    const firstSelectSelector = selectSelectors[0];
    if (firstSelectSelector.includes('select:has-text')) {
        console.log('✅ Select elementType correctly prioritizes select selectors');
    } else {
        console.log('❌ Select elementType prioritization failed');
        console.log('First selector was:', firstSelectSelector);
    }
    
    // Verify that select selectors are included in the result
    const hasSelectSelectors = selectSelectors.some(selector => 
        selector.includes('select') || selector.includes('option')
    );
    if (hasSelectSelectors) {
        console.log('✅ Select selectors are present in the result');
    } else {
        console.log('❌ No select selectors found in the result');
    }
    
    // Verify default behavior includes select selectors
    const defaultHasSelectSelectors = defaultSelectors.some(selector => 
        selector.includes('select') || selector.includes('option')
    );
    if (defaultHasSelectSelectors) {
        console.log('✅ Default behavior includes select selectors');
    } else {
        console.log('❌ Default behavior missing select selectors');
    }
    
    console.log('\n🎉 Select elementType tests completed!');
}

// Run test if this file is executed directly
if (require.main === module) {
    testSelectElementType().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = { testSelectElementType };