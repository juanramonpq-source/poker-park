import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { completedPark } from "./fixtures/completed-park.ts";
import { legalVisits } from "../src/lib/game/engine.ts";

const url = process.env.POKER_PARK_URL ?? "http://127.0.0.1:8080";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
mkdirSync("screenshots", { recursive: true });
try {
  for (const challenge of ["classic", "night", "festival", "mirror", "storm", "impossible"]) {
    const page = await browser.newPage({ viewport: { width: challenge === "classic" ? 1280 : 390, height: 844 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const game = completedPark("solo", challenge);
    await page.addInitScript(savedGame => {
      localStorage.setItem("poker-park.save.v7", JSON.stringify(savedGame));
      localStorage.setItem("poker-park.opening-seen.v1", "seen");
      localStorage.setItem("poker-park-tutorial-seen", "true");
      localStorage.setItem("poker-park.settings.v1", JSON.stringify({ muted: true }));
      localStorage.setItem("poker-park.secrets.v1", JSON.stringify({ perfect: true, lifetime: true, nightPerfect: true, masterPassUnlocked: true, festivalPerfect: true, mirrorPerfect: true, stormPerfect: true, impossiblePerfect: true }));
    }, game);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator(".opening-title-action").click();
    await page.locator(".title-resume-button").click();
    await page.getByRole("heading", { name: "La jornada en el parque ha terminado" }).waitFor();
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `screenshots/jornada-${challenge}.png` });
    await page.getByRole("button", { name: "Dejar un visitante", exact: true }).click();
    const close = page.getByRole("button", { name: "Cerrar el parque", exact: true });
    await close.waitFor();
    if (challenge === "night") {
      await page.locator(".hand-cards button").first().click();
      const destination = legalVisits(game, "clubs-12")[0];
      await page.locator(`[data-card-drop-attraction="${destination}"]`).click();
      await page.getByRole("heading", { name: "La jornada en el parque ha terminado" }).waitFor();
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.save.v7")));
      assert.equal(saved.attractions[destination].visitors.length, 1);
      assert.equal(saved.exchangesUsed, 0);
    }
    // Choosing the optional visit can always be cancelled by closing immediately.
    await close.click();
    await page.locator(".end-tally").waitFor({ timeout: 15000 });
    await page.getByText(/Cambios ahorrados:/).waitFor({ timeout: 15000 });
    assert.match(await page.getByText(/Cambios ahorrados:/).innerText(), /Cambios ahorrados: (\d+) de \1\./);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log("Final de los seis retos: aviso, visitantes opcionales, cierre y cambios ahorrados verificados.");
} finally {
  await browser.close();
}
