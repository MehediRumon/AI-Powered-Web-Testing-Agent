const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

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
        return res.status(400).json({ error: 'Grok API key must start with "xai-"' });
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
                    : `Connection failed: ${grokAIService.connectionError}. Please check your Grok API key.`
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