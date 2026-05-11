// Generador de PDF basico (HTML -> PDF) usando puppeteer
// En produccion se reemplaza por puppeteer-core + chromium en Render

let puppeteer = null;
function getPup() {
  if (!puppeteer) puppeteer = require('puppeteer');
  return puppeteer;
}

async function htmlToPdfBuffer(html) {
  const pup = getPup();
  const browser = await pup.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true,
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = { htmlToPdfBuffer };
