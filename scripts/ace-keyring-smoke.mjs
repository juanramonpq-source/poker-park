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
page.setDefaultTimeout(10_000);

const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.addInitScript(() => {
  localStorage.setItem("poker-park-tutorial-seen", "true");
  localStorage.setItem("poker-park.secrets.v1", JSON.stringify({
    perfect: true,
    lifetime: false,
    nightPerfect: false,
    pentonuiSignal: false,
    festivalPerfect: false,
    mirrorPerfect: false,
    stormPerfect: false,
    impossiblePerfect: false,
  }));
});

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("poker-park.save.v7"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /La Noche de Guardia/ }).click();
  await page.getByRole("button", { name: "Guardia en solitario" }).click();
  await page.getByRole("button", { name: "Abrir el plano ahora" }).click();
  await page.getByText("6 cartas · toca o arrastra").waitFor();

  const game = await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.save.v7") ?? "null"));
  if (!game) throw new Error("No se guardó la partida nocturna");
  const dealt = [...game.deck, ...game.hands[0], ...game.hands[1], ...game.entrance];
  const aces = dealt.filter((card) => card.rank === 1);
  const hiddenAces = game.deck.filter((card) => card.rank === 1).length;
  if (dealt.length !== 52 || new Set(dealt.map((card) => card.id)).size !== 52 || aces.length !== 4) {
    throw new Error("Los ases no forman parte de la baraja nocturna completa");
  }
  if (game.night?.aceRack !== undefined) throw new Error("La partida nueva conserva el antiguo depósito de ases");

  const trigger = page.getByRole("button", { name: new RegExp(`${hiddenAces} ases siguen ocultos en el mazo`) });
  await trigger.click();
  await page.getByRole("heading", { name: "Llavero de Ases" }).waitFor();
  await page.getByText("Los ases forman parte del mazo y pueden salir con normalidad.").waitFor();
  await page.waitForTimeout(700);

  mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/ace-keyring-natural-mobile.png", fullPage: false });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: "screenshots/ace-keyring-natural-desktop.png", fullPage: false });

  if (errors.length > 0) throw new Error(`errores de navegador: ${errors.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, totalAces: aces.length, hiddenAces, errors }, null, 2));
} finally {
  await browser.close();
}
