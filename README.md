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

## Quick Start

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

**Option A: Quick Start (Recommended)**
```bash
# The application creates a default .env file automatically
# Configure API keys through the web UI after starting the app
```

**Option B: Environment File Setup**
```bash
# Copy environment template (optional)
cp .env.example .env

# Edit .env file with your settings
# Note: API keys can be configured per-user through the web interface
```

> 💡 **User-Specific API Configuration**: Each user can configure their own OpenAI and Groq API keys through the Settings menu in the web interface. This is the recommended approach for multi-user deployments.

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
- `POST /api/test/ai/generate-from-url` - Generate test from URL

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

**Note**: This application includes AI-powered features that require an OpenAI API key for full functionality. Basic testing features work without AI integration.