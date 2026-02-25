import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../public/carousel-fb.html');
const outDir = path.resolve(__dirname, '../public/carousel-slides');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport large enough
  await page.setViewport({ width: 1280, height: 1200, deviceScaleFactor: 1 });

  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  // Get all slides
  const slides = await page.$$('.slide');
  console.log(`Found ${slides.length} slides`);

  const slideNames = [
    '01-hook',
    '02-problema',
    '03-que-hace',
    '04-demo-chat',
    '05-resultados',
    '06-industrias',
    '07-precios',
    '08-cta'
  ];

  for (let i = 0; i < slides.length; i++) {
    const name = slideNames[i] || `slide-${i + 1}`;
    const filePath = path.join(outDir, `${name}.png`);

    await slides[i].screenshot({
      path: filePath,
      type: 'png',
    });

    console.log(`✓ ${name}.png (1080x1080)`);
  }

  await browser.close();
  console.log(`\nDone! ${slides.length} slides saved to ${outDir}`);
})();
