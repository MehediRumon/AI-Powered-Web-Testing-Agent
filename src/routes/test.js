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
            expectedUrl: action.expectedUrl ? action.expectedUrl.replace(/[<>'"]/g, '') : undefined,
            elementType: action.elementType ? action.elementType.replace(/[<>'"]/g, '') : undefined
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

// Update a test case
router.put('/cases/:id', authenticateToken, (req, res) => {
    try {
        const testCaseId = req.params.id;
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

        // First check if the test case exists and belongs to the user
        db.get(
            'SELECT id FROM test_cases WHERE id = ? AND user_id = ?',
            [testCaseId, req.user.id],
            (err, existingTestCase) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!existingTestCase) {
                    db.close();
                    return res.status(404).json({ error: 'Test case not found' });
                }

                // Update the test case
                db.run(
                    'UPDATE test_cases SET name = ?, description = ?, url = ?, actions = ? WHERE id = ? AND user_id = ?',
                    [sanitizedName, sanitizedDescription, sanitizedUrl, JSON.stringify(validatedActions), testCaseId, req.user.id],
                    function(err) {
                        db.close();
                        
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ error: 'Failed to update test case' });
                        }

                        if (this.changes === 0) {
                            return res.status(404).json({ error: 'Test case not found' });
                        }

                        res.json({
                            message: 'Test case updated successfully',
                            testCase: {
                                id: parseInt(testCaseId),
                                name: sanitizedName,
                                description: sanitizedDescription,
                                url: sanitizedUrl,
                                actions: validatedActions
                            }
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Update test case error:', error);
        if (error.message.includes('URL') || error.message.includes('Actions') || error.message.includes('type')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a test case
router.delete('/cases/:id', authenticateToken, (req, res) => {
    const testCaseId = req.params.id;
    const db = getDatabase();

    // First check if the test case exists and belongs to the user
    db.get(
        'SELECT id FROM test_cases WHERE id = ? AND user_id = ?',
        [testCaseId, req.user.id],
        (err, existingTestCase) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }

            if (!existingTestCase) {
                db.close();
                return res.status(404).json({ error: 'Test case not found' });
            }

            // Delete associated test results first (cascade delete)
            db.run(
                'DELETE FROM test_results WHERE test_case_id = ?',
                [testCaseId],
                function(err) {
                    if (err) {
                        db.close();
                        console.error('Error deleting test results:', err);
                        return res.status(500).json({ error: 'Failed to delete associated test results' });
                    }

                    // Now delete the test case
                    db.run(
                        'DELETE FROM test_cases WHERE id = ? AND user_id = ?',
                        [testCaseId, req.user.id],
                        function(err) {
                            db.close();
                            
                            if (err) {
                                console.error('Database error:', err);
                                return res.status(500).json({ error: 'Failed to delete test case' });
                            }

                            if (this.changes === 0) {
                                return res.status(404).json({ error: 'Test case not found' });
                            }

                            res.json({
                                message: 'Test case deleted successfully',
                                deletedId: parseInt(testCaseId)
                            });
                        }
                    );
                }
            );
        }
    );
});

// Execute a test case
router.post('/execute/:id', authenticateToken, async (req, res) => {
    try {
        const testCaseId = req.params.id;
        const { browserType = 'chromium', headless = true, interactionDelay = 5 } = req.body;

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
            const result = await testService.runTest(testCase, { interactionDelay });

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
        const { browserType = 'chromium', headless = true, parallel = false, maxConcurrency = 3, interactionDelay = 5 } = req.body;
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

        const results = [];

        if (parallel && testCases.length > 1) {
            // Parallel execution
            const executeTestBatch = async (testCaseBatch) => {
                const testService = new PlaywrightTestService();
                const batchResults = [];
                
                try {
                    await testService.initialize(browserType, headless);
                    
                    for (const testCase of testCaseBatch) {
                        testCase.actions = JSON.parse(testCase.actions || '[]');
                        const result = await testService.runTest(testCase, { interactionDelay });

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

                        batchResults.push({
                            testCaseId: testCase.id,
                            testCaseName: testCase.name,
                            ...result
                        });
                    }
                } finally {
                    await testService.close();
                }
                
                return batchResults;
            };

            // Split test cases into batches for parallel execution
            const batches = [];
            for (let i = 0; i < testCases.length; i += maxConcurrency) {
                batches.push(testCases.slice(i, i + maxConcurrency));
            }

            // Execute batches in parallel
            const batchPromises = batches.map(batch => executeTestBatch(batch));
            const batchResults = await Promise.all(batchPromises);
            
            // Flatten results
            results.push(...batchResults.flat());
            
        } else {
            // Sequential execution (original implementation)
            const testService = new PlaywrightTestService();
            
            try {
                await testService.initialize(browserType, headless);

                for (const testCase of testCases) {
                    testCase.actions = JSON.parse(testCase.actions || '[]');
                    const result = await testService.runTest(testCase, { interactionDelay });

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
            } finally {
                await testService.close();
            }
        }

        db.close();

        res.json({
            message: 'All tests executed successfully',
            executionMode: parallel ? 'parallel' : 'sequential',
            results,
            summary: {
                total: results.length,
                passed: results.filter(r => r.status === 'success').length,
                failed: results.filter(r => r.status === 'failed').length
            }
        });

    } catch (error) {
        console.error('Execute all tests error:', error);
        res.status(500).json({ 
            error: 'Batch test execution failed',
            details: error.message 
        });
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

// Get a specific test result
router.get('/results/:id', authenticateToken, (req, res) => {
    const db = getDatabase();

    db.get(`
        SELECT tr.*, tc.name as test_case_name, tc.url as test_case_url 
        FROM test_results tr 
        JOIN test_cases tc ON tr.test_case_id = tc.id 
        WHERE tr.id = ? AND tc.user_id = ?
    `, [req.params.id, req.user.id], (err, result) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!result) {
            return res.status(404).json({ error: 'Test result not found' });
        }

        res.json({ result });
    });
});

// Update a test result
router.put('/results/:id', authenticateToken, (req, res) => {
    try {
        const resultId = req.params.id;
        const { status, execution_time, error_message, screenshot_path, report_path } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        // Validate status values
        const allowedStatuses = ['success', 'failed', 'pending', 'skipped'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: ' + allowedStatuses.join(', ') });
        }

        // Input validation and sanitization
        const sanitizedStatus = status.trim();
        const sanitizedErrorMessage = error_message ? error_message.trim().replace(/[<>]/g, '') : null;
        const sanitizedScreenshotPath = screenshot_path ? screenshot_path.trim().replace(/[<>'"]/g, '') : null;
        const sanitizedReportPath = report_path ? report_path.trim().replace(/[<>'"]/g, '') : null;
        const validExecutionTime = execution_time && !isNaN(execution_time) ? parseInt(execution_time) : null;

        const db = getDatabase();

        // First check if the test result exists and belongs to the user (via test case)
        db.get(`
            SELECT tr.id 
            FROM test_results tr 
            JOIN test_cases tc ON tr.test_case_id = tc.id 
            WHERE tr.id = ? AND tc.user_id = ?
        `, [resultId, req.user.id], (err, existingResult) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }

            if (!existingResult) {
                db.close();
                return res.status(404).json({ error: 'Test result not found' });
            }

            // Update the test result
            db.run(
                'UPDATE test_results SET status = ?, execution_time = ?, error_message = ?, screenshot_path = ?, report_path = ? WHERE id = ?',
                [sanitizedStatus, validExecutionTime, sanitizedErrorMessage, sanitizedScreenshotPath, sanitizedReportPath, resultId],
                function(err) {
                    db.close();
                    
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to update test result' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Test result not found' });
                    }

                    res.json({
                        message: 'Test result updated successfully',
                        result: {
                            id: parseInt(resultId),
                            status: sanitizedStatus,
                            execution_time: validExecutionTime,
                            error_message: sanitizedErrorMessage,
                            screenshot_path: sanitizedScreenshotPath,
                            report_path: sanitizedReportPath
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error('Update test result error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a test result
router.delete('/results/:id', authenticateToken, (req, res) => {
    const resultId = req.params.id;
    const db = getDatabase();

    // First check if the test result exists and belongs to the user (via test case)
    db.get(`
        SELECT tr.id 
        FROM test_results tr 
        JOIN test_cases tc ON tr.test_case_id = tc.id 
        WHERE tr.id = ? AND tc.user_id = ?
    `, [resultId, req.user.id], (err, existingResult) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (!existingResult) {
            db.close();
            return res.status(404).json({ error: 'Test result not found' });
        }

        // Delete the test result
        db.run(
            'DELETE FROM test_results WHERE id = ?',
            [resultId],
            function(err) {
                db.close();
                
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to delete test result' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Test result not found' });
                }

                res.json({
                    message: 'Test result deleted successfully',
                    deletedId: parseInt(resultId)
                });
            }
        );
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

        const aiService = await OpenAIService.createForUser(req.user.id);
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
            message: parsed.metadata?.usedFallback 
                ? `Instructions parsed with fallback due to ${parsed.metadata.fallbackReason === 'quota_exceeded' ? 'API quota limits' : 'rate limits'}. Rule-based parsing used.`
                : 'Instructions parsed successfully',
            parsed: { testCase },
            ...(parsed.metadata?.usedFallback && {
                warning: parsed.metadata.fallbackReason === 'quota_exceeded' 
                    ? 'OpenAI API quota exceeded. Consider checking your billing or upgrading your plan for full AI parsing.'
                    : 'OpenAI API rate limit reached. The system used rule-based fallback parsing.',
                fallback: 'You can create test cases manually or try again later for AI-powered parsing.'
            })
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

// Generate test case from URL using AI (now integrated with Grok)
router.post('/ai/generate-from-url', authenticateToken, async (req, res) => {
    try {
        const { url, autoExecute = false } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        console.log(`Generate from URL request for: ${url}, autoExecute: ${autoExecute}`);

        // Use OpenAI service for vision-based analysis
        const aiService = await OpenAIService.createForUser(req.user.id);
        const generated = await aiService.generateTestFromURL(url);

        // If autoExecute is true, save and execute the test case immediately
        if (autoExecute && generated.testCase) {
            try {
                const testCase = generated.testCase;
                testCase.user_id = req.user.id;
                testCase.created_at = new Date().toISOString();
                testCase.actions = JSON.stringify(testCase.actions || []);

                const db = getDatabase();
                
                // Save test case
                const saveResult = await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO test_cases (name, description, url, actions, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [testCase.name, testCase.description, testCase.url, testCase.actions, testCase.user_id, testCase.created_at],
                        function(err) {
                            if (err) reject(err);
                            else resolve({ id: this.lastID });
                        }
                    );
                });

                // Execute the test case immediately
                const PlaywrightTestService = require('../services/playwright');
                const testService = new PlaywrightTestService();
                
                // Parse actions back to array for execution
                testCase.actions = JSON.parse(testCase.actions);
                testCase.id = saveResult.id;

                await testService.initialize('chromium', false);
                const result = await testService.runTest(testCase, { interactionDelay: 2 });

                // Save test result
                db.run(
                    'INSERT INTO test_results (test_case_id, status, execution_time, error_message, screenshot_path) VALUES (?, ?, ?, ?, ?)',
                    [saveResult.id, result.status, result.executionTime, result.errorMessage, result.screenshotPath],
                    function(err) {
                        if (err) {
                            console.error('Failed to save test result:', err);
                        }
                    }
                );

                await testService.close();
                db.close();

                res.json({
                    message: 'Test case generated and executed successfully',
                    testCase: generated.testCase,
                    testCaseId: saveResult.id,
                    execution: {
                        status: result.status,
                        executionTime: result.executionTime,
                        screenshotPath: result.screenshotPath,
                        steps: result.steps
                    }
                });

            } catch (execError) {
                console.error('Auto-execution error:', execError);
                res.json({
                    message: 'Test case generated successfully, but auto-execution failed',
                    testCase: generated.testCase,
                    executionError: execError.message
                });
            }
        } else {
            // Just return the generated test case without executing
            res.json({
                message: 'Test case generated successfully from OpenAI vision analysis',
                testCase: generated.testCase
            });
        }

    } catch (error) {
        console.error('AI generation error:', error);
        
        // Check for specific error types
        if (error.message.includes('API') || error.message.includes('OpenAI')) {
            return res.status(503).json({ 
                error: 'AI service temporarily unavailable. Please check your OpenAI API configuration and try again later.',
                fallback: 'You can create test cases manually or use the basic generator.',
                suggestion: 'Make sure you have OPENAI_API_KEY configured in your .env file or user settings.'
            });
        } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            return res.status(400).json({ 
                error: 'Unable to access the specified URL. The domain may not exist or be unreachable from this server.',
                fallback: 'The system generated a comprehensive fallback test case based on the URL structure.',
                suggestion: 'Please verify the URL is correct and accessible. You can also try creating test cases manually.'
            });
        } else if (error.message.includes('net::ERR_') || error.message.includes('timeout')) {
            return res.status(400).json({ 
                error: 'Network error accessing the URL. The site may be slow, down, or have connectivity issues.',
                fallback: 'The system generated a comprehensive fallback test case based on the URL structure.',
                suggestion: 'Try again later or verify the URL is accessible from your location.'
            });
        } else if (error.message.includes('Browser initialization failed')) {
            return res.status(500).json({ 
                error: 'Browser initialization failed. This may be due to missing dependencies or environment issues.',
                fallback: 'The system generated a comprehensive fallback test case based on the URL structure.',
                suggestion: 'Make sure Playwright browsers are installed: npm run install-browsers'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to generate test case from URL',
            details: error.message
        });
    }
});

// Browse feature - take screenshot and generate test case using Grok
router.post('/ai/browse-and-generate', authenticateToken, async (req, res) => {
    try {
        const { url, autoExecute = false } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const GrokService = require('../services/grok');
        const grokService = new GrokService();
        
        console.log(`Browse request received for URL: ${url}, autoExecute: ${autoExecute}`);
        
        const generated = await grokService.browseAndGenerateTest(url);

        // If autoExecute is true, save and execute the test case immediately
        if (autoExecute && generated.testCase) {
            try {
                const testCase = generated.testCase;
                testCase.user_id = req.user.id;
                testCase.created_at = new Date().toISOString();
                testCase.actions = JSON.stringify(testCase.actions || []);

                const db = getDatabase();
                
                // Save test case
                const saveResult = await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO test_cases (name, description, url, actions, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        [testCase.name, testCase.description, testCase.url, testCase.actions, testCase.user_id, testCase.created_at],
                        function(err) {
                            if (err) reject(err);
                            else resolve({ id: this.lastID });
                        }
                    );
                });

                // Execute the test case immediately
                const PlaywrightTestService = require('../services/playwright');
                const testService = new PlaywrightTestService();
                
                // Parse actions back to array for execution
                testCase.actions = JSON.parse(testCase.actions);
                testCase.id = saveResult.id;

                await testService.initialize('chromium', false);
                const result = await testService.runTest(testCase, { interactionDelay: 2 });

                // Save test result
                db.run(
                    'INSERT INTO test_results (test_case_id, status, execution_time, error_message, screenshot_path) VALUES (?, ?, ?, ?, ?)',
                    [saveResult.id, result.status, result.executionTime, result.errorMessage, result.screenshotPath],
                    function(err) {
                        if (err) {
                            console.error('Failed to save test result:', err);
                        }
                    }
                );

                await testService.close();
                db.close();

                res.json({
                    message: 'Test case generated, saved and executed successfully',
                    testCase: generated.testCase,
                    testCaseId: saveResult.id,
                    execution: {
                        status: result.status,
                        executionTime: result.executionTime,
                        screenshotPath: result.screenshotPath,
                        steps: result.steps
                    }
                });

            } catch (execError) {
                console.error('Auto-execution error:', execError);
                res.json({
                    message: 'Test case generated successfully, but auto-execution failed',
                    testCase: generated.testCase,
                    executionError: execError.message
                });
            }
        } else {
            // Just return the generated test case without executing
            res.json({
                message: 'Test case generated successfully from Grok AI vision analysis',
                testCase: generated.testCase
            });
        }

    } catch (error) {
        console.error('Browse and generate error:', error);
        
        if (error.message.includes('API') || error.message.includes('Grok')) {
            return res.status(503).json({ 
                error: 'AI service temporarily unavailable. Please try again later.',
                fallback: 'You can create test cases manually or use the basic generator.'
            });
        }
        
        res.status(500).json({ error: 'Failed to browse and generate test case' });
    }
});

module.exports = router;