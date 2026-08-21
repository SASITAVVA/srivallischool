const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/srivalli/PublicPages.tsx');
let content = fs.readFileSync(file, 'utf8');

// add border to gradient-pink buttons to guarantee 3:1 contrast
content = content.replace(/className="gradient-pink/g, 'className="gradient-pink border border-[#c2185b]');
content = content.replace(/className="flex-1 gradient-pink/g, 'className="flex-1 gradient-pink border border-[#c2185b]');
content = content.replace(/className="w-full gradient-pink/g, 'className="w-full gradient-pink border border-[#c2185b]');

fs.writeFileSync(file, content, 'utf8');
