const puppeteer = require('puppeteer');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to http://localhost:3000...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('Clicking Login...');
    await page.evaluate(() => {
      const loginBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Login'));
      if (loginBtns.length > 0) loginBtns[0].click();
    });
    
    await wait(1000);
    
    console.log('Typing credentials...');
    // Type in a test student account. Assuming student@srivallischool.com or we can create one!
    // But since there's an API Error during login if Firebase throws, wait!
    // Firebase auth returns token, we can mock Zustand state!
    await page.evaluate(() => {
      window.useAppStore = require('@/lib/store').useAppStore;
      window.useAppStore.getState().login({ id: '123', name: 'Test Student', role: 'student' });
    });
    console.log('Mocked login successfully.');
    
    console.log('Waiting for navigation...');
    await wait(3000);
    
    console.log('Checking if error boundary appeared...');
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes("This page couldn't load")) {
      console.log("FOUND ERROR BOUNDARY!");
    } else {
      console.log("No error boundary found.");
    }
  } catch (err) {
    console.log('Script error:', err.message);
  }

  await browser.close();
})();
