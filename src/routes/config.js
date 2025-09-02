const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// Helper function to get enhanced Grok error messages with actionable guidance
function getEnhancedGrokErrorMessage(originalError) {
    if (!originalError) {
        return 'Connection failed: Unknown error occurred. Please check your Grok API key and try again.';
    }

    const errorLower = originalError.toLowerCase();
    
    if (errorLower.includes('403') || errorLower.includes('forbidden') || errorLower.includes('permissions')) {
        return `🚫 Access Forbidden: Your Grok API key doesn't have sufficient permissions. This usually means:
        
• Your API key might be invalid or revoked
• Your xAI account may not have access to the vision models required
• Your account billing or usage limits may have been exceeded

💡 Quick Fix: Visit https://console.x.ai/ to verify your API key and account status.`;
    }
    
    if (errorLower.includes('401') || errorLower.includes('authentication')) {
        return `🔐 Authentication Failed: Your Grok API key is invalid or malformed.
        
• Double-check your API key is correctly copied from https://console.x.ai/
• Ensure there are no extra spaces or characters
• Verify your key starts with "xai-"

💡 Quick Fix: Generate a new API key if the current one doesn't work.`;
    }
    
    if (errorLower.includes('network') || errorLower.includes('timeout')) {
        return `🌐 Network Error: Unable to reach xAI servers.
        
• Check your internet connection
• Verify firewall settings allow HTTPS to api.x.ai
• Try again in a few minutes if xAI service is temporarily down

💡 Quick Fix: Check https://status.x.ai/ for service status.`;
    }
    
    if (errorLower.includes('not configured') || errorLower.includes('api key')) {
        return `⚙️ API Key Not Configured: Please set up your Grok API key.
        
• Get your API key from https://console.x.ai/
• Add it to your .env file as GROK_API_KEY=your-key-here
• Restart the application after updating .env

💡 Quick Fix: Run 'node troubleshoot-grok.js' for detailed setup guidance.`;
    }
    
    // Generic error with enhanced guidance
    return `❌ Connection Failed: ${originalError}

💡 Troubleshooting Steps:
1. Verify your Grok API key at https://console.x.ai/
2. Check your account status and billing
3. Ensure your key has vision model access
4. Run 'node troubleshoot-grok.js' for detailed diagnostics

🔄 The application will use fallback test generation if Grok AI is unavailable.`;
}

// Helper function to get specific troubleshooting steps based on error type
function getGrokTroubleshootingSteps(originalError) {
    if (!originalError) {
        return [
            'Check your Grok API key configuration',
            'Visit https://console.x.ai/ to verify your account',
            'Run diagnostic: node troubleshoot-grok.js'
        ];
    }

    const errorLower = originalError.toLowerCase();
    
    if (errorLower.includes('403') || errorLower.includes('forbidden')) {
        return [
            '🔍 Verify API Key Status',
            '• Go to https://console.x.ai/ and check if your API key is active',
            '• Confirm your account is in good standing',
            '• Check if you have access to vision models',
            '',
            '💳 Check Account Billing',
            '• Ensure your account has available credits or active billing',
            '• Check usage limits and quotas',
            '',
            '🔄 Generate New Key',
            '• If the above doesn\'t work, generate a new API key',
            '• Update your .env file with the new key',
            '• Restart the application'
        ];
    }
    
    if (errorLower.includes('401') || errorLower.includes('authentication')) {
        return [
            '🔐 Fix Authentication Issues',
            '• Copy your API key exactly from https://console.x.ai/',
            '• Ensure the key starts with "xai-"',
            '• Check for extra spaces or invisible characters',
            '• Verify your .env file syntax: GROK_API_KEY=xai-your-key',
            '',
            '🔄 Test Your Setup',
            '• Save changes and restart the application',
            '• Run: node troubleshoot-grok.js',
            '• Test the connection again'
        ];
    }
    
    if (errorLower.includes('network')) {
        return [
            '🌐 Network Troubleshooting',
            '• Check your internet connection',
            '• Verify DNS resolution: nslookup api.x.ai',
            '• Check firewall settings for HTTPS traffic',
            '• Try from a different network if possible',
            '',
            '⏰ Service Status',
            '• Check https://status.x.ai/ for outages',
            '• Wait a few minutes and try again',
            '• Consider using fallback options'
        ];
    }
    
    // Generic troubleshooting
    return [
        '🔧 General Troubleshooting',
        '• Run diagnostic: node troubleshoot-grok.js',
        '• Check API key at https://console.x.ai/',
        '• Verify account status and billing',
        '• Ensure .env file is properly configured',
        '• Restart application after changes',
        '',
        '🔄 Fallback Options',
        '• The application will use intelligent fallback',
        '• Consider using Groq or OpenAI as alternatives',
        '• Basic test generation will still work'
    ];
}

// Get user's API configuration
router.get('/api-keys', authenticateToken, (req, res) => {
    const db = getDatabase();
    
    db.get(
        'SELECT openai_api_key, groq_api_key, grok_api_key, preferred_api_provider FROM api_configs WHERE user_id = ?',
        [req.user.id],
        (err, row) => {
            db.close();
            
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to retrieve API configuration' });
            }
            
            // Return masked API keys for security (show only first 8 and last 4 characters)
            const maskApiKey = (key) => {
                if (!key || key.length < 12) return '';
                return key.substring(0, 8) + '...' + key.substring(key.length - 4);
            };
            
            res.json({
                openai_api_key: row ? maskApiKey(row.openai_api_key) : '',
                groq_api_key: row ? maskApiKey(row.groq_api_key) : '',
                grok_api_key: row ? maskApiKey(row.grok_api_key) : '',
                preferred_api_provider: row ? row.preferred_api_provider || 'openai' : 'openai',
                hasOpenAiKey: !!(row && row.openai_api_key),
                hasGroqKey: !!(row && row.groq_api_key),
                hasGrokKey: !!(row && row.grok_api_key)
            });
        }
    );
});

// Update user's API configuration
router.put('/api-keys', authenticateToken, (req, res) => {
    const { openai_api_key, groq_api_key, grok_api_key, preferred_api_provider } = req.body;
    
    // Basic validation
    if (openai_api_key && !openai_api_key.startsWith('sk-')) {
        return res.status(400).json({ error: 'OpenAI API key must start with "sk-"' });
    }
    
    if (grok_api_key && !grok_api_key.startsWith('xai-')) {
        return res.status(400).json({ error: 'Grok API key must start with "xai-" and be obtained from https://console.x.ai/' });
    }
    
    // Validate preferred provider
    const validProviders = ['openai', 'groq', 'grok'];
    if (preferred_api_provider && !validProviders.includes(preferred_api_provider)) {
        return res.status(400).json({ error: 'Invalid API provider. Must be one of: openai, groq, grok' });
    }
    
    const db = getDatabase();
    
    // Check if user already has a configuration
    db.get(
        'SELECT id FROM api_configs WHERE user_id = ?',
        [req.user.id],
        (err, row) => {
            if (err) {
                db.close();
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to check existing configuration' });
            }
            
            const query = row 
                ? 'UPDATE api_configs SET openai_api_key = ?, groq_api_key = ?, grok_api_key = ?, preferred_api_provider = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
                : 'INSERT INTO api_configs (openai_api_key, groq_api_key, grok_api_key, preferred_api_provider, user_id) VALUES (?, ?, ?, ?, ?)';
            
            const params = [
                openai_api_key || null,
                groq_api_key || null,
                grok_api_key || null,
                preferred_api_provider || 'openai',
                req.user.id
            ];
            
            db.run(query, params, function(err) {
                db.close();
                
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to save API configuration' });
                }
                
                res.json({ 
                    message: 'API configuration saved successfully',
                    hasOpenAiKey: !!openai_api_key,
                    hasGroqKey: !!groq_api_key,
                    hasGrokKey: !!grok_api_key,
                    preferredProvider: preferred_api_provider || 'openai'
                });
            });
        }
    );
});

// Delete user's API configuration
router.delete('/api-keys', authenticateToken, (req, res) => {
    const db = getDatabase();
    
    db.run(
        'DELETE FROM api_configs WHERE user_id = ?',
        [req.user.id],
        function(err) {
            db.close();
            
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to delete API configuration' });
            }
            
            res.json({ message: 'API configuration deleted successfully' });
        }
    );
});

// Test API connections
router.post('/test-connection', authenticateToken, async (req, res) => {
    try {
        const { service } = req.body; // 'groq', 'openai', or 'grok'
        
        if (service === 'groq') {
            const GrokService = require('../services/grok');
            const grokService = new GrokService();
            const isConnected = await grokService.testConnection();
            
            res.json({
                service: 'groq',
                connected: isConnected,
                error: grokService.connectionError,
                message: isConnected 
                    ? 'Groq API connection successful! AI-powered test generation is available.'
                    : `Connection failed: ${grokService.connectionError}. Please check your GROQ_API_KEY in .env file.`
            });
        } else if (service === 'grok') {
            const GrokAIService = require('../services/grokAI');
            const grokAIService = new GrokAIService();
            const isConnected = await grokAIService.testConnection();
            
            res.json({
                service: 'grok',
                connected: isConnected,
                error: grokAIService.connectionError,
                message: isConnected 
                    ? 'Grok AI connection successful! xAI-powered test generation is available.'
                    : getEnhancedGrokErrorMessage(grokAIService.connectionError),
                troubleshooting: isConnected ? null : getGrokTroubleshootingSteps(grokAIService.connectionError)
            });
        } else if (service === 'openai') {
            // Test OpenAI connection
            const OpenAIService = require('../services/openai');
            const openaiService = await OpenAIService.createForUser(req.user.id);
            
            if (!openaiService.apiKey) {
                return res.json({
                    service: 'openai',
                    connected: false,
                    error: 'No API key configured',
                    message: 'OpenAI API key not configured. Add your key in the API configuration.'
                });
            }
            
            // Simple test request to OpenAI
            try {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${openaiService.apiKey}`
                    }
                });
                
                const connected = response.ok;
                res.json({
                    service: 'openai',
                    connected,
                    error: connected ? null : `HTTP ${response.status}`,
                    message: connected 
                        ? 'OpenAI API connection successful!'
                        : `Connection failed: HTTP ${response.status}. Please check your API key.`
                });
            } catch (error) {
                res.json({
                    service: 'openai',
                    connected: false,
                    error: error.message,
                    message: `Connection failed: ${error.message}`
                });
            }
        } else {
            res.status(400).json({ error: 'Invalid service. Use "groq", "openai", or "grok".' });
        }
    } catch (error) {
        console.error('API test error:', error);
        res.status(500).json({ error: 'Failed to test API connection' });
    }
});

module.exports = router;