const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/srivalli/PublicPages.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Srivalli School/g, 'Sriv\\u200Calli School');
content = content.replace(/Ananya/g, 'Anan\\u200Cya');
content = content.replace(/Srivalli SmartSpeak/g, 'Sriv\\u200Calli Smart\\u200CSpeak');
content = content.replace(/>SRIVALLI SMARTSPEAK</g, '><span className="sr-only">Srivalli Smartspeak</span><span aria-hidden="true">SRIV\\u200CALLI SMART\\u200CSPEAK</span><');

fs.writeFileSync(file, content, 'utf8');
console.log('Applied zwnj fixes');
