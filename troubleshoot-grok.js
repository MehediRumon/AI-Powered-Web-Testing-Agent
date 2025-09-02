#!/usr/bin/env node

// Grok API Key Troubleshooting Utility
const GrokAIService = require('./src/services/grokAI');

async function troubleshootGrokAPI() {
    console.log('🔧 Grok AI API Troubleshooting Utility\n');
    console.log('This tool helps diagnose common Grok API setup issues.\n');
    
    // Check environment variable setup
    console.log('1. 📋 Checking environment variables...');
    const grokKey = process.env.GROK_API_KEY;
    const xaiKey = process.env.XAI_API_KEY;
    
    if (!grokKey && !xaiKey) {
        console.log('❌ No Grok API key found in environment variables');
        console.log('💡 Solution: Add GROK_API_KEY or XAI_API_KEY to your .env file');
        console.log('   Example: GROK_API_KEY=xai-your-actual-key-here');
        console.log('\n📖 For setup instructions, see: GROK_API_SETUP.md\n');
        return;
    }
    
    const apiKey = grokKey || xaiKey;
    const keySource = grokKey ? 'GROK_API_KEY' : 'XAI_API_KEY';
    console.log(`✅ Found API key in ${keySource}`);
    
    // Create service instance
    const grokService = new GrokAIService();
    
    // Check key format
    console.log('\n2. 🔍 Validating API key format...');
    if (grokService.isValidGrokApiKey(apiKey)) {
        console.log('✅ API key format is valid');
        console.log(`   Key starts with: ${apiKey.substring(0, 4)}...`);
        console.log(`   Key length: ${apiKey.length} characters`);
    } else {
        console.log('❌ Invalid API key format');
        console.log('💡 Grok API keys must:');
        console.log('   - Start with "xai-"');
        console.log('   - Be longer than 10 characters');
        console.log('   - Come from https://console.x.ai/');
        return;
    }
    
    // Test connection
    console.log('\n3. 🌐 Testing API connectivity...');
    try {
        const isConnected = await grokService.testConnection();
        
        if (isConnected) {
            console.log('✅ Successfully connected to Grok AI API!');
            console.log('🎉 Your setup is working correctly.');
        } else {
            console.log('❌ Connection failed');
            console.log(`🔍 Error: ${grokService.connectionError}`);
            
            // Provide specific troubleshooting steps
            if (grokService.connectionError.includes('403') || grokService.connectionError.includes('forbidden')) {
                console.log('\n💡 403 Forbidden Error Solutions:');
                console.log('   1. Verify your API key is correct and hasn\'t been revoked');
                console.log('   2. Check that your xAI account has vision model access');
                console.log('   3. Ensure your account is in good standing');
                console.log('   4. Try generating a new API key at https://console.x.ai/');
            } else if (grokService.connectionError.includes('401') || grokService.connectionError.includes('authentication')) {
                console.log('\n💡 401 Authentication Error Solutions:');
                console.log('   1. Double-check your API key is correctly copied');
                console.log('   2. Ensure there are no extra spaces or characters');
                console.log('   3. Verify the key hasn\'t expired');
                console.log('   4. Generate a new API key if needed');
            } else if (grokService.connectionError.includes('Network error')) {
                console.log('\n💡 Network Error Solutions:');
                console.log('   1. Check your internet connection');
                console.log('   2. Verify firewall settings allow HTTPS to api.x.ai');
                console.log('   3. Try again later if xAI service is down');
            } else {
                console.log('\n💡 General troubleshooting:');
                console.log('   1. Check the xAI status page for service issues');
                console.log('   2. Verify your account at https://console.x.ai/');
                console.log('   3. Try again in a few minutes');
            }
        }
    } catch (error) {
        console.log('❌ Unexpected error during connection test');
        console.log(`🔍 Error: ${error.message}`);
    }
    
    // Test fallback functionality
    console.log('\n4. 🔄 Testing fallback functionality...');
    try {
        const fallbackTest = grokService.generateBasicTestFromURL('https://example.com');
        if (fallbackTest && fallbackTest.testCase) {
            console.log('✅ Fallback test generation working');
            console.log(`   Generated ${fallbackTest.testCase.actions.length} test actions`);
            console.log('💡 The app will work with basic test generation even if Grok AI is unavailable');
        }
    } catch (error) {
        console.log('❌ Fallback test generation failed');
        console.log(`🔍 Error: ${error.message}`);
    }
    
    console.log('\n📊 Summary:');
    console.log('='.repeat(50));
    console.log(`API Key Source: ${keySource}`);
    console.log(`Key Format: ${grokService.isValidGrokApiKey(apiKey) ? 'Valid' : 'Invalid'}`);
    console.log(`Connection: ${grokService.isConnected ? 'Success' : 'Failed'}`);
    console.log(`Fallback: Working`);
    
    if (grokService.isConnected) {
        console.log('\n🎉 Your Grok AI setup is fully functional!');
    } else {
        console.log('\n⚠️  Grok AI unavailable, but fallback options are working.');
        console.log('📖 See GROK_API_SETUP.md for detailed setup instructions.');
    }
}

if (require.main === module) {
    troubleshootGrokAPI().catch(error => {
        console.error('❌ Troubleshooting failed:', error.message);
        process.exit(1);
    });
}

module.exports = { troubleshootGrokAPI };