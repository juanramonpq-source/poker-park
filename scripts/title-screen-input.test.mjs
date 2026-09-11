import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const gameAppSource = readFileSync(new URL("../src/components/game/GameApp.tsx", import.meta.url), "utf8");

test("title stage accepts a click anywhere on the screen", () => {
  assert.match(gameAppSource, /title-screen\[data-opening="title"\] \.opening-title-action/);
  assert.match(gameAppSource, /if \(titleEntrance && !button\)/);
  assert.match(gameAppSource, /titleEntrance\.click\(\)/);
});
