const fs = require('fs');
let pages = fs.readFileSync('src/components/srivalli/PublicPages.tsx', 'utf8');

const oldLine = "const cred = await signInWithEmailAndPassword(auth, form.email, form.password);";
const newLine = `sessionStorage.setItem('pendingLoginRole', form.role);\n        const cred = await signInWithEmailAndPassword(auth, form.email, form.password);`;

pages = pages.replace(oldLine, newLine);

const oldFinally = "} finally { setLoading(false); }";
const newFinally = "} finally { sessionStorage.removeItem('pendingLoginRole'); setLoading(false); }";

// Replace only the first occurrence which is in LoginPage... wait, LoginPage doesn't have finally currently! Let's check.
