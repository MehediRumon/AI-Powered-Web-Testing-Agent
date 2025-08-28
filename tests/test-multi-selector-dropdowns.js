const PlaywrightTestService = require('../src/services/playwright');
const path = require('path');

async function testMultiSelectorDropdowns() {
    console.log('🎯 Testing Multi-Selector Dropdown Functionality');
    console.log('=============================================\n');
    
    const testService = new PlaywrightTestService();
    
    try {
        // Initialize browser
        console.log('Initializing browser...');
        await testService.initialize('chromium', false); // Use non-headless for visual verification
        console.log('✅ Browser initialized successfully\n');
        
        // Load the test page
        const testPagePath = path.resolve(__dirname, 'test-page-multi-dropdown.html');
        const testPageUrl = 'file://' + testPagePath;
        
        console.log('Loading test page:', testPageUrl);
        await testService.page.goto(testPageUrl, { waitUntil: 'networkidle' });
        console.log('✅ Test page loaded\n');
        
        // Wait for page to be ready
        await testService.page.waitForTimeout(1000);
        
        let testsPassed = 0;
        let totalTests = 0;
        
        // Test Case 1: Mobile Banking Type - Single selector
        console.log('Test 1: Mobile Banking Type - Single selector (#MobileBankingType)');
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
                console.log('✅ Test 1 PASSED\n');
                testsPassed++;
            } else {
                console.log('❌ Test 1 FAILED\n');
            }
        } catch (error) {
            console.log('❌ Test 1 ERROR:', error.message, '\n');
        }
        
        // Test Case 2: Teacher Grade - Multi-selector (primary selector should work)
        console.log('Test 2: Teacher Grade - Multi-selector with primary selector');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#teachergrade, #teachergradeType, select[name=teachergrade], select[name=teachergradeType]',
                value: 'Level-01',
                description: 'Select Level-01 from Teacher Grade dropdown'
            });
            
            await testService.page.waitForTimeout(1000);
            const result2 = await testService.page.textContent('#teacher-grade-result');
            console.log('Result:', result2);
            
            if (result2.includes('Selected Level-01')) {
                console.log('✅ Test 2 PASSED\n');
                testsPassed++;
            } else {
                console.log('❌ Test 2 FAILED\n');
            }
        } catch (error) {
            console.log('❌ Test 2 ERROR:', error.message, '\n');
        }
        
        // Test Case 3: Teacher Grade - Multi-selector fallback (remove primary, test fallback)
        console.log('Test 3: Teacher Grade - Multi-selector fallback to secondary selector');
        totalTests++;
        try {
            // Hide the primary selector to test fallback
            await testService.page.evaluate(() => {
                const primarySelect = document.getElementById('teachergrade');
                if (primarySelect) primarySelect.style.display = 'none';
            });
            
            await testService.executeAction({
                type: 'select',
                selector: '#nonexistent, #teachergradeType, select[name=teachergradeType]',
                value: 'Level-01',
                description: 'Select Level-01 using fallback selector'
            });
            
            await testService.page.waitForTimeout(1000);
            const result3 = await testService.page.textContent('#teacher-grade-alt-result');
            console.log('Result:', result3);
            
            if (result3.includes('Selected Level-01')) {
                console.log('✅ Test 3 PASSED (fallback works)\n');
                testsPassed++;
            } else {
                console.log('❌ Test 3 FAILED\n');
            }
            
            // Restore the hidden element
            await testService.page.evaluate(() => {
                const primarySelect = document.getElementById('teachergrade');
                if (primarySelect) primarySelect.style.display = 'block';
            });
            
        } catch (error) {
            console.log('❌ Test 3 ERROR:', error.message, '\n');
        }
        
        // Test Case 4: Religion - Multi-selector
        console.log('Test 4: Religion - Multi-selector');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#religion, #religionType, select[name=religion], select[name=religionType]',
                value: 'Islam',
                description: 'Select Islam from Religion dropdown'
            });
            
            await testService.page.waitForTimeout(1000);
            const result4 = await testService.page.textContent('#religion-result');
            console.log('Result:', result4);
            
            if (result4.includes('Selected Islam')) {
                console.log('✅ Test 4 PASSED\n');
                testsPassed++;
            } else {
                console.log('❌ Test 4 FAILED\n');
            }
        } catch (error) {
            console.log('❌ Test 4 ERROR:', error.message, '\n');
        }
        
        // Test Case 5: Invalid selector list - should fail gracefully
        console.log('Test 5: Invalid selector list - error handling');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#nonexistent1, #nonexistent2, #nonexistent3',
                value: 'SomeValue',
                description: 'Try to select from non-existent dropdown'
            });
            
            console.log('❌ Test 5 FAILED (should have thrown error)\n');
        } catch (error) {
            if (error.message.includes('Failed to select option') && error.message.includes('using any of the provided selectors')) {
                console.log('✅ Test 5 PASSED (error handling works)\n');
                testsPassed++;
            } else {
                console.log('❌ Test 5 FAILED (unexpected error):', error.message, '\n');
            }
        }
        
        // Test Case 6: Value vs text selection fallback
        console.log('Test 6: Value vs text selection fallback');
        totalTests++;
        try {
            await testService.executeAction({
                type: 'select',
                selector: '#MobileBankingType',
                value: 'bKash', // Use text instead of value
                description: 'Select bKash using text instead of value'
            });
            
            await testService.page.waitForTimeout(1000);
            const result6 = await testService.page.textContent('#mobile-banking-result');
            console.log('Result:', result6);
            
            if (result6.includes('Selected bKash')) {
                console.log('✅ Test 6 PASSED (text fallback works)\n');
                testsPassed++;
            } else {
                console.log('❌ Test 6 FAILED\n');
            }
        } catch (error) {
            console.log('❌ Test 6 ERROR:', error.message, '\n');
        }
        
        // Summary
        console.log('📊 TEST SUMMARY');
        console.log('===============');
        console.log(`Tests Passed: ${testsPassed}/${totalTests}`);
        console.log(`Success Rate: ${Math.round((testsPassed/totalTests)*100)}%`);
        
        if (testsPassed === totalTests) {
            console.log('🎉 ALL TESTS PASSED! Multi-selector functionality is working correctly.');
        } else {
            console.log('❌ Some tests failed. Please review the implementation.');
        }
        
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

// Test the specific problem statement cases
async function testProblemStatementCases() {
    console.log('\n🎯 Testing Specific Problem Statement Cases');
    console.log('==========================================\n');
    
    const testService = new PlaywrightTestService();
    
    try {
        await testService.initialize('chromium', true); // headless for automated testing
        
        const testPagePath = path.resolve(__dirname, 'test-page-multi-dropdown.html');
        const testPageUrl = 'file://' + testPagePath;
        await testService.page.goto(testPageUrl, { waitUntil: 'networkidle' });
        
        const testCases = [
            {
                name: 'Mobile Banking Type - Nagad',
                action: {
                    type: 'select',
                    selector: '#MobileBankingType',
                    value: 'Nagad',
                    description: 'Select \'Nagad\' from the Mobile Banking Type dropdown'
                }
            },
            {
                name: 'Teacher Grade - Level-01',
                action: {
                    type: 'select',
                    selector: '#teachergrade',
                    value: 'Level-01',
                    description: 'Select \'Level-01\' from the Teacher Grade dropdown'
                }
            },
            {
                name: 'Religion - Islam',
                action: {
                    type: 'select',
                    selector: '#religion',
                    value: 'Islam',
                    description: 'Select \'Islam\' from the Religion dropdown'
                }
            }
        ];
        
        for (const testCase of testCases) {
            console.log(`Testing: ${testCase.name}`);
            try {
                await testService.executeAction(testCase.action);
                console.log(`✅ ${testCase.name} - SUCCESS`);
            } catch (error) {
                console.log(`❌ ${testCase.name} - FAILED:`, error.message);
            }
            await testService.page.waitForTimeout(1000);
        }
        
    } catch (error) {
        console.error('Problem statement test failed:', error);
    } finally {
        await testService.close();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testMultiSelectorDropdowns()
        .then(() => testProblemStatementCases())
        .then(() => {
            console.log('\n🎉 All multi-selector tests completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testMultiSelectorDropdowns, testProblemStatementCases };