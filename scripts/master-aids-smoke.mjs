import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { createGame } from '../src/lib/game/engine.ts';
import { makeDeck } from '../src/lib/game/deck.ts';
import { ATTRACTION_IDS } from '../src/lib/game/types.ts';

const url = process.argv[2] ?? 'http://127.0.0.1:8080/';
const label = new URL(url).port === '8081' ? 'built' : 'dev';
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(60000);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const deck = makeDeck();
const c = id => deck.find(card => card.id === id);
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('poker-park.save.v7')));
function fixture(challenge) {
  const g = createGame('solo', undefined, challenge);
  g.entrance = [c('clubs-10'), c('clubs-9')];
  g.hands = [[c('hearts-12'), c('clubs-2'), c('clubs-3')], []];
  if (g.jackBox) g.jackBox = [c('clubs-11')];
  if (g.storm) { g.storm.forecast = ['forest', ...ATTRACTION_IDS.filter(id => id !== 'forest')]; g.storm.index = 0; }
  const used = new Set([...g.entrance, ...g.hands.flat(), ...(g.jackBox ?? [])].map(c => c.id));
  g.deck = deck.filter(c => !used.has(c.id));
  return g;
}
async function load(g) {
  console.log(`Checking ${g.challenge} at ${url}`);
  if (page.url() === 'about:blank') await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(g => {
    localStorage.setItem('poker-park.save.v7', JSON.stringify(g));
    localStorage.setItem('poker-park.opening-seen.v1', 'seen');
    localStorage.setItem('poker-park-tutorial-seen', 'true');
    localStorage.setItem('poker-park.settings.v1', JSON.stringify({ muted: true }));
  }, g);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await resume();
  await page.locator('.playing-table').waitFor();
}
async function resume() {
  const skip = page.getByRole('button', { name: 'Omitir apertura', exact: true });
  const resume = page.getByRole('button', { name: 'Continuar la jornada', exact: true });
  await skip.or(resume).first().waitFor();
  if (await skip.isVisible()) await skip.click();
  await page.getByRole('button', { name: 'Continuar la jornada', exact: true }).click();
}
async function screenshot(name) {
  await page.waitForFunction(() => [...document.images].filter(img => {
    const box = img.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  }).every(img => img.complete && img.naturalWidth > 0));
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
    // Let the existing staggered dialog entrance finish before visual inspection.
    await page.waitForTimeout(800);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `screenshots/master-${label}-${name}-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
}
async function place(id, index) {
  await page.locator(`[data-attraction-id="${id}"]`).click();
  await page.locator(`[data-card-drop-slot="true"][data-drop-attraction="${id}"][data-drop-index="${index}"]`).click();
}
try {
  mkdirSync('screenshots', { recursive: true });
  if (process.argv.includes('--visual-only')) {
    await load(fixture('mirror'));
    await screenshot('map');
    await page.getByRole('button', { name: /Caseta de Jotas/ }).click();
    await screenshot('box');
    await load(fixture('impossible'));
    await page.getByRole('button', { name: /Abrir Llavero de Ases/ }).click();
    await screenshot('keys');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ ok: true, url, checked: ['loaded artwork on desktop and mobile'], errors }));
  } else {
  for (const challenge of ['festival', 'mirror', 'storm', 'impossible']) {
    await load(fixture(challenge));
    assert.equal(await page.getByRole('button', { name: /Caseta de Jotas/ }).count(), challenge === 'festival' ? 0 : 1);
    assert.equal(await page.getByRole('button', { name: /Abrir Llavero de Ases/ }).count(), ['mirror', 'impossible'].includes(challenge) ? 1 : 0);
  }
  await load(fixture('mirror'));
  await screenshot('map');
  await page.getByRole('button', { name: /Caseta de Jotas/ }).click();
  const box = page.getByRole('dialog', { name: 'Caseta de Jotas', exact: true });
  assert.match(await box.textContent(), /antes de levantar la torre/);
  await screenshot('box');
  await box.getByRole('button', { name: 'J de tréboles', exact: true }).click();
  await place('chairs', 0);
  assert.equal((await saved()).attractions.chairs.slots[0].id, 'clubs-11');
  if (await page.locator('.sheet-close').count()) await page.locator('.sheet-close').click();
  await page.getByRole('button', { name: /Caseta de Jotas/ }).click();
  assert.match(await box.textContent(), /Las Jotas que robes aparecerán aquí/);
  await box.getByRole('button', { name: 'Cerrar caseta' }).click();

  await load(fixture('mirror'));
  await page.getByRole('button', { name: /Caseta de Jotas/ }).click();
  await page.getByRole('dialog', { name: 'Caseta de Jotas', exact: true }).getByRole('button', { name: 'J de tréboles', exact: true }).click();
  await page.getByRole('button', { name: /Intercambiar la carta seleccionada/ }).click();
  await page.locator('.park-entrance').getByRole('button', { name: '10 de tréboles', exact: true }).click();
  assert.equal((await saved()).swappedCardId, 'clubs-10');
  assert.equal((await saved()).jackBox.length, 0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await resume();
  await page.locator('footer').getByRole('button', { name: '10 de tréboles', exact: true }).click();
  await place('coaster', 7);
  assert.equal((await saved()).attractions.coaster.slots[7].id, 'clubs-10');

  await load(fixture('impossible'));
  await page.locator('footer').getByRole('button', { name: 'Q de corazones', exact: true }).click();
  await page.getByRole('button', { name: /Intercambiar la carta seleccionada/ }).click();
  await page.getByRole('button', { name: /Abrir Llavero de Ases/ }).click();
  const rack = page.getByRole('dialog', { name: 'Llavero de Ases', exact: true });
  assert.equal(await rack.getByRole('button', { name: 'Preparar comodín' }).count(), 0);
  await screenshot('keys');
  await rack.getByRole('button', { name: 'A de corazones', exact: true }).click();
  assert.equal((await saved()).swappedCardId, 'hearts-1');
  assert.equal((await saved()).exchangesUsed, 1);
  await place('love', 3);
  assert.equal((await saved()).attractions.love.slots[3].id, 'hearts-1');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, url, checked: ['aid gating in four modes', 'jack placement', 'jack exchange and reload', 'ace rescue and placement', 'desktop and mobile'], errors }));
  }
} catch (error) {
  console.error(error);
  console.error('Browser errors:', errors);
  console.error('Page text:', await page.locator('body').innerText({ timeout: 5000 }).catch(() => 'unavailable'));
  console.error('Images:', await page.locator('img').evaluateAll(images => images.map(img => ({ src: img.src, loaded: img.complete, width: img.naturalWidth }))).catch(() => []));
  await page.screenshot({ path: `screenshots/master-${label}-failure.png`, timeout: 5000 }).catch(() => {});
  throw error;
} finally { await browser.close(); }
