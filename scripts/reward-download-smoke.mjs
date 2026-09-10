import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { createGame } from "../src/lib/game/engine.ts";
import { makeDeck } from "../src/lib/game/deck.ts";
import { ATTRACTION_IDS } from "../src/lib/game/types.ts";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
assert.match(url, /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//, "This source-module smoke runs only against the local dev server");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
const deck = makeDeck();
const card = id => structuredClone(deck.find(candidate => candidate.id === id));

function perfectNight() {
  const game = createGame("solo", undefined, "night", "easy");
  const full = {
    coaster: [2, 3, 4, 5, 6, 7, 8, 9].map(rank => card(`clubs-${rank}`)),
    haunted: [2, 3, 4, 5, 1].map(rank => card(`spades-${rank}`)),
    love: [2, 3, 4, 1, 5, 6, 7].map(rank => card(`hearts-${rank}`)),
    forest: ["diamonds-2", "diamonds-3", "diamonds-4", "diamonds-5", "diamonds-1", "diamonds-6", "diamonds-7", "diamonds-8", "clubs-10", "diamonds-9", "diamonds-10"].map(card),
    chairs: ["hearts-11", "spades-11", "clubs-11", "diamonds-11", "spades-6", "spades-7", "spades-8"].map(card),
    restaurant: ["hearts-8", "clubs-1", "hearts-9", "hearts-10", "spades-9", "spades-10"].map(card),
    restrooms: [card("hearts-12"), card("hearts-13")],
  };
  for (const id of ATTRACTION_IDS) game.attractions[id].slots = full[id];
  game.night.unlocked = [...ATTRACTION_IDS];
  game.night.route = [];
  game.night.jackBox = [];
  game.night.jokerUsed = true;
  game.deck = [];
  game.hands = [[], []];
  game.entrance = [card("diamonds-12"), card("diamonds-13")];
  game.ended = false;
  game.endReason = null;
  game.pendingAdvance = false;
  return game;
}

async function openReward(page, game) {
  await page.goto(url);
  await page.evaluate(state => {
    localStorage.setItem("poker-park.settings.v1", JSON.stringify({ muted: true }));
    localStorage.setItem("poker-park-tutorial-seen", "true");
    localStorage.setItem("poker-park.save.v7", JSON.stringify(state));
  }, game);
  await page.reload();
  await page.getByRole("button", { name: "Continuar la guardia", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar el parque", exact: true }).click();
  await page.getByRole("button", { name: "Descargar fondo para móvil", exact: true }).waitFor({ timeout: 15000 });
}

try {
  mkdirSync("screenshots", { recursive: true });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await openReward(page, perfectNight());
  const beforeUrl = page.url();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar fondo para móvil", exact: true }).click();
  assert.equal((await download).suggestedFilename(), "Poker-Park-Guardianes-del-Alba.webp");
  assert.equal(page.url(), beforeUrl);
  await page.getByRole("button", { name: "Recompensa lista", exact: true }).waitFor();
  await page.getByRole("button", { name: "Activar interfaz nocturna", exact: true }).click();
  await page.screenshot({ path: "screenshots/reward-download-mobile.png", fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

  const shared = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await shared.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: data => Boolean(data?.files?.length) });
    Object.defineProperty(navigator, "share", { configurable: true, value: async data => {
      window.__rewardShare = { filename: data.files[0].name, type: data.files[0].type, title: data.title };
    } });
  });
  shared.on("pageerror", error => errors.push(error.message));
  await openReward(shared, perfectNight());
  await shared.getByRole("button", { name: "Descargar fondo para móvil", exact: true }).click();
  assert.deepEqual(await shared.evaluate(() => window.__rewardShare), {
    filename: "Poker-Park-Guardianes-del-Alba.webp",
    type: "image/webp",
    title: "Descargar fondo para móvil",
  });
  assert.match(shared.url(), /\/$/);
  await shared.getByRole("button", { name: "Ver créditos", exact: true }).click();
  await shared.getByRole("button", { name: "Volver al inicio", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, nativeShare: true, safeDownload: true, gameResponsive: true, errors }));
} finally {
  await browser.close();
}
