const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const PlaywrightTestService = require('../services/playwright');
const OpenAIService = require('../services/openai');

const router = express.Router();

// Helper function to validate and sanitize URL
function validateAndSanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('URL is required and must be a string');
    }
    
    // Remove potentially dangerous characters
    const sanitized = url.trim().replace(/[<>'"]/g, '');
    
    // Basic URL validation
    if (!sanitized.match(/^https?:\/\/.+/) && !sanitized.startsWith('/')) {
        throw new Error('URL must be a valid HTTP/HTTPS URL or start with /');
    }
    
    return sanitized;
}

// Helper function to validate test case actions
function validateActions(actions) {
    if (!actions) return [];
    
    if (!Array.isArray(actions)) {
        throw new Error('Actions must be an array');
    }
    
    const allowedActionTypes = ['navigate', 'input', 'click', 'verify', 'wait', 'assert_visible', 'assert_text', 'fill', 'type', 'select', 'check', 'uncheck', 'hover', 'scroll'];
    
    return actions.map((action, index) => {
        if (!action.type) {
            throw new Error(`Action ${index + 1} must have a type`);
        }
        
        if (!allowedActionTypes.includes(action.type)) {
            throw new Error(`Invalid action type: ${action.type}`);
        }
        
        // Sanitize string fields
        const sanitized = {
            type: action.type,
            locator: action.locator ? action.locator.replace(/[<>'"]/g, '') : undefined,
            selector: action.selector ? action.selector.replace(/[<>'"]/g, '') : undefined,
            value: action.value ? action.value.replace(/[<>]/g, '') : undefined,
            description: action.description ? action.description.replace(/[<>]/g, '') : undefined,
            expectedUrl: action.expectedUrl ? action.expectedUrl.replace(/[<>'"]/g, '') : undefined
        };
        
        return sanitized;
    });
}

// Create a new test case
router.post('/cases', authenticateToken, (req, res) => {
    try {
        const { name, description, url, actions } = req.body;

        if (!name || !url) {
            return res.status(400).json({ error: 'Name and URL are required' });
        }

        // Input validation and sanitization
        const sanitizedName = name.trim().replace(/[<>'"]/g, '');
        const sanitizedDescription = description ? description.trim().replace(/[<>]/g, '') : '';
        const sanitizedUrl = validateAndSanitizeUrl(url);
        const validatedActions = validateActions(actions);

        if (sanitizedName.length < 1 || sanitizedName.length > 255) {
            return res.status(400).json({ error: 'Test name must be between 1 and 255 characters' });
        }

        const db = getDatabase();

        db.run(
            'INSERT INTO test_cases (name, description, url, actions, user_id) VALUES (?, ?, ?, ?, ?)',
            [sanitizedName, sanitizedDescription, sanitizedUrl, JSON.stringify(validatedActions), req.user.id],
            function(err) {
                db.close();
                
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to create test case' });
                }

                res.status(201).json({
                    message: 'Test case created successfully',
                    testCase: {
                        id: this.lastID,
                        name: sanitizedName,
                        description: sanitizedDescription,
                        url: sanitizedUrl,
                        actions: validatedActions
                    }
                });
            }
        );
    } catch (error) {
        console.error('Create test case error:', error);
        if (error.message.includes('URL') || error.message.includes('Actions') || error.message.includes('type')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all test cases for the user
router.get('/cases', authenticateToken, (req, res) => {
    const db = getDatabase();

    db.all(
        'SELECT * FROM test_cases WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        (err, testCases) => {
            db.close();
            
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Parse actions JSON
            const parsedTestCases = testCases.map(testCase => ({
                ...testCase,
                actions: JSON.parse(testCase.actions || '[]')
            }));

            res.json({ testCases: parsedTestCases });
        }
    );
});

// Get a specific test case
router.get('/cases/:id', authenticateToken, (req, res) => {
    const db = getDatabase();

    db.get(
        'SELECT * FROM test_cases WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id],
        (err, testCase) => {
            db.close();
            
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!testCase) {
                return res.status(404).json({ error: 'Test case not found' });
            }

            testCase.actions = JSON.parse(testCase.actions || '[]');
            res.json({ testCase });
        }
    );
});

// Execute a test case
router.post('/execute/:id', authenticateToken, async (req, res) => {
    try {
        const testCaseId = req.params.id;
        const { browserType = 'chromium', headless = true } = req.body;

        const db = getDatabase();

        // Get test case
        const testCase = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM test_cases WHERE id = ? AND user_id = ?',
                [testCaseId, req.user.id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!testCase) {
            db.close();
            return res.status(404).json({ error: 'Test case not found' });
        }

        testCase.actions = JSON.parse(testCase.actions || '[]');

        // Execute test
        const testService = new PlaywrightTestService();
        
        try {
            await testService.initialize(browserType, headless);
            const result = await testService.runTest(testCase);

            // Save test result
            db.run(
                'INSERT INTO test_results (test_case_id, status, execution_time, error_message, screenshot_path) VALUES (?, ?, ?, ?, ?)',
                [testCaseId, result.status, result.executionTime, result.errorMessage, result.screenshotPath],
                function(err) {
                    if (err) {
                        console.error('Failed to save test result:', err);
                    }
                }
            );

            await testService.close();
            db.close();

            res.json({
                message: 'Test executed successfully',
                result: {
                    ...result,
                    testCaseId,
                    resultId: this.lastID
                }
            });

        } catch (testError) {
            await testService.close();
            db.close();
            
            console.error('Test execution error:', testError);
            res.status(500).json({ 
                error: 'Test execution failed',
                details: testError.message 
            });
        }

    } catch (error) {
        console.error('Execute test error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Execute all test cases
router.post('/execute-all', authenticateToken, async (req, res) => {
    try {
        const { browserType = 'chromium', headless = true } = req.body;
        const db = getDatabase();

        // Get all test cases for the user
        const testCases = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM test_cases WHERE user_id = ?',
                [req.user.id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        if (testCases.length === 0) {
            db.close();
            return res.status(404).json({ error: 'No test cases found' });
        }

        const testService = new PlaywrightTestService();
        const results = [];

        try {
            await testService.initialize(browserType, headless);

            for (const testCase of testCases) {
                testCase.actions = JSON.parse(testCase.actions || '[]');
                const result = await testService.runTest(testCase);

                // Save test result
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO test_results (test_case_id, status, execution_time, error_message, screenshot_path) VALUES (?, ?, ?, ?, ?)',
                        [testCase.id, result.status, result.executionTime, result.errorMessage, result.screenshotPath],
                        function(err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                });

                results.push({
                    testCaseId: testCase.id,
                    testCaseName: testCase.name,
                    ...result
                });
            }

            await testService.close();
            db.close();

            res.json({
                message: 'All tests executed successfully',
                results,
                summary: {
                    total: results.length,
                    passed: results.filter(r => r.status === 'success').length,
                    failed: results.filter(r => r.status === 'failed').length
                }
            });

        } catch (testError) {
            await testService.close();
            db.close();
            
            console.error('Batch test execution error:', testError);
            res.status(500).json({ 
                error: 'Batch test execution failed',
                details: testError.message,
                partialResults: results
            });
        }

    } catch (error) {
        console.error('Execute all tests error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get test results
router.get('/results', authenticateToken, (req, res) => {
    const db = getDatabase();

    db.all(`
        SELECT tr.*, tc.name as test_case_name, tc.url as test_case_url 
        FROM test_results tr 
        JOIN test_cases tc ON tr.test_case_id = tc.id 
        WHERE tc.user_id = ? 
        ORDER BY tr.executed_at DESC
    `, [req.user.id], (err, results) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({ results });
    });
});

// Check browser installation status
router.get('/browser-status', (req, res) => {
    try {
        const { execSync } = require('child_process');
        
        // Try to check if browsers are installed
        try {
            execSync('npx playwright --version', { stdio: 'pipe' });
            res.json({ 
                status: 'installed',
                message: 'Playwright is installed and ready to use',
                installCommand: 'npm run install-browsers'
            });
        } catch (error) {
            res.json({ 
                status: 'not_installed',
                message: 'Playwright browsers need to be installed',
                installCommand: 'npm run install-browsers',
                manualCommand: 'npx playwright install'
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to check browser status' });
    }
});

// AI-powered test case generation from natural language
router.post('/ai/parse', authenticateToken, async (req, res) => {
    try {
        const { instructions } = req.body;

        if (!instructions) {
            return res.status(400).json({ error: 'Instructions are required' });
        }

        if (typeof instructions !== 'string') {
            return res.status(400).json({ error: 'Instructions must be a string' });
        }

        if (instructions.length > 5000) {
            return res.status(400).json({ error: 'Instructions are too long (max 5000 characters)' });
        }

        // Sanitize instructions
        const sanitizedInstructions = instructions.trim().replace(/[<>]/g, '');

        const aiService = new OpenAIService();
        const parsed = await aiService.parseTestInstructions(sanitizedInstructions);

        // Validate the parsed result
        if (!parsed || !parsed.testCase) {
            return res.status(400).json({ error: 'Failed to parse instructions into valid test case' });
        }

        // Additional validation of the parsed test case
        const { testCase } = parsed;
        if (!testCase.name || !testCase.url) {
            return res.status(400).json({ error: 'Parsed test case is missing required fields (name, url)' });
        }

        // Validate and sanitize the parsed actions
        try {
            testCase.actions = validateActions(testCase.actions);
            testCase.url = validateAndSanitizeUrl(testCase.url);
            testCase.name = testCase.name.trim().replace(/[<>'"]/g, '');
            testCase.description = testCase.description ? testCase.description.trim().replace(/[<>]/g, '') : '';
        } catch (validationError) {
            return res.status(400).json({ error: `Invalid parsed test case: ${validationError.message}` });
        }

        res.json({
            message: 'Instructions parsed successfully',
            parsed: { testCase }
        });

    } catch (error) {
        console.error('AI parsing error:', error);
        
        if (error.message.includes('API') || error.message.includes('OpenAI')) {
            return res.status(503).json({ 
                error: 'AI service temporarily unavailable. Please try again later.',
                fallback: 'You can create test cases manually or use the basic fallback parser.'
            });
        }
        
        res.status(500).json({ error: 'Failed to parse instructions' });
    }
});

// Generate test case from URL using AI
router.post('/ai/generate-from-url', authenticateToken, async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const aiService = new OpenAIService();
        const generated = await aiService.generateTestFromURL(url);

        res.json({
            message: 'Test case generated successfully',
            testCase: generated.testCase
        });

    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ error: 'Failed to generate test case' });
    }
});

module.exports = router;