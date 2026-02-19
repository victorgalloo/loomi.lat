const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--font-render-hinting=none', '--disable-lcd-text'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 3 });

  await page.goto(`file://${path.join(__dirname, 'carousel-seguridad.html')}`, {
    waitUntil: 'networkidle0',
  });

  // Wait for Google Fonts
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.fonts.check('900 62px Inter'));
  await page.waitForFunction(() => document.fonts.check('700 20px JetBrains Mono'));
  await new Promise(r => setTimeout(r, 2000));

  // Get all slides and build a single-page-per-slide PDF
  const slides = await page.$$('.slide');
  const pdfPages = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const box = await slide.boundingBox();

    // Create a new page for each slide, screenshot it, then add to PDF
    const slidePage = await browser.newPage();
    await slidePage.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 3 });
    await slidePage.goto(`file://${path.join(__dirname, 'carousel-seguridad.html')}`, {
      waitUntil: 'networkidle0',
    });
    await slidePage.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 1000));

    // Hide all slides except current one and remove body styling
    await slidePage.evaluate((idx) => {
      document.body.style.padding = '0';
      document.body.style.gap = '0';
      document.body.style.background = 'transparent';
      const labels = document.querySelectorAll('.label');
      labels.forEach(l => l.style.display = 'none');
      const allSlides = document.querySelectorAll('.slide');
      allSlides.forEach((s, i) => {
        if (i !== idx) s.style.display = 'none';
      });
    }, i);

    const pdfBuffer = await slidePage.pdf({
      width: '1080px',
      height: '1350px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    pdfPages.push(pdfBuffer);
    await slidePage.close();
  }

  // Use pdf-lib to merge (or just use a simpler approach)
  // Since we can't easily merge PDFs with puppeteer alone,
  // let's use a single page approach instead
  await browser.close();

  // Simpler approach: use a single page with print CSS
  const browser2 = await puppeteer.launch({
    headless: 'new',
    args: ['--font-render-hinting=none', '--disable-lcd-text'],
  });
  const printPage = await browser2.newPage();
  await printPage.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 3 });
  await printPage.goto(`file://${path.join(__dirname, 'carousel-seguridad.html')}`, {
    waitUntil: 'networkidle0',
  });
  await printPage.evaluate(() => document.fonts.ready);
  await printPage.waitForFunction(() => document.fonts.check('900 62px Inter'));
  await printPage.waitForFunction(() => document.fonts.check('700 20px JetBrains Mono'));
  await new Promise(r => setTimeout(r, 2000));

  // Inject print-optimized CSS
  await printPage.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `
      body { padding: 0 !important; gap: 0 !important; background: white !important; }
      .label { display: none !important; }
      .slide { page-break-after: always; margin: 0; }
      .slide:last-child { page-break-after: avoid; }
    `;
    document.head.appendChild(style);
  });

  await printPage.pdf({
    path: path.join(__dirname, 'carousel-seguridad.pdf'),
    width: '1080px',
    height: '1350px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser2.close();
  console.log('✓ carousel-seguridad.pdf — 7 pages at 1080×1350px');
})();
