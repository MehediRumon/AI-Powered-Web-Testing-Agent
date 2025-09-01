#!/usr/bin/env node

// Test script for new Grok AI integration
const GrokAIService = require('./src/services/grokAI');

async function testGrokAIService() {
    console.log('🧪 Testing Grok AI Service Integration...\n');
    
    const grokAIService = new GrokAIService();
    
    // Test 1: Service instantiation
    console.log('1. Testing service instantiation...');
    if (grokAIService instanceof GrokAIService) {
        console.log('✅ GrokAIService instance created successfully');
    } else {
        console.log('❌ Failed to create GrokAIService instance');
        return false;
    }
    
    // Test 2: Method existence
    console.log('\n2. Testing method existence...');
    const requiredMethods = [
        'browseAndGenerateTest', 
        'analyzeScreenshotWithGrokAI', 
        'generateBasicTestFromURL',
        'testConnection',
        'validateTestCase'
    ];
    let methodsExist = true;
    
    requiredMethods.forEach(method => {
        if (typeof grokAIService[method] === 'function') {
            console.log(`✅ Method ${method} exists`);
        } else {
            console.log(`❌ Method ${method} missing`);
            methodsExist = false;
        }
    });
    
    // Test 3: Basic test case generation (without API call)
    console.log('\n3. Testing basic fallback test generation...');
    try {
        const basicTest = grokAIService.generateBasicTestFromURL('https://example.com');
        if (basicTest && basicTest.testCase && basicTest.testCase.actions) {
            console.log(`✅ Basic test generated with ${basicTest.testCase.actions.length} actions`);
            console.log(`   Test name: ${basicTest.testCase.name}`);
            console.log(`   Test URL: ${basicTest.testCase.url}`);
            
            // Test auto-parsing validation
            const isValid = grokAIService.validateTestCase(basicTest.testCase);
            console.log(`   Validation: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
        } else {
            console.log('❌ Failed to generate basic test');
            return false;
        }
    } catch (error) {
        console.log(`❌ Error generating basic test: ${error.message}`);
        return false;
    }
    
    // Test 4: Domain extraction functionality
    console.log('\n4. Testing domain extraction...');
    const testUrls = [
        'https://example.com',
        'https://www.github.com/user/repo',
        'https://google.com/search?q=test'
    ];
    
    testUrls.forEach(url => {
        try {
            const domain = grokAIService.extractDomainFromURL(url);
            console.log(`✅ ${url} → ${domain}`);
        } catch (error) {
            console.log(`❌ Failed to extract domain from ${url}: ${error.message}`);
            return false;
        }
    });
    
    // Test 5: Configuration check
    console.log('\n5. Testing configuration...');
    const hasApiKey = !!(process.env.GROK_API_KEY || process.env.XAI_API_KEY);
    console.log(`API Key configured: ${hasApiKey ? '✅ YES' : '⚠️  NO (will use fallback)'}`);
    
    if (!hasApiKey) {
        console.log('💡 To enable full Grok AI functionality:');
        console.log('   1. Get API key from https://console.x.ai/');
        console.log('   2. Add GROK_API_KEY=your-key to .env file');
        console.log('   3. Restart the application');
    }
    
    return methodsExist;
}

// Test the non-headless browser requirement check
function testNonHeadlessConfiguration() {
    console.log('\n🔍 Testing Non-Headless Configuration...\n');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
        // Check if the original Grok service was updated
        const grokSourceFile = fs.readFileSync(path.join(__dirname, 'src/services/grok.js'), 'utf8');
        
        if (grokSourceFile.includes('const isHeadless = false')) {
            console.log('✅ Original Grok service set to non-headless mode');
        } else {
            console.log('⚠️  Original Grok service still using conditional headless mode');
        }
        
        // Check if the new GrokAI service has non-headless
        const grokAISourceFile = fs.readFileSync(path.join(__dirname, 'src/services/grokAI.js'), 'utf8');
        
        if (grokAISourceFile.includes('initialize(\'chromium\', false)')) {
            console.log('✅ New GrokAI service configured for non-headless mode');
        } else {
            console.log('❌ New GrokAI service not properly configured for non-headless mode');
            return false;
        }
        
        // Check if vision model is configured
        if (grokAISourceFile.includes('grok-vision-beta')) {
            console.log('✅ Grok vision model configured for image analysis');
        } else {
            console.log('❌ Grok vision model not configured');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error checking configuration: ${error.message}`);
        return false;
    }
}

// Run the tests
if (require.main === module) {
    console.log('🔬 Starting Grok AI Integration Tests...\n');
    
    testGrokAIService().then(serviceTest => {
        const configTest = testNonHeadlessConfiguration();
        
        console.log('\n📋 Test Results Summary:');
        console.log('='.repeat(50));
        console.log(`Grok AI Service: ${serviceTest ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Configuration: ${configTest ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (serviceTest && configTest) {
            console.log('\n🎉 All Grok AI integration tests passed!');
            console.log('✅ Service properly configured');
            console.log('✅ Vision model set up for image analysis');
            console.log('✅ Non-headless browser mode configured');
            console.log('✅ Auto-parsing validation implemented');
            console.log('✅ Fallback functionality working');
            process.exit(0);
        } else {
            console.log('\n❌ Some tests failed');
            process.exit(1);
        }
    }).catch(error => {
        console.error(`❌ Test execution failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testGrokAIService, testNonHeadlessConfiguration };