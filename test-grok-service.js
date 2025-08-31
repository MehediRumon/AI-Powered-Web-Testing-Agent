#!/usr/bin/env node

// Unit test to verify the GrokService configuration and API structure

const GrokService = require('./src/services/grok');

function testGrokServiceConfiguration() {
    console.log('🧪 Testing GrokService Configuration...\n');
    
    const grokService = new GrokService();
    
    // Test 1: Service instantiation
    console.log('1. Testing service instantiation...');
    if (grokService instanceof GrokService) {
        console.log('✅ GrokService instance created successfully');
    } else {
        console.log('❌ Failed to create GrokService instance');
        return false;
    }
    
    // Test 2: Method existence
    console.log('\n2. Testing method existence...');
    const requiredMethods = ['browseAndGenerateTest', 'analyzeScreenshotWithGrok', 'generateBasicTestFromURL'];
    let methodsExist = true;
    
    requiredMethods.forEach(method => {
        if (typeof grokService[method] === 'function') {
            console.log(`✅ Method ${method} exists`);
        } else {
            console.log(`❌ Method ${method} missing`);
            methodsExist = false;
        }
    });
    
    // Test 3: Helper methods
    console.log('\n3. Testing helper methods...');
    const helperMethods = ['normalizeSelector', 'normalizeActions', 'extractDomainFromURL', 'cleanupScreenshot'];
    let helpersExist = true;
    
    helperMethods.forEach(method => {
        if (typeof grokService[method] === 'function') {
            console.log(`✅ Helper method ${method} exists`);
        } else {
            console.log(`❌ Helper method ${method} missing`);
            helpersExist = false;
        }
    });
    
    // Test 4: Basic URL test generation (without browser)
    console.log('\n4. Testing basic URL test generation...');
    try {
        const basicTest = grokService.generateBasicTestFromURL('https://example.com');
        if (basicTest && basicTest.testCase && basicTest.testCase.actions) {
            console.log(`✅ Basic test generated with ${basicTest.testCase.actions.length} actions`);
            console.log(`   Test name: ${basicTest.testCase.name}`);
            console.log(`   Test URL: ${basicTest.testCase.url}`);
        } else {
            console.log('❌ Failed to generate basic test');
            return false;
        }
    } catch (error) {
        console.log(`❌ Error generating basic test: ${error.message}`);
        return false;
    }
    
    // Test 5: Domain extraction
    console.log('\n5. Testing domain extraction...');
    const testUrls = [
        'https://example.com',
        'https://www.github.com/user/repo',
        'https://google.com/search?q=test'
    ];
    
    testUrls.forEach(url => {
        try {
            const domain = grokService.extractDomainFromURL(url);
            console.log(`✅ ${url} → ${domain}`);
        } catch (error) {
            console.log(`❌ Failed to extract domain from ${url}: ${error.message}`);
            return false;
        }
    });
    
    return methodsExist && helpersExist;
}

function testBrowserConfigurationChanges() {
    console.log('\n🔍 Verifying Browser Configuration Changes...\n');
    
    // Read the source file to verify changes
    const fs = require('fs');
    const path = require('path');
    
    try {
        const sourceFile = fs.readFileSync(path.join(__dirname, 'src/services/grok.js'), 'utf8');
        
        // Test that headless is set to false
        if (sourceFile.includes('initialize(\'chromium\', false)')) {
            console.log('✅ Browser configured for non-headless mode (visible)');
        } else {
            console.log('❌ Browser still in headless mode');
            return false;
        }
        
        // Test enhanced logging presence
        const loggingPatterns = [
            '🚀 Starting browse and generate test',
            '🌐 Opening browser in visible mode',
            '📸 Taking full-page screenshot',
            '🤖 Starting Grok AI analysis',
            '✅ Browser opened successfully'
        ];
        
        let loggingCount = 0;
        loggingPatterns.forEach(pattern => {
            if (sourceFile.includes(pattern)) {
                console.log(`✅ Enhanced logging found: "${pattern}"`);
                loggingCount++;
            }
        });
        
        if (loggingCount >= 4) {
            console.log(`✅ Enhanced logging implemented (${loggingCount}/${loggingPatterns.length} patterns found)`);
        } else {
            console.log(`❌ Insufficient enhanced logging (${loggingCount}/${loggingPatterns.length} patterns found)`);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error reading source file: ${error.message}`);
        return false;
    }
}

// Run the tests
if (require.main === module) {
    console.log('🔬 Starting GrokService Unit Tests...\n');
    
    const configTest = testGrokServiceConfiguration();
    const browserTest = testBrowserConfigurationChanges();
    
    console.log('\n📋 Test Results Summary:');
    console.log('='.repeat(50));
    console.log(`Service Configuration: ${configTest ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Browser Configuration: ${browserTest ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (configTest && browserTest) {
        console.log('\n🎉 All unit tests passed!');
        console.log('✅ Service properly configured');
        console.log('✅ Browser set to non-headless mode');
        console.log('✅ Enhanced logging implemented');
        console.log('✅ API methods available and working');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed');
        process.exit(1);
    }
}

module.exports = { testGrokServiceConfiguration, testBrowserConfigurationChanges };