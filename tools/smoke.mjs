// Prueba de humo de la PWA en Chrome headless (sin Supabase, modo demo).
// Uso: node tools/smoke.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.SMOKE_URL ?? 'http://localhost:8081';
const OUT = path.resolve('tools/smoke');
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=es-CO'],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

const errors = [];
page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`CONSOLE: ${message.text()}`);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(`📸 ${name}.png`);
}

async function clickLabel(label) {
  const ok = await page.evaluate((value) => {
    const element = document.querySelector(`[aria-label="${value}"]`);
    if (!element) return false;
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }, label);
  if (!ok) console.log(`⚠️ No encontré aria-label ${label}`);
  return ok;
}

async function clickText(text) {
  const ok = await page.evaluate((value) => {
    const nodes = [...document.querySelectorAll('div, span, button, a')].filter(
      (node) => node.textContent?.trim() === value,
    );
    const element = nodes.sort((a, b) => a.childElementCount - b.childElementCount)[0];
    if (!element) return false;
    const target = element.closest('[role="button"]') ?? element.closest('[tabindex="0"]') ?? element;
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return true;
  }, text);
  if (!ok) console.log(`⚠️ No encontré el texto ${text}`);
  return ok;
}

async function waitForText(text, timeout = 15000) {
  await page.waitForFunction(
    (value) => document.body.innerText.includes(value),
    { timeout },
    text,
  );
}

try {
  console.log(`Abriendo ${BASE}…`);
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 120000 });
  await waitForText('LovePlans', 30000);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), { timeout: 15000 }).catch(() => {});
  await sleep(1000);
  await shot('01-welcome');

  if (!(await clickLabel('Probar la demo'))) {
    // Si ya está configurado Supabase, entramos por el puntito demo.
    await page.evaluate(() => {
      const dot = [...document.querySelectorAll('[aria-label="Modo demo"]')][0];
      dot?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
  }

  await waitForText('Juntos por', 20000);
  await sleep(800);
  await shot('02-home');
  console.log('HOME:', (await page.evaluate(() => document.body.innerText)).slice(0, 300).replace(/\n/g, ' | '));

  await clickLabel('Planes');
  await waitForText('Todos', 10000);
  await sleep(600);
  await shot('03-planes');

  await clickText('Nuevo plan');
  await sleep(1200);
  await shot('04-editor');

  const titleInput = await page.$('input[placeholder="Ej. Picnic en el parque"]');
  if (titleInput) {
    await titleInput.click();
    await titleInput.type('Cine de prueba');
    await sleep(300);
  }

  await clickText('Crear plan');
  await sleep(1500);
  await shot('05-planes-con-plan');

  await clickText('Cine de prueba');
  await sleep(1200);
  await shot('06-detalle');
  console.log('DETALLE:', (await page.evaluate(() => document.body.innerText)).slice(0, 260).replace(/\n/g, ' | '));

  await clickLabel('Calendario');
  await sleep(900);
  await shot('07-calendario');

  await clickLabel('Recuerdos');
  await sleep(900);
  await shot('08-recuerdos');

  await clickText('Ramen en el sitio nuevo');
  await sleep(900);
  await shot('08b-album');

  await page.mouse.click(195, 230);
  await sleep(700);
  await shot('08c-foto');

  await clickLabel('Cerrar');
  await sleep(400);
  await clickLabel('Volver');
  await sleep(500);

  await clickLabel('Nosotros');
  await waitForText('Juntos desde', 10000);
  await sleep(900);
  await shot('09-nosotros');

  console.log(errors.length ? `\n❌ ${errors.length} errores:` : '\n✅ Sin errores de página');
  for (const error of errors.slice(0, 20)) console.log(error.slice(0, 500));
} catch (error) {
  console.error('SMOKE FAIL:', error.message);
  await shot('99-fallo');
  for (const item of errors.slice(0, 20)) console.log(item.slice(0, 500));
  process.exitCode = 1;
} finally {
  await browser.close();
}
