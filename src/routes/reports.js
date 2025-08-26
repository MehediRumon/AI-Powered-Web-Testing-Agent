const express = require('express');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const ReportService = require('../services/report');

const router = express.Router();
const reportService = new ReportService();

// Generate HTML report
router.post('/generate/html', authenticateToken, async (req, res) => {
    try {
        const { testResultIds } = req.body;
        const db = getDatabase();

        let query = `
            SELECT tr.*, tc.name as test_case_name, tc.url as test_case_url 
            FROM test_results tr 
            JOIN test_cases tc ON tr.test_case_id = tc.id 
            WHERE tc.user_id = ?
        `;
        let params = [req.user.id];

        if (testResultIds && testResultIds.length > 0) {
            const placeholders = testResultIds.map(() => '?').join(',');
            query += ` AND tr.id IN (${placeholders})`;
            params.push(...testResultIds);
        }

        query += ' ORDER BY tr.executed_at DESC';

        const testResults = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        db.close();

        if (testResults.length === 0) {
            return res.status(404).json({ error: 'No test results found' });
        }

        const summary = {
            total: testResults.length,
            passed: testResults.filter(r => r.status === 'success').length,
            failed: testResults.filter(r => r.status === 'failed').length
        };

        const report = await reportService.saveHTMLReport(testResults, summary);

        res.json({
            message: 'HTML report generated successfully',
            report: {
                ...report,
                summary,
                testCount: testResults.length
            }
        });

    } catch (error) {
        console.error('Generate HTML report error:', error);
        res.status(500).json({ error: 'Failed to generate HTML report' });
    }
});

// Generate PDF report
router.post('/generate/pdf', authenticateToken, async (req, res) => {
    try {
        const { testResultIds } = req.body;
        const db = getDatabase();

        let query = `
            SELECT tr.*, tc.name as test_case_name, tc.url as test_case_url 
            FROM test_results tr 
            JOIN test_cases tc ON tr.test_case_id = tc.id 
            WHERE tc.user_id = ?
        `;
        let params = [req.user.id];

        if (testResultIds && testResultIds.length > 0) {
            const placeholders = testResultIds.map(() => '?').join(',');
            query += ` AND tr.id IN (${placeholders})`;
            params.push(...testResultIds);
        }

        query += ' ORDER BY tr.executed_at DESC';

        const testResults = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        db.close();

        if (testResults.length === 0) {
            return res.status(404).json({ error: 'No test results found' });
        }

        const summary = {
            total: testResults.length,
            passed: testResults.filter(r => r.status === 'success').length,
            failed: testResults.filter(r => r.status === 'failed').length
        };

        const report = await reportService.generatePDFReport(testResults, summary);

        res.json({
            message: 'PDF report generated successfully',
            report: {
                ...report,
                summary,
                testCount: testResults.length
            }
        });

    } catch (error) {
        console.error('Generate PDF report error:', error);
        res.status(500).json({ error: 'Failed to generate PDF report' });
    }
});

// Download report file
router.get('/download/:filename', authenticateToken, (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(process.cwd(), 'reports', filename);

        // Security check - ensure file is in reports directory
        const normalizedPath = path.normalize(filePath);
        const reportsDir = path.normalize(path.join(process.cwd(), 'reports'));
        
        if (!normalizedPath.startsWith(reportsDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Report file not found' });
        }

        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        
        if (ext === '.html') {
            contentType = 'text/html';
        } else if (ext === '.pdf') {
            contentType = 'application/pdf';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download report error:', error);
        res.status(500).json({ error: 'Failed to download report' });
    }
});

// List available reports
router.get('/list', authenticateToken, (req, res) => {
    try {
        const reportsDir = path.join(process.cwd(), 'reports');
        
        if (!fs.existsSync(reportsDir)) {
            return res.json({ reports: [] });
        }

        const files = fs.readdirSync(reportsDir).filter(file => {
            return file.endsWith('.html') || file.endsWith('.pdf');
        });

        const reports = files.map(filename => {
            const filePath = path.join(reportsDir, filename);
            const stats = fs.statSync(filePath);
            
            return {
                filename,
                size: stats.size,
                created: stats.mtime,
                type: path.extname(filename).substring(1).toUpperCase(),
                downloadUrl: `/api/reports/download/${filename}`
            };
        }).sort((a, b) => new Date(b.created) - new Date(a.created));

        res.json({ reports });

    } catch (error) {
        console.error('List reports error:', error);
        res.status(500).json({ error: 'Failed to list reports' });
    }
});

// Serve report files directly (for viewing in browser)
router.use('/files', express.static(path.join(process.cwd(), 'reports')));

module.exports = router;