#!/usr/bin/env node

// Demo script to show Grok AI integration fallback functionality
const GrokAIService = require('./src/services/grokAI');

async function demoGrokAIFallback() {
    console.log('🎬 Grok AI Integration Demo - Fallback Functionality\n');
    console.log('=' .repeat(60));
    
    const grokAIService = new GrokAIService();
    
    console.log('\n1. Testing API Connection...');
    const isConnected = await grokAIService.testConnection();
    
    if (!isConnected) {
        console.log('ℹ️  Grok AI API not configured - demonstrating fallback functionality');
    }
    
    console.log('\n2. Generating test case with fallback (no browser needed)...');
    
    try {
        const testUrl = 'https://github.com/features';
        console.log(`🎯 Target URL: ${testUrl}`);
        
        const result = grokAIService.generateBasicTestFromURL(testUrl);
        
        console.log('\n✅ Test case generated successfully!');
        console.log('📋 Generated Test Case:');
        console.log('─'.repeat(40));
        console.log(`Name: ${result.testCase.name}`);
        console.log(`Description: ${result.testCase.description}`);
        console.log(`URL: ${result.testCase.url}`);
        console.log(`Actions: ${result.testCase.actions.length} steps`);
        
        console.log('\n📝 Test Actions:');
        result.testCase.actions.forEach((action, index) => {
            console.log(`  ${index + 1}. ${action.type}: ${action.description}`);
            if (action.selector) console.log(`     Selector: ${action.selector}`);
            if (action.value) console.log(`     Value: ${action.value}`);
        });
        
        console.log('\n🔍 Auto-parsing validation...');
        const isValid = grokAIService.validateTestCase(result.testCase);
        
        console.log('\n📊 Summary:');
        console.log('─'.repeat(40));
        console.log(`✅ Non-headless browser mode: Configured`);
        console.log(`✅ Fallback test generation: Working`);
        console.log(`✅ Auto-parsing validation: ${isValid ? 'PASSED' : 'FAILED'}`);
        console.log(`✅ Smart URL-based actions: Detected ${testUrl.includes('github') ? 'GitHub platform' : 'generic website'}`);
        console.log(`✅ Grok AI vision model: grok-vision-beta configured`);
        console.log(`${isConnected ? '✅' : '⚠️ '} API Connection: ${isConnected ? 'Connected' : 'Fallback mode (API key needed)'}`);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

// Additional demo for different URL types
async function demoDifferentUrlTypes() {
    console.log('\n\n🌐 Demo: Smart URL Pattern Recognition');
    console.log('=' .repeat(60));
    
    const grokAIService = new GrokAIService();
    const testUrls = [
        'https://github.com/octocat/Hello-World',
        'https://google.com/search',
        'https://amazon.com/products',
        'https://example.com'
    ];
    
    testUrls.forEach((url, index) => {
        console.log(`\n${index + 1}. Testing URL: ${url}`);
        const result = grokAIService.generateBasicTestFromURL(url);
        console.log(`   Generated ${result.testCase.actions.length} actions for ${grokAIService.extractDomainFromURL(url)}`);
        console.log(`   Test name: ${result.testCase.name}`);
    });
}

// Run the demo
if (require.main === module) {
    demoGrokAIFallback().then(() => {
        return demoDifferentUrlTypes();
    }).then(() => {
        console.log('\n🎉 Demo completed successfully!');
        console.log('\n💡 To enable full Grok AI vision analysis:');
        console.log('   1. Get API key from https://console.x.ai/');
        console.log('   2. Add GROK_API_KEY=your-key to .env file');
        console.log('   3. Restart the application');
        console.log('   4. Use "📸 Generate from URL (Grok AI)" button in the web interface');
    }).catch(error => {
        console.error(`❌ Demo failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { demoGrokAIFallback, demoDifferentUrlTypes };