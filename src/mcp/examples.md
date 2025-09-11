# MCP Server Usage Examples

This file contains examples of how to use the AI-Powered Web Testing Agent through the MCP (Model Context Protocol) interface.

## Setup

1. Start the MCP server:
```bash
npm run mcp
```

2. The server will run on stdio and wait for JSON-RPC messages.

## Example Requests and Responses

### 1. List Available Tools

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "create_test_case",
        "description": "Create a new test case for web testing",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "description": {"type": "string"},
            "url": {"type": "string"},
            "actions": {"type": "array"}
          },
          "required": ["name", "url"]
        }
      }
      // ... more tools
    ]
  }
}
```

### 2. Parse Natural Language Instructions

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "parse_natural_language",
    "arguments": {
      "instructions": "Navigate to https://example.com, click the login button, enter username 'test@example.com', enter password 'password123', and click submit"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"message\": \"Instructions parsed successfully\", \"parsed\": {\"testCase\": {\"name\": \"Login Test\", \"url\": \"https://example.com\", \"actions\": [{\"type\": \"navigate\", \"url\": \"https://example.com\"}, {\"type\": \"click\", \"selector\": \"button[type='submit'], input[type='submit'], .login-btn\"}, {\"type\": \"input\", \"selector\": \"input[type='email'], input[name='username'], #username\", \"value\": \"test@example.com\"}, {\"type\": \"input\", \"selector\": \"input[type='password'], input[name='password'], #password\", \"value\": \"password123\"}, {\"type\": \"click\", \"selector\": \"button[type='submit'], input[type='submit'], .submit-btn\"}]}}}"
      }
    ]
  }
}
```

### 3. Create a Test Case from Description

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "create_test_from_description",
    "arguments": {
      "description": "Go to Google homepage, search for 'OpenAI', and verify the results page loads",
      "name": "Google Search Test"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"message\": \"Test case created successfully from description\", \"testCaseId\": 1, \"testCase\": {\"id\": 1, \"name\": \"Google Search Test\", \"description\": \"Go to Google homepage, search for 'OpenAI', and verify the results page loads\", \"url\": \"https://google.com\", \"actions\": [{\"type\": \"navigate\", \"url\": \"https://google.com\"}, {\"type\": \"input\", \"selector\": \"input[name='q'], .search-input\", \"value\": \"OpenAI\"}, {\"type\": \"click\", \"selector\": \"button[type='submit'], .search-button\"}, {\"type\": \"verify\", \"selector\": \".search-results\", \"description\": \"Verify results page loads\"}]}}"
      }
    ]
  }
}
```

### 4. Execute a Test Case

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "execute_test_case",
    "arguments": {
      "testCaseId": 1,
      "headless": true
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"message\": \"Test case executed successfully\", \"result\": {\"status\": \"passed\", \"executionTime\": 3500, \"screenshotPath\": \"reports/screenshot-1234567890.png\", \"reportPath\": \"reports/test-report-1234567890.html\", \"resultId\": 1}}"
      }
    ]
  }
}
```

### 5. List All Test Cases

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "list_test_cases",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"testCases\": [{\"id\": 1, \"name\": \"Google Search Test\", \"description\": \"Go to Google homepage, search for 'OpenAI', and verify the results page loads\", \"url\": \"https://google.com\", \"actions\": [...], \"created_at\": \"2024-01-15T10:30:00Z\"}]}"
      }
    ]
  }
}
```

### 6. Get Test Results

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "get_test_results",
    "arguments": {
      "limit": 5
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"results\": [{\"id\": 1, \"test_case_id\": 1, \"status\": \"passed\", \"execution_time\": 3500, \"executed_at\": \"2024-01-15T10:35:00Z\", \"screenshot_path\": \"reports/screenshot-1234567890.png\"}]}"
      }
    ]
  }
}
```

### 7. Check Browser Status

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "get_browser_status",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"status\": \"installed\", \"message\": \"Playwright is installed and ready to use\"}"
      }
    ]
  }
}
```

### 8. Delete a Test Case

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "delete_test_case",
    "arguments": {
      "testCaseId": 1
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"message\": \"Test case deleted successfully\", \"deletedTestCase\": {\"id\": 1, \"name\": \"Google Search Test\"}}"
      }
    ]
  }
}
```

## Error Responses

### Invalid Tool Name

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "tools/call",
  "params": {
    "name": "invalid_tool",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "error": {
    "code": -32601,
    "message": "Unknown tool: invalid_tool"
  }
}
```

### Missing Required Parameters

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "tools/call",
  "params": {
    "name": "create_test_case",
    "arguments": {
      "name": "Test without URL"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "error": {
    "code": -32603,
    "message": "Error executing tool create_test_case: Name and URL are required"
  }
}
```

## Integration with AI Assistants

### Claude Desktop Configuration

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ai-web-testing-agent": {
      "command": "node",
      "args": ["src/mcp/server.js"],
      "cwd": "/path/to/AI-Powered-Web-Testing-Agent"
    }
  }
}
```

### Example AI Assistant Conversation

**User:** "Create a test that goes to GitHub, searches for 'playwright', and verifies results appear"

**AI Assistant:** I'll create a web test for you that searches GitHub for Playwright.

*[AI Assistant calls create_test_from_description tool]*

**AI Assistant:** ✅ I've successfully created a test case called "GitHub Playwright Search Test" (ID: 2). The test will:

1. Navigate to GitHub.com
2. Find the search input field
3. Enter "playwright" as the search term
4. Click the search button
5. Verify that search results appear

Would you like me to execute this test now?

**User:** "Yes, please run the test"

*[AI Assistant calls execute_test_case tool]*

**AI Assistant:** ✅ Test executed successfully! The test passed in 4.2 seconds. Here are the results:

- **Status:** Passed ✅
- **Execution Time:** 4200ms
- **Screenshot:** Available at reports/screenshot-1642789123.png
- **Report:** Full report saved to reports/test-report-1642789123.html

The test successfully navigated to GitHub, performed the search, and verified that results appeared on the page.

## Tips for AI Assistant Integration

1. **Combine Tools:** Use `parse_natural_language` first, then `create_test_case` with the parsed actions
2. **Error Handling:** Always check the `success` field in responses
3. **Test Management:** Use `list_test_cases` to show available tests to users
4. **Results Review:** Use `get_test_results` to show test execution history
5. **Cleanup:** Use `delete_test_case` to remove tests that are no longer needed