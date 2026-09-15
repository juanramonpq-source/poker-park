import assert from 'node:assert/strict';
import { mkdirSync, existsSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { createGame } from '../src/lib/game/engine.ts';
import { makeDeck } from '../src/lib/game/deck.ts';
import { completedPark } from './fixtures/completed-park.ts';

const url = process.argv[2] ?? 'http://127.0.0.1:8080/';
const label = process.argv[3] ?? 'dev';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync('screenshots', { recursive: true });
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true, ...(name === 'chromium' && existsSync(chrome) ? { executablePath: chrome } : {}) });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  page.setDefaultTimeout(30000);
  const errors = [];
  const cdp = name === 'chromium' ? await page.context().newCDPSession(page) : null;
  async function swipe(from, to, hold = false) {
    if (cdp) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * i / 12, y: from.y + (to.y - from.y) * i / 12 }] });
        await page.waitForTimeout(20);
      }
      if (!hold) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 15 });
      if (!hold) await page.mouse.up();
    }
  }
  async function fixedDocument() {
    await page.evaluate(() => scrollTo(1000, 1000));
    assert.deepEqual(await page.evaluate(() => [scrollX, scrollY, document.documentElement.scrollHeight > innerHeight]), [0, 0, false]);
  }
  async function resume(game) {
    await page.evaluate(g => localStorage.setItem('poker-park.save.v7', JSON.stringify(g)), game);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Omitir apertura', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar la jornada', exact: true }).click();
  }
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    // Isolated browser profile: exercise the final mode without changing player progress.
    if (!localStorage.getItem('poker-park.secrets.v1')) localStorage.setItem('poker-park.secrets.v1', JSON.stringify({ perfect: true, nightPerfect: true, masterPassUnlocked: true, festivalPerfect: true, mirrorPerfect: true, stormPerfect: true }));
    localStorage.setItem('poker-park.opening-seen.v1', 'seen');
    localStorage.setItem('poker-park-tutorial-seen', 'true');
    localStorage.setItem('poker-park.settings.v1', JSON.stringify({ muted: true }));
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Omitir apertura', exact: true }).click();
    await page.locator('.master-pass-button').click();
    for (const size of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(size);
      for (const mode of ['festival', 'mirror', 'storm', 'impossible']) {
        await page.locator(`.master-mode-${mode}`).click();
        const guide = page.getByRole('region', { name: 'Guía visual del reto', exact: true });
        await guide.waitFor();
        assert.equal(await page.locator('.master-full-rules').evaluate(el => el.open), false);
        assert.equal(await guide.locator('.guide-support-row').count(), mode === 'festival' ? 0 : mode === 'storm' ? 1 : 2);
        if (mode === 'mirror') assert.equal(await guide.locator('.guide-mirror-step').count(), 6);
        for (const difficulty of ['Clásico', 'Fácil']) {
          await page.locator('.master-start-panel').getByRole('button', { name: new RegExp(difficulty) }).click();
          await page.waitForTimeout(150);
          const bounds = await page.locator('.master-pass-card').evaluate(card => {
            const outer = card.getBoundingClientRect();
            const controls = [...card.querySelectorAll('button')].map(button => {
              const r = button.getBoundingClientRect();
              const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
              return { text: button.textContent, fits: r.top >= Math.max(0, outer.top) && r.bottom <= Math.min(innerHeight, outer.bottom) + 1 && r.left >= 0 && r.right <= innerWidth + 1, reachable: button.contains(hit) };
            });
            return { controls, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, viewport: [innerWidth, innerHeight] };
          });
          assert.ok(bounds.controls.every(c => c.fits && c.reachable), `${name} ${JSON.stringify(size)} ${mode} ${difficulty}: ${JSON.stringify(bounds)}`);
          assert.ok(bounds.width <= size.width && bounds.height <= size.height, 'Document overflow');
        }
        await page.locator('.master-full-rules > summary').click();
        assert.equal(await page.locator('.master-full-rules').evaluate(el => el.open), true);
        const actions = await page.locator('.master-start-actions').boundingBox();
        assert.ok(actions.y + actions.height <= size.height, 'Expanded rules must not push start buttons away');
        await page.locator('.master-full-rules > summary').click();
        await page.locator('.master-mode-info').evaluate(el => { el.scrollTop = 0; });
        if (size.width === 390) await page.screenshot({ path: `screenshots/master-guide-${label}-${name}-${mode}.png` });
      }
      await page.screenshot({ path: `screenshots/master-menu-${label}-${name}-${size.width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 700 });
    await page.waitForTimeout(300);
    const info = page.locator('.master-mode-info');
    await info.evaluate(el => { el.scrollTop = 0; });
    const infoBox = await info.boundingBox();
    if (cdp) {
      await swipe({ x: infoBox.x + infoBox.width / 2, y: infoBox.y + infoBox.height - 10 }, { x: infoBox.x + infoBox.width / 2, y: infoBox.y + 10 });
      await page.waitForTimeout(400);
      assert.ok(await info.evaluate(el => el.scrollTop > 0), 'Touch scroll inside explanations');
    }
    await info.evaluate(el => { el.scrollTop = el.scrollHeight; });
    assert.ok(await info.evaluate(el => el.scrollTop > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 1), 'All explanations can be read');
    await page.locator('.master-start-actions').getByRole('button', { name: 'Modo solitario', exact: true }).click();
    await page.getByRole('heading', { name: 'Modo solitario', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cerrar modo solitario', exact: true }).last().click();
    await page.locator('.master-start-actions').getByRole('button', { name: 'En pareja', exact: true }).click();
    await page.getByRole('heading', { name: 'Jugar en pareja', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cerrar preparación de partida', exact: true }).last().click();
    await page.getByRole('button', { name: 'Cerrar Pase Maestro', exact: true }).last().click();
    await swipe({ x: 5, y: 550 }, { x: 5, y: 200 });
    await fixedDocument();

    const game = createGame('solo');
    const deck = makeDeck();
    const card = id => deck.find(c => c.id === id);
    game.hands = [[card('clubs-2'), card('hearts-3'), card('clubs-12')], []];
    game.entrance = [card('hearts-12'), card('hearts-13')];
    const used = new Set([...game.hands.flat(), ...game.entrance].map(c => c.id));
    game.deck = deck.filter(c => !used.has(c.id));
    await resume(game);
    await page.locator('.playing-table').waitFor();
    await swipe({ x: 2, y: 520 }, { x: 2, y: 200 });
    await fixedDocument();
    const source = page.locator('.hand-cards').getByRole('button', { name: '2 de tréboles', exact: true });
    const target = page.locator('[data-card-drop-attraction="coaster"]');
    const from = await source.boundingBox();
    const to = await target.boundingBox();
    await swipe({ x: from.x + from.width / 2, y: from.y + from.height / 2 }, { x: to.x + to.width / 2, y: to.y + to.height / 2 }, true);
    await page.locator('.card-drag-ghost').waitFor();
    if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    else await page.mouse.up();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('poker-park.save.v7')).attractions.coaster.slots[0]?.id === 'clubs-2');
    assert.equal(await page.evaluate(() => getSelection().toString()), '');
    await fixedDocument();

    await resume(completedPark('solo', 'classic'));
    await page.getByRole('button', { name: 'Cerrar el parque', exact: true }).click();
    const tally = page.locator('.end-tally');
    await tally.waitFor({ timeout: 15000 });
    const credits = page.getByRole('button', { name: 'Ver créditos', exact: true });
    await credits.waitFor({ timeout: 15000 });
    await credits.scrollIntoViewIfNeeded();
    assert.ok(await tally.evaluate(el => el.scrollTop > 0), 'Long results remain readable in their own panel');
    await fixedDocument();
    await credits.click();
    await page.getByRole('button', { name: 'Volver al inicio', exact: true }).waitFor();
    await page.evaluate(() => localStorage.setItem('poker-park.secrets.v1', JSON.stringify({ perfect: true, nightPerfect: true })));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Omitir apertura', exact: true }).click();
    await page.locator('.master-pass-button').click();
    assert.ok(await page.locator('.master-mode-impossible').isDisabled(), 'The final challenge remains locked for unfinished profiles');
    assert.equal(await page.locator('.master-mode-impossible .master-mode-state').textContent(), 'Supera los 3 retos');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ ok: true, url, browser: name, checked: 'four visual guides and correct aids, expandable full rules, both difficulties, four viewports, reachable controls, scrolling explanations, solo/pair entry, fixed title/game, card drag, end results', errors }));
  } catch (error) {
    await page.screenshot({ path: `screenshots/master-menu-${label}-${name}-failure.png` });
    console.error('At failure:', await page.locator('.master-mode-info').evaluateAll(elements => elements.map(el => ({ scroll: el.scrollTop, height: el.clientHeight, contentHeight: el.scrollHeight, rect: el.getBoundingClientRect().toJSON() }))));
    throw error;
  } finally { await browser.close(); }
}
