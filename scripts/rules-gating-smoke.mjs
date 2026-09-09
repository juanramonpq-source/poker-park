#!/usr/bin/env node

import { existsSync } from "node:fs";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
const macChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(macChrome) ? { executablePath: macChrome } : {}),
});

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

async function openRules() {
  await page.getByRole("button", { name: "Reglas completas" }).click();
  await page.getByRole("dialog", { name: "Cómo recorrer el parque" }).waitFor();
}

async function visibleSecretRules() {
  const dialog = page.getByRole("dialog", { name: "Cómo recorrer el parque" });
  return {
    night: await dialog.getByText("La Noche de Guardia", { exact: true }).count(),
    impossible: await dialog.getByText("Poker Park 00:13", { exact: true }).count(),
  };
}

await page.goto(url, { waitUntil: "networkidle" });
await openRules();
const fresh = await visibleSecretRules();

await page.getByRole("button", { name: "Cerrar", exact: true }).click();
await page.evaluate(() => {
  localStorage.setItem("poker-park.secrets.v1", JSON.stringify({ perfect: true }));
});
await page.reload({ waitUntil: "networkidle" });
await openRules();
const nightUnlocked = await visibleSecretRules();

await page.getByRole("button", { name: "Cerrar", exact: true }).click();
await page.evaluate(() => {
  localStorage.setItem("poker-park.secrets.v1", JSON.stringify({
    perfect: true,
    nightPerfect: true,
    festivalPerfect: true,
    mirrorPerfect: true,
    stormPerfect: true,
  }));
});
await page.reload({ waitUntil: "networkidle" });
await openRules();
const finaleUnlocked = await visibleSecretRules();

const ok = fresh.night === 0
  && fresh.impossible === 0
  && nightUnlocked.night === 1
  && nightUnlocked.impossible === 0
  && finaleUnlocked.night === 1
  && finaleUnlocked.impossible === 1
  && errors.length === 0;

console.log(JSON.stringify({ ok, fresh, nightUnlocked, finaleUnlocked, errors }, null, 2));
await browser.close();
if (!ok) process.exitCode = 1;
