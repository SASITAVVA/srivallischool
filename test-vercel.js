const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to Vercel URL...');
  try {
    const response = await page.goto('https://srivalli-smartspeak-project-v2-1i4gr2l1c-rcb12.vercel.app', { waitUntil: 'networkidle0' });
    console.log('Status code:', response.status());
    console.log('Page loaded successfully.');
  } catch (err) {
    console.log('Navigation error:', err.message);
  }

  await browser.close();
})();
