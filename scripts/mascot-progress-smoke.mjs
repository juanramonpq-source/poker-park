import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.POKER_PARK_URL ?? "http://127.0.0.1:8080";
const screenshots = new URL("../screenshots/", import.meta.url);
await mkdir(screenshots, { recursive: true });

const secrets = {
  perfect: true,
  lifetime: true,
  nightPerfect: true,
  masterPassUnlocked: true,
  pentonuiSignal: true,
  festivalPerfect: true,
  mirrorPerfect: true,
  stormPerfect: true,
  impossiblePerfect: true,
  classicMedals: ["classic", "night", "festival", "mirror", "storm", "impossible"],
};

async function reachReadyTitle(page) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator(".opening-title-action").waitFor({ state: "visible", timeout: 7_000 });
  await page.locator(".opening-title-action").click();
  await page.waitForTimeout(1_100);
}

const browser = await chromium.launch({ headless: true });
try {
  for (const [name, viewport] of [["desktop", { width: 1_280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(({ savedSecrets }) => {
      localStorage.setItem("poker-park.opening-seen.v1", "seen");
      localStorage.setItem("poker-park.secrets.v1", JSON.stringify(savedSecrets));
      localStorage.setItem("poker-park.mascots.v1", JSON.stringify({
        version: 1,
        greetings: { turtle: 101, hedgehog: 101, fish: 101 },
        lastGreeted: "fish",
        pentonuiMedal: false,
      }));
    }, { savedSecrets: secrets });
    await reachReadyTitle(page);
    const reveal = page.locator(".pentonui-medal-reveal");
    await reveal.waitFor({ state: "visible", timeout: 2_000 });
    assert.match(await reveal.innerText(), /Medalla Pentonúi/);
    await page.waitForTimeout(900);
    await page.screenshot({ path: new URL(`pentonui-popup-${name}.png`, screenshots).pathname, fullPage: true });
    await reveal.getByRole("button", { name: "Guardar en mi colección" }).click();
    await page.screenshot({ path: new URL(`mascot-medals-${name}.png`, screenshots).pathname, fullPage: true });
    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      mascotMedals: document.querySelectorAll(".title-mascot-medal").length,
      classicMedals: document.querySelectorAll(".title-classic-medal").length,
    }));
    assert.deepEqual(errors, [], `${name}: errores en consola`);
    assert.equal(layout.scrollWidth, layout.clientWidth, `${name}: desbordamiento horizontal`);
    assert.equal(layout.mascotMedals, 4, `${name}: deben verse tres medallas de mascota de rango maximo y la final`);
    assert.equal(layout.classicMedals, 6, `${name}: deben convivir con las seis medallas clasicas`);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(350);
    assert.equal(await page.locator(".pentonui-medal-reveal").count(), 0, `${name}: el aviso final solo debe aparecer una vez`);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    localStorage.setItem("poker-park.opening-seen.v1", "seen");
    localStorage.setItem("poker-park.mascots.v1", JSON.stringify({
      version: 1,
      greetings: { turtle: 25, hedgehog: 25, fish: 25 },
      lastGreeted: "fish",
    }));
  });
  await reachReadyTitle(page);
  await page.locator(".menu-mascot-perch").waitFor({ state: "visible", timeout: 9_000 });
  const label = await page.locator(".menu-mascot-perch").getAttribute("aria-label");
  await page.locator(".menu-mascot-perch").click();
  const result = await page.evaluate(() => ({
    progress: JSON.parse(localStorage.getItem("poker-park.mascots.v1")),
    medals: document.querySelectorAll(".title-mascot-medal").length,
  }));
  const greeted = label.includes("Tuga") ? "turtle" : label.includes("Púa") ? "hedgehog" : "fish";
  assert.equal(result.progress.greetings[greeted], 26, "el saludo visible debe guardarse");
  assert.equal(result.medals, 1, "la medalla de bronce debe aparecer al superar 25");
  await page.close();
} finally {
  await browser.close();
}

console.log("Mascotas: persistencia, medallas, consola y portada responsive verificadas.");