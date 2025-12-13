// Script untuk mencari semua hardcoded API URLs
// Jalankan: node find-hardcoded-urls.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HARDCODED_PATTERNS = [
    'http://127.0.0.1:3333',
    'http://localhost:3333',
    'https://127.0.0.1:3333',
    'https://localhost:3333'
];

function scanDirectory(dir, results = []) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and dist
            if (!['node_modules', 'dist', '.git'].includes(file)) {
                scanDirectory(filePath, results);
            }
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            
            for (const pattern of HARDCODED_PATTERNS) {
                if (content.includes(pattern)) {
                    const lines = content.split('\n');
                    const matches = [];
                    
                    lines.forEach((line, index) => {
                        if (line.includes(pattern)) {
                            matches.push({
                                line: index + 1,
                                content: line.trim()
                            });
                        }
                    });
                    
                    if (matches.length > 0) {
                        results.push({
                            file: filePath.replace(__dirname, ''),
                            matches
                        });
                    }
                    break;
                }
            }
        }
    }
    
    return results;
}

const srcDir = path.join(__dirname, 'src');
const results = scanDirectory(srcDir);

console.log('\n=== HARDCODED API URLs FOUND ===\n');
console.log(`Total files with hardcoded URLs: ${results.length}\n`);

results.forEach(result => {
    console.log(`📄 ${result.file}`);
    result.matches.forEach(match => {
        console.log(`   Line ${match.line}: ${match.content}`);
    });
    console.log('');
});

console.log('\n=== SUMMARY ===');
console.log(`Files to update: ${results.length}`);
