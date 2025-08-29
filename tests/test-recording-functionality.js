const fs = require('fs');
const path = require('path');

// Test to verify recording functionality and identify issues
function testRecordingFunctionality() {
    console.log('\n🎬 Testing Recording Functionality...');
    
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Test 1: Check if recording script injection exists
    if (htmlContent.includes('setupRecordingInWindow')) {
        console.log('✅ Recording script injection function found');
    } else {
        console.log('❌ Recording script injection function not found');
        return false;
    }
    
    // Test 2: Check if event listeners are properly set up
    const eventListeners = [
        'addEventListener(\'click\'',
        'addEventListener(\'input\'',
        'addEventListener(\'submit\''
    ];
    
    let eventListenersFound = 0;
    eventListeners.forEach(listener => {
        if (htmlContent.includes(listener)) {
            eventListenersFound++;
        }
    });
    
    if (eventListenersFound === eventListeners.length) {
        console.log('✅ All required event listeners found');
    } else {
        console.log(`❌ Missing event listeners. Found ${eventListenersFound}/${eventListeners.length}`);
        return false;
    }
    
    // Test 3: Check for window.opener communication
    if (htmlContent.includes('window.opener') && htmlContent.includes('addRecordedAction')) {
        console.log('✅ Window.opener communication setup found');
    } else {
        console.log('❌ Window.opener communication setup not found');
        return false;
    }
    
    // Test 4: Check for live view/preview functionality
    if (htmlContent.includes('updateActionsDisplay')) {
        console.log('✅ Actions display update function found');
    } else {
        console.log('❌ Actions display update function not found');
        return false;
    }
    
    // Test 5: Check for error handling
    const errorHandlingPatterns = [
        'try {',
        'catch (error)',
        'console.error'
    ];
    
    let errorHandlingFound = 0;
    errorHandlingPatterns.forEach(pattern => {
        if (htmlContent.includes(pattern)) {
            errorHandlingFound++;
        }
    });
    
    if (errorHandlingFound >= 2) {
        console.log('✅ Error handling patterns found');
    } else {
        console.log('❌ Insufficient error handling');
        return false;
    }
    
    // Test 6: Check for timing issues (load event handling)
    if (htmlContent.includes('addEventListener(\'load\'') && htmlContent.includes('DOMContentLoaded')) {
        console.log('✅ Load event handling found');
    } else {
        console.log('❌ Proper load event handling not found');
    }
    
    console.log('✅ Recording functionality basic structure test completed');
    return true;
}

// Test to identify missing live view features
function testLiveViewFeatures() {
    console.log('\n📺 Testing Live View Features...');
    
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for real-time action preview
    if (htmlContent.includes('actionsList') && htmlContent.includes('action-item')) {
        console.log('✅ Actions list structure found');
    } else {
        console.log('❌ Actions list structure not found');
        return false;
    }
    
    // Check for visual indicators
    if (htmlContent.includes('Recording in Progress') || htmlContent.includes('recording-status')) {
        console.log('✅ Recording status indicators found');
    } else {
        console.log('❌ Recording status indicators not found');
        return false;
    }
    
    // Check for live updates
    if (htmlContent.includes('updateActionsDisplay()')) {
        console.log('✅ Live update mechanism found');
    } else {
        console.log('❌ Live update mechanism not found');
        return false;
    }
    
    console.log('🔍 Live view features test completed');
    return true;
}

// Run tests if this file is executed directly
if (require.main === module) {
    console.log('🚀 Starting Recording Functionality Tests...');
    
    const test1 = testRecordingFunctionality();
    const test2 = testLiveViewFeatures();
    
    if (test1 && test2) {
        console.log('\n🎉 All basic recording tests passed!');
        console.log('📋 Issues to address:');
        console.log('   1. Improve script injection timing');
        console.log('   2. Add better cross-origin error handling');
        console.log('   3. Enhance live view with real-time preview');
        console.log('   4. Add more visual feedback');
        process.exit(0);
    } else {
        console.log('\n💥 Some recording tests failed!');
        process.exit(1);
    }
}

module.exports = { testRecordingFunctionality, testLiveViewFeatures };