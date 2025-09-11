#!/usr/bin/env node

/**
 * Integration test demonstrating the MCP server end-to-end functionality
 * This test shows how an AI assistant would interact with the web testing agent
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 MCP Server Integration Test\n');
console.log('This test demonstrates how an AI assistant would use the MCP server\n');

const mcpServerPath = path.join(__dirname, '../src/mcp/server.js');

function sendMCPRequest(request) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [mcpServerPath], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let response = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      response += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      if (response.includes('"jsonrpc"')) {
        try {
          const jsonResponse = JSON.parse(response.split('\n').find(line => line.includes('"jsonrpc"')));
          resolve(jsonResponse);
        } catch (err) {
          reject(new Error(`Failed to parse JSON response: ${err.message}`));
        }
      } else {
        reject(new Error(`Server exited with code ${code}. stderr: ${errorOutput}`));
      }
    });

    server.on('error', (error) => {
      reject(error);
    });

    // Send the request
    server.stdin.write(JSON.stringify(request) + '\n');
    server.stdin.end();

    // Kill server after timeout
    setTimeout(() => {
      server.kill('SIGTERM');
    }, 8000);
  });
}

async function simulateAIAssistantWorkflow() {
  console.log('🤖 Simulating AI Assistant Workflow:\n');
  
  // Step 1: AI assistant wants to create a test
  console.log('1. 📝 AI Assistant: "Create a test that goes to example.com and checks the title"');
  
  const createRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'create_test_from_description',
      arguments: {
        description: 'Navigate to https://example.com and verify the page title contains "Example Domain"',
        name: 'Example Domain Title Test'
      }
    }
  };

  const createResponse = await sendMCPRequest(createRequest);
  
  if (createResponse.error) {
    throw new Error(`Failed to create test: ${createResponse.error.message}`);
  }

  const createResult = JSON.parse(createResponse.result.content[0].text);
  console.log(`   ✅ Created test case: "${createResult.testCase.name}" (ID: ${createResult.testCaseId})`);
  console.log(`   📋 Actions generated: ${createResult.testCase.actions.length} steps\n`);

  // Step 2: AI assistant lists all available tests
  console.log('2. 📊 AI Assistant: "Show me all available test cases"');
  
  const listRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'list_test_cases',
      arguments: {}
    }
  };

  const listResponse = await sendMCPRequest(listRequest);
  const listResult = JSON.parse(listResponse.result.content[0].text);
  console.log(`   📋 Found ${listResult.testCases.length} test case(s):`);
  
  listResult.testCases.forEach((tc, index) => {
    console.log(`      ${index + 1}. ${tc.name} (ID: ${tc.id})`);
  });
  console.log();

  // Step 3: AI assistant checks browser status
  console.log('3. 🌐 AI Assistant: "Check if browsers are ready for testing"');
  
  const statusRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_browser_status',
      arguments: {}
    }
  };

  const statusResponse = await sendMCPRequest(statusRequest);
  const statusResult = JSON.parse(statusResponse.result.content[0].text);
  console.log(`   🔍 Browser status: ${statusResult.status}`);
  console.log(`   💬 Message: ${statusResult.message}\n`);

  // Step 4: AI assistant parses natural language for another test
  console.log('4. 🧠 AI Assistant: "Parse this test description: Go to Google and search for MCP"');
  
  const parseRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'parse_natural_language',
      arguments: {
        instructions: 'Go to Google homepage, enter "Model Context Protocol" in the search box, and click search'
      }
    }
  };

  const parseResponse = await sendMCPRequest(parseRequest);
  const parseResult = JSON.parse(parseResponse.result.content[0].text);
  
  if (parseResult.success) {
    console.log(`   ✅ Successfully parsed instructions`);
    console.log(`   🎯 Generated ${parseResult.parsed.testCase.actions.length} actions for the test\n`);
  }

  // Step 5: Show what was parsed
  console.log('5. 📖 AI Assistant: "Here\'s what I understood from your description:"');
  const parsedTest = parseResult.parsed.testCase;
  console.log(`   Test Name: ${parsedTest.name}`);
  console.log(`   Target URL: ${parsedTest.url}`);
  console.log(`   Actions:`);
  
  parsedTest.actions.forEach((action, index) => {
    console.log(`      ${index + 1}. ${action.type} - ${action.description || 'No description'}`);
  });

  console.log('\n🎉 Integration test completed successfully!');
  console.log('\n💡 This demonstrates how an AI assistant can:');
  console.log('   • Create test cases from natural language descriptions');
  console.log('   • List and manage existing test cases');
  console.log('   • Check system status');
  console.log('   • Parse complex test instructions');
  console.log('   • Generate structured test actions');
  console.log('\n🔌 Ready for integration with AI assistants supporting MCP!');
}

async function main() {
  try {
    await simulateAIAssistantWorkflow();
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}