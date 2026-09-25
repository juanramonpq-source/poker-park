import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAchievementLimiter,
  handleAchievement,
  sendAchievementEmail,
  type AchievementMailConfig,
} from "./achievement.server.ts";
import type { AchievementSubmission } from "./achievement.ts";

const NOW = 2_000_000;

function validSubmission(): AchievementSubmission {
  return {
    name: "<b>Visitante</b>",
    email: "visitor@example.com",
    rating: 5,
    message: "Un cierre <script>especial</script> & feliz.",
    stats: {
      activePlaySeconds: 7_200,
      finishedDays: 12,
      perfectDays: 6,
      completedAttractions: 71,
    },
    completedChallenges: ["classic", "night", "festival", "mirror", "storm", "impossible"],
    consent: true,
    website: "",
    formStartedAt: NOW - 3_000,
  };
}

function request(
  body: unknown = validSubmission(),
  init: { method?: string; contentType?: string | null; headers?: Record<string, string>; rawBody?: string } = {},
) {
  const headers = new Headers(init.headers);
  if (init.contentType !== null) headers.set("content-type", init.contentType ?? "application/json; charset=utf-8");
  return new Request("https://poker-park.example/api/achievement", {
    method: init.method ?? "POST",
    headers,
    body: init.method === "GET" ? undefined : (init.rawBody ?? JSON.stringify(body)),
  });
}

function successConfig(calls: Array<Record<string, unknown>> = []): AchievementMailConfig {
  return {
    apiKey: "resend_test_key",
    to: "destination@example.test",
    from: "Poker Park <park@example.test>",
    now: () => NOW,
    limiter: createAchievementLimiter({ cooldownMs: 60_000, maxEntries: 20 }),
    fetcher: async (_input, init) => {
      calls.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  };
}

describe("correo de hazaña", () => {
  it("escapa el HTML, incluye texto alternativo y responde al correo del jugador", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const result = await sendAchievementEmail(validSubmission(), successConfig(calls));

    assert.deepEqual(result, { id: "email_123" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].to, "destination@example.test");
    assert.equal(calls[0].reply_to, "visitor@example.com");
    assert.match(String(calls[0].html), /&lt;b&gt;Visitante&lt;\/b&gt;/);
    assert.match(String(calls[0].html), /&lt;script&gt;especial&lt;\/script&gt; &amp; feliz/);
    assert.doesNotMatch(String(calls[0].html), /<script>/);
    assert.match(String(calls[0].text), /Un cierre <script>especial<\/script> & feliz/);
    assert.match(String(calls[0].text), /2 h/);
  });

  it("acepta solo POST y exige JSON", async () => {
    const config = successConfig();
    const getResponse = await handleAchievement(request(undefined, { method: "GET" }), config);
    assert.equal(getResponse.status, 405);
    assert.equal(getResponse.headers.get("allow"), "POST");

    const textResponse = await handleAchievement(request(validSubmission(), { contentType: "text/plain" }), config);
    assert.equal(textResponse.status, 415);
    assert.deepEqual(await textResponse.json(), { ok: false, code: "content_type" });
  });

  it("rechaza el cuerpo antes de analizarlo cuando supera el límite", async () => {
    const oversized = "x".repeat(17_000);
    const response = await handleAchievement(request(undefined, {
      headers: { "content-length": String(oversized.length) },
      rawBody: oversized,
    }), successConfig());
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { ok: false, code: "payload_too_large" });
  });

  it("rechaza JSON roto, contratos inválidos, honeypot y envíos instantáneos", async () => {
    const config = successConfig();
    const broken = await handleAchievement(request(undefined, { rawBody: "{" }), config);
    assert.equal(broken.status, 400);

    const invalid = await handleAchievement(request({ ...validSubmission(), rating: 8 }), config);
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { ok: false, code: "invalid_payload" });

    const honeypot = await handleAchievement(request({ ...validSubmission(), website: "robot" }), config);
    assert.equal(honeypot.status, 400);

    const instant = await handleAchievement(request({ ...validSubmission(), formStartedAt: NOW - 100 }), config);
    assert.equal(instant.status, 400);
  });

  it("aplica una espera por origen sin conservar la dirección original", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const config = successConfig(calls);
    const headers = { "x-forwarded-for": "203.0.113.42, 10.0.0.1" };
    const first = await handleAchievement(request(validSubmission(), { headers }), config);
    const second = await handleAchievement(request(validSubmission(), { headers }), config);

    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    assert.equal(calls.length, 1);
    assert.ok(config.limiter);
    const keys = [...config.limiter.entries.keys()];
    assert.equal(keys.length, 1);
    assert.notEqual(keys[0], "203.0.113.42");
    assert.doesNotMatch(JSON.stringify(await second.json()), /203\.0\.113\.42|destination@example\.test/);
  });

  it("permite reintentar cuando el proveedor falla", async () => {
    let attempts = 0;
    const config = successConfig();
    config.fetcher = async () => {
      attempts += 1;
      if (attempts === 1) return new Response("provider failure", { status: 500 });
      return new Response(JSON.stringify({ id: "email_retry" }), { status: 200 });
    };
    const headers = { "x-forwarded-for": "198.51.100.8" };

    assert.equal((await handleAchievement(request(validSubmission(), { headers }), config)).status, 502);
    assert.equal((await handleAchievement(request(validSubmission(), { headers }), config)).status, 200);
    assert.equal(attempts, 2);
  });

  it("devuelve 503 sin configuración y 502 ante un fallo de Resend", async () => {
    const unavailable = await handleAchievement(request(), {
      apiKey: "",
      to: "",
      from: "",
      now: () => NOW,
      limiter: createAchievementLimiter(),
      fetcher: async () => new Response(null, { status: 200 }),
    });
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { ok: false, code: "unavailable" });

    const failedConfig = successConfig();
    failedConfig.fetcher = async () => new Response("secret provider detail", { status: 503 });
    const failed = await handleAchievement(request(), failedConfig);
    assert.equal(failed.status, 502);
    assert.deepEqual(await failed.json(), { ok: false, code: "delivery_failed" });
  });

  it("en éxito solo confirma la recepción y no expone el destinatario ni el id del proveedor", async () => {
    const response = await handleAchievement(request(), successConfig());
    assert.equal(response.status, 200);
    const body = JSON.stringify(await response.json());
    assert.equal(body, JSON.stringify({ ok: true }));
    assert.doesNotMatch(body, /destination@example\.test|email_123/);
  });
});
