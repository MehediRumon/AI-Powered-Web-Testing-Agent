# Browse & Generate Feature Documentation

## Overview

The Browse & Generate feature allows users to automatically generate test cases by taking screenshots of web pages and analyzing them using the Grok AI API. This feature implements the requirement to "initialize Browse, take screenshot of the page, send image to AI, and auto-parse test cases for execution."

## Features

- 🔍 **Screenshot Capture**: Automatically takes full-page screenshots of target URLs
- 🤖 **AI Analysis**: Uses Grok API (llama-3.3-70b-versatile model) to analyze screenshots
- 📝 **Test Generation**: Generates structured test cases from visual analysis
- ⚡ **Auto-Execution**: Optionally saves and executes generated test cases immediately
- 🔄 **Fallback Support**: Graceful fallback when Grok API is unavailable

## How It Works

### 1. User Interaction
- Click the "🔍 Browse & Generate" button in the AI Assistant tab
- Enter the target URL when prompted
- Choose whether to auto-execute the generated test case

### 2. Screenshot Process
```javascript
// Navigate to URL and capture screenshot
await playwrightService.initialize('chromium', true);
await playwrightService.page.goto(url, { waitUntil: 'networkidle' });
await playwrightService.page.screenshot({ 
    path: screenshotPath, 
    fullPage: true,
    type: 'png'
});
```

### 3. AI Analysis
- Screenshot is sent to Grok API for analysis
- AI generates structured test cases based on visible UI elements
- Focuses on interactive elements, navigation, forms, and user flows

### 4. Test Case Generation
The AI returns test cases in this format:
```json
{
  "testCase": {
    "name": "Descriptive test name",
    "description": "Brief description of what this test validates",
    "url": "https://example.com",
    "actions": [
      {
        "type": "click|fill|select|wait|verify|assert_visible|assert_text",
        "selector": "CSS selector or text selector",
        "value": "value for fill/select actions",
        "description": "Human readable description"
      }
    ]
  }
}
```

### 5. Auto-Execution (Optional)
If auto-execution is enabled:
- Test case is saved to the database
- Test is immediately executed using Playwright
- Results are displayed to the user

## API Endpoints

### POST `/api/test/ai/browse-and-generate`

**Request Body:**
```json
{
  "url": "https://example.com",
  "autoExecute": false
}
```

**Response (Generation Only):**
```json
{
  "message": "Test case generated successfully from screenshot analysis",
  "testCase": {
    "name": "...",
    "description": "...",
    "url": "...",
    "actions": [...]
  }
}
```

**Response (Auto-Execute):**
```json
{
  "message": "Test case generated, saved and executed successfully",
  "testCase": {...},
  "testCaseId": 123,
  "execution": {
    "status": "passed",
    "executionTime": 5000,
    "screenshotPath": "...",
    "steps": [...]
  }
}
```

## Configuration

### Environment Variables
Add to your `.env` file:
```env
# Grok API Configuration (Required for Browse feature)
GROQ_API_KEY=your-groq-api-key-here
```

### Grok API Setup
1. Sign up at [Grok/X.AI platform](https://x.ai/)
2. Generate an API key
3. Add the key to your environment variables
4. The system uses the `llama-3.3-70b-versatile` model

## Usage Examples

### Basic Usage
1. Navigate to AI Assistant tab
2. Click "🔍 Browse & Generate"
3. Enter URL: `https://example.com`
4. Choose "Cancel" for generation only
5. Review generated test case
6. Save manually if needed

### Auto-Execute Usage
1. Click "🔍 Browse & Generate"
2. Enter URL: `https://httpbin.org`
3. Choose "OK" for auto-execution
4. Test case is generated, saved, and executed automatically
5. View results in Test Results section

## Supported Action Types

The AI can generate the following action types:

- **click**: Click buttons, links, elements
- **fill**: Fill input fields with text
- **select**: Select dropdown options
- **wait**: Wait for elements or time delays
- **verify**: Verify page content or URL
- **assert_visible**: Assert element is visible
- **assert_text**: Assert text content

## Fallback Behavior

When Grok API is unavailable:
- System generates basic test case with navigation and assertion
- No screenshot analysis is performed
- Basic functionality test is created
- User is notified of fallback mode

Example fallback test:
```json
{
  "testCase": {
    "name": "Basic Test for example.com",
    "description": "Basic functionality test for https://example.com",
    "url": "https://example.com",
    "actions": [
      {
        "type": "wait",
        "value": "3",
        "description": "Wait for page to load"
      },
      {
        "type": "assert_visible",
        "selector": "body",
        "description": "Verify page loaded successfully"
      }
    ]
  }
}
```

## Error Handling

- Invalid URLs are validated before processing
- Screenshot capture errors trigger fallback mode
- API failures gracefully degrade to basic test generation
- Detailed error messages are provided to users

## Files Modified

- `src/services/grok.js` - New Grok AI service
- `src/routes/test.js` - Added browse-and-generate endpoint
- `public/index.html` - Added Browse button and JavaScript functions
- `.env.example` - Added GROQ_API_KEY configuration

## Testing

Basic functionality can be tested without API key:
```bash
node test-browse.js
```

This tests the fallback functionality and validates the service structure.