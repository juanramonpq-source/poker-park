import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.argv[2] ?? "http://127.0.0.1:8080/";
const localChrome = process.env.POKER_PARK_CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(localChrome) ? { executablePath: localChrome } : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

await mkdir("screenshots", { recursive: true });

async function checkMap(viewport, name, skip, testClose = false) {
  const context = await browser.newContext({
    viewport,
    hasTouch: name === "mobile",
    isMobile: name === "mobile",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("poker-park-tutorial-seen", "true");
    localStorage.removeItem("poker-park.save.v7");
  });

  await page.goto(baseURL, { waitUntil: "networkidle" });
  const startClickAt = Date.now();
  await page
    .getByRole("button", { name: "Jugar con compañero", exact: true })
    .evaluate((element) => element.click());
  const startClickDurationMs = Date.now() - startClickAt;
  const intro = page.locator("[data-map-intro='visible']");
  try {
    await intro.waitFor({ state: "attached", timeout: 5000 });
  } catch (error) {
    const debug = {
      name,
      body: (await page.locator("body").innerText()).slice(0, 500),
      playingTable: await page.locator(".playing-table").count(),
      mapSurface: await page.locator("[data-map-surface]").count(),
      tutorialSeen: await page.evaluate(() => localStorage.getItem("poker-park-tutorial-seen")),
      startClickDurationMs,
      reducedMotion: await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
      errors,
    };
    throw new Error(`No apareció la animación: ${JSON.stringify(debug)} · ${error.message}`);
  }
  await intro.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(520);
  const challenge = await intro.getAttribute("data-map-challenge");
  await page.screenshot({ path: `screenshots/map-unfold-${name}.png` });

  if (skip) {
    const skipButton = page.getByRole("button", { name: "Abrir el plano ahora" });
    if (await skipButton.isVisible().catch(() => false)) {
      await skipButton.evaluate((element) => element.click());
    }
  }
  await intro.waitFor({ state: "detached", timeout: 4000 });

  const surface = page.locator("[data-map-surface='classic']");
  await surface.waitFor({ state: "visible" });
  const result = {
    name,
    challenge,
    skipped: skip,
    startClickDurationMs,
    attractionCount: await surface.locator("[data-attraction-id]").count(),
    mapVisible: await surface.isVisible(),
    horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    consoleErrors: errors,
    closingAnimation: false,
    endScreenDuringFold: false,
    endScreenAfterFold: false,
  };
  await page.screenshot({ path: `screenshots/map-board-${name}.png` });

  if (testClose) {
    await page.getByRole("button", { name: "Cerrar el parque y ver el recuento" }).click();
    const closeClickAt = Date.now();
    await page
      .getByRole("button", { name: "Cerrar parque", exact: true })
      .evaluate((element) => element.click());
    result.closeClickDurationMs = Date.now() - closeClickAt;
    const outro = page.locator("[data-map-outro='visible']");
    await outro.waitFor({ state: "visible", timeout: 1500 });
    result.closingAnimation = true;
    result.endScreenDuringFold = await page
      .getByRole("heading", { name: "Fin de la jornada en el parque" })
      .isVisible()
      .catch(() => false);
    // Capture the fold after both side panels have visibly started to close.
    await page.waitForTimeout(1750);
    await page.screenshot({ path: `screenshots/map-fold-${name}.png` });
    await outro.waitFor({ state: "detached", timeout: 4000 });
    const endHeading = page.getByRole("heading", { name: "Fin de la jornada en el parque" });
    await endHeading.waitFor({ state: "visible", timeout: 1500 }).catch(() => undefined);
    result.endScreenAfterFold = await endHeading.isVisible().catch(() => false);
  }
  await context.close();

  if (
    result.challenge !== "classic" ||
    result.attractionCount !== 7 ||
    !result.mapVisible ||
    (testClose && (!result.closingAnimation || result.endScreenDuringFold || !result.endScreenAfterFold)) ||
    result.horizontalOverflow ||
    result.consoleErrors.length
  ) {
    throw new Error(`Fallo en el plano ${name}: ${JSON.stringify(result)}`);
  }
  return result;
}

async function checkNightMap() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("poker-park-tutorial-seen", "true");
    localStorage.removeItem("poker-park.save.v7");
    localStorage.setItem("poker-park.secrets.v1", JSON.stringify({ perfect: true }));
  });
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /La Noche de Guardia/ }).click();
  await page
    .getByRole("button", { name: "Guardia con compañero" })
    .evaluate((element) => element.click());
  const intro = page.locator("[data-map-intro='visible'][data-map-challenge='night']");
  await intro.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(520);
  await page.screenshot({ path: "screenshots/map-unfold-night-mobile.png" });
  const skipButton = page.getByRole("button", { name: "Abrir el plano ahora" });
  if (await skipButton.isVisible().catch(() => false)) {
    await skipButton.evaluate((element) => element.click());
  }
  await intro.waitFor({ state: "detached", timeout: 1500 });
  const result = {
    challenge: "night",
    mapVisible: await page.locator("[data-map-surface='night']").isVisible(),
    attractionCount: await page.locator("[data-map-surface='night'] [data-attraction-id]").count(),
    horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    consoleErrors: errors,
  };
  await page.screenshot({ path: "screenshots/map-board-night-mobile.png" });
  await context.close();
  if (!result.mapVisible || result.attractionCount !== 7 || result.horizontalOverflow || errors.length) {
    throw new Error(`Fallo en el plano nocturno: ${JSON.stringify(result)}`);
  }
  return result;
}

try {
  const results = [];
  results.push(await checkMap({ width: 1280, height: 800 }, "desktop", false));
  results.push(await checkMap({ width: 390, height: 844 }, "mobile", true, true));
  results.push(await checkNightMap());

  const reducedPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await reducedPage.addInitScript(() => {
    localStorage.setItem("poker-park-tutorial-seen", "true");
    localStorage.removeItem("poker-park.save.v7");
  });
  await reducedPage.goto(baseURL, { waitUntil: "networkidle" });
  await reducedPage
    .getByRole("button", { name: "Jugar con compañero", exact: true })
    .evaluate((element) => element.click());
  await reducedPage.locator("[data-map-intro='visible']").waitFor({ state: "detached", timeout: 1200 });
  results.push({ reducedMotion: true, mapVisible: await reducedPage.locator("[data-map-surface='classic']").isVisible() });
  await reducedPage.close();

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
} finally {
  await browser.close();
}
