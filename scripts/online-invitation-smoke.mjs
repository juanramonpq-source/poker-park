import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:8080/';
const label = process.argv[3] ?? 'dev';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync('screenshots', { recursive: true });
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true, ...(name === 'chromium' && existsSync(chrome) ? { executablePath: chrome } : {}) });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    localStorage.setItem('poker-park.settings.v1', JSON.stringify({ muted: true }));
    let attempts = 0;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => {
        if (++attempts === 1) throw new DOMException('Permission denied', 'NotAllowedError');
        window.__copiedInvitation = text;
      },
    } });
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Omitir apertura', exact: true }).click();
    await page.getByRole('button', { name: 'Jugar en pareja', exact: true }).click();
    assert.doesNotMatch(await page.getByRole('dialog', { name: 'Jugar en pareja', exact: true }).innerText(), /\bbeta\b/i);
    await page.getByRole('button', { name: /Jugar online/ }).click();
    await page.getByRole('button', { name: 'Preparar sala online', exact: true }).click();
    assert.doesNotMatch(await page.getByRole('dialog', { name: 'Jugar online', exact: true }).innerText(), /\bbeta\b/i);
    await page.getByRole('button', { name: /^Crear una sala/ }).click();
    await page.getByRole('button', { name: 'Crear sala privada', exact: true }).click();
    const code = (await page.locator('.online-room-code > strong').innerText()).trim();
    await page.getByRole('button', { name: 'Copiar invitación', exact: true }).click();
    const fallback = page.getByLabel('Enlace de invitación', { exact: true });
    await fallback.waitFor();
    const link = await fallback.inputValue();
    assert.equal(new URL(link).searchParams.get('sala'), code);
    await fallback.click();
    // WebKit applies the native input selection after the click has finished.
    await page.waitForFunction(() => {
      const input = document.querySelector('.online-invite-fallback input');
      return input.selectionEnd - input.selectionStart === input.value.length;
    });
    assert.equal(await fallback.evaluate(el => el.selectionEnd - el.selectionStart), link.length);
    await page.screenshot({ path: `screenshots/online-invite-${label}-${name}-mobile.png` });
    await page.getByRole('button', { name: 'Copiar invitación', exact: true }).click();
    await page.getByRole('button', { name: 'Enlace copiado', exact: true }).waitFor();
    assert.equal(await fallback.count(), 0);
    assert.equal(await page.evaluate(() => window.__copiedInvitation), link);

    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    await page.getByRole('button', { name: /^(Copiar invitación|Enlace copiado)$/ }).click();
    await fallback.waitFor();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForFunction(() => {
      const bounds = document.querySelector('.online-card').getBoundingClientRect();
      return bounds.top >= 0 && bounds.bottom <= innerHeight;
    });
    await page.screenshot({ path: `screenshots/online-invite-${label}-${name}-desktop.png` });
    assert.deepEqual(await page.evaluate(() => [scrollY, document.documentElement.scrollWidth > innerWidth]), [0, false]);
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
    assert.equal(new URL(page.url()).searchParams.has('sala'), false);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ ok: true, browser: name, url, checked: ['no beta labels', 'clipboard denied', 'manual selection', 'successful retry', 'clipboard unavailable', 'mobile and desktop', 'leave room'], errors }));
  } catch (error) {
    console.error('Page:', await page.locator('body').innerText());
    console.error('Browser errors:', errors);
    await page.screenshot({ path: `screenshots/online-invite-${label}-${name}-failure.png` });
    throw error;
  } finally { await browser.close(); }
}
