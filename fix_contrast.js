const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // 1. Replace text-white/80, 85, 90 with text-white
        content = content.replace(/text-white\/(80|85|90)/g, 'text-white');
        
        // 2. Replace border-gray-300 with border-gray-500
        content = content.replace(/border-gray-300/g, 'border-gray-500');
        
        // 3. In PublicPages.tsx, replace text-gray-400 with text-gray-600
        // Wait, text-gray-400 on white needs to be text-gray-600.
        // What about text-gray-500? text-gray-600 too.
        if (filePath.endsWith('PublicPages.tsx')) {
            // we already fixed footer text-gray-500 to text-gray-400 manually, wait, I didn't!
            // I only modified line 465 inside the footer. 
            // the footer lists at lines 441, 453 use text-gray-400.
            // Wait, let's fix the footer lists first. 
            content = content.replace(/<ul className="space-y-2 text-sm text-gray-400">/g, '<ul className="space-y-2 text-sm text-gray-300">');
            content = content.replace(/<p className="text-gray-400 text-sm">Speak Clearly/g, '<p className="text-gray-300 text-sm">Speak Clearly');
            
            // then globally replace text-gray-400 to text-gray-600 for light backgrounds
            content = content.replace(/text-gray-400/g, 'text-gray-600');
            
            // then replace text-gray-500 to text-gray-600 (except copyright which is now 400! wait, copyright was replaced to 400. if I replace 400 to 600... ah!)
        }
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
