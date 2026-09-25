import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeAchievementSubmission } from "./achievement.ts";

const now = 2_000_000;
const valid = () => ({
  name: "  Visitante del parque  ",
  email: "  Visitor@Example.com ",
  rating: 5,
  message: "  Me ha encantado.  ",
  stats: {
    activePlaySeconds: 7_200,
    finishedDays: 12,
    perfectDays: 6,
    completedAttractions: 71,
  },
  completedChallenges: ["classic", "night", "festival", "mirror", "storm", "impossible"],
  consent: true,
  website: "",
  formStartedAt: now - 3_000,
});

describe("contrato de la hazaña", () => {
  it("normaliza nombre, correo y mensaje sin convertir texto en HTML", () => {
    const input = valid();
    input.name = "  <b>Visitante</b>  ";
    input.message = "  <script>hola</script>  ";
    const result = normalizeAchievementSubmission(input, now);
    assert.equal(result.name, "<b>Visitante</b>");
    assert.equal(result.email, "visitor@example.com");
    assert.equal(result.message, "<script>hola</script>");
  });

  it("exige un nombre de 1 a 80 caracteres", () => {
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), name: "   " }, now));
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), name: "x".repeat(81) }, now));
    assert.equal(normalizeAchievementSubmission({ ...valid(), name: "x".repeat(80) }, now).name.length, 80);
  });

  it("exige un correo válido de hasta 254 caracteres", () => {
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), email: "no-es-correo" }, now));
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), email: `${"a".repeat(246)}@mail.com` }, now));
  });

  it("limita satisfacción a enteros del 1 al 5 y el mensaje a 600 caracteres", () => {
    for (const rating of [0, 1.5, 6]) {
      assert.throws(() => normalizeAchievementSubmission({ ...valid(), rating }, now));
    }
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), message: "x".repeat(601) }, now));
    assert.equal(normalizeAchievementSubmission({ ...valid(), message: undefined }, now).message, "");
  });

  it("exige consentimiento, campo trampa vacío y tiempo humano mínimo", () => {
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), consent: false }, now));
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), website: "bot.example" }, now));
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), formStartedAt: now - 200 }, now));
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), formStartedAt: now + 1 }, now));
  });

  it("acepta exactamente los seis identificadores de reto conocidos", () => {
    assert.throws(() => normalizeAchievementSubmission({ ...valid(), completedChallenges: ["classic", "night"] }, now));
    assert.throws(() => normalizeAchievementSubmission({
      ...valid(),
      completedChallenges: ["classic", "night", "festival", "mirror", "storm", "dragon"],
    }, now));
    assert.throws(() => normalizeAchievementSubmission({
      ...valid(),
      completedChallenges: ["classic", "night", "festival", "mirror", "storm", "storm"],
    }, now));
  });

  it("rechaza estadísticas negativas, fraccionarias o fuera del entero seguro", () => {
    for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => normalizeAchievementSubmission({
        ...valid(),
        stats: { ...valid().stats, finishedDays: value },
      }, now));
    }
  });
});
