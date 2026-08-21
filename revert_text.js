const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/srivalli/PublicPages.tsx');
let content = fs.readFileSync(file, 'utf8');

// Undo the broken pseudo-element tags inside text
content = content.replace(/<span className="after:content-\['Srivalli'\]" aria-label="Srivalli" role="text"><\/span>/g, 'Srivalli');
content = content.replace(/<span className="after:content-\['Ananya'\]" aria-label="Ananya" role="text"><\/span>/g, 'Ananya');
content = content.replace(/<span className="after:content-\['Srivalli SmartSpeak'\]" aria-label="Srivalli SmartSpeak" role="text"><\/span>/g, 'Srivalli SmartSpeak');
content = content.replace(/><span className="after:content-\['SRIVALLI SMARTSPEAK'\]" aria-label="SRIVALLI SMARTSPEAK" role="text"><\/span></g, '>SRIVALLI SMARTSPEAK<');

fs.writeFileSync(file, content, 'utf8');
console.log('Reverted text');
