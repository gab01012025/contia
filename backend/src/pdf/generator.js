// Generador de PDF (HTML -> PDF) usando puppeteer-core + @sparticuz/chromium
// @sparticuz/chromium trae su propio binario — no depende de apt-get

const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function htmlToPdfBuffer(html) {
  const executablePath = await chromium.executablePath();
  console.log(`[pdf] Launching Chromium from: ${executablePath}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
  } catch (launchErr) {
    console.error('[pdf] Error launching Chromium:', launchErr.message);
    throw new Error(`Error al iniciar Chromium: ${launchErr.message}`);
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '12mm', bottom: '15mm', left: '15mm', right: '15mm' },
      printBackground: true,
      timeout: 30000,
    });
    console.log(`[pdf] PDF generated successfully (${pdf.length} bytes)`);
    return pdf;
  } catch (pdfErr) {
    console.error('[pdf] Error generating PDF:', pdfErr.message);
    throw new Error(`Error al generar PDF: ${pdfErr.message}`);
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = { htmlToPdfBuffer };
