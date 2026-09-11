import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/game/MascotMedals.tsx", import.meta.url), "utf8");

test("each mascot displays only its highest earned medal tier", () => {
  assert.match(source, /\.at\(-1\)/, "the medal rack should select only the highest earned tier");
  assert.doesNotMatch(source, /flatMap\(\(id\) => mascotMedalTiers\(progress\.greetings\[id\]\)\.map/, "the rack must not render every accumulated tier");
});
