const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/srivalli/PublicPages.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Text Spell Check Fixes
content = content.replace(/Srivalli School/g, '<span translate="no" spellCheck="false">Srivalli</span> School');
content = content.replace(/Ananya/g, '<span translate="no" spellCheck="false">Ananya</span>');
content = content.replace(/Srivalli SmartSpeak/g, '<span translate="no" spellCheck="false">Srivalli SmartSpeak</span>');
content = content.replace(/>SRIVALLI SMARTSPEAK</g, '><span translate="no" spellCheck="false">SRIVALLI SMARTSPEAK</span><');

// 2. Form Fixes - Add action and method
content = content.replace(/<form onSubmit={handleSubmit} className="space-y-4">/g, '<form onSubmit={handleSubmit} className="space-y-4" action="#" method="POST">');

// 3. Form Input Fixes - Add autoComplete
// Contact Form
content = content.replace(/id="contact-name"(.*?)onChange=\{e => setForm\(\{...form, name: e.target.value\}\)\} \/>/g, 
'id="contact-name"={e => setForm({...form, name: e.target.value})} autoComplete="name" />');
content = content.replace(/id="contact-email"(.*?)onChange=\{e => setForm\(\{...form, email: e.target.value\}\)\} \/>/g, 
'id="contact-email"={e => setForm({...form, email: e.target.value})} autoComplete="email" />');

// Demo Form
content = content.replace(/id="demo-parent"(.*?)onChange=\{e => update\('parentName', e.target.value\)\} \/>/g, 
'id="demo-parent"={e => update(\'parentName\', e.target.value)} autoComplete="name" />');
content = content.replace(/id="demo-child"(.*?)onChange=\{e => update\('childName', e.target.value\)\} \/>/g, 
'id="demo-child"={e => update(\'childName\', e.target.value)} autoComplete="off" />');

// Login Form
content = content.replace(/id="login-email"(.*?)onChange=\{e => setForm\(\{...form, email: e.target.value\}\)\} \/>/g, 
'id="login-email"={e => setForm({...form, email: e.target.value})} autoComplete="username" />');
content = content.replace(/id="login-pass"(.*?)onChange=\{e => setForm\(\{...form, password: e.target.value\}\)\} \/>/g, 
'id="login-pass"={e => setForm({...form, password: e.target.value})} autoComplete="current-password" />');

// Register Student Form
content = content.replace(/id="rs-name"(.*?)onChange=\{e => update\('name', e.target.value\)\} \/>/g, 
'id="rs-name"={e => update(\'name\', e.target.value)} autoComplete="name" />');
content = content.replace(/id="rs-email"(.*?)onChange=\{e => update\('email', e.target.value\)\} \/>/g, 
'id="rs-email"={e => update(\'email\', e.target.value)} autoComplete="email" />');

// Register Parent Form
content = content.replace(/id="rp-name"(.*?)onChange=\{e => update\('name', e.target.value\)\} \/>/g, 
'id="rp-name"={e => update(\'name\', e.target.value)} autoComplete="name" />');
content = content.replace(/id="rp-mobile"(.*?)onChange=\{e => update\('mobile', e.target.value\)\} \/>/g, 
'id="rp-mobile"={e => update(\'mobile\', e.target.value)} autoComplete="tel" />');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed texts and forms');
