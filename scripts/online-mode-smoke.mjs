import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";

const baseUrl = process.env.POKER_PARK_URL ?? "http://127.0.0.1:8080/";
const localChrome =
  process.env.POKER_PARK_CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(localChrome) ? { executablePath: localChrome } : {}),
});
const hostContext = await browser.newContext({ viewport: { width: 1100, height: 820 } });
const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const host = await hostContext.newPage();
const guest = await guestContext.newPage();
const errors = [];
for (const page of [host, guest]) {
  page.on("console", (message) => {
    if (message.type() === "error")
      errors.push(`${message.text()} ${message.location().url}`.trim());
  });
  page.on("pageerror", (error) => errors.push(error.message));
}

async function playFirstLegal(page) {
  const cards = page.locator("footer .playing-card[aria-label]");
  for (let index = 0; index < (await cards.count()); index += 1) {
    await cards.nth(index).click({ force: true });
    const destination = page
      .locator("[data-attraction-id][aria-label*='disponible para la carta elegida']")
      .first();
    if (await destination.count()) {
      await destination.click({ force: true });
      const slots = page.locator("[data-card-drop-slot='true']");
      if (await slots.count()) await slots.first().click({ force: true });
      return true;
    }
  }
  return false;
}

try {
  await host.goto(baseUrl);
  await host.waitForTimeout(500);
  await host.getByRole("button", { name: /Jugar en pareja/ }).click();
  await host.getByRole("button", { name: /Jugar online/ }).click();
  await host.getByRole("button", { name: /Preparar sala online/ }).click();
  await host.getByRole("button", { name: /Crear una sala/ }).click();
  await host.getByLabel("Tu nombre").fill("Ana");
  await host.getByRole("button", { name: "Crear sala privada" }).click();
  const code = (await host.locator(".online-room-code > strong").textContent())?.trim();
  if (!code) throw new Error("No se generó el código de sala");

  await guest.goto(`${baseUrl}?sala=${code}`);
  await guest.getByLabel("Tu nombre").fill("Luis");
  await guest.getByRole("button", { name: "Entrar en la sala" }).click();
  await Promise.all([
    host.getByText("Luis está dentro").waitFor({ timeout: 20_000 }),
    guest.getByText("Ana está dentro").waitFor({ timeout: 20_000 }),
  ]);
  mkdirSync("screenshots", { recursive: true });
  await Promise.all([
    host.screenshot({ path: "screenshots/online-lobby-desktop.png", fullPage: true }),
    guest.screenshot({ path: "screenshots/online-lobby-mobile.png", fullPage: true }),
  ]);

  await host.getByRole("button", { name: "Empezar juntos" }).click();
  await Promise.all([
    host.getByRole("button", { name: "Abrir el plano ahora" }).click(),
    guest.getByRole("button", { name: "Abrir el plano ahora" }).click({ timeout: 12_000 }),
  ]);

  if (!(await playFirstLegal(host)))
    throw new Error("La mano del anfitrión no ofreció una colocación legal");
  await guest.locator(".ai-move-reveal").waitFor({ timeout: 8_000 });
  await guest.locator(".ai-move-reveal").waitFor({ state: "hidden", timeout: 8_000 });
  await guest.getByText("Turno de Luis", { exact: true }).waitFor({ timeout: 8_000 });
  if (!(await playFirstLegal(guest)))
    throw new Error("La mano del invitado no ofreció una colocación legal");
  await host.locator(".ai-move-reveal").waitFor({ timeout: 8_000 });
  await host.locator(".ai-move-reveal").waitFor({ state: "hidden", timeout: 8_000 });
  await host.getByText("Turno de Ana", { exact: true }).waitFor({ timeout: 8_000 });

  if (errors.length) throw new Error(`Errores de navegador: ${errors.join(" | ")}`);
  console.log(
    JSON.stringify(
      {
        ok: true,
        room: code,
        connected: ["Ana", "Luis"],
        synchronizedTurns: 2,
        remotePlacementAnimation: true,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
