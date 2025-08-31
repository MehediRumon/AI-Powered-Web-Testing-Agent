const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

// Get user's API configuration
router.get('/api-keys', authenticateToken, (req, res) => {
    const db = getDatabase();
    
    db.get(
        'SELECT openai_api_key, groq_api_key FROM api_configs WHERE user_id = ?',
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
                hasOpenAiKey: !!(row && row.openai_api_key),
                hasGroqKey: !!(row && row.groq_api_key)
            });
        }
    );
});

// Update user's API configuration
router.put('/api-keys', authenticateToken, (req, res) => {
    const { openai_api_key, groq_api_key } = req.body;
    
    // Basic validation
    if (openai_api_key && !openai_api_key.startsWith('sk-')) {
        return res.status(400).json({ error: 'OpenAI API key must start with "sk-"' });
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
                ? 'UPDATE api_configs SET openai_api_key = ?, groq_api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
                : 'INSERT INTO api_configs (openai_api_key, groq_api_key, user_id) VALUES (?, ?, ?)';
            
            const params = [
                openai_api_key || null,
                groq_api_key || null,
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
                    hasGroqKey: !!groq_api_key
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

module.exports = router;