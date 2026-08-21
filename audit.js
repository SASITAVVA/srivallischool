const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let noAltCount = 0;
let ulCount = 0;
let svgCount = 0;

walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find <img> tags without alt
        let imgMatches = content.match(/<img[^>]*>/g);
        if (imgMatches) {
            imgMatches.forEach(img => {
                if (!img.includes('alt=')) {
                    console.log('Missing alt: ' + filePath);
                    noAltCount++;
                }
            });
        }
        
        // Find <svg> tags
        let svgMatches = content.match(/<svg[^>]*>/g);
        if (svgMatches) {
            svgMatches.forEach(svg => {
                if (!svg.includes('aria-hidden')) {
                    svgCount++;
                }
            });
        }
        
        // Find <ul> tags
        let ulMatches = content.match(/<ul[^>]*>/g);
        if (ulMatches) {
            ulMatches.forEach(ul => {
                ulCount++;
            });
        }
    }
});

console.log('Images missing alt: ' + noAltCount);
console.log('SVGs missing aria-hidden: ' + svgCount);
console.log('Total <ul> tags: ' + ulCount);
