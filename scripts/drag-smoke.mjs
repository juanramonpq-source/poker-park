import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.argv[2] ?? "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.POKER_PARK_CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 1,
});
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => localStorage.setItem("poker-park-tutorial-seen", "true"));

try {
  await mkdir("screenshots", { recursive: true });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Modo solitario", exact: true }).click();
  await page.getByRole("button", { name: /Con compañero virtual/ }).click();
  await page.getByRole("button", { name: "Empezar con compañero virtual" }).click();
  await page.locator("[data-map-intro='visible']").waitFor({ state: "detached", timeout: 4000 });
  await page.waitForSelector(".hand-cards button");

  const cards = page.locator(".hand-cards button");
  let card = null;
  let tile = null;
  for (let index = 0; index < await cards.count(); index += 1) {
    const candidate = cards.nth(index);
    await candidate.evaluate((element) => element.click());
    const hot = page.locator(".park-tile.tile-hot").first();
    if (await hot.isVisible()) {
      card = candidate;
      const attractionId = await hot.getAttribute("data-attraction-id");
      tile = page.locator(`[data-card-drop-attraction="${attractionId}"]`);
      await candidate.evaluate((element) => element.click());
      break;
    }
    await candidate.evaluate((element) => element.click());
  }
  if (!card || !tile) throw new Error("La mano inicial no ofreció ningún destino arrastrable");

  const cardName = await card.getAttribute("aria-label");
  const cardBox = await card.boundingBox();
  const tileBox = await tile.boundingBox();
  if (!cardBox || !tileBox) throw new Error("No se pudieron medir la carta o la atracción");
  const start = { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 };
  const target = { x: tileBox.x + tileBox.width / 2, y: tileBox.y + tileBox.height / 2 };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y - 22, { steps: 3 });
  await page.mouse.move(target.x, target.y, { steps: 14 });
  await page.waitForTimeout(140);
  const ghostName = await page.locator(".card-drag-ghost .playing-card").getAttribute("aria-label");
  const targetHint = await page.locator(".card-drag-hint").textContent();
  if (ghostName !== cardName) throw new Error(`La carta perdió identidad: ${cardName} → ${ghostName}`);
  if (targetHint?.trim() !== "Suelta aquí") throw new Error(`Destino no reconocido: ${targetHint}`);

  await page.waitForTimeout(430);
  const slot = page.locator("[data-card-drop-slot='true']").first();
  if (await slot.isVisible()) {
    const slotBox = await slot.boundingBox();
    if (!slotBox) throw new Error("No se pudo medir el hueco legal");
    await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height / 2, { steps: 8 });
    await page.waitForTimeout(120);
  }
  await page.screenshot({ path: "screenshots/drag-identity-mobile.png" });
  await page.mouse.up();
  await page.waitForTimeout(180);

  const result = {
    card: cardName,
    ghostPreservedIdentity: ghostName === cardName,
    released: (await page.locator(".card-drag-ghost").count()) === 0,
    placedCards: await page.locator(".map-pip.is-filled").count(),
    dialogOpen: await page.locator(".attraction-sheet").isVisible().catch(() => false),
    horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    consoleErrors: errors,
  };
  if (!result.released || (result.placedCards === 0 && !result.dialogOpen) || result.horizontalOverflow || errors.length) {
    throw new Error(`Fallo del arrastre: ${JSON.stringify(result)}`);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await browser.close();
}
