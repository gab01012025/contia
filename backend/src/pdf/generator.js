// Generador de PDF (HTML -> PDF) usando puppeteer
// Soporta tanto desarrollo local (puppeteer bundled) como Render (chromium del sistema)

let puppeteer = null;
function getPup() {
  if (!puppeteer) puppeteer = require('puppeteer');
  return puppeteer;
}

async function htmlToPdfBuffer(html) {
  const pup = getPup();

  // Detectar chromium del sistema (Render) o usar el bundled (local)
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    || process.env.CHROMIUM_PATH
    || undefined;

  const browser = await pup.launch({
    headless: 'new',
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
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
