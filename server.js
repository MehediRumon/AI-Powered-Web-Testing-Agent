const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create uploads and reports directories if they don't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const reportsDir = path.join(__dirname, 'reports');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// Initialize database
const { initDatabase } = require('./src/database/init');
initDatabase();

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/upload', require('./src/routes/upload'));
app.use('/api/test', require('./src/routes/test'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/config', require('./src/routes/config'));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI-Powered Web Testing Agent is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`AI-Powered Web Testing Agent running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});

module.exports = app;