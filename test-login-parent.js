const puppeteer = require('puppeteer');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to http://localhost:3000...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Inject the user state directly to simulate being logged in as a parent
    await page.evaluate(() => {
      window.useAppStore = require('@/lib/store').useAppStore;
      window.useAppStore.getState().login({ id: 'parent123', name: 'Test Parent', role: 'parent' });
    });
    console.log('Mocked login successfully as parent.');
    
    console.log('Waiting for navigation...');
    await wait(3000);
    
    console.log('Checking if error boundary appeared...');
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes("This page couldn't load")) {
      console.log("FOUND ERROR BOUNDARY!");
    } else {
      console.log("No error boundary found. Success!");
    }
  } catch (err) {
    console.log('Script error:', err.message);
  }

  await browser.close();
})();
