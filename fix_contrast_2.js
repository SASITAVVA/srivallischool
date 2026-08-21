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
        
        // 1. span: border-white/30 to border-white/50
        content = content.replace(/border-white\/30/g, 'border-white/50');
        
        // 2. p.text-gray-500.text-sm.md:text-base to text-gray-600
        content = content.replace(/text-gray-500 text-sm md:text-base/g, 'text-gray-600 text-sm md:text-base');
        
        // 3. p.text-white on via-emerald-500 etc. We need to darken the gradients for the courses!
        content = content.replace(/from-purple-600 via-violet-500 to-fuchsia-500/g, 'from-purple-700 via-violet-700 to-fuchsia-700');
        content = content.replace(/from-amber-500 via-orange-500 to-red-500/g, 'from-amber-700 via-orange-700 to-red-700');
        content = content.replace(/from-green-500 via-emerald-500 to-teal-500/g, 'from-green-700 via-emerald-700 to-teal-700');
        
        // 4. button: from-amber-500 to-orange-600
        content = content.replace(/from-amber-500 to-orange-600/g, 'from-orange-700 to-red-800');
        content = content.replace(/from-amber-600 hover:to-orange-700/g, 'from-orange-800 hover:to-red-900');
        
        content = content.replace(/from-green-500 to-emerald-600/g, 'from-green-700 to-emerald-800');
        content = content.replace(/from-green-600 hover:to-emerald-700/g, 'from-green-800 hover:to-emerald-900');
        
        content = content.replace(/from-purple-600 to-violet-600/g, 'from-purple-700 to-violet-800');
        content = content.replace(/from-purple-700 hover:to-violet-700/g, 'from-purple-800 hover:to-violet-900');
        
        // 5. p.text-xs on from-orange-400 (Leadership cards)
        content = content.replace(/from-purple-500 to-violet-600/g, 'from-purple-700 to-violet-800');
        content = content.replace(/from-orange-400 to-rose-500/g, 'from-orange-700 to-rose-800');
        
        // 6. Fix bg-emerald-100 text-emerald-700 in course badges
        content = content.replace(/bg-emerald-100 text-emerald-700/g, 'bg-emerald-100 text-emerald-800');
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
