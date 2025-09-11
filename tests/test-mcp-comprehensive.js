#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Comprehensive MCP Server Test Suite\n');

const mcpServerPath = path.join(__dirname, '../src/mcp/server.js');

let testPassed = 0;
let testFailed = 0;

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
      if (code === 0 || response.includes('"jsonrpc"')) {
        resolve({ response, errorOutput });
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
    }, 5000);
  });
}

async function runTest(testName, testFunction) {
  try {
    console.log(`🔍 ${testName}...`);
    await testFunction();
    console.log(`✅ ${testName} - PASSED\n`);
    testPassed++;
  } catch (error) {
    console.log(`❌ ${testName} - FAILED`);
    console.log(`   Error: ${error.message}\n`);
    testFailed++;
  }
}

async function testListTools() {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  const { response } = await sendMCPRequest(request);
  const data = JSON.parse(response.split('\n').find(line => line.includes('"jsonrpc"')));
  
  if (!data.result || !data.result.tools) {
    throw new Error('No tools found in response');
  }

  const expectedTools = [
    'create_test_case',
    'parse_natural_language',
    'execute_test_case',
    'list_test_cases',
    'get_test_results',
    'get_browser_status',
    'create_test_from_description',
    'delete_test_case'
  ];

  const actualTools = data.result.tools.map(tool => tool.name);
  
  for (const expectedTool of expectedTools) {
    if (!actualTools.includes(expectedTool)) {
      throw new Error(`Missing expected tool: ${expectedTool}`);
    }
  }

  console.log(`   Found ${data.result.tools.length} tools`);
}

async function testParseNaturalLanguage() {
  const request = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'parse_natural_language',
      arguments: {
        instructions: 'Navigate to https://example.com and click the submit button'
      }
    }
  };

  const { response } = await sendMCPRequest(request);
  const data = JSON.parse(response.split('\n').find(line => line.includes('"jsonrpc"')));
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }

  if (!data.result || !data.result.content) {
    throw new Error('No content in response');
  }

  const content = JSON.parse(data.result.content[0].text);
  if (!content.success) {
    throw new Error('Parse operation failed');
  }

  console.log('   Successfully parsed natural language instructions');
}

async function testGetBrowserStatus() {
  const request = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_browser_status',
      arguments: {}
    }
  };

  const { response } = await sendMCPRequest(request);
  const data = JSON.parse(response.split('\n').find(line => line.includes('"jsonrpc"')));
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }

  if (!data.result || !data.result.content) {
    throw new Error('No content in response');
  }

  const content = JSON.parse(data.result.content[0].text);
  console.log(`   Browser status: ${content.status}`);
}

async function testCreateTestCase() {
  const request = {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'create_test_case',
      arguments: {
        name: 'Test Case from MCP',
        description: 'Test case created via MCP server',
        url: 'https://example.com',
        actions: [
          {
            type: 'navigate',
            url: 'https://example.com',
            description: 'Navigate to example.com'
          }
        ]
      }
    }
  };

  const { response } = await sendMCPRequest(request);
  const data = JSON.parse(response.split('\n').find(line => line.includes('"jsonrpc"')));
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }

  if (!data.result || !data.result.content) {
    throw new Error('No content in response');
  }

  const content = JSON.parse(data.result.content[0].text);
  if (!content.success) {
    throw new Error('Test case creation failed');
  }

  console.log(`   Created test case with ID: ${content.testCaseId}`);
  return content.testCaseId;
}

async function testListTestCases() {
  const request = {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'list_test_cases',
      arguments: {}
    }
  };

  const { response } = await sendMCPRequest(request);
  const data = JSON.parse(response.split('\n').find(line => line.includes('"jsonrpc"')));
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }

  if (!data.result || !data.result.content) {
    throw new Error('No content in response');
  }

  const content = JSON.parse(data.result.content[0].text);
  if (!content.success) {
    throw new Error('List test cases failed');
  }

  console.log(`   Found ${content.testCases.length} test case(s)`);
  return content.testCases;
}

async function testCreateFromDescription() {
  const request = {
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'create_test_from_description',
      arguments: {
        description: 'Go to Google and search for MCP',
        name: 'Google MCP Search Test'
      }
    }
  };

  const { response } = await sendMCPRequest(request);
  const data = JSON.parse(response.split('\n').find(line => line.includes('"jsonrpc"')));
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }

  if (!data.result || !data.result.content) {
    throw new Error('No content in response');
  }

  const content = JSON.parse(data.result.content[0].text);
  if (!content.success) {
    throw new Error('Create test from description failed');
  }

  console.log(`   Created test case "${content.testCase.name}" with ID: ${content.testCaseId}`);
  return content.testCaseId;
}

async function testInvalidTool() {
  const request = {
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'invalid_tool_name',
      arguments: {}
    }
  };

  const { response } = await sendMCPRequest(request);
  const data = JSON.parse(response.split('\n').find(line => line.includes('"jsonrpc"')));
  
  if (!data.error) {
    throw new Error('Expected error for invalid tool, but got success');
  }

  if (data.error.code !== -32601) {
    throw new Error(`Expected error code -32601, got ${data.error.code}`);
  }

  console.log('   Correctly returned error for invalid tool');
}

async function main() {
  console.log('Starting comprehensive MCP server tests...\n');

  await runTest('List Tools', testListTools);
  await runTest('Parse Natural Language', testParseNaturalLanguage);
  await runTest('Get Browser Status', testGetBrowserStatus);
  await runTest('Create Test Case', testCreateTestCase);
  await runTest('List Test Cases', testListTestCases);
  await runTest('Create Test from Description', testCreateFromDescription);
  await runTest('Invalid Tool Error Handling', testInvalidTool);

  console.log('='.repeat(50));
  console.log(`📊 Test Results: ${testPassed} passed, ${testFailed} failed`);
  
  if (testFailed === 0) {
    console.log('🎉 All MCP server tests passed successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});