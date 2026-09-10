#!/usr/bin/env node
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
const localChrome = process.env.POKER_PARK_CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(localChrome) ? { executablePath: localChrome } : {}),
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(8_000);

const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    localStorage.setItem("poker-park-tutorial-seen", "true");
    localStorage.removeItem("poker-park.save.v7");
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Jugar en solitario" }).click();
  const openMapNow = page.getByRole("button", { name: "Abrir el plano ahora" });
  if (await openMapNow.isVisible().catch(() => false)) await openMapNow.click();
  await page.getByText("6 cartas · toca o arrastra").waitFor();
  await page.getByRole("button", { name: "Cerrar el parque y ver el recuento" }).click();
  await page.getByRole("button", { name: "Cerrar parque", exact: true }).click();

  const closingMap = page.locator(".park-map-intro.is-closing");
  await closingMap.waitFor();
  await page.waitForTimeout(2_350);
  const closingFrame = await closingMap.evaluate((element) => ({
    opacity: Number.parseFloat(getComputedStyle(element).opacity),
    coversCenter: Boolean(document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest(".park-map-intro.is-closing")),
  }));
  if (closingFrame.opacity < 0.95 || !closingFrame.coversCenter) {
    throw new Error(`el cierre deja ver el tablero: ${JSON.stringify(closingFrame)}`);
  }

  mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/map-outro-last-frame-mobile.png" });
  await page.locator(".end-splash").waitFor();
  const boardVisibleAfterClose = await page.locator(".playing-table").isVisible().catch(() => false);
  if (boardVisibleAfterClose) throw new Error("el tablero reaparece después de plegar el plano");
  await page.locator(".end-tally").waitFor();
  await page.screenshot({ path: "screenshots/map-outro-tally-mobile.png" });

  if (errors.length > 0) throw new Error(`errores de navegador: ${errors.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, closingFrame, boardVisibleAfterClose, errors }, null, 2));
} finally {
  await browser.close();
}
