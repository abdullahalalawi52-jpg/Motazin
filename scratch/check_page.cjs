const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('Page loaded.');
    
    const h1 = await page.locator('h1').textContent();
    console.log('H1 Text Content:', h1);
    
    // Save to App Data Dir / artifacts
    const screenshotPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\f60f410f-0ce4-4fa8-bb4d-0f3fad442802\\e2e_screenshot.png';
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot saved to:', screenshotPath);
  } catch (e) {
    console.error('Error during execution:', e);
  } finally {
    await browser.close();
  }
})();
