import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";

const baseUrl = process.env.POKER_PARK_URL ?? "http://127.0.0.1:8080/";
const localChrome =
  process.env.POKER_PARK_CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(localChrome) ? { executablePath: localChrome } : {}),
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript(() => {
  localStorage.setItem("poker-park-tutorial-seen", "true");
  localStorage.setItem(
    "poker-park.secrets.v1",
    JSON.stringify({
      perfect: true,
      lifetime: true,
      nightPerfect: true,
      pentonuiSignal: true,
      festivalPerfect: true,
      mirrorPerfect: true,
      stormPerfect: true,
      impossiblePerfect: true,
      classicMedals: [],
    }),
  );
});
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

async function expectPairChooser(challengeName) {
  const chooser = page.getByRole("dialog", { name: "Jugar en pareja" });
  await chooser.getByRole("heading", { name: "Jugar en pareja" }).waitFor();
  await chooser.getByText(challengeName, { exact: true }).waitFor();
  await chooser.getByRole("button", { name: /En este dispositivo/ }).waitFor();
  await chooser.getByRole("button", { name: /Jugar online/ }).waitFor();
}

try {
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Jugar en pareja", exact: true }).click();
  await expectPairChooser("Jornada de día");
  mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/online-submenu-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Cerrar preparación de partida" }).last().click();

  await page.getByRole("button", { name: /La Noche de Guardia/ }).click();
  await page.getByRole("button", { name: /Guardia en pareja/ }).click();
  await expectPairChooser("La Noche de Guardia");
  await page.getByRole("button", { name: "Cerrar preparación de partida" }).last().click();

  await page.getByRole("button", { name: /Pase Maestro/ }).click();
  for (const challengeName of [
    "Festival de las Luces",
    "Parque Espejo",
    "Día de Tormenta",
    "Poker Park 00:13",
  ]) {
    await page.getByRole("button", { name: new RegExp(challengeName) }).click();
    await page.getByRole("button", { name: "En pareja", exact: true }).click();
    await expectPairChooser(challengeName);
    await page.getByRole("button", { name: "Cerrar preparación de partida" }).last().click();
  }

  if (errors.length) throw new Error(errors.join(" | "));
  console.log(JSON.stringify({ ok: true, challenges: 6, onlineNestedUnderPair: true }, null, 2));
} finally {
  await browser.close();
}
