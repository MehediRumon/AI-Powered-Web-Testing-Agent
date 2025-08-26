const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept CSV, Excel, and JSON files
        const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV, Excel, and JSON files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload test cases file
router.post('/test-cases', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const db = getDatabase();
        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        // Record file upload in database
        db.run(
            'INSERT INTO uploaded_files (filename, original_name, file_path, file_type, user_id) VALUES (?, ?, ?, ?, ?)',
            [req.file.filename, req.file.originalname, filePath, fileExt, req.user.id],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                }
            }
        );

        let testCases = [];

        if (fileExt === '.csv') {
            // Parse CSV file
            testCases = await parseCsvFile(filePath);
        } else if (fileExt === '.xlsx' || fileExt === '.xls') {
            // Parse Excel file
            testCases = await parseExcelFile(filePath);
        } else if (fileExt === '.json') {
            // Parse JSON file
            testCases = await parseJsonFile(filePath);
        }

        // Save test cases to database
        const savedTestCases = [];
        for (const testCase of testCases) {
            if (testCase.name && testCase.url) {
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO test_cases (name, description, url, actions, user_id) VALUES (?, ?, ?, ?, ?)',
                        [testCase.name, testCase.description || '', testCase.url, JSON.stringify(testCase.actions || []), req.user.id],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                savedTestCases.push({
                                    id: this.lastID,
                                    ...testCase
                                });
                                resolve();
                            }
                        }
                    );
                });
            }
        }

        db.close();

        res.json({
            message: 'File uploaded and test cases imported successfully',
            file: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size
            },
            testCases: savedTestCases
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process uploaded file' });
    }
});

// Get uploaded files
router.get('/files', authenticateToken, (req, res) => {
    const db = getDatabase();

    db.all(
        'SELECT * FROM uploaded_files WHERE user_id = ? ORDER BY uploaded_at DESC',
        [req.user.id],
        (err, files) => {
            db.close();
            
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ files });
        }
    );
});

// Helper function to parse CSV file
function parseCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const testCases = [];
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                testCases.push({
                    name: row.name || row.Name || row.test_name,
                    description: row.description || row.Description,
                    url: row.url || row.URL || row.website,
                    actions: row.actions ? JSON.parse(row.actions) : []
                });
            })
            .on('end', () => {
                resolve(testCases);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

// Helper function to parse Excel file
function parseExcelFile(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            const testCases = data.map(row => ({
                name: row.name || row.Name || row.test_name,
                description: row.description || row.Description,
                url: row.url || row.URL || row.website,
                actions: row.actions ? JSON.parse(row.actions) : []
            }));

            resolve(testCases);
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to parse JSON file
function parseJsonFile(filePath) {
    return new Promise((resolve, reject) => {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(fileContent);
            
            let testCases = [];
            
            // Handle both array of test cases and single test case
            if (Array.isArray(data)) {
                testCases = data.map(item => ({
                    name: item.name || item.testName || item.title,
                    description: item.description || item.desc,
                    url: item.url || item.baseUrl || item.website,
                    actions: item.actions || item.steps || []
                }));
            } else if (data.testCases && Array.isArray(data.testCases)) {
                testCases = data.testCases.map(item => ({
                    name: item.name || item.testName || item.title,
                    description: item.description || item.desc,
                    url: item.url || item.baseUrl || item.website,
                    actions: item.actions || item.steps || []
                }));
            } else {
                // Single test case
                testCases = [{
                    name: data.name || data.testName || data.title,
                    description: data.description || data.desc,
                    url: data.url || data.baseUrl || data.website,
                    actions: data.actions || data.steps || []
                }];
            }
            
            resolve(testCases);
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = router;