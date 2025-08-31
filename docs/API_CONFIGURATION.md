# API Configuration Guide

## Overview

The AI-Powered Web Testing Agent supports user-specific API key configuration through the web interface. This eliminates the need for a `.env` file and allows multiple users to configure their own API keys.

## Features

✅ **User-Specific API Keys**: Each user can configure their own OpenAI and Groq API keys  
✅ **Database Storage**: API keys are securely stored in the database per user  
✅ **UI Configuration**: Easy-to-use settings interface for API key management  
✅ **Fallback Support**: Falls back to environment variables if no user key is configured  
✅ **Test Connections**: Built-in API connection testing functionality  

## How to Configure API Keys

### 1. Access Settings
- Log in to the application
- Click on your username in the top navigation
- Select "⚙️ Settings" from the dropdown menu

### 2. Configure API Keys
In the API Configuration section:

**For OpenAI API:**
- Enter your OpenAI API key (starts with `sk-`)
- Get your key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Used for AI-powered test generation and natural language parsing

**For Groq API:**
- Enter your Groq API key
- Get your key from [Groq Console](https://console.groq.com/)
- Used for AI-powered browse & test generation features

### 3. Save and Test
- Click "Save Settings" to store your API keys
- Use "Test Connection" buttons to verify your keys work
- Status indicators will show ✅ for configured keys or ⚠️ for missing keys

## Technical Implementation

### Database Schema
```sql
CREATE TABLE api_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    openai_api_key TEXT,
    groq_api_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### API Endpoints
- `GET /api/config/api-keys` - Get user's API configuration (masked)
- `PUT /api/config/api-keys` - Update user's API keys
- `DELETE /api/config/api-keys` - Delete user's API configuration
- `POST /api/config/test-connection` - Test API connections

### Service Integration
The OpenAI service automatically uses user-specific API keys:

```javascript
// Creates service instance with user's API key
const aiService = await OpenAIService.createForUser(userId);

// Falls back to environment variable if no user key
const aiService = new OpenAIService(userApiKey || process.env.OPENAI_API_KEY);
```

## Benefits

1. **No Environment Setup**: Users don't need to configure `.env` files
2. **Multi-User Support**: Each user has their own API key configuration
3. **Security**: API keys are stored per user, not globally accessible
4. **Easy Management**: Simple UI for updating and testing API keys
5. **Fallback Safety**: Still works with environment variables as backup

## Migration from Environment Variables

If you previously used environment variables:
1. Your existing `.env` file will still work as a fallback
2. User-configured API keys take precedence over environment variables
3. You can gradually migrate users to UI-based configuration
4. No code changes required - the system handles both automatically

## Troubleshooting

**API Key Not Working?**
- Verify the key format (OpenAI keys start with `sk-`)
- Use the "Test Connection" button to verify connectivity
- Check your API key's usage limits and billing status
- Ensure the key has the necessary permissions

**Settings Not Saving?**
- Check that you're logged in with a valid session
- Verify network connectivity to the server
- Check browser console for any JavaScript errors
- Try refreshing the page and logging in again