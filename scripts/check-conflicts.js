#!/usr/bin/env node

/**
 * Script to check for Git merge conflict markers in source files
 * This helps prevent syntax errors caused by unresolved merge conflicts
 */

const fs = require('fs');
const path = require('path');

const CONFLICT_MARKERS = [
    '<<<<<<< HEAD',
    '=======',
    '>>>>>>>'
];

const SOURCE_EXTENSIONS = ['.js', '.json', '.ts', '.jsx', '.tsx'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'reports', 'uploads'];

function checkFileForConflicts(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const conflicts = [];

        lines.forEach((line, index) => {
            CONFLICT_MARKERS.forEach(marker => {
                if (line.trim().startsWith(marker)) {
                    conflicts.push({
                        file: filePath,
                        line: index + 1,
                        marker: marker,
                        content: line.trim()
                    });
                }
            });
        });

        return conflicts;
    } catch (error) {
        console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
        return [];
    }
}

function scanDirectory(dir, allConflicts = []) {
    try {
        const entries = fs.readdirSync(dir);
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (!EXCLUDE_DIRS.includes(entry)) {
                    scanDirectory(fullPath, allConflicts);
                }
            } else if (stat.isFile()) {
                const ext = path.extname(entry);
                if (SOURCE_EXTENSIONS.includes(ext)) {
                    const conflicts = checkFileForConflicts(fullPath);
                    allConflicts.push(...conflicts);
                }
            }
        }
    } catch (error) {
        console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
    }
    
    return allConflicts;
}

function main() {
    console.log('🔍 Checking for Git merge conflict markers...\n');
    
    const projectRoot = process.cwd();
    const conflicts = scanDirectory(projectRoot);
    
    if (conflicts.length === 0) {
        console.log('✅ No merge conflict markers found in source files.');
        console.log('🎉 All files are clean and ready for deployment!\n');
        process.exit(0);
    } else {
        console.log('❌ Found merge conflict markers in the following files:\n');
        
        conflicts.forEach(conflict => {
            console.log(`📄 ${conflict.file}:${conflict.line}`);
            console.log(`   ${conflict.marker}`);
            console.log(`   ${conflict.content}\n`);
        });
        
        console.log('🚨 Please resolve these conflicts before proceeding.');
        console.log('💡 Tip: Search for the conflict markers and manually resolve them.\n');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { checkFileForConflicts, scanDirectory };