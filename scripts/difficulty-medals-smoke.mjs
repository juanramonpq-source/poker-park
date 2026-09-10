#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
const localChrome = process.env.POKER_PARK_CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(localChrome) ? { executablePath: localChrome } : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(10_000);

const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

await page.addInitScript(() => {
  localStorage.setItem("poker-park-tutorial-seen", "true");
  localStorage.setItem("poker-park.secrets.v1", JSON.stringify({
    perfect: true,
    lifetime: false,
    nightPerfect: true,
    pentonuiSignal: false,
    festivalPerfect: true,
    mirrorPerfect: true,
    stormPerfect: true,
    impossiblePerfect: true,
    classicMedals: ["classic", "night", "festival", "mirror", "storm", "impossible"],
  }));
});

async function freshTitle() {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("poker-park.save.v7"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Poker Park" }).waitFor();
}

try {
  mkdirSync("screenshots", { recursive: true });
  await freshTitle();
  const medals = page.locator(".title-classic-medal");
  await medals.first().waitFor();
  const medalCount = await medals.count();
  if (medalCount !== 6) throw new Error(`No aparecen las seis medallas clásicas: ${medalCount}`);
  const colors = await medals.evaluateAll((items) => items.map((item) => getComputedStyle(item).backgroundColor));
  if (new Set(colors).size !== 6) throw new Error(`Las medallas no están bien diferenciadas: ${colors.join(", ")}`);
  if (await page.locator(".day-difficulty-selector").count() !== 0) throw new Error("La dificultad sigue ocupando espacio en portada");
  await page.screenshot({ path: "screenshots/classic-medals-mobile.png", fullPage: false });

  await page.getByRole("button", { name: "Jugar en pareja" }).click();
  const pairDialog = page.getByRole("dialog", { name: "Jugar en pareja" });
  await pairDialog.getByRole("button", { name: /Fácil.*4 cambios/ }).click();
  await page.screenshot({ path: "screenshots/difficulty-pair-mobile.png", fullPage: false });
  await pairDialog.getByRole("button", { name: "Empezar la jornada" }).click();
  let game = await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.save.v7") ?? "null"));
  if (game?.mode !== "hotseat" || game?.challenge !== "classic" || game?.difficulty !== "easy") throw new Error("La pareja no conserva la dificultad Fácil");

  await freshTitle();
  await page.getByRole("button", { name: /La Noche de Guardia/ }).click();
  const nightDialog = page.getByRole("dialog", { name: "La Noche de Guardia" });
  await nightDialog.getByRole("button", { name: /Fácil.*6 cambios/ }).click();
  await nightDialog.getByText("6 cambios compartidos").waitFor();
  await nightDialog.getByRole("button", { name: "Guardia en pareja" }).click();
  game = await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.save.v7") ?? "null"));
  if (game?.challenge !== "night" || game?.difficulty !== "easy") throw new Error("Noche no conserva su dificultad Fácil");

  await freshTitle();
  await page.getByRole("button", { name: /Pase Maestro/ }).click();
  const masterDialog = page.getByRole("dialog", { name: "Pase Maestro" });
  await masterDialog.getByRole("button", { name: /Poker Park 00:13/ }).click();
  await masterDialog.getByRole("button", { name: /Fácil.*7 cambios/ }).waitFor();
  await masterDialog.getByRole("button", { name: /Fácil.*7 cambios/ }).scrollIntoViewIfNeeded();
  await masterDialog.locator(".master-pass-card").evaluate((card) => { card.scrollTop = card.scrollHeight; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "screenshots/difficulty-master-mobile.png", fullPage: false });

  if (errors.length) throw new Error(`Errores del navegador: ${errors.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, medalColors: colors, pairEasy: 4, nightEasy: 6, impossibleEasy: 7, errors }, null, 2));
} finally {
  await browser.close();
}
