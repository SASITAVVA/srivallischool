const fs = require('fs');
const path = require('path');

const files = [
  'src/components/srivalli/StudentDashboard.tsx',
  'src/components/srivalli/TeacherDashboard.tsx',
  'src/components/srivalli/ParentDashboard.tsx'
];

const fetchHelper = `
const fetchWithAuth = async (url: string, init?: RequestInit) => {
  const token = useAppStore.getState().idToken;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    useAppStore.getState().logout();
  }
  return res;
};
`;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Insert fetchWithAuth after the helpers block
  if (!content.includes('const fetchWithAuth')) {
    content = content.replace(
      '/* ═══════════════════════════════════════════════════════',
      fetchHelper + '\n/* ═══════════════════════════════════════════════════════'
    );
  }

  // Replace fetch('/api/... with fetchWithAuth('/api/...
  // We use a regex to match fetch( followed by backtick, single quote, or double quote and /api/
  content = content.replace(/\bfetch\(\s*(['"`]\/api\/)/g, 'fetchWithAuth($1');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Refactored', file);
}
