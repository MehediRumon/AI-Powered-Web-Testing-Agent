const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');

function initDatabase() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
        } else {
            console.log('Connected to SQLite database');
        }
    });

    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create test_cases table
    db.run(`
        CREATE TABLE IF NOT EXISTS test_cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            url TEXT NOT NULL,
            actions TEXT, -- JSON string of test actions
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // Create test_results table
    db.run(`
        CREATE TABLE IF NOT EXISTS test_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_case_id INTEGER,
            status TEXT NOT NULL,
            execution_time INTEGER,
            error_message TEXT,
            screenshot_path TEXT,
            report_path TEXT,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_case_id) REFERENCES test_cases (id)
        )
    `);

    // Create uploaded_files table
    db.run(`
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            user_id INTEGER,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // Create api_configs table
    db.run(`
        CREATE TABLE IF NOT EXISTS api_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE,
            openai_api_key TEXT,
            groq_api_key TEXT,
            grok_api_key TEXT,
            preferred_api_provider TEXT DEFAULT 'openai',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // Add migration for existing api_configs table
    db.run(`
        ALTER TABLE api_configs ADD COLUMN grok_api_key TEXT
    `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Migration error for grok_api_key:', err);
        }
    });

    db.run(`
        ALTER TABLE api_configs ADD COLUMN preferred_api_provider TEXT DEFAULT 'openai'
    `, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Migration error for preferred_api_provider:', err);
        }
    });

    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database initialized successfully');
        }
    });
}

function getDatabase() {
    return new sqlite3.Database(dbPath);
}

module.exports = { initDatabase, getDatabase };