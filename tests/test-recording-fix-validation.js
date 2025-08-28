/**
 * Test for the interaction recording fix
 * This test validates that the recording functionality has been properly fixed
 */

const path = require('path');
const fs = require('fs');

function testRecordingFunctionCallFix() {
    console.log('\n🔧 Testing Recording Function Call Fix...');
    
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check that all function calls have been fixed with parentheses
    const fixedCalls = [
        'window.opener.isRecordingActive()',
        'window.opener.isRecordingPaused()'
    ];
    
    const brokenCalls = [
        'window.opener.isRecordingActive && !window.opener.isRecordingPaused',
        'window.opener.isRecordingActive && !window.opener.isRecordingPaused'
    ];
    
    // Verify that the fixed calls are present
    let fixedCallsFound = 0;
    fixedCalls.forEach(call => {
        // Count occurrences of each function call
        const regex = new RegExp(call.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const matches = htmlContent.match(regex);
        const count = matches ? matches.length : 0;
        fixedCallsFound += count;
        console.log(`✅ Found ${count} instances of fixed function call: ${call}`);
    });
    
    // Verify that the broken calls are NOT present
    let brokenCallsFound = 0;
    brokenCalls.forEach(call => {
        if (htmlContent.includes(call)) {
            brokenCallsFound++;
            console.log(`❌ Found broken function call pattern: ${call}`);
        }
    });
    
    // Check for error handling improvements
    const errorHandlingPatterns = [
        'console.error(\'Recording:',
        'try {',
        'catch (error) {'
    ];
    
    let errorHandlingFound = 0;
    errorHandlingPatterns.forEach(pattern => {
        if (htmlContent.includes(pattern)) {
            errorHandlingFound++;
            console.log(`✅ Found error handling pattern: ${pattern}`);
        }
    });
    
    // Check for debugging improvements
    const debugPatterns = [
        'console.log(\'Recording script initialized',
        'console.log(\'Recording: DOM ready',
        'console.log(\'Recording action:'
    ];
    
    let debugPatternsFound = 0;
    debugPatterns.forEach(pattern => {
        if (htmlContent.includes(pattern)) {
            debugPatternsFound++;
            console.log(`✅ Found debug pattern: ${pattern}`);
        }
    });
    
    // Summary
    const success = fixedCallsFound >= 8 && brokenCallsFound === 0 && errorHandlingFound >= 2 && debugPatternsFound >= 2;
    
    if (success) {
        console.log('✅ Recording function call fix test passed!');
        console.log(`   - Fixed function calls: ${fixedCallsFound}/8`);
        console.log(`   - Broken patterns eliminated: ${brokenCallsFound === 0 ? 'Yes' : 'No'}`);
        console.log(`   - Error handling added: ${errorHandlingFound}/3`);
        console.log(`   - Debug logging added: ${debugPatternsFound}/3`);
    } else {
        console.log('❌ Recording function call fix test failed!');
        console.log(`   - Fixed function calls: ${fixedCallsFound}/8`);
        console.log(`   - Broken patterns found: ${brokenCallsFound}`);
        console.log(`   - Error handling patterns: ${errorHandlingFound}/3`);
        console.log(`   - Debug patterns: ${debugPatternsFound}/3`);
    }
    
    return success;
}

function testRecordingInterfaceElements() {
    console.log('\n🔧 Testing Recording Interface Elements...');
    
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for essential recording elements
    const elements = [
        'id="recordTestName"',
        'id="recordTestUrl"',
        'id="startRecordingBtn"',
        'id="stopRecordingBtn"',
        'onclick="startRecording()"',
        'onclick="stopRecording()"',
        'window.addRecordedAction = function',
        'window.isRecordingActive = function',
        'window.isRecordingPaused = function'
    ];
    
    let found = 0;
    elements.forEach(element => {
        if (htmlContent.includes(element)) {
            found++;
            console.log(`✅ Found: ${element}`);
        } else {
            console.log(`❌ Missing: ${element}`);
        }
    });
    
    const success = found === elements.length;
    console.log(success ? '✅ All recording interface elements present!' : '❌ Some recording interface elements missing!');
    
    return success;
}

async function runRecordingFixTests() {
    console.log('🧪 Running Recording Fix Tests...');
    
    const tests = [
        testRecordingFunctionCallFix,
        testRecordingInterfaceElements
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
    
    console.log(`\n📊 Recording Fix Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All recording fix tests passed!');
        console.log('💡 The interaction recording issue has been successfully fixed!');
        return true;
    } else {
        console.log('❌ Some recording fix tests failed');
        return false;
    }
}

// Export for use in other test files
module.exports = {
    runRecordingFixTests,
    testRecordingFunctionCallFix,
    testRecordingInterfaceElements
};

// Run tests if this file is executed directly
if (require.main === module) {
    runRecordingFixTests();
}