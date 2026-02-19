const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const outputDir = path.join(__dirname, 'slides');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--font-render-hinting=none', '--disable-lcd-text'],
  });
  const page = await browser.newPage();

  // 3x scale for crispy retina output (3240x3240 final)
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 3 });

  await page.goto(`file://${path.join(__dirname, 'carousel-seguridad.html')}`, {
    waitUntil: 'networkidle0',
  });

  // Wait for Google Fonts to fully load
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.fonts.check('900 62px Inter'));
  await page.waitForFunction(() => document.fonts.check('700 20px JetBrains Mono'));
  await new Promise(r => setTimeout(r, 2000));

  for (let i = 1; i <= 7; i++) {
    const el = await page.$(`#slide-${i}`);
    if (el) {
      const filename = `slide-${String(i).padStart(2, '0')}.png`;
      await el.screenshot({ path: path.join(outputDir, filename), type: 'png' });
      console.log(`✓ ${filename}`);
    }
  }

  await browser.close();
  console.log(`\nDone — 7 slides at 3240×4050px in ./slides/`);
})();
