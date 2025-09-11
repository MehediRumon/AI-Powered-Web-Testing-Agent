#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');

const { getDatabase, initDatabase } = require('../database/init');
const PlaywrightTestService = require('../services/playwright');
const OpenAIService = require('../services/openai');

class WebTestingMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ai-web-testing-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_test_case',
            description: 'Create a new test case for web testing',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the test case',
                },
                description: {
                  type: 'string',
                  description: 'Description of the test case',
                },
                url: {
                  type: 'string',
                  description: 'URL to test',
                },
                actions: {
                  type: 'array',
                  description: 'Array of test actions to perform',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      selector: { type: 'string' },
                      value: { type: 'string' },
                      description: { type: 'string' },
                    },
                  },
                },
              },
              required: ['name', 'url'],
            },
          },
          {
            name: 'parse_natural_language',
            description: 'Parse natural language instructions into structured test actions',
            inputSchema: {
              type: 'object',
              properties: {
                instructions: {
                  type: 'string',
                  description: 'Natural language description of test steps',
                },
              },
              required: ['instructions'],
            },
          },
          {
            name: 'execute_test_case',
            description: 'Execute a specific test case',
            inputSchema: {
              type: 'object',
              properties: {
                testCaseId: {
                  type: 'number',
                  description: 'ID of the test case to execute',
                },
                headless: {
                  type: 'boolean',
                  description: 'Whether to run browser in headless mode',
                  default: true,
                },
              },
              required: ['testCaseId'],
            },
          },
          {
            name: 'list_test_cases',
            description: 'List all available test cases',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'number',
                  description: 'Optional user ID to filter test cases',
                },
              },
            },
          },
          {
            name: 'get_test_results',
            description: 'Get results of executed test cases',
            inputSchema: {
              type: 'object',
              properties: {
                testCaseId: {
                  type: 'number',
                  description: 'Optional test case ID to filter results',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10,
                },
              },
            },
          },
          {
            name: 'get_browser_status',
            description: 'Check browser installation status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'create_test_from_description',
            description: 'Create a complete test case from natural language description',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Natural language description of the complete test',
                },
                name: {
                  type: 'string',
                  description: 'Optional name for the test case',
                },
              },
              required: ['description'],
            },
          },
          {
            name: 'delete_test_case',
            description: 'Delete a test case',
            inputSchema: {
              type: 'object',
              properties: {
                testCaseId: {
                  type: 'number',
                  description: 'ID of the test case to delete',
                },
              },
              required: ['testCaseId'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_test_case':
            return await this.createTestCase(args);
          case 'parse_natural_language':
            return await this.parseNaturalLanguage(args);
          case 'execute_test_case':
            return await this.executeTestCase(args);
          case 'list_test_cases':
            return await this.listTestCases(args);
          case 'get_test_results':
            return await this.getTestResults(args);
          case 'get_browser_status':
            return await this.getBrowserStatus(args);
          case 'create_test_from_description':
            return await this.createTestFromDescription(args);
          case 'delete_test_case':
            return await this.deleteTestCase(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error.message}`
        );
      }
    });
  }

  async createTestCase(args) {
    const { name, description = '', url, actions = [] } = args;

    if (!name || !url) {
      throw new Error('Name and URL are required');
    }

    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      db.run(
        'INSERT INTO test_cases (name, description, url, actions, user_id) VALUES (?, ?, ?, ?, ?)',
        [name, description, url, JSON.stringify(actions), 1], // Default user ID 1 for MCP
        function(err) {
          db.close();
          
          if (err) {
            reject(err);
          } else {
            resolve({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    message: 'Test case created successfully',
                    testCaseId: this.lastID,
                    testCase: {
                      id: this.lastID,
                      name,
                      description,
                      url,
                      actions,
                    },
                  }, null, 2),
                },
              ],
            });
          }
        }
      );
    });
  }

  async parseNaturalLanguage(args) {
    const { instructions } = args;

    if (!instructions) {
      throw new Error('Instructions are required');
    }

    const aiService = new OpenAIService();
    const parsed = await aiService.parseTestInstructions(instructions);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Instructions parsed successfully',
            parsed,
          }, null, 2),
        },
      ],
    };
  }

  async executeTestCase(args) {
    const { testCaseId, headless = true } = args;

    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      db.get('SELECT * FROM test_cases WHERE id = ?', [testCaseId], async (err, testCase) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }

        if (!testCase) {
          db.close();
          reject(new Error('Test case not found'));
          return;
        }

        try {
          const playwrightService = new PlaywrightTestService();
          const result = await playwrightService.executeTestCase({
            ...testCase,
            actions: JSON.parse(testCase.actions || '[]'),
          }, { headless });

          // Save result to database
          db.run(
            'INSERT INTO test_results (test_case_id, status, execution_time, error_message, screenshot_path, report_path) VALUES (?, ?, ?, ?, ?, ?)',
            [testCaseId, result.status, result.executionTime, result.error, result.screenshotPath, result.reportPath],
            function(insertErr) {
              db.close();
              
              if (insertErr) {
                reject(insertErr);
              } else {
                resolve({
                  content: [
                    {
                      type: 'text',
                      text: JSON.stringify({
                        success: true,
                        message: 'Test case executed successfully',
                        result: {
                          ...result,
                          resultId: this.lastID,
                        },
                      }, null, 2),
                    },
                  ],
                });
              }
            }
          );
        } catch (error) {
          db.close();
          reject(error);
        }
      });
    });
  }

  async listTestCases(args) {
    const { userId } = args;

    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      let query = 'SELECT * FROM test_cases';
      let params = [];
      
      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY created_at DESC';

      db.all(query, params, (err, testCases) => {
        db.close();
        
        if (err) {
          reject(err);
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  testCases: testCases.map(tc => ({
                    ...tc,
                    actions: JSON.parse(tc.actions || '[]'),
                  })),
                }, null, 2),
              },
            ],
          });
        }
      });
    });
  }

  async getTestResults(args) {
    const { testCaseId, limit = 10 } = args;

    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      let query = 'SELECT * FROM test_results';
      let params = [];
      
      if (testCaseId) {
        query += ' WHERE test_case_id = ?';
        params.push(testCaseId);
      }
      
      query += ' ORDER BY executed_at DESC LIMIT ?';
      params.push(limit);

      db.all(query, params, (err, results) => {
        db.close();
        
        if (err) {
          reject(err);
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  results,
                }, null, 2),
              },
            ],
          });
        }
      });
    });
  }

  async getBrowserStatus() {
    const { execSync } = require('child_process');
    
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              status: 'installed',
              message: 'Playwright is installed and ready to use',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              status: 'not_installed',
              message: 'Playwright browsers need to be installed',
              installCommand: 'npm run install-browsers',
            }, null, 2),
          },
        ],
      };
    }
  }

  async createTestFromDescription(args) {
    const { description, name } = args;

    if (!description) {
      throw new Error('Description is required');
    }

    try {
      // First, parse the natural language description
      const aiService = new OpenAIService();
      const parsed = await aiService.parseTestInstructions(description);

      if (!parsed || !parsed.testCase) {
        throw new Error('Failed to parse test description');
      }

      const testCase = parsed.testCase;
      const testName = name || testCase.name || 'AI Generated Test';
      const testUrl = testCase.url || 'https://example.com';
      const testDescription = testCase.description || description;
      const actions = testCase.actions || [];

      // Create the test case in the database
      return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        db.run(
          'INSERT INTO test_cases (name, description, url, actions, user_id) VALUES (?, ?, ?, ?, ?)',
          [testName, testDescription, testUrl, JSON.stringify(actions), 1],
          function(err) {
            db.close();
            
            if (err) {
              reject(err);
            } else {
              resolve({
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      message: 'Test case created successfully from description',
                      testCaseId: this.lastID,
                      testCase: {
                        id: this.lastID,
                        name: testName,
                        description: testDescription,
                        url: testUrl,
                        actions,
                      },
                      originalDescription: description,
                      parsedResult: parsed,
                    }, null, 2),
                  },
                ],
              });
            }
          }
        );
      });
    } catch (error) {
      throw new Error(`Failed to create test from description: ${error.message}`);
    }
  }

  async deleteTestCase(args) {
    const { testCaseId } = args;

    if (!testCaseId) {
      throw new Error('Test case ID is required');
    }

    return new Promise((resolve, reject) => {
      const db = getDatabase();
      
      // First check if test case exists
      db.get('SELECT * FROM test_cases WHERE id = ?', [testCaseId], (err, testCase) => {
        if (err) {
          db.close();
          reject(err);
          return;
        }

        if (!testCase) {
          db.close();
          reject(new Error('Test case not found'));
          return;
        }

        // Delete the test case
        db.run('DELETE FROM test_cases WHERE id = ?', [testCaseId], function(deleteErr) {
          if (deleteErr) {
            db.close();
            reject(deleteErr);
            return;
          }

          // Also delete associated test results
          db.run('DELETE FROM test_results WHERE test_case_id = ?', [testCaseId], function(resultDeleteErr) {
            db.close();
            
            if (resultDeleteErr) {
              console.warn('Failed to delete test results:', resultDeleteErr);
            }

            resolve({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    message: 'Test case deleted successfully',
                    deletedTestCase: {
                      id: testCase.id,
                      name: testCase.name,
                    },
                  }, null, 2),
                },
              ],
            });
          });
        });
      });
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AI Web Testing Agent MCP Server running on stdio');
  }
}

async function main() {
  // Initialize database first
  initDatabase();
  
  const server = new WebTestingMCPServer();
  await server.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = WebTestingMCPServer;