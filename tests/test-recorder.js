/**
 * Test cases for the new Interaction Recorder functionality
 */

const path = require('path');
const fs = require('fs');

// Simple test to verify the recorder HTML elements are present
function testRecorderUIElements() {
    console.log('\n📝 Testing Interaction Recorder UI Elements...');
    
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Test for Record tab
    if (htmlContent.includes('onclick="switchTestTab(\'record\')"')) {
        console.log('✅ Record tab found in HTML');
    } else {
        console.log('❌ Record tab not found in HTML');
        return false;
    }
    
    // Test for recorder form fields
    if (htmlContent.includes('id="recordTestName"')) {
        console.log('✅ Record test name field found');
    } else {
        console.log('❌ Record test name field not found');
        return false;
    }
    
    if (htmlContent.includes('id="recordTestUrl"')) {
        console.log('✅ Record test URL field found');
    } else {
        console.log('❌ Record test URL field not found');
        return false;
    }
    
    // Test for recorder control buttons
    if (htmlContent.includes('onclick="startRecording()"')) {
        console.log('✅ Start recording button found');
    } else {
        console.log('❌ Start recording button not found');
        return false;
    }
    
    if (htmlContent.includes('onclick="stopRecording()"')) {
        console.log('✅ Stop recording button found');
    } else {
        console.log('❌ Stop recording button not found');
        return false;
    }
    
    // Test for recorder JavaScript functions
    if (htmlContent.includes('function startRecording()')) {
        console.log('✅ startRecording function found');
    } else {
        console.log('❌ startRecording function not found');
        return false;
    }
    
    if (htmlContent.includes('function stopRecording()')) {
        console.log('✅ stopRecording function found');
    } else {
        console.log('❌ stopRecording function not found');
        return false;
    }
    
    if (htmlContent.includes('function saveRecordedTest()')) {
        console.log('✅ saveRecordedTest function found');
    } else {
        console.log('❌ saveRecordedTest function not found');
        return false;
    }
    
    // Test for CSS styles
    if (htmlContent.includes('.recorder-section')) {
        console.log('✅ Recorder CSS styles found');
    } else {
        console.log('❌ Recorder CSS styles not found');
        return false;
    }
    
    console.log('✅ All Interaction Recorder UI elements are present');
    return true;
}

// Test to verify the recorder integrates with existing test case format
function testRecorderTestCaseFormat() {
    console.log('\n📝 Testing Recorder Test Case Format Compatibility...');
    
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check if the recorder uses the existing test case structure
    if (htmlContent.includes('createTestCase(testCase)')) {
        console.log('✅ Recorder integrates with existing createTestCase function');
    } else {
        console.log('❌ Recorder does not integrate with existing createTestCase function');
        return false;
    }
    
    // Check if it generates actions in the correct format
    if (htmlContent.includes('type: action.type') && 
        htmlContent.includes('locator: action.locator') && 
        htmlContent.includes('value: action.value')) {
        console.log('✅ Recorder generates actions in correct format');
    } else {
        console.log('❌ Recorder does not generate actions in correct format');
        return false;
    }
    
    console.log('✅ Recorder test case format is compatible with existing system');
    return true;
}

// Test to verify the recorder has proper error handling
function testRecorderErrorHandling() {
    console.log('\n📝 Testing Recorder Error Handling...');
    
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for validation of required fields
    if (htmlContent.includes('if (!testName || !testUrl)') || 
        htmlContent.includes('Please enter both test name and URL')) {
        console.log('✅ Input validation found');
    } else {
        console.log('❌ Input validation not found');
        return false;
    }
    
    // Check for URL validation
    if (htmlContent.includes('new URL(testUrl)') || 
        htmlContent.includes('Please enter a valid URL')) {
        console.log('✅ URL validation found');
    } else {
        console.log('❌ URL validation not found');
        return false;
    }
    
    // Check for popup blocker handling
    if (htmlContent.includes('Please allow popups') || 
        htmlContent.includes('Failed to open recording window')) {
        console.log('✅ Popup blocker handling found');
    } else {
        console.log('❌ Popup blocker handling not found');
        return false;
    }
    
    console.log('✅ Recorder has proper error handling');
    return true;
}

// Run all tests
async function runRecorderTests() {
    console.log('🧪 Running Interaction Recorder Tests...');
    
    const tests = [
        testRecorderUIElements,
        testRecorderTestCaseFormat,
        testRecorderErrorHandling
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            if (test()) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Test failed with error: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All Interaction Recorder tests passed!');
        return true;
    } else {
        console.log('❌ Some Interaction Recorder tests failed');
        return false;
    }
}

// Export for use in other test files
module.exports = {
    runRecorderTests,
    testRecorderUIElements,
    testRecorderTestCaseFormat,
    testRecorderErrorHandling
};

// Run tests if this file is executed directly
if (require.main === module) {
    runRecorderTests();
}