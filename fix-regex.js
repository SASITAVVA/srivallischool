const fs = require('fs');
let content = fs.readFileSync('src/components/srivalli/PublicPages.tsx', 'utf8');

const regex = /pattern="\^\(\?\!\.\*\\\\\.invalid\$\)\[a-zA-Z0-9\._%\+-\]\+@\[a-zA-Z0-9\.-\]\+\\\\\.\[a-zA-Z\]\{2,\}\$"/g;
const newPattern = 'pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"';

content = content.replace(regex, newPattern);

// also fix if the backslashes are different
const regex2 = /pattern="\^\(\?\!\.\*\\\.invalid\$\)\[a-zA-Z0-9\._%\+-\]\+@\[a-zA-Z0-9\.-\]\+\\\\.\[a-zA-Z\]\{2,\}\$"/g;
content = content.replace(regex2, newPattern);

fs.writeFileSync('src/components/srivalli/PublicPages.tsx', content, 'utf8');
console.log('Regex fix done');
