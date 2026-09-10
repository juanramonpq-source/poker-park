import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { createGame } from "../src/lib/game/engine.ts";
import { makeDeck } from "../src/lib/game/deck.ts";
import { ATTRACTION_IDS } from "../src/lib/game/types.ts";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
const deck = makeDeck();
const c = id => deck.find(card => card.id === id);
function fixture(challenge = "classic") {
  const game = createGame("solo", undefined, challenge, "easy");
  game.entrance = [c("hearts-12"), c("spades-13")];
  game.hands = [[c("spades-4"), c("clubs-4"), c("clubs-5")], []];
  if (game.night) {
    game.night.jackBox = [];
    game.night.unlocked = [...ATTRACTION_IDS]; game.night.route = [];
  }
  return game;
}
function repairDeck(game) {
  const used = new Set([...game.hands.flat(), ...game.entrance, ...(game.night?.jackBox ?? []), ...Object.values(game.attractions).flatMap(a => [...a.slots, ...a.visitors])].filter(Boolean).map(c => c.id));
  game.deck = deck.filter(c => !used.has(c.id));
}
async function load(game) {
  repairDeck(game);
  await page.goto(url);
  await page.evaluate(game => {
    localStorage.setItem("poker-park.save.v7", JSON.stringify(game));
    localStorage.setItem("poker-park-tutorial-seen", "true");
    localStorage.setItem("poker-park.settings.v1", JSON.stringify({ muted: true }));
  }, game);
  await page.reload();
  await page.getByRole("button", { name: game.challenge === "night" ? "Continuar la guardia" : "Continuar la jornada", exact: true }).click();
  await page.locator(".playing-table").waitFor();
}
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.save.v7")));
async function slot(id, index) {
  await page.locator(`[data-attraction-id="${id}"]`).click();
  await page.locator(`[data-card-drop-slot="true"][data-drop-attraction="${id}"][data-drop-index="${index}"]`).click();
}

try {
  mkdirSync("screenshots", { recursive: true });
  const game = fixture();
  game.attractions.restaurant.slots = [c("spades-2"), c("clubs-1"), c("spades-3"), null, null, null];
  await load(game);
  await page.locator("footer").getByRole("button", { name: "4 de picas", exact: true }).click();
  const before = await saved();
  await slot("restaurant", 3);
  const caution = page.getByRole("dialog", { name: "Antes de colocar…" });
  await caution.waitFor();
  assert.match(await caution.textContent(), /Casa del Terror y Sillas Voladoras/);
  assert.deepEqual(await saved(), before);
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);
    await page.screenshot({ path: `screenshots/easy-warning-${viewport.width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await caution.getByRole("button", { name: "Reconsiderar" }).click();
  assert.deepEqual(await saved(), before);
  await page.locator('[data-drop-attraction="restaurant"][data-drop-index="3"]').click();
  await caution.getByRole("button", { name: "Colocar igualmente" }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("poker-park.save.v7")).attractions.restaurant.slots[3]?.id === "spades-4");
  const after = await saved();
  assert.equal(after.exchangesUsed, before.exchangesUsed);
  assert.equal(after.deck.length, before.deck.length - 1);

  const night = fixture("night");
  night.night.jackBox = [c("clubs-11"), c("hearts-11")];
  [2, 3, 5].forEach((rank, i) => { night.attractions.chairs.slots[4 + i] = c(`spades-${rank}`); });
  await load(night);
  await page.getByRole("button", { name: /Caseta de guardia/ }).click();
  const box = page.getByRole("dialog", { name: "Caseta de guardia", exact: true });
  await box.getByRole("button", { name: "J de tréboles", exact: true }).click();
  await slot("chairs", 0);
  assert.equal((await saved()).attractions.chairs.slots[0].id, "clubs-11");
  if (await page.locator(".sheet-close").count()) await page.locator(".sheet-close").click();
  await page.getByRole("button", { name: /Abrir Llavero de Ases/ }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "screenshots/night-joker-mobile.png" });
  await page.getByRole("button", { name: "Preparar comodín" }).click();
  await slot("restaurant", 1);
  assert.equal((await saved()).night.jokerUsed, true);
  assert.equal((await saved()).attractions.restaurant.slots[1].id, "night-joker:clubs:1");
  await page.reload();
  await page.getByRole("button", { name: "Continuar la guardia", exact: true }).click();
  assert.equal((await saved()).night.jokerUsed, true);
  await page.screenshot({ path: "screenshots/night-tools-mobile.png" });

  // Both selection orders must work, including a box-only emergency exchange.
  for (const emergency of [false, true]) {
    const swap = fixture("night");
    swap.difficulty = "standard";
    swap.night.jackBox = [c("clubs-11")];
    swap.entrance = [c("clubs-2"), c("hearts-3")];
    if (emergency) {
      swap.hands = [[], []];
      swap.night.unlocked = ["restaurant", "restrooms"];
      swap.night.route = ["coaster", "forest", "chairs", "love", "haunted"];
    }
    await load(swap);
    const beforeSwap = await saved();
    if (emergency) await page.getByRole("button", { name: "Usar un cambio antes" }).click();
    await page.getByRole("button", { name: /Caseta de guardia/ }).click();
    const jackDialog = page.getByRole("dialog", { name: "Caseta de guardia", exact: true });
    if (!emergency) {
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 800 });
        await page.screenshot({ path: `screenshots/jack-exchange-box-${width}.png` });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      await page.setViewportSize({ width: 390, height: 844 });
    }
    await jackDialog.getByRole("button", { name: "J de tréboles", exact: true }).click();
    if (!emergency) await page.getByRole("button", { name: /Intercambiar la carta seleccionada/ }).click();
    await page.locator(".park-entrance").getByRole("button", { name: "2 de tréboles", exact: true }).click();
    const exchanged = await saved();
    assert.equal(exchanged.entrance[0].id, "clubs-11");
    assert.equal(exchanged.night.jackBox.length, 0);
    assert.equal(exchanged.swappedCardId, "clubs-2");
    assert.equal(exchanged.exchangesUsed, 1);
    assert.equal(exchanged.hands[0].length, beforeSwap.hands[0].length + 1);
    assert.deepEqual(exchanged.deck, beforeSwap.deck);
    await page.reload();
    await page.getByRole("button", { name: "Continuar la guardia", exact: true }).click();
    assert.equal((await saved()).swappedCardId, "clubs-2");
    await page.locator("footer").getByRole("button", { name: "2 de tréboles", exact: true }).click();
    await slot("restaurant", 0);
    assert.equal((await saved()).attractions.restaurant.slots[0].id, "clubs-2");
  }

  const wideHand = fixture("night");
  wideHand.hands = [[
    c("spades-2"), c("clubs-2"), c("diamonds-2"), c("hearts-2"), c("spades-3"),
    c("clubs-3"), c("diamonds-3"), c("hearts-3"), c("spades-4"), c("clubs-4"),
  ], []];
  wideHand.night.jackBox = [];
  await load(wideHand);
  const handCards = page.locator(".hand-cards .playing-card");
  assert.equal(await handCards.count(), 10);
  assert.equal(await page.locator(".hand-cards.is-compact").getAttribute("data-hand-count"), "10");
  const bounds = await handCards.evaluateAll(cards => cards.map(card => card.getBoundingClientRect()).map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight })));
  assert.ok(bounds.every(rect => rect.left >= 0 && rect.right <= rect.viewportWidth && rect.top >= 0 && rect.bottom <= rect.viewportHeight));
  assert.ok(bounds.every(rect => rect.right - rect.left >= 44 && rect.bottom - rect.top >= 44));
  await handCards.nth(9).click();
  assert.equal(await page.locator(".hand-card-on").count(), 1);
  await page.screenshot({ path: "screenshots/night-expanded-hand-mobile.png" });

  const six = fixture("night");
  const full = {
    haunted: ["spades-2", "spades-3", "spades-4", "spades-5", "spades-1"],
    love: ["hearts-2", "hearts-3", "hearts-4", "hearts-1", "hearts-5", "hearts-6", "hearts-7"],
    forest: ["diamonds-2", "diamonds-3", "clubs-2", "diamonds-4", "diamonds-1", "diamonds-5", "clubs-3", "clubs-4", "clubs-5", "diamonds-6", "diamonds-7"],
    chairs: ["hearts-11", "spades-11", "clubs-11", "diamonds-11", "spades-6", "spades-7", "spades-8"],
    restaurant: ["clubs-6", "clubs-1", "clubs-7", "clubs-8", "clubs-9", "clubs-10"],
    restrooms: ["hearts-12", "hearts-13"],
  };
  for (const [id, cards] of Object.entries(full)) six.attractions[id].slots = cards.map(c);
  six.entrance = [c("spades-12"), c("spades-13")]; six.hands = [[c("diamonds-8"), c("hearts-8")], []];
  await page.evaluate(() => localStorage.removeItem("poker-park.secrets.v1"));
  await load(six);
  await page.getByRole("button", { name: "Cerrar el turno y ver el recuento" }).click();
  await page.getByRole("button", { name: "Cerrar turno", exact: true }).click();
  await page.getByText("Pase Maestro desbloqueado", { exact: true }).waitFor({ timeout: 20000 });
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.secrets.v1")));
  assert.equal(progress.masterPassUnlocked, true); assert.equal(progress.nightPerfect, false);
  await page.goto(url);
  await page.getByRole("button", { name: /Pase Maestro/ }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Activar interfaz nocturna", exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, reconsider: true, confirmOnce: true, jackBox: true, jackExchange: true, jackEmergency: true, expandedHand: true, joker: true, resume: true, sixUnlock: true, errors }));
} finally { await browser.close(); }
