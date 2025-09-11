#!/usr/bin/env node

/**
 * MCP Server validation script
 * This script validates that the MCP server is properly configured and ready to use
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating AI Web Testing Agent MCP Server...\n');

let validationPassed = true;

function validateFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} - Found`);
    return true;
  } else {
    console.log(`❌ ${description} - Missing: ${filePath}`);
    validationPassed = false;
    return false;
  }
}

function validatePackageJson() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  if (!validateFile(packageJsonPath, 'package.json')) {
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check for MCP SDK dependency
    if (packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/sdk']) {
      console.log('✅ MCP SDK dependency - Found');
    } else {
      console.log('❌ MCP SDK dependency - Missing');
      validationPassed = false;
    }

    // Check for MCP scripts
    if (packageJson.scripts && packageJson.scripts['mcp']) {
      console.log('✅ MCP start script - Found');
    } else {
      console.log('❌ MCP start script - Missing');
      validationPassed = false;
    }

    return true;
  } catch (error) {
    console.log(`❌ package.json - Invalid JSON: ${error.message}`);
    validationPassed = false;
    return false;
  }
}

function validateMCPFiles() {
  const mcpServerPath = path.join(__dirname, '../src/mcp/server.js');
  const mcpConfigPath = path.join(__dirname, '../mcp-config.json');
  const mcpReadmePath = path.join(__dirname, '../src/mcp/README.md');
  const mcpExamplesPath = path.join(__dirname, '../src/mcp/examples.md');

  validateFile(mcpServerPath, 'MCP Server implementation');
  validateFile(mcpConfigPath, 'MCP configuration file');
  validateFile(mcpReadmePath, 'MCP documentation');
  validateFile(mcpExamplesPath, 'MCP examples');
}

function validateTestFiles() {
  const basicTestPath = path.join(__dirname, '../tests/test-mcp-server.js');
  const comprehensiveTestPath = path.join(__dirname, '../tests/test-mcp-comprehensive.js');
  const integrationTestPath = path.join(__dirname, '../tests/test-mcp-integration.js');

  validateFile(basicTestPath, 'MCP basic test');
  validateFile(comprehensiveTestPath, 'MCP comprehensive test');
  validateFile(integrationTestPath, 'MCP integration test');
}

function validateDependencies() {
  const requiredPaths = [
    '../src/database/init.js',
    '../src/services/playwright.js',
    '../src/services/openai.js',
    '../src/middleware/auth.js'
  ];

  requiredPaths.forEach(relativePath => {
    const fullPath = path.join(__dirname, relativePath);
    validateFile(fullPath, `Dependency: ${path.basename(relativePath)}`);
  });
}

async function main() {
  console.log('📦 Package Configuration');
  validatePackageJson();

  console.log('\n🔧 MCP Server Files');
  validateMCPFiles();

  console.log('\n🧪 Test Files');
  validateTestFiles();

  console.log('\n🔗 Dependencies');
  validateDependencies();

  console.log('\n' + '='.repeat(50));
  
  if (validationPassed) {
    console.log('🎉 MCP Server validation passed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the MCP server: npm run mcp');
    console.log('   2. Test functionality: npm run test-mcp');
    console.log('   3. Configure your AI assistant to use the MCP server');
    console.log('   4. See src/mcp/examples.md for usage examples');
    console.log('\n✨ The AI Web Testing Agent is ready for MCP integration!');
    process.exit(0);
  } else {
    console.log('❌ MCP Server validation failed!');
    console.log('\n🔧 Fix the issues above and run validation again.');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error.message);
    process.exit(1);
  });
}