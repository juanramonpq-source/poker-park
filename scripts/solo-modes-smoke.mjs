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
  }));
});

async function freshTitle() {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.removeItem("poker-park.save.v7"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Poker Park" }).waitFor();
}

async function readStartedGame(expectedChallenge) {
  await page.getByRole("button", { name: "Abrir el plano ahora" }).click();
  await page.getByText("6 cartas · toca o arrastra").waitFor();
  const game = await page.evaluate(() => JSON.parse(localStorage.getItem("poker-park.save.v7") ?? "null"));
  if (!game) throw new Error(`${expectedChallenge}: no se guardó la partida`);
  if (game.mode !== "solo" || game.challenge !== expectedChallenge) {
    throw new Error(`${expectedChallenge}: se inició ${game.mode}/${game.challenge}`);
  }
  if (game.currentPlayer !== 0 || game.hands[0].length !== 6 || game.hands[1].length !== 0) {
    throw new Error(`${expectedChallenge}: reparto solitario incorrecto`);
  }
  return {
    challenge: game.challenge,
    hand: game.hands[0].length,
    exchanges: game.challenge === "classic" ? 3 : ({ night: 5, festival: 4, mirror: 5, storm: 5, impossible: 6 })[game.challenge],
  };
}

const results = [];
try {
  await freshTitle();
  await page.getByRole("button", { name: /La Noche de Guardia/ }).click();
  await page.getByRole("button", { name: "Guardia en solitario" }).waitFor();
  mkdirSync("screenshots", { recursive: true });
  await page.screenshot({ path: "screenshots/solo-night-selector-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Guardia en solitario" }).click();
  results.push(await readStartedGame("night"));

  for (const challenge of ["festival", "mirror", "storm", "impossible"]) {
    await freshTitle();
    await page.getByRole("button", { name: /Pase Maestro/ }).click();
    const label = {
      festival: "Festival de las Luces",
      mirror: "Parque Espejo",
      storm: "Día de Tormenta",
      impossible: "Poker Park 00:13",
    }[challenge];
    await page.getByRole("button", { name: new RegExp(label) }).click();
    const soloButton = page.getByRole("button", { name: "En solitario", exact: true });
    await soloButton.waitFor();
    if (challenge === "festival") {
      await soloButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await page.screenshot({ path: "screenshots/solo-master-selector-mobile.png", fullPage: true });
    }
    await soloButton.click();
    results.push(await readStartedGame(challenge));
  }

  if (errors.length > 0) throw new Error(`errores de navegador: ${errors.join(" | ")}`);
  console.log(JSON.stringify({ ok: true, modes: results, errors }, null, 2));
} finally {
  await browser.close();
}
