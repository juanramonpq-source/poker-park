import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { createGame, advanceTurn, prepareNightUnlock } from "../src/lib/game/engine.ts";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
const errors = [];
mkdirSync("screenshots", { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url);
  await page.getByRole("heading", { name: "Poker Park", exact: true }).waitFor();
  assert.equal(await page.locator('link[rel="manifest"]').count(), 1);
  const game = createGame("solo");
  game.pendingAdvance = true;
  const expected = advanceTurn(game);
  await page.evaluate((game) => {
    localStorage.setItem("poker-park.save.v7", JSON.stringify(game));
    localStorage.setItem("poker-park-tutorial-seen", "true");
  }, game);
  await page.reload();
  await page.getByRole("button", { name: "Continuar la jornada" }).click();
  await page.locator(".playing-table").waitFor();
  const resumed = await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.save.v7")));
  assert.deepEqual(resumed, JSON.parse(JSON.stringify(expected)));
  const night = createGame("solo", undefined, "night");
  night.pendingAdvance = true;
  night.night.pendingUnlock = true;
  await page.evaluate((game) => localStorage.setItem("poker-park.save.v7", JSON.stringify(game)), night);
  await page.reload();
  await page.getByRole("button", { name: "Continuar la guardia" }).click();
  const resumedNight = await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.save.v7")));
  assert.deepEqual(resumedNight, JSON.parse(JSON.stringify(prepareNightUnlock(night))));
  await page.evaluate(() => localStorage.setItem("poker-park.save.v7", '{"version":7}'));
  await page.reload();
  await page.getByRole("heading", { name: "Poker Park", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Continuar la jornada" }).count(), 0);
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: "Privacidad", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Privacidad y créditos" });
    await dialog.waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `screenshots/audit-privacy-${viewport.width}.png` });
    await page.getByRole("button", { name: "Entendido", exact: true }).click();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, recovery: true, invalidSave: true, singleManifest: true, privacyWidths: [320, 390], errors }));
} finally {
  await browser.close();
}
