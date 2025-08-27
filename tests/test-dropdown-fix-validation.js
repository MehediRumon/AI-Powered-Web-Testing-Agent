const PlaywrightTestService = require('../src/services/playwright');
const path = require('path');

async function testDropdownSelectionFix() {
    console.log('🔧 Dropdown Selection Fix - Integration Test');
    console.log('============================================\n');
    
    console.log('This test validates the dropdown selection fix that resolves:');
    console.log('"Problem in dropdown selection its can\'t select"\n');
    
    const testService = new PlaywrightTestService();
    
    try {
        // Initialize browser
        console.log('Initializing browser...');
        await testService.initialize('chromium', false); // Non-headless for visual verification
        console.log('✅ Browser initialized successfully\n');
        
        // Load the existing test page
        const testPagePath = path.resolve(__dirname, 'test-page-multi-dropdown.html');
        const testPageUrl = 'file://' + testPagePath;
        
        console.log('Loading test page:', testPageUrl);
        await testService.page.goto(testPageUrl, { waitUntil: 'networkidle' });
        console.log('✅ Test page loaded\n');
        
        // Wait for page to be ready
        await testService.page.waitForTimeout(2000);
        
        let testsPassed = 0;
        let totalTests = 0;
        
        // Test Case 1: The original problem - Select "Nagad" by text
        console.log('🎯 Test 1: Original Problem - Select "Nagad" by text (core issue)');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#MobileBankingType',
                value: 'Nagad',
                description: 'Select Nagad from Mobile Banking Type dropdown'
            });
            
            await testService.page.waitForTimeout(1000);
            const result1 = await testService.page.textContent('#mobile-banking-result');
            console.log('Result:', result1);
            
            if (result1.includes('Selected Nagad')) {
                console.log('✅ Test 1 PASSED - Core issue resolved!\n');
                testsPassed++;
            } else {
                console.log('❌ Test 1 FAILED - Core issue not resolved\n');
            }
        } catch (error) {
            console.log('❌ Test 1 ERROR:', error.message, '\n');
        }
        
        // Test Case 2: Select by value (should still work - backward compatibility)
        console.log('🔄 Test 2: Backward Compatibility - Select by value "10"');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#MobileBankingType',
                value: '10',
                description: 'Select bKash by value for backward compatibility'
            });
            
            await testService.page.waitForTimeout(1000);
            const result2 = await testService.page.textContent('#mobile-banking-result');
            console.log('Result:', result2);
            
            if (result2.includes('Selected bKash')) {
                console.log('✅ Test 2 PASSED - Backward compatibility maintained\n');
                testsPassed++;
            } else {
                console.log('❌ Test 2 FAILED - Backward compatibility broken\n');
            }
        } catch (error) {
            console.log('❌ Test 2 ERROR:', error.message, '\n');
        }
        
        // Test Case 3: Case insensitive selection (new enhancement)
        console.log('🆕 Test 3: Case Insensitive - Select "ROCKET" (uppercase)');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#MobileBankingType',
                value: 'ROCKET',
                description: 'Select Rocket with uppercase input'
            });
            
            await testService.page.waitForTimeout(1000);
            const result3 = await testService.page.textContent('#mobile-banking-result');
            console.log('Result:', result3);
            
            if (result3.includes('Selected Rocket')) {
                console.log('✅ Test 3 PASSED - Case insensitive matching works\n');
                testsPassed++;
            } else {
                console.log('❌ Test 3 FAILED - Case insensitive matching failed\n');
            }
        } catch (error) {
            console.log('❌ Test 3 ERROR:', error.message, '\n');
        }
        
        // Test Case 4: Multi-selector fallback (existing feature)
        console.log('🔄 Test 4: Multi-selector Fallback - Teacher Grade');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#teachergrade, #teachergradeType, select[name=teachergrade], select[name=teachergradeType]',
                value: 'Level-01',
                description: 'Select Level-01 using multi-selector'
            });
            
            await testService.page.waitForTimeout(1000);
            const result4 = await testService.page.textContent('#teacher-grade-result');
            console.log('Result:', result4);
            
            if (result4.includes('Selected Level-01')) {
                console.log('✅ Test 4 PASSED - Multi-selector fallback works\n');
                testsPassed++;
            } else {
                console.log('❌ Test 4 FAILED - Multi-selector fallback failed\n');
            }
        } catch (error) {
            console.log('❌ Test 4 ERROR:', error.message, '\n');
        }
        
        // Test Case 5: Error handling - Invalid option
        console.log('🚨 Test 5: Error Handling - Invalid option selection');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#MobileBankingType',
                value: 'NonExistentOption',
                description: 'Try to select non-existent option'
            });
            
            console.log('❌ Test 5 FAILED - Should have thrown error for invalid option\n');
        } catch (error) {
            if (error.message.includes('Failed to select option') && error.message.includes('Available options:')) {
                console.log('✅ Test 5 PASSED - Proper error handling with available options\n');
                testsPassed++;
            } else {
                console.log('❌ Test 5 FAILED - Error handling insufficient:', error.message, '\n');
            }
        }
        
        // Summary
        console.log('📊 FIX VALIDATION SUMMARY');
        console.log('=========================');
        console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
        console.log(`Success Rate: ${Math.round((testsPassed/totalTests)*100)}%`);
        
        if (testsPassed === totalTests) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('✅ The dropdown selection fix is working correctly.');
            console.log('✅ Original problem "Problem in dropdown selection its can\'t select" is RESOLVED.');
            console.log('✅ Backward compatibility is maintained.');
            console.log('✅ Enhanced features are working properly.');
        } else {
            console.log('\n❌ Some tests failed. The fix may need additional work.');
        }
        
        // Keep browser open for manual inspection
        console.log('\n👀 Browser will remain open for 10 seconds for manual inspection...');
        await testService.page.waitForTimeout(10000);
        
    } catch (error) {
        console.log('💥 Test execution failed:', error.message);
    } finally {
        if (testService) {
            await testService.close();
        }
    }
}

// Run the test
testDropdownSelectionFix().catch(console.error);