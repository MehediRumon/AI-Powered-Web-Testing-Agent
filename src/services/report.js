const fs = require('fs');
const path = require('path');

class ReportService {
    generateHTML(testResults, summary = {}) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; flex: 1; }
        .success { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .test-result { border: 1px solid #ddd; margin-bottom: 20px; border-radius: 5px; overflow: hidden; }
        .test-header { background: #f9f9f9; padding: 15px; border-bottom: 1px solid #ddd; }
        .test-content { padding: 15px; }
        .status-success { color: #4CAF50; font-weight: bold; }
        .status-failed { color: #f44336; font-weight: bold; }
        .steps { background: #f8f9fa; padding: 10px; margin-top: 10px; border-radius: 3px; }
        .error { background: #fee; color: #c33; padding: 10px; border-radius: 3px; margin-top: 10px; }
        .screenshot { margin-top: 10px; }
        .screenshot img { max-width: 300px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Web Testing Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div style="font-size: 24px; font-weight: bold;">${summary.total || testResults.length}</div>
        </div>
        <div class="summary-card success">
            <h3>Passed</h3>
            <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${summary.passed || 0}</div>
        </div>
        <div class="summary-card failed">
            <h3>Failed</h3>
            <div style="font-size: 24px; font-weight: bold; color: #f44336;">${summary.failed || 0}</div>
        </div>
        <div class="summary-card">
            <h3>Success Rate</h3>
            <div style="font-size: 24px; font-weight: bold;">${summary.total ? Math.round((summary.passed / summary.total) * 100) : 0}%</div>
        </div>
    </div>

    <h2>Test Results</h2>
    ${testResults.map(result => `
        <div class="test-result">
            <div class="test-header">
                <h3>${result.test_case_name || result.testCaseName || 'Unknown Test'}</h3>
                <p><strong>URL:</strong> ${result.test_case_url || result.url || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="status-${result.status}">${result.status.toUpperCase()}</span></p>
                <p><strong>Execution Time:</strong> ${result.execution_time || result.executionTime || 0}ms</p>
                <p><strong>Executed At:</strong> ${result.executed_at ? new Date(result.executed_at).toLocaleString() : new Date().toLocaleString()}</p>
            </div>
            <div class="test-content">
                ${result.steps && result.steps.length > 0 ? `
                    <div class="steps">
                        <strong>Steps Executed:</strong>
                        <ul>
                            ${result.steps.map(step => `<li>${step}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${result.error_message || result.errorMessage ? `
                    <div class="error">
                        <strong>Error:</strong> ${result.error_message || result.errorMessage}
                    </div>
                ` : ''}
                
                ${result.screenshot_path || result.screenshotPath ? `
                    <div class="screenshot">
                        <strong>Screenshot:</strong><br>
                        <em>Screenshot saved at: ${result.screenshot_path || result.screenshotPath}</em>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('')}
</body>
</html>`;
        return html;
    }

    async saveHTMLReport(testResults, summary = {}, filename = null) {
        const html = this.generateHTML(testResults, summary);
        const reportsDir = path.join(process.cwd(), 'reports');
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportFilename = filename || `test-report-${Date.now()}.html`;
        const reportPath = path.join(reportsDir, reportFilename);
        
        fs.writeFileSync(reportPath, html, 'utf8');
        
        return {
            path: reportPath,
            filename: reportFilename,
            url: `/reports/${reportFilename}`
        };
    }

    async generatePDFReport(testResults, summary = {}) {
        // For a minimal implementation, we'll use the HTML report
        // In a production environment, you might want to use puppeteer or similar for PDF generation
        try {
            const puppeteer = require('puppeteer');
            
            const html = this.generateHTML(testResults, summary);
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            await page.setContent(html);
            
            const reportsDir = path.join(process.cwd(), 'reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const pdfFilename = `test-report-${Date.now()}.pdf`;
            const pdfPath = path.join(reportsDir, pdfFilename);
            
            await page.pdf({
                path: pdfPath,
                format: 'A4',
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                }
            });
            
            await browser.close();
            
            return {
                path: pdfPath,
                filename: pdfFilename,
                url: `/reports/${pdfFilename}`
            };
        } catch (error) {
            // Fallback to HTML report if puppeteer is not available
            console.warn('PDF generation failed, falling back to HTML report:', error.message);
            return await this.saveHTMLReport(testResults, summary);
        }
    }
}

module.exports = ReportService;