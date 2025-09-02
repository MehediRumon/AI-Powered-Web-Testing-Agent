# Grok API Key Setup Guide

## Getting Your xAI/Grok API Key

### Step 1: Create an xAI Account
1. Visit [https://console.x.ai/](https://console.x.ai/)
2. Sign up for a new account or log in with existing credentials
3. Complete the account verification process

### Step 2: Generate API Key
1. Navigate to the API Keys section in your xAI console
2. Click "Create New API Key"
3. Give your key a descriptive name (e.g., "Web Testing Agent")
4. Copy the generated key (it will start with `xai-`)
5. **Important**: Save this key securely as you won't be able to see it again

### Step 3: Configure Your Application
1. Open your `.env` file in the project root
2. Add your API key:
   ```env
   GROK_API_KEY=xai-your-actual-key-here
   ```
   Or alternatively:
   ```env
   XAI_API_KEY=xai-your-actual-key-here
   ```

### Step 4: Restart the Application
```bash
# Stop the current server (Ctrl+C)
# Then restart:
node server.js
```

## Troubleshooting Common Issues

### Error: "Connection failed: Grok API responded with status 403"
**Causes:**
- Invalid or expired API key
- API key doesn't have vision model access
- Account hasn't been approved for xAI services

**Solutions:**
1. Verify your API key starts with `xai-`
2. Check that your xAI account is in good standing
3. Ensure you have access to the Grok vision models
4. Generate a new API key if the current one is expired

### Error: "Grok API key not configured"
**Solution:**
- Add your API key to the `.env` file as shown in Step 3 above

### Error: "Invalid Grok API key format"
**Solution:**
- Ensure your key starts with `xai-` and is complete
- Remove any extra spaces or characters from the key

### Error: "Network error: Unable to reach xAI API"
**Causes:**
- Internet connectivity issues
- Firewall blocking API requests
- xAI service temporarily down

**Solutions:**
1. Check your internet connection
2. Verify firewall settings allow HTTPS requests to api.x.ai
3. Wait and try again if xAI service is down

## API Key Validation
The application will automatically validate your API key format when you configure it. Valid keys must:
- Start with `xai-`
- Be longer than 10 characters
- Be properly formatted

## Fallback Options
If Grok AI is not available, the application will automatically fall back to:
1. **Groq AI** (if configured with GROQ_API_KEY)
2. **Basic test generation** (no API required)

## Testing Your Setup
You can test your API configuration using:
```bash
node test-grok-ai-integration.js
```

Or through the web interface:
1. Navigate to the AI Assistant tab
2. Click "Test API Connection"
3. Select "Grok" from the dropdown

## Getting Help
If you continue to experience issues:
1. Check the [xAI documentation](https://docs.x.ai/)
2. Verify your account status at [https://console.x.ai/](https://console.x.ai/)
3. Check the application logs for detailed error messages

## Security Notes
- Never share your API key in public repositories
- Store the key securely in your `.env` file
- Regenerate your key if you suspect it has been compromised
- The application will mask your key in the UI for security