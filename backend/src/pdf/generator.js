// Generador de PDF (HTML -> PDF) usando puppeteer-core
// Usa chromium del sistema en producción (Render) o ruta configurada en local

let puppeteer = null;
function getPup() {
  if (!puppeteer) puppeteer = require('puppeteer-core');
  return puppeteer;
}

// Detectar ruta del ejecutable de Chromium
function getChromiumPath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  // Intentar rutas comunes en Linux
  const fs = require('fs');
  const paths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }

  return undefined;
}

async function htmlToPdfBuffer(html) {
  const pup = getPup();
  const executablePath = getChromiumPath();

  if (!executablePath) {
    throw new Error(
      'No se encontró Chromium. Configura PUPPETEER_EXECUTABLE_PATH o instala chromium en el sistema.'
    );
  }

  console.log(`[pdf] Launching Chromium from: ${executablePath}`);

  let browser;
  try {
    browser = await pup.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
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
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
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
