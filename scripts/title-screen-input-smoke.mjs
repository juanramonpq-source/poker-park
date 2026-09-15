import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { chromium, webkit } from "playwright";

// Catches Safari dropping taps on non-interactive background elements.
// Do not use dispatchEvent or element.click(): those bypass native tap behavior.
const url = process.argv[2] ?? "http://127.0.0.1:8080";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
mkdirSync("screenshots", { recursive: true });
for (const engine of [webkit, chromium]) {
  const browser = await engine.launch({ headless: true, ...(engine === chromium && existsSync(chrome) ? { executablePath: chrome } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.addInitScript(() => localStorage.setItem("poker-park.opening-seen.v1", "seen"));
    async function recordLanding(target) {
      await target.locator('.title-screen').evaluate(el => {
        window.__openingInputSnapshots = [];
        new MutationObserver(() => window.__openingInputSnapshots.push({
          stage: el.getAttribute('data-opening'),
          inert: el.querySelector('.title-panel').inert,
        })).observe(el, { attributes: true, attributeFilter: ['data-opening'] });
      });
    }
    async function showTitle() {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.locator('.title-screen[data-opening="title"]').waitFor();
      // Let the title's own reveal finish before testing a stationary tap target.
      await page.waitForTimeout(650);
      await recordLanding(page);
    }
    async function expectLanding(label, target = page) {
      // Observe the transition in-page so slow browser round trips cannot miss
      // the short animation. Still require a locked menu throughout landing.
      await target.locator('.title-screen[data-opening="ready"]').waitFor();
      const snapshots = await target.evaluate(() => window.__openingInputSnapshots);
      const landing = snapshots.filter(snapshot => snapshot.stage === 'landing');
      assert(landing.length > 0, `${engine.name()}: ${label} did not start the menu drop`);
      assert(landing.every(snapshot => snapshot.inert), 'Menu must be inert during landing');
      assert.equal(await target.locator('.title-panel').evaluate(el => el.inert), false);
    }
    for (const point of [{ x: 195, y: 40 }, { x: 8, y: 420 }, { x: 195, y: 744 }]) {
      await showTitle();
      await page.touchscreen.tap(point.x, point.y);
      await expectLanding(`background tap ${point.x},${point.y}`);
    }
    await showTitle();
    await page.getByRole('button', { name: /Poker Park.*Toca para entrar/ }).tap();
    await expectLanding('title button');
    await showTitle();
    await page.getByRole('button', { name: 'Omitir apertura' }).tap();
    assert.equal(await page.locator('.title-screen').getAttribute('data-opening'), 'ready', 'Skip must bypass the menu drop');
    await page.touchscreen.tap(195, 40);
    assert.equal(await page.locator('.title-screen').getAttribute('data-opening'), 'ready', 'Background must not restart the completed opening');
    await page.getByRole('button', { name: 'Ver secuencia de apertura' }).tap();
    await page.locator('.title-screen[data-opening="studio"]').waitFor();
    await page.touchscreen.tap(8, 100);
    assert.equal(await page.locator('.title-screen').getAttribute('data-opening'), 'studio', 'Studio must still require its own control');
    await page.getByRole('button', { name: 'Omitir apertura' }).tap();
    await page.screenshot({ path: `screenshots/title-input-${engine.name()}-mobile.png` });
    await page.close();

    const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    desktop.on('pageerror', error => errors.push(error.message));
    await desktop.addInitScript(() => localStorage.setItem('poker-park.opening-seen.v1', 'seen'));
    for (const input of ['mouse', 'keyboard']) {
      await desktop.goto(url, { waitUntil: 'domcontentloaded' });
      await desktop.locator('.title-screen[data-opening="title"]').waitFor();
      await recordLanding(desktop);
      if (input === 'mouse') await desktop.mouse.click(20, 300);
      else { await desktop.locator('.opening-title-action').focus(); await desktop.keyboard.press('Enter'); }
      await expectLanding(input, desktop);
    }
    await desktop.screenshot({ path: `screenshots/title-input-${engine.name()}-desktop.png` });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ engine: engine.name(), backgroundTaps: 3, title: true, skip: true, replay: true, mouse: true, keyboard: true, errors }));
  } finally { await browser.close(); }
}
