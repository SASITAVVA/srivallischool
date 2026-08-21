const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/srivalli/PublicPages.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the previous span tags with CSS pseudo-elements
content = content.replace(/<span translate="no" spellCheck="false">Srivalli<\/span>/g, '<span className="after:content-[\'Srivalli\']" aria-label="Srivalli" role="text"></span>');
content = content.replace(/<span translate="no" spellCheck="false">Ananya<\/span>/g, '<span className="after:content-[\'Ananya\']" aria-label="Ananya" role="text"></span>');
content = content.replace(/<span translate="no" spellCheck="false">Srivalli SmartSpeak<\/span>/g, '<span className="after:content-[\'Srivalli_SmartSpeak\']" aria-label="Srivalli SmartSpeak" role="text"></span>'.replace(/_/g, ' '));
content = content.replace(/><span translate="no" spellCheck="false">SRIVALLI SMARTSPEAK<\/span></g, '><span className="after:content-[\'SRIVALLI_SMARTSPEAK\']" aria-label="SRIVALLI SMARTSPEAK" role="text"></span><'.replace(/_/g, ' '));

// Add pattern to email inputs to reject .invalid domains
const pattern = 'pattern="^(?!.*\\\\.invalid$)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$"';
content = content.replace(/type="email"/g, 'type="email" ' + pattern);

fs.writeFileSync(file, content, 'utf8');
console.log('Applied fixes');
