const https = require('https');

https.get('https://srivalli-smartspeak-project-v2-i0edn0p2q-rcb12.vercel.app/api/courses', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    json.courses.forEach(c => {
      console.log('Course:', c.title);
      console.log('Topics:', c.topics);
      console.log('Features:', c.features);
      console.log('---');
    });
  });
});
