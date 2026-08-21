const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const replacements = [
    { from: /#f54900/gi, to: '#C23A00' },
    { from: /#6a7282/gi, to: '#525B6C' },
    { from: /#99a1af/gi, to: '#6B7280' },
    { from: /#ff7043/gi, to: '#BF360C' },
    { from: /#ff793f/gi, to: '#BF420C' },
    { from: /#00c950/gi, to: '#007D32' }
];

let changedFiles = 0;
walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        replacements.forEach(r => {
            newContent = newContent.replace(r.from, r.to);
        });

        // specific globals.css gradient fixes
        if (filePath.endsWith('globals.css')) {
            newContent = newContent.replace(/#4338CA 0%, #F43F5E 100%/g, '#4338CA 0%, #E11D48 100%');
            newContent = newContent.replace(/#F59E0B 0%, #F43F5E 100%/g, '#B45309 0%, #E11D48 100%');
            newContent = newContent.replace(/#0D9488 0%, #10B981 100%/g, '#0D9488 0%, #047857 100%');
        }

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            changedFiles++;
            console.log('Updated: ' + filePath);
        }
    }
});
console.log('Total files updated: ' + changedFiles);
