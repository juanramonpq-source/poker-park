import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const title = readFileSync(new URL("../src/components/game/TitleScreen.tsx", import.meta.url), "utf8");
const pass = readFileSync(new URL("../src/components/game/PassScreen.tsx", import.meta.url), "utf8");

test("tutorial explains the cooperative journey and its reward without implying a winner", () => {
  assert.match(title, /No hay ganadores ni perdedores/i);
  assert.match(title, /montar en tantas de las siete atracciones como puedas/i);
  assert.match(title, /Poker Park puede guardarte alguna sorpresa/i);
});

test("tutorial distinguishes solo play from shared-device play", () => {
  assert.match(title, /una única mano/i);
  assert.match(title, /pasa el dispositivo cuando el juego lo indique/i);
  assert.match(title, /compañero virtual/i);
});

test("pass screen uses device-neutral wording", () => {
  assert.match(pass, /Pasa el dispositivo/i);
  assert.match(pass, /Cuando tengas el dispositivo/i);
  assert.doesNotMatch(pass, /teléfono/i);
});
