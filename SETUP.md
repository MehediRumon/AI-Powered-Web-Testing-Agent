# Quick Setup Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies and Create .env file
```bash
npm run setup-env
npm install
```

### Step 2: Configure API Keys (Optional but Recommended)

Edit the `.env` file that was just created:
```bash
# Open .env file in your preferred editor
nano .env
# or
code .env
```

Replace the placeholder values with your actual API keys:
```bash
# OpenAI API Key (for AI-powered test generation)
OPENAI_API_KEY=sk-your-actual-openai-key-here

# Groq API Key (for advanced browse & test generation)  
GROQ_API_KEY=gsk_your-actual-groq-key-here
```

**Where to get API keys:**
- 🔗 OpenAI: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- 🔗 Groq: [https://console.groq.com/](https://console.groq.com/)

### Step 3: Start the Application
```bash
npm start
```

Visit: [http://localhost:3000](http://localhost:3000)

## ✅ That's it!

### Alternative: Configure API Keys via Web UI
1. Start the app with `npm start`
2. Register/Login to your account
3. Go to Settings → API Configuration
4. Enter your API keys and save

### Note About API Keys
- **Without API keys**: App works with basic rule-based test parsing
- **With API keys**: Enhanced AI-powered test generation and analysis
- **Security**: API keys in `.env` are automatically excluded from Git

### Troubleshooting
- **Missing .env file?** Run `npm run setup-env`
- **Browser issues?** Run `npm run install-browsers`
- **Permission errors?** Check that `uploads/` and `reports/` directories are writable

For detailed documentation, see [README.md](README.md).