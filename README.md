# AI-Powered Web Testing Agent

🤖 An intelligent web testing automation tool powered by Playwright and AI, featuring natural language test creation, file upload capabilities, and comprehensive reporting.

## Features

- ✅ **Playwright Browser Integration** - Automated web testing with Chromium, Firefox, and WebKit
- ✅ **Database Integration** - SQLite database for persistent storage (replacing in-memory storage)
- ✅ **File Upload Functionality** - Import test cases from CSV/Excel files
- ✅ **PDF Export for Reports** - Generate downloadable HTML and PDF test reports
- ✅ **Enhanced AI Parsing** - OpenAI integration for natural language test creation
- ✅ **User Authentication** - JWT-based authentication and role management
- ✅ **User-Specific API Configuration** - Configure OpenAI/Groq API keys per user via web UI
- 🎯 **Manual Test Creation** - Create tests with custom actions and selectors
- 📊 **Real-time Test Execution** - Execute single tests or batch testing
- 📸 **Screenshot Capture** - Automatic screenshots on test completion and failures
- 🤖 **Grok AI Vision Analysis** - Generate test cases from website screenshots using Grok AI
- 🔄 **Smart Fallback System** - Graceful fallback between AI services

## Quick Start

> 🚀 **New here?** See [SETUP.md](SETUP.md) for a simplified 3-step setup guide!

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/MehediRumon/AI-Powered-Web-Testing-Agent.git
cd AI-Powered-Web-Testing-Agent

# Install dependencies
npm install

# Install Playwright browsers (required for testing)
npm run install-browsers
```

### 2. Configuration

**Option A: Automated Setup (Recommended)**
```bash
# Create .env file and install everything needed
npm run setup

# Or just create the .env file
npm run setup-env
```

**Option B: Manual Setup**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your API keys (see API Key Setup section below)
nano .env
```

### 🔑 API Key Setup

After creating your `.env` file, you have two ways to configure API keys:

**Method 1: Edit .env file directly (for single user)**
```bash
# Edit the .env file and replace placeholders with your actual API keys
OPENAI_API_KEY=sk-your-actual-openai-key-here
GROQ_API_KEY=gsk_your-actual-groq-key-here
```

**Method 2: Use Web UI (for multiple users)**
- Start the application first (see step 3 below)
- Log in and go to Settings
- Configure API keys per user through the web interface

**Where to get API keys:**
- 🔗 **OpenAI API Key**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) (for AI-powered test generation)
- 🤖 **Grok AI API Key**: [https://console.x.ai/](https://console.x.ai/) (for vision-based test generation from screenshots)
- 🔗 **Groq API Key**: [https://console.groq.com/](https://console.groq.com/) (for advanced browse & test generation)

> 💡 **Note**: The application works without API keys but AI features will use fallback parsing instead of advanced AI analysis.

**🔧 API Troubleshooting:**
- For Grok AI setup issues, see [GROK_API_SETUP.md](GROK_API_SETUP.md)
- Run `node troubleshoot-grok.js` to diagnose Grok API problems
- Common error: "Connection failed: Grok API responded with status 403" → Check your API key at [console.x.ai](https://console.x.ai/)

### 3. Start the Application

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 4. Access the Application

Open your browser and navigate to: `http://localhost:3000`

## Browser Installation Note

Due to Playwright's download requirements, browsers need to be installed manually:

```bash
# Method 1: Using npm script
npm run install-browsers

# Method 2: Direct command
npx playwright install

# Method 3: Install specific browsers only
npx playwright install chromium firefox webkit
```

**Note**: Browser installation may require additional system dependencies. See [Playwright documentation](https://playwright.dev/docs/browsers) for system-specific requirements.

## Usage Guide

### 1. Authentication
- Register a new account or login with existing credentials
- JWT tokens are used for secure session management

### 2. Creating Test Cases

#### Manual Creation
- Navigate to "Create Test Case" → "Manual" tab
- Enter test name, URL, and description
- Add custom actions programmatically

#### AI-Powered Creation
- Use "AI Assistant" tab
- Describe your test in natural language
- Example: "Go to https://example.com, click the login button, enter username 'test@example.com'"
- AI will parse and convert to structured test actions

#### File Upload
- Upload CSV or Excel files with test case data
- Required columns: `name`, `url`, `description`, `actions` (JSON)
- Supports batch import of multiple test cases

### 3. Test Execution
- Choose browser type (Chromium, Firefox, WebKit)
- Toggle headless mode for visual debugging
- Execute individual tests or run all tests in batch
- View real-time execution results

### 4. Reporting
- Generate HTML or PDF reports
- Download comprehensive test execution reports
- View test history and performance metrics

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Test Management
- `GET /api/test/cases` - List test cases
- `POST /api/test/cases` - Create test case
- `POST /api/test/execute/:id` - Execute specific test
- `POST /api/test/execute-all` - Execute all tests

### AI Features
- `POST /api/test/ai/parse` - Parse natural language instructions
- `POST /api/test/ai/generate-from-url` - Generate test from URL using Grok AI vision analysis

### File Upload
- `POST /api/upload/test-cases` - Upload CSV/Excel test cases

### Reports
- `POST /api/reports/generate/html` - Generate HTML report
- `POST /api/reports/generate/pdf` - Generate PDF report
- `GET /api/reports/download/:filename` - Download report

## Test Case Structure

Test cases support various action types:

```json
{
  "name": "Login Test",
  "description": "Test user login functionality", 
  "url": "https://example.com/login",
  "actions": [
    {
      "type": "fill",
      "selector": "input[name='username']",
      "value": "testuser@example.com",
      "description": "Enter username"
    },
    {
      "type": "fill", 
      "selector": "input[name='password']",
      "value": "password123",
      "description": "Enter password"
    },
    {
      "type": "click",
      "selector": "button[type='submit']",
      "description": "Click login button"
    },
    {
      "type": "assert_visible",
      "selector": ".dashboard",
      "description": "Verify dashboard is visible"
    }
  ]
}
```

### Supported Action Types
- `click` - Click an element
- `fill` - Fill input fields
- `select` - Select dropdown options
- `check`/`uncheck` - Toggle checkboxes
- `hover` - Hover over elements
- `scroll` - Scroll page
- `wait` - Wait for timeout or element
- `assert_text` - Verify text content
- `assert_visible` - Verify element visibility

## CSV/Excel Upload Format

Create files with these columns:

| name | description | url | actions |
|------|-------------|-----|---------|
| Login Test | Test login flow | https://example.com | [{"type":"click","selector":"#login"}] |
| Search Test | Test search functionality | https://example.com | [{"type":"fill","selector":"#search","value":"test"}] |

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Playwright (Chromium, Firefox, WebKit)
- **AI Integration**: OpenAI GPT-3.5-turbo (optional)
- **File Processing**: Multer, XLSX, CSV-parser
- **Reports**: HTML/PDF generation
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **MCP Server**: Model Context Protocol server for AI assistant integration

## MCP Server Integration

The AI-Powered Web Testing Agent includes a Model Context Protocol (MCP) server that enables AI assistants to programmatically create and execute web tests.

### Starting the MCP Server

```bash
# Start MCP server
npm run mcp

# Test MCP server functionality
npm run test-mcp
```

### Available MCP Tools

- `create_test_case` - Create new test cases
- `parse_natural_language` - Convert descriptions to test actions
- `execute_test_case` - Run specific tests
- `list_test_cases` - View all test cases
- `get_test_results` - Retrieve test results
- `get_browser_status` - Check browser installation
- `create_test_from_description` - Create complete tests from natural language
- `delete_test_case` - Remove test cases

### AI Assistant Integration

Configure your AI assistant (like Claude Desktop) to use the MCP server:

```json
{
  "mcpServers": {
    "ai-web-testing-agent": {
      "command": "node",
      "args": ["src/mcp/server.js"],
      "cwd": "/path/to/project"
    }
  }
}
```

See `src/mcp/README.md` and `src/mcp/examples.md` for detailed documentation and usage examples.

## Troubleshooting

### Browser Installation Issues
```bash
# Clear Playwright cache
npx playwright install --force

# Install system dependencies (Ubuntu/Debian)
npx playwright install-deps
```

### Database Issues
```bash
# Reset database (warning: deletes all data)
rm database.sqlite
npm start  # Will recreate database
```

### Permission Issues
```bash
# Ensure proper permissions for uploads/reports directories
chmod 755 uploads reports
```

## Development

### Project Structure
```
├── server.js              # Main server file
├── src/
│   ├── database/          # Database initialization
│   ├── routes/            # API route handlers
│   ├── middleware/        # Authentication middleware
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── public/                # Static frontend files
├── uploads/               # Uploaded test case files
├── reports/               # Generated test reports
└── tests/                 # Test files
```

### Running Tests
```bash
# Run basic application tests
npm test

# Test with browser automation
npm run dev  # In one terminal
npm test     # In another terminal after server starts
```

## Documentation

- [API Configuration Guide](docs/API_CONFIGURATION.md) - How to configure OpenAI and Groq API keys via web UI

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions, please open an issue on GitHub or contact the maintainers.

---

**Note**: This application includes AI-powered features that support multiple AI services:
- **Grok AI (xAI)**: For vision-based test generation from website screenshots
- **OpenAI**: For natural language test instruction parsing  
- **Groq**: Alternative AI service with fallback support

Basic testing features work without AI integration, with intelligent fallback test generation.