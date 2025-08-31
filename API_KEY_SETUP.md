# API Key Setup Guide

## Quick Setup Process

The AI-Powered Web Testing Agent now provides an automated setup process for API keys.

### Method 1: Automated Setup (Recommended)

```bash
# Step 1: Create .env file from template
npm run setup-env

# Step 2: Edit .env file with your API keys
nano .env  # or use your preferred editor
```

### Method 2: Web UI Configuration

1. Start the application: `npm start`
2. Register/Login to your account
3. Go to Settings → API Configuration
4. Enter your API keys directly in the web interface

## API Key Sources

### OpenAI API Key
- **URL**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Format**: Starts with `sk-`
- **Purpose**: AI-powered test generation and natural language parsing
- **Required**: Optional (fallback parsing available)

### Groq API Key
- **URL**: [https://console.groq.com/](https://console.groq.com/)
- **Format**: Starts with `gsk_`
- **Purpose**: Advanced browse & AI test generation features
- **Required**: Optional (fallback mode available)

## Configuration Details

### .env File Structure
```bash
# Server Configuration
PORT=3000

# JWT Secret Key (Change this in production!)
JWT_SECRET=your-secret-key-change-in-production

# OpenAI API Configuration (Optional)
OPENAI_API_KEY=sk-your-actual-key-here

# Groq AI API Configuration (Optional)
GROQ_API_KEY=gsk_your-actual-key-here

# Database Configuration
DB_PATH=./database.sqlite

# Application Settings
NODE_ENV=development
```

### Expected Behavior
- **Without API keys**: Basic rule-based test parsing works
- **With OpenAI key**: Enhanced AI-powered test generation
- **With Groq key**: Advanced URL analysis and intelligent test cases
- **With both keys**: Full AI-powered functionality

## Security Notes

- ✅ `.env` file is automatically excluded from Git via `.gitignore`
- ✅ API keys are stored securely per user in database when using web UI
- ✅ Environment variables take precedence as system defaults
- ✅ User-specific keys override environment variables

## Troubleshooting

### No .env file?
```bash
npm run setup-env
```

### API keys not working?
1. Check key format (OpenAI: `sk-...`, Groq: `gsk_...`)
2. Verify key permissions and billing status
3. Test connection through Settings → API Configuration
4. Check console for error messages

### Need to reset configuration?
```bash
# Remove .env file and recreate
rm .env
npm run setup-env
```

## Migration from Previous Versions

If you previously had API keys configured:
1. Your existing `.env` file continues to work
2. User-configured keys (via web UI) take precedence
3. No changes needed - everything is backward compatible

## Files Modified in This Update

- ✅ `package.json` - Added `setup-env` and `setup` scripts
- ✅ `README.md` - Enhanced setup instructions
- ✅ `SETUP.md` - New simplified setup guide
- ✅ `.env` - Created from template (not committed to Git)