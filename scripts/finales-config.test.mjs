import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Netlify envía la hazaña al servicio privado antes de otras redirecciones", async () => {
  const config = await readFile(new URL("netlify.toml", root), "utf8");
  const achievementProxy = [
    'from = "/api/achievement"',
    'to = "https://poker-park-production.up.railway.app/api/achievement"',
    "status = 200",
    "force = true",
  ];
  let cursor = -1;
  for (const line of achievementProxy) {
    const next = config.indexOf(line, cursor + 1);
    assert.ok(next > cursor, `falta o está desordenado: ${line}`);
    cursor = next;
  }
  const rtcProxy = config.indexOf('from = "/api/rtc"');
  assert.ok(rtcProxy > cursor, "la ruta de la hazaña debe preceder a redirecciones más generales");
});

test("la política explica todos los datos voluntarios de la hazaña", async () => {
  const privacy = (await readFile(new URL("PRIVACY.md", root), "utf8")).toLowerCase();
  for (const field of [
    "nombre",
    "correo electrónico",
    "valoración",
    "mensaje",
    "tiempo activo",
    "jornadas terminadas",
    "parques perfectos",
    "atracciones completadas",
    "retos superados",
  ]) {
    assert.match(privacy, new RegExp(field), `falta explicar el dato: ${field}`);
  }
  assert.match(privacy, /voluntari[oa]/);
  assert.match(privacy, /no se puede reconstruir/);
});
