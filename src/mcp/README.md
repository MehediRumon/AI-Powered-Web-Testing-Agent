# MCP Server for AI-Powered Web Testing Agent

This directory contains the Model Context Protocol (MCP) server implementation for the AI-Powered Web Testing Agent. The MCP server exposes the testing agent's functionality through the standardized MCP protocol, allowing AI assistants to programmatically create and execute web tests.

## Overview

The MCP server provides a standardized interface for AI assistants to interact with the web testing agent. This enables seamless integration with AI tools that support the MCP protocol.

## Features

### Tools Available

1. **create_test_case** - Create a new test case for web testing
   - Parameters: name, description, url, actions
   - Creates a test case in the database

2. **parse_natural_language** - Parse natural language instructions into structured test actions
   - Parameters: instructions
   - Converts human-readable test descriptions into executable actions

3. **execute_test_case** - Execute a specific test case
   - Parameters: testCaseId, headless (optional)
   - Runs the test case using Playwright and saves results

4. **list_test_cases** - List all available test cases
   - Parameters: userId (optional)
   - Returns all test cases from the database

5. **get_test_results** - Get results of executed test cases
   - Parameters: testCaseId (optional), limit (optional)
   - Returns test execution results

6. **get_browser_status** - Check browser installation status
   - No parameters required
   - Verifies if Playwright browsers are installed

## Usage

### Starting the MCP Server

```bash
# Direct execution
npm run mcp

# Or directly with node
node src/mcp/server.js
```

### Testing the MCP Server

```bash
npm run test-mcp
```

### Configuration

The MCP server configuration is located in `mcp-config.json`:

```json
{
  "mcpServers": {
    "ai-web-testing-agent": {
      "command": "node",
      "args": ["src/mcp/server.js"],
      "cwd": "/path/to/project",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Integration with AI Assistants

### Claude Desktop Integration

To use this MCP server with Claude Desktop:

1. Add the server configuration to your Claude Desktop configuration file
2. Start the MCP server
3. Claude will automatically discover and use the available tools

### Example Usage

Once connected, you can ask Claude to:

- "Create a test case that navigates to example.com and clicks the login button"
- "Parse this test description: 'Go to the homepage, fill in the search box with 'test', and click search'"
- "Execute test case #5 and show me the results"
- "List all test cases in the system"

## Architecture

The MCP server is built on top of the existing web testing agent infrastructure:

- **Database**: Uses the same SQLite database as the main application
- **Services**: Reuses PlaywrightTestService and OpenAIService
- **Authentication**: Uses a default user ID (1) for MCP operations

## Error Handling

The MCP server includes comprehensive error handling:

- Invalid parameters return appropriate error messages
- Database errors are caught and reported
- Test execution failures are captured and returned

## Development

### Adding New Tools

To add new tools to the MCP server:

1. Add the tool definition to the `ListToolsRequestSchema` handler
2. Add a case for the tool in the `CallToolRequestSchema` handler
3. Implement the tool method in the `WebTestingMCPServer` class

### Testing

The test suite verifies:

- MCP server startup
- Tool registration
- Basic JSON-RPC communication

Run tests with:
```bash
npm run test-mcp
```

## Dependencies

- `@modelcontextprotocol/sdk` - Official MCP SDK
- Existing project dependencies (Express, Playwright, SQLite, etc.)

## Protocol Compliance

This implementation follows the Model Context Protocol specification:

- Uses JSON-RPC 2.0 for communication
- Implements required MCP message types
- Provides structured tool definitions with JSON schemas
- Returns proper MCP response formats