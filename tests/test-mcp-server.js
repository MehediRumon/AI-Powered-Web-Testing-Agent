#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('Testing AI Web Testing Agent MCP Server...\n');

const mcpServerPath = path.join(__dirname, '../src/mcp/server.js');

try {
  // Test 1: Check if the MCP server can start
  console.log('🔍 Test 1: Checking MCP server startup...');
  
  // Create a simple test by sending a list tools request
  const testInput = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  }) + '\n';
  
  const result = execSync(`echo '${testInput}' | node "${mcpServerPath}"`, {
    encoding: 'utf8',
    timeout: 10000,
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ MCP server started successfully');
  console.log('📤 Response:', result.trim());
  
  // Test 2: Verify the response contains our tools
  if (result.includes('create_test_case') && 
      result.includes('parse_natural_language') && 
      result.includes('execute_test_case')) {
    console.log('✅ All expected tools are registered');
  } else {
    console.log('❌ Some expected tools are missing');
  }
  
  console.log('\n🎉 MCP Server tests completed successfully!');
  
} catch (error) {
  console.error('❌ MCP Server test failed:', error.message);
  if (error.stdout) {
    console.log('stdout:', error.stdout);
  }
  if (error.stderr) {
    console.log('stderr:', error.stderr);
  }
  process.exit(1);
}