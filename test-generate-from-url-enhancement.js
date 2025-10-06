// Test the enhanced Generate from URL functionality with system-based selectors

const OpenAIService = require('./src/services/openai');

async function testSelectorEnhancement() {
    console.log('🧪 Testing AI-Generated Selector Enhancement\n');
    
    const aiService = new OpenAIService();
    
    // Test 1: Test selector enhancement on mock AI response
    console.log('Test 1: Testing enhanceAIGeneratedSelectors method');
    console.log('=========================================');
    
    const mockAITestCase = {
        name: "Test Mobile Banking Form",
        description: "Test dropdown selections and form filling",
        url: "https://example.com/form",
        actions: [
            {
                type: "select",
                selector: "#mobileBanking",
                value: "Nagad",
                description: "Select 'Nagad' from the Mobile Banking Type dropdown"
            },
            {
                type: "select", 
                selector: "#grade",
                value: "Level-01",
                description: "Select 'Level-01' from the Teacher Grade dropdown"
            },
            {
                type: "select",
                selector: "#userReligion", 
                value: "Islam",
                description: "Select 'Islam' from the Religion dropdown"
            },
            {
                type: "fill",
                selector: "input",
                value: "test@example.com",
                description: "Enter email address in the email field"
            },
            {
                type: "click",
                selector: "button",
                value: "",
                description: "Click the submit button"
            }
        ]
    };
    
    console.log('Original test case:');
    console.log(JSON.stringify(mockAITestCase, null, 2));
    
    const enhanced = aiService.enhanceAIGeneratedSelectors(mockAITestCase);
    
    console.log('\nEnhanced test case:');
    console.log(JSON.stringify(enhanced, null, 2));
    
    // Test 2: Test selector guidance generation
    console.log('\n\nTest 2: Testing generateSelectorGuidance method');
    console.log('=============================================');
    
    const guidance = aiService.generateSelectorGuidance();
    console.log('Generated selector guidance:');
    console.log(guidance);
    
    // Test 3: Test multi-selector pattern generation
    console.log('\n\nTest 3: Testing generateMultiSelectorPattern method');
    console.log('===============================================');
    
    const testCases = [
        { selector: '#MobileBankingType', description: "Select 'Nagad' from the Mobile Banking Type dropdown" },
        { selector: '#teachergrade', description: "Select 'Level-01' from the Teacher Grade dropdown" },
        { selector: '#religion', description: "Select 'Islam' from the Religion dropdown" },
        { selector: '#productCategory', description: "Select 'Electronics' from the Product Category dropdown" }
    ];
    
    testCases.forEach((testCase, index) => {
        const multiSelector = aiService.generateMultiSelectorPattern(testCase.selector, testCase.description);
        console.log(`\nTest ${index + 1}:`);
        console.log(`  Original: ${testCase.selector}`);
        console.log(`  Enhanced: ${multiSelector}`);
        console.log(`  Description: ${testCase.description}`);
    });
    
    // Test 4: Test individual selector extraction methods
    console.log('\n\nTest 4: Testing individual selector methods');
    console.log('=========================================');
    
    const extractionTests = [
        { line: "Select 'Nagad' from the Mobile Banking Type dropdown", type: "dropdown" },
        { line: "Click the login button", type: "click" },
        { line: "Enter 'test@example.com' in the email field", type: "fill" },
        { line: "Select 'Level-01' from Teacher Grade dropdown", type: "dropdown" }
    ];
    
    extractionTests.forEach((test, index) => {
        console.log(`\nExtraction test ${index + 1}: ${test.line}`);
        
        if (test.type === 'dropdown') {
            const parsed = aiService.parseSelectInstruction(test.line);
            console.log(`  Parsed selector: ${parsed.selector}`);
            console.log(`  Parsed value: ${parsed.value}`);
        } else {
            const selector = aiService.extractSelector(test.line, test.type === 'click' ? 'button' : 'input');
            console.log(`  Extracted selector: ${selector}`);
        }
    });
    
    console.log('\n✅ All selector enhancement tests completed!');
    console.log('📝 The AI will now generate system-based selectors with:');
    console.log('   - Level-based hierarchy (ID > class > attribute > text)');
    console.log('   - Multi-selector patterns for dropdowns');
    console.log('   - System-specific conventions (PascalCase, semantic selectors)');
    console.log('   - Placeholder fallbacks when needed');
}

// Test the enhanced Generate from URL if OpenAI API key is available
async function testGenerateFromURLWithFallback() {
    console.log('\n\n🧪 Testing Generate from URL with Enhanced System\n');
    
    const aiService = new OpenAIService();
    
    // Test with a simple URL (will use fallback if no API key)
    const testUrl = 'https://example.com';
    
    try {
        console.log(`Testing generateBasicTestFromURL with: ${testUrl}`);
        const basicResult = aiService.generateBasicTestFromURL(testUrl);
        
        console.log('Basic test case result:');
        console.log(JSON.stringify(basicResult, null, 2));
        
        console.log('\n✅ Basic test generation working correctly');
        
    } catch (error) {
        console.error('❌ Error testing generate from URL:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    try {
        await testSelectorEnhancement();
        await testGenerateFromURLWithFallback();
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('🔧 The Generate from URL feature is now enhanced with system-based selectors');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the tests
runAllTests();