import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { createGame } from "../src/lib/game/engine.ts";
import { makeDeck } from "../src/lib/game/deck.ts";
import { ATTRACTION_IDS } from "../src/lib/game/types.ts";

const url = process.env.POKER_PARK_URL ?? "http://127.0.0.1:8080/";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
const deck = makeDeck();
const card = id => structuredClone(deck.find(candidate => candidate.id === id));

const game = createGame("solo", undefined, "classic", "standard");
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
game.deck = [];
game.hands = [[], []];
game.entrance = [card("diamonds-12"), card("diamonds-13")];
game.ended = false;
game.endReason = null;
game.pendingAdvance = false;

try {
  mkdirSync("screenshots", { recursive: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.addInitScript(({ savedGame }) => {
    localStorage.setItem("poker-park.opening-seen.v1", "seen");
    localStorage.setItem("poker-park-tutorial-seen", "true");
    localStorage.setItem("poker-park.settings.v1", JSON.stringify({ muted: true }));
    localStorage.setItem("poker-park.save.v7", JSON.stringify(savedGame));
    localStorage.setItem("poker-park.secrets.v1", JSON.stringify({
      perfect: true,
      lifetime: true,
      nightPerfect: true,
      pentonuiSignal: true,
      festivalPerfect: true,
      mirrorPerfect: true,
      stormPerfect: true,
      impossiblePerfect: true,
      classicMedals: ["night", "festival", "mirror", "storm", "impossible"],
    }));
    localStorage.setItem("poker-park.mascots.v1", JSON.stringify({
      version: 1,
      greetings: { turtle: 101, hedgehog: 101, fish: 101 },
      lastGreeted: "fish",
      pentonuiMedal: false,
    }));
  }, { savedGame: game });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".opening-title-action").waitFor({ state: "visible", timeout: 7_000 });
  await page.locator(".opening-title-action").click();
  await page.waitForTimeout(1_000);
  await page.getByRole("button", { name: "Continuar la jornada", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar el parque", exact: true }).click();
  const reveal = page.locator(".pentonui-medal-reveal");
  await reveal.waitFor({ state: "visible", timeout: 20_000 });
  assert.match(await reveal.innerText(), /Medalla Pentonúi/);
  const favoriteMascot = page.locator(".mascot-tally-note");
  await favoriteMascot.waitFor({ state: "visible", timeout: 2_000 });
  assert.match(await favoriteMascot.innerText(), /Mascota favorita de este dispositivo: Burbujas/);
  assert.equal(await favoriteMascot.locator(".mascot-sprite.mascot-sprite-fish").count(), 1, "la mascota favorita debe mostrar su sprite reutilizado");
  const stored = await page.evaluate(() => ({
    secrets: JSON.parse(localStorage.getItem("poker-park.secrets.v1")),
    mascots: JSON.parse(localStorage.getItem("poker-park.mascots.v1")),
  }));
  assert.deepEqual(stored.secrets.classicMedals.sort(), ["classic", "festival", "impossible", "mirror", "night", "storm"]);
  assert.equal(stored.mascots.pentonuiMedal, true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  await reveal.getByRole("button", { name: "Guardar en mi colección" }).click();
  await favoriteMascot.waitFor({ state: "visible", timeout: 2_000 });
  await page.screenshot({ path: "screenshots/pentonui-medal-end-mobile.png", fullPage: true });
  console.log("Medalla Pentonúi concedida y anunciada desde el recuento final.");
} finally {
  await browser.close();
}
