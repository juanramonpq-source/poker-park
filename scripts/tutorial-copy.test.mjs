import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const title = readFileSync(new URL("../src/components/game/TitleScreen.tsx", import.meta.url), "utf8");
const pass = readFileSync(new URL("../src/components/game/PassScreen.tsx", import.meta.url), "utf8");

test("tutorial explains the cooperative journey and its reward without implying a winner", () => {
  assert.match(title, /No hay ganadores ni perdedores/);
  assert.match(title, /montar en tantas de las siete atracciones como puedas/);
  assert.match(title, /Poker Park puede guardarte alguna sorpresa/);
});

test("tutorial distinguishes solo play from shared-device play", () => {
  assert.match(title, /una única mano/);
  assert.match(title, /pasa el dispositivo cuando el juego lo indique/);
  assert.match(title, /compañero virtual/);
});

test("pass screen uses device-neutral wording", () => {
  assert.match(pass, /Pasa el dispositivo/);
  assert.match(pass, /Cuando tengas el dispositivo/);
  assert.doesNotMatch(pass, /teléfono/);
});
