import assert from "node:assert/strict";
import { mkdirSync, existsSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8109";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
mkdirSync("screenshots", { recursive: true });
const results = [];
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.addInitScript(() => {
      window.__openingAudio = [];
      const Original = window.AudioContext;
      window.AudioContext = class extends Original {
        constructor(...args) { super(...args); window.__openingAudio.push(this); }
      };
      localStorage.setItem("poker-park-tutorial-seen", "true");
    });
    const stage = value => page.locator(`.title-screen[data-opening="${value}"]`);
    await page.goto(url);
    await stage("studio").waitFor();
    assert.equal(await page.getByRole("button", { name: "Jugar en pareja", exact: true }).isVisible(), false);
    await page.waitForTimeout(950);
    await page.screenshot({ path: `screenshots/opening-studio-${viewport.width}.png` });
    await page.getByRole("button", { name: /Pentonúi Games.*Toca/ }).click();
    await stage("ticket").waitFor();
    await page.waitForFunction(() => window.__openingAudio.some(ctx => ctx.state === "running"));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `screenshots/opening-ticket-${viewport.width}.png` });
    await page.getByRole("button", { name: "Rasgar y validar la entrada de Poker Park" }).click();
    await stage("tearing").waitFor();
    await stage("validated").waitFor();
    assert.equal(await page.locator('.opening-ticket-sprite').getAttribute("data-frame"), "3");
    assert.equal(await page.evaluate(() => localStorage.getItem("poker-park.opening-seen.v1")), null);
    await page.screenshot({ path: `screenshots/opening-validated-${viewport.width}.png` });
    await page.getByRole("button", { name: "¡Ya puedes entrar! Soltar la entrada" }).click();
    await stage("flying").waitFor();
    await stage("sun").waitFor();
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `screenshots/opening-sun-${viewport.width}.png` });
    await stage("title").waitFor();
    await page.getByRole("button", { name: /Poker Park.*Toca para entrar/ }).click();
    await stage("landing").waitFor();
    assert.equal(await page.locator('.title-panel').evaluate(el => el.inert), true);
    await stage("ready").waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem("poker-park.opening-seen.v1")), "seen");
    const layout = await page.locator('.title-panel').evaluate(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, viewport: innerHeight }; });
    assert.ok(layout.top >= 0 && layout.bottom <= layout.viewport + 1, JSON.stringify(layout));
    await page.screenshot({ path: `screenshots/opening-menu-${viewport.width}.png` });
    await page.reload();
    await stage("sun").waitFor();
    await stage("title").waitFor();
    await page.getByRole("button", { name: /Poker Park.*Toca para entrar/ }).click();
    await stage("ready").waitFor();
    await page.getByRole("button", { name: "Ver secuencia de apertura" }).click();
    await stage("studio").waitFor();
    await page.getByRole("button", { name: "Omitir apertura" }).click();
    await stage("ready").waitFor();
    await page.getByRole("button", { name: "Modo solitario", exact: true }).click();
    await page.getByRole("button", { name: "Empezar montando solo" }).click();
    await page.getByRole("button", { name: "Abrir el plano ahora" }).click();
    assert.equal(await page.locator('.hand-card').count(), 6);
    assert.equal(await page.locator('.hand-card').first().evaluate(el => getComputedStyle(el).animationDuration), "3.4s");
    assert.deepEqual(errors, []);
    results.push({ viewport, firstRun: true, repeat: true, replay: true, skip: true, audio: true, hand: 6, errors });
    await page.close();
  }
  const reduced = await browser.newPage({ viewport: { width: 390, height: 667 }, reducedMotion: "reduce" });
  await reduced.addInitScript(() => {
    localStorage.setItem("poker-park.secrets.v1", JSON.stringify({ version: 1, perfect: true, nightPerfect: true, festivalPerfect: true, mirrorPerfect: true, stormPerfect: true, impossiblePerfect: true, lifetime: true }));
  });
  await reduced.goto(url);
  await reduced.getByRole("button", { name: "Omitir apertura" }).click();
  await reduced.locator('.title-screen[data-opening="ready"]').waitFor();
  await reduced.waitForTimeout(300);
  await reduced.screenshot({ path: "screenshots/opening-unlocked-small.png" });
  const bounds = await reduced.locator('.title-panel, .title-hero').evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: innerHeight }; }));
  assert.ok(bounds.every(r => r.top >= 0 && r.bottom <= r.height + 1), JSON.stringify(bounds));
  await reduced.getByRole("button", { name: "Ver secuencia de apertura" }).click();
  await reduced.getByRole("button", { name: /Pentonúi Games.*Toca/ }).click();
  await reduced.getByRole("button", { name: "Rasgar y validar la entrada de Poker Park" }).click();
  await reduced.getByRole("button", { name: "¡Ya puedes entrar! Soltar la entrada" }).click();
  await reduced.getByRole("button", { name: /Poker Park.*Toca para entrar/ }).click();
  await reduced.locator('.title-screen[data-opening="ready"]').waitFor();
  await reduced.close();
  results.push({ reducedMotion: true, unlockedSmallViewport: true });
  console.log(JSON.stringify({ ok: true, results }, null, 2));
} finally { await browser.close(); }
