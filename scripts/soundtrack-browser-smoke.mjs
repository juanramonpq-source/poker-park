import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:8109";
const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const results = [];
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/__soundtrack-test", route => route.fulfill({ contentType: "text/html", body: '<button id="start">Start audio test</button>' }));
  await page.goto(`${url}/__soundtrack-test`);
  await page.evaluate(async () => {
    const Native = window.AudioContext;
    window.__qa = { contexts: [], sources: [], oscillators: 0 };
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args);
        window.__qa.contexts.push(this);
        const analyser = this.createAnalyser();
        analyser.connect(this.destination);
        window.__qa.analyser = analyser;
        const gainFactory = this.createGain.bind(this);
        this.createGain = () => {
          const gain = gainFactory();
          const connect = gain.connect.bind(gain);
          gain.connect = destination => connect(destination === this.destination ? analyser : destination);
          return gain;
        };
        const factory = this.createBufferSource.bind(this);
        this.createBufferSource = () => {
          const source = factory();
          const record = { source, stopped: false };
          source.addEventListener("ended", () => { record.stopped = true; });
          window.__qa.sources.push(record);
          return source;
        };
        const oscillatorFactory = this.createOscillator.bind(this);
        this.createOscillator = () => { window.__qa.oscillators++; return oscillatorFactory(); };
      }
    };
    window.__audio = await import('/src/lib/game/audio.ts');
    document.querySelector('#start').onclick = () => window.__audio.startTitleBed();
  });
  await page.click('#start');
  for (const mode of ['title', 'park', 'night', 'festival', 'mirror', 'storm', 'impossible']) {
    if (mode !== 'title') await page.evaluate(mode => {
      if (mode === 'night') window.__audio.startNightBed();
      else window.__audio.startChallengeBed(mode === 'park' ? 'classic' : mode);
    }, mode);
    await page.waitForFunction(() => window.__qa.sources.filter(r => !r.stopped && r.source.loop && r.source.buffer.duration > 20).length === 1);
    await page.waitForTimeout(2200);
    const info = await page.evaluate(() => {
      const record = window.__qa.sources.filter(r => !r.stopped && r.source.loop && r.source.buffer.duration > 20).at(-1);
      const samples = new Float32Array(window.__qa.analyser.fftSize);
      window.__qa.analyser.getFloatTimeDomainData(samples);
      return { running: window.__qa.contexts[0].state, duration: record.source.buffer.duration, loopEnd: record.source.loopEnd, rms: Math.sqrt(samples.reduce((n, v) => n + v * v, 0) / samples.length) };
    });
    assert.equal(info.running, 'running');
    assert.ok(info.duration > 20 && info.loopEnd < info.duration);
    assert.ok(info.rms > 0.00001, `Silent output: ${mode} ${info.rms}`);
    results.push({ mode, ...info });
  }
  await page.evaluate(() => window.__audio.setMuted(true));
  await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => {
    const samples = new Float32Array(window.__qa.analyser.fftSize);
    window.__qa.analyser.getFloatTimeDomainData(samples);
    return samples.every(v => Math.abs(v) < 0.00001);
  }), 'Mute did not silence the mixer');
  await page.evaluate(() => window.__audio.setMuted(false));
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__audio.isMuted()), false);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.__qa.contexts[0].state === 'suspended');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForFunction(() => window.__qa.contexts[0].state === 'running');
  await page.route('**/title-suno-v1.mp3', route => route.fulfill({ status: 404, body: 'Test missing music' }));
  const oscillatorCount = await page.evaluate(() => window.__qa.oscillators);
  await page.evaluate(() => window.__audio.startTitleBed());
  await page.waitForFunction(count => window.__qa.oscillators > count + 2, oscillatorCount);
  await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => window.__qa.sources.filter(r => !r.stopped && r.source.loop && r.source.buffer.duration > 20).length), 0);
  await page.unroute('**/title-suno-v1.mp3');
  await page.evaluate(() => window.__audio.startParkBed());
  await page.waitForTimeout(3000);
  const afterFallback = await page.evaluate(() => window.__qa.oscillators);
  await page.waitForTimeout(2800);
  assert.equal(await page.evaluate(() => window.__qa.oscillators), afterFallback, 'Fallback kept scheduling over recorded music');
  await page.evaluate(() => { window.__audio.playMenuClick(); window.__audio.playPlace(); window.__audio.stopParkBed(); });
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => window.__qa.sources.filter(r => !r.stopped && r.source.loop && r.source.buffer.duration > 20).length), 0);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ ok: true, results, mute: true, background: true, fallback: true, fallbackStops: true, stop: true, errors }, null, 2));
} finally { await browser.close(); }
