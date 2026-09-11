import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const gameApp = readFileSync(new URL("../src/components/game/GameApp.tsx", import.meta.url), "utf8");
const popupUrl = new URL("../src/components/game/ProgressUnlockPopups.tsx", import.meta.url);

test("end screen mounts progression unlock popups", () => {
  assert.match(gameApp, /ProgressUnlockPopups/);
  assert.match(gameApp, /active=\{screen === "end"\}/);
});

test("progression popups announce master pass and the definitive challenge on first transition", () => {
  assert.equal(existsSync(popupUrl), true, "ProgressUnlockPopups.tsx must exist");
  const popup = readFileSync(popupUrl, "utf8");
  assert.match(popup, /!hasMasterPass\(previous\) && hasMasterPass\(next\)/);
  assert.match(popup, /!masterTrialsComplete\(previous\) && masterTrialsComplete\(next\)/);
  assert.match(popup, /Pase Maestro desbloqueado/);
  assert.match(popup, /El reto definitivo ha aparecido/);
  assert.match(popup, /Poker Park 00:13/);
});
