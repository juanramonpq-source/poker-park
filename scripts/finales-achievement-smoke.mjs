import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const phase = process.argv.find(argument => argument.startsWith("--phase="))?.split("=")[1] ?? "all";
assert.ok(["all", "narrative", "form"].includes(phase), `Fase desconocida: ${phase}`);
assert.ok(existsSync("src/components/game/ParkEndingReveal.tsx"), "falta ParkEndingReveal");
assert.ok(existsSync("src/components/game/FinaleSequence.tsx"), "falta FinaleSequence");
if (phase === "form") assert.ok(existsSync("src/components/game/AchievementForm.tsx"), "falta AchievementForm");

const url = process.env.POKER_PARK_URL ?? "http://127.0.0.1:8080/";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(chrome) ? { executablePath: chrome } : {}),
});

const completeSecrets = {
  perfect: true,
  lifetime: false,
  nightPerfect: true,
  masterPassUnlocked: true,
  pentonuiSignal: false,
  festivalPerfect: true,
  mirrorPerfect: true,
  stormPerfect: true,
  impossiblePerfect: true,
  classicMedals: [],
};

const mascotProgress = (gold, pentonuiMedal = false) => ({
  version: 1,
  greetings: gold
    ? { turtle: 101, hedgehog: 101, fish: 101 }
    : { turtle: 0, hedgehog: 0, fish: 0 },
  lastGreeted: gold ? "fish" : null,
  pentonuiMedal,
});

async function openReadyPage({
  gold = false,
  pentonuiMedal = false,
  finale = null,
  viewport = { width: 390, height: 844 },
  achievementStatus = null,
} = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() !== "error") return;
    if (achievementStatus && achievementStatus >= 400 && message.text().includes(`status of ${achievementStatus}`)) return;
    errors.push(message.text());
  });
  const requests = [];
  if (achievementStatus !== null) {
    await page.route("**/api/achievement", async route => {
      requests.push(await route.request().postDataJSON());
      await route.fulfill({
        status: achievementStatus,
        contentType: "application/json",
        body: JSON.stringify(achievementStatus >= 200 && achievementStatus < 300 ? { ok: true } : { ok: false, error: "service_unavailable" }),
      });
    });
  }
  await page.addInitScript(({ secrets, mascots, savedFinale }) => {
    localStorage.setItem("poker-park.opening-seen.v1", "seen");
    localStorage.setItem("poker-park-tutorial-seen", "true");
    localStorage.setItem("poker-park.settings.v1", JSON.stringify({ muted: true }));
    localStorage.setItem("poker-park.secrets.v1", JSON.stringify(secrets));
    localStorage.setItem("poker-park.mascots.v1", JSON.stringify(mascots));
    if (savedFinale) localStorage.setItem("poker-park.finales.v1", JSON.stringify(savedFinale));
  }, { secrets: completeSecrets, mascots: mascotProgress(gold, pentonuiMedal), savedFinale: finale });
  await page.goto(url, { waitUntil: "networkidle" });
  const titleAction = page.locator(".opening-title-action");
  await titleAction.waitFor({ state: "visible", timeout: 8_000 });
  await titleAction.click();
  await page.locator('[data-opening="ready"]').waitFor({ state: "visible", timeout: 5_000 });
  return { context, page, errors, requests };
}

async function narrativeSmoke() {
  {
    const { context, page, errors } = await openReadyPage();
    const park = page.getByRole("heading", { name: /todo día en el parque llega a su fin/i });
    await park.waitFor({ state: "visible" });
    assert.equal(await page.locator(".park-ending-reveal").evaluate(dialog => dialog.contains(document.activeElement)), true);
    assert.equal(await page.getByRole("heading", { name: /último secreto del parque/i }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: "screenshots/final-parque-mobile.png", fullPage: true });
    await context.close();
  }

  {
    const { context, page, errors } = await openReadyPage({ gold: true });
    await page.getByRole("heading", { name: /todo día en el parque llega a su fin/i }).waitFor();
    assert.equal(await page.getByRole("heading", { name: /último secreto del parque/i }).count(), 0);
    await page.getByRole("button", { name: /cerrar las puertas por hoy/i }).click();
    await page.getByRole("heading", { name: /último secreto del parque/i }).waitFor();
    assert.equal(await page.locator(".pentonui-medal-reveal").evaluate(dialog => dialog.contains(document.activeElement)), true);
    await page.getByRole("button", { name: /ahora no/i }).click();
    const stored = await page.evaluate(() => ({
      finale: JSON.parse(localStorage.getItem("poker-park.finales.v1")),
      mascot: JSON.parse(localStorage.getItem("poker-park.mascots.v1")),
    }));
    assert.equal(stored.finale.parkEndingSeen, true);
    assert.equal(stored.finale.ultimateEndingSeen, true);
    assert.equal(stored.mascot.pentonuiMedal, true);
    const medal = page.getByRole("button", { name: /medalla pentonúi/i });
    await medal.click();
    await page.getByRole("heading", { name: /último secreto del parque/i }).waitFor();
    await page.screenshot({ path: "screenshots/final-definitivo-mobile.png", fullPage: true });
    assert.deepEqual(errors, []);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.getByRole("heading", { name: /todo día en el parque llega a su fin/i }).count(), 0);
    assert.equal(await page.getByRole("heading", { name: /último secreto del parque/i }).count(), 0);
    await context.close();
  }

  {
    const { context, page, errors } = await openReadyPage({
      gold: true,
      finale: { version: 1, parkEndingSeen: true, ultimateEndingSeen: false, achievementSubmittedAt: null },
      viewport: { width: 1280, height: 800 },
    });
    await page.getByRole("heading", { name: /último secreto del parque/i }).waitFor();
    assert.equal(await page.getByRole("heading", { name: /todo día en el parque llega a su fin/i }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: "screenshots/final-definitivo-desktop.png", fullPage: true });
    await context.close();
  }
}

async function openAchievementForm(options = {}) {
  const session = await openReadyPage({
    gold: true,
    pentonuiMedal: true,
    finale: { version: 1, parkEndingSeen: true, ultimateEndingSeen: true, achievementSubmittedAt: null },
    ...options,
  });
  await session.page.getByRole("button", { name: /medalla pentonúi/i }).click();
  await session.page.getByRole("button", { name: /compartir mi hazaña/i }).click();
  await session.page.getByRole("heading", { name: /comparte tu hazaña con pentonúi games/i }).waitFor();
  return session;
}

async function fillValidAchievement(page) {
  await page.getByLabel("Tu nombre").fill("Alex del Parque");
  await page.getByLabel("Tu correo").fill("alex@example.com");
  await page.getByRole("radio", { name: "5 estrellas" }).check();
  await page.getByLabel("Mensaje opcional").fill("Una despedida preciosa.");
  await page.getByRole("checkbox", { name: /acepto enviar/i }).check();
  await page.waitForTimeout(2_100);
}

async function formSmoke() {
  {
    const { context, page, requests, errors } = await openAchievementForm({ achievementStatus: 200 });
    await page.getByRole("button", { name: /cancelar por ahora/i }).click();
    assert.equal(requests.length, 0);
    assert.deepEqual(errors, []);
    await context.close();
  }

  {
    const { context, page, requests, errors } = await openAchievementForm({ achievementStatus: 200 });
    await page.getByLabel("Tu correo").fill("correo inválido");
    await page.getByRole("button", { name: /enviar mi hazaña/i }).click();
    await page.getByText(/revisa los campos señalados/i).waitFor();
    assert.equal(requests.length, 0);
    assert.deepEqual(errors, []);
    await context.close();
  }

  {
    const { context, page, requests, errors } = await openAchievementForm({ achievementStatus: 503 });
    await fillValidAchievement(page);
    await page.getByRole("button", { name: /enviar mi hazaña/i }).click();
    await page.getByText(/no se ha enviado nada/i).waitFor();
    assert.equal(await page.getByLabel("Tu nombre").inputValue(), "Alex del Parque");
    assert.equal(requests.length, 1);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.finales.v1")).achievementSubmittedAt), null);
    assert.equal("to" in requests[0], false, "el navegador no debe conocer el destinatario");
    assert.equal("recipient" in requests[0], false, "el formulario no debe enviar un destinatario");
    await page.screenshot({ path: "screenshots/hazana-error-mobile.png", fullPage: true });
    assert.deepEqual(errors, []);
    await context.close();
  }

  {
    const { context, page, requests, errors } = await openAchievementForm({
      achievementStatus: 200,
      viewport: { width: 1280, height: 800 },
    });
    await fillValidAchievement(page);
    await page.getByRole("button", { name: /enviar mi hazaña/i }).click();
    await page.getByRole("heading", { name: /hazaña recibida/i }).waitFor();
    assert.equal(requests.length, 1);
    assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.finales.v1")).achievementSubmittedAt));
    await page.screenshot({ path: "screenshots/hazana-enviada-desktop.png", fullPage: true });
    await page.getByRole("button", { name: /volver al parque/i }).click();
    await page.getByRole("button", { name: /medalla pentonúi/i }).click();
    assert.equal(await page.getByRole("button", { name: /hazaña ya enviada/i }).isDisabled(), true);
    assert.equal(requests.length, 1);
    assert.deepEqual(errors, []);
    await context.close();
  }
}

try {
  mkdirSync("screenshots", { recursive: true });
  if (phase === "all" || phase === "narrative") await narrativeSmoke();
  if (phase === "all" || phase === "form") await formSmoke();
  console.log("Finales narrativos verificados en móvil y escritorio.");
} finally {
  await browser.close();
}
