import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/game/mascot-progress.ts", import.meta.url), "utf8");
const endScreen = readFileSync(new URL("../src/components/game/EndScreen.tsx", import.meta.url), "utf8");

test("el recuento final identifica la mascota favorita del dispositivo", () => {
  assert.match(source, /Mascota favorita de este dispositivo:/);
  assert.match(endScreen, /favoriteMascotNote\(mascotProgress\)/);
});
