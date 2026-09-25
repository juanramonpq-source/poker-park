# Poker Park Finales y Contacto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir el final de los seis retos y el final definitivo de los tres oros, con estadísticas locales y un formulario voluntario que envíe la hazaña a Pentonúi Games sin revelar la dirección receptora.

**Architecture:** El progreso narrativo y las estadísticas vivirán en módulos locales versionados e independientes de `GameState`. Un componente compartido orquestará los dos finales desde la portada y el recuento; el formulario enviará un payload limitado a una ruta Railway que validará y enviará por Resend, mientras Netlify redirige esa ruta al mismo servidor.

**Tech Stack:** React 19, TypeScript, Zustand, Zod, TanStack Start server routes, localStorage, Resend REST API, Playwright, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-25-finales-poker-park-contacto-design.md`

## Global Constraints

- El final de Poker Park requiere los seis retos completados en cualquier dificultad; nunca requiere mascotas ni medallas clásicas.
- El final definitivo requiere esos seis retos y más de 100 saludos para cada una de las tres mascotas.
- Las medallas clásicas permanecen intactas como distinción adicional.
- La dirección receptora solo existe en `PENTONUI_ACHIEVEMENT_TO`; nunca debe aparecer en cliente, repositorio, respuesta HTTP ni logs propios.
- El envío es voluntario y comprende únicamente nombre, correo, satisfacción, mensaje opcional y las estadísticas mostradas.
- No añadir auth ni base de datos; todo el progreso sigue siendo local a cada dispositivo.
- Mantener compatibilidad con guardados y progreso existentes, móvil 390×844, movimiento reducido y foco accesible.
- Publicar Railway antes que Netlify y verificar ambos con el mismo SHA.

## Review Focus

- Progreso antiguo que ya cumple ambos finales: debe mostrarlos en orden y una sola vez; Task 1 lo fija en pruebas de migración y Task 3 en navegador.
- Pestaña oculta, recarga o pantalla final remontada: no debe inflar tiempo ni jornadas; Task 2 lo fija con reloj inyectable y deduplicación.
- Payload manipulado, campos enormes o satisfacción fuera de 1–5: debe rechazarse antes de enviar correo; Task 4 y Task 5 lo fijan en pruebas compartidas y de ruta.
- Resend sin configurar o caído: debe conservar el formulario y no guardar `achievementSubmittedAt`; Task 4 y Task 5 cubren error y reintento.
- Contenido HTML introducido en nombre o mensaje: debe llegar escapado y con alternativa de texto plano; Task 5 lo fija inspeccionando la petición saliente simulada.

---

## File Structure

**Nuevos módulos**

- `src/lib/game/finale-progress.ts`: criterios, persistencia y reclamación idempotente de los dos finales.
- `src/lib/game/finale-progress.test.ts`: progreso nuevo, migración y orden.
- `src/lib/game/play-stats.ts`: reloj activo, estadísticas acumuladas y deduplicación de jornadas.
- `src/lib/game/play-stats.test.ts`: tiempo, visibilidad, recarga y jornada única.
- `src/lib/achievement.ts`: esquema Zod y tipos compartidos del formulario.
- `src/lib/achievement.test.ts`: límites y normalización del payload.
- `src/lib/achievement.server.ts`: límites de frecuencia, construcción del correo y llamada a Resend.
- `src/lib/achievement.server.test.ts`: configuración, escapado, rate limit y secreto receptor.
- `src/routes/api/achievement.ts`: frontera HTTP `POST`.
- `src/components/game/ParkEndingReveal.tsx`: primer cierre narrativo.
- `src/components/game/FinaleSequence.tsx`: orden de diálogos y acceso al formulario.
- `src/components/game/AchievementForm.tsx`: consentimiento, validación, envío y reintento.
- `scripts/finales-achievement-smoke.mjs`: recorrido de los dos finales y formulario.

**Archivos existentes**

- `src/lib/game/persist.ts`: helper de seis retos y exportación del estado necesario.
- `src/lib/game/mascot-progress.ts`: criterio de medalla Pentonúi basado en retos y oros.
- `src/store/game-store.ts`: inicio/pausa del reloj y consolidación única de una jornada.
- `src/components/game/EndScreen.tsx`: activa la secuencia tras resolver el recuento.
- `src/components/game/TitleScreen.tsx`: activa progresos antiguos y reabre el formulario desde la medalla.
- `src/components/game/MascotMedals.tsx`: convierte la medalla azul en control accesible.
- `src/components/game/PentonuiMedalReveal.tsx`: agradecimiento definitivo y acciones compartir/ahora no.
- `src/components/game/GameApp.tsx`: pausa el reloj por visibilidad y cambio de pantalla.
- `src/styles.css`: estilos de los finales y formulario dentro del sistema visual actual.
- `netlify.toml`: proxy de `/api/achievement` a Railway.
- `PRIVACY.md`, `docs/CODEX.md`, `docs/REGLAS.md`: datos, reglas y operación.
- `package.json`: incorpora las nuevas pruebas a `test:game` y un smoke dedicado.

---

### Task 1: Modelar y migrar los dos hitos narrativos

**Files:**
- Create: `src/lib/game/finale-progress.ts`
- Create: `src/lib/game/finale-progress.test.ts`
- Modify: `src/lib/game/persist.ts`
- Modify: `src/lib/game/mascot-progress.ts`
- Modify: `src/lib/game/mascot-progress.test.ts`
- Modify: `src/lib/game/persist.test.ts`
- Modify: `src/components/game/DeveloperMenu.tsx`

**Interfaces:**
- Produces: `allChallengesComplete(secrets: Secrets): boolean`.
- Produces: `FinaleProgress { version: 1; parkEndingSeen: boolean; ultimateEndingSeen: boolean; achievementSubmittedAt: string | null }`.
- Produces: `loadFinaleProgress(): FinaleProgress`, `nextPendingFinale(secrets: Secrets, mascots: MascotProgress): "park" | "ultimate" | null`, `markFinaleSeen(kind: "park" | "ultimate"): FinaleProgress`, `markAchievementSubmitted(isoDate: string): FinaleProgress`.
- Changes: `qualifiesForPentonuiMedal(progress: MascotProgress, secrets: Secrets): boolean` and `claimPentonuiMedal(secrets: Secrets)`.

- [ ] **Step 1: Write failing progress tests**

Add tests named `completa Poker Park con los seis retos en cualquier dificultad`, `no exige medallas clásicas para ningún final`, `ordena park antes de ultimate`, `concede Pentonúi con seis retos y tres oros`, `no concede Pentonúi con un reto u oro pendiente`, and `persiste cada final y el envío una sola vez`. Assert exact booleans and the sequence `park → ultimate → null`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --experimental-strip-types --test src/lib/game/finale-progress.test.ts src/lib/game/mascot-progress.test.ts src/lib/game/persist.test.ts`

Expected: FAIL because `finale-progress.ts`, `allChallengesComplete`, and the new claim signatures do not exist.

- [ ] **Step 3: Implement the progression interfaces**

Use storage key `poker-park.finales.v1`. `nextPendingFinale` must always return `park` before `ultimate`, even when both are already eligible. Keep malformed localStorage fail-safe and preserve `classicMedals` unchanged.

- [ ] **Step 4: Update existing consumers and developer presets**

Change test fixtures and `DeveloperMenu` presets to initialize/reset the new local record without coupling it to `Secrets`. Replace classic-medal arguments to `claimPentonuiMedal` with the complete `Secrets` object.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run: `node --experimental-strip-types --test src/lib/game/finale-progress.test.ts src/lib/game/mascot-progress.test.ts src/lib/game/persist.test.ts`

Expected: PASS with the exact order and new medal criterion.

- [ ] **Step 6: Commit**

```bash
git add src/lib/game/finale-progress.ts src/lib/game/finale-progress.test.ts src/lib/game/persist.ts src/lib/game/persist.test.ts src/lib/game/mascot-progress.ts src/lib/game/mascot-progress.test.ts src/components/game/DeveloperMenu.tsx
git commit -m "feat: model Poker Park final milestones"
```

---

### Task 2: Registrar tiempo activo y estadísticas sin duplicados

**Files:**
- Create: `src/lib/game/play-stats.ts`
- Create: `src/lib/game/play-stats.test.ts`
- Modify: `src/store/game-store.ts`
- Modify: `src/components/game/GameApp.tsx`
- Modify: `src/lib/game/persist.ts`

**Interfaces:**
- Consumes: `GameState`, `completedAttractions(state)` and `dayRating(count)`.
- Produces: `PlayStats { version: 1; activePlaySeconds: number; finishedDays: number; perfectDays: number; completedAttractions: number; activeRunId: string | null; activeStartedAt: number | null; lastFinishedRunId: string | null }`.
- Produces: `loadPlayStats(): PlayStats`, `beginTrackedRun(now?: number): PlayStats`, `resumePlayTimer(now?: number): PlayStats`, `pausePlayTimer(now?: number): PlayStats`, `recordFinishedRun(runId: string, completed: number, perfect: boolean, now?: number): PlayStats`, `achievementStatsSnapshot(secrets: Secrets): AchievementStats`.

- [ ] **Step 1: Write failing clock and deduplication tests**

Use an injected millisecond clock. Assert that 10 visible seconds add exactly 10, a hidden interval adds zero, two calls for the same `runId` add one finished day, and a reload with `activeStartedAt` settles only the intended visible interval. Add malformed-storage recovery and cap negative/overflowing values to safe nonnegative integers.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `node --experimental-strip-types --test src/lib/game/play-stats.test.ts`

Expected: FAIL because the stats module does not exist.

- [ ] **Step 3: Implement the local stats module**

Use keys `poker-park.stats.v1` and a cryptographically random `activeRunId` generated at game start. Persist seconds as integers; retain milliseconds only in `activeStartedAt`. The public snapshot must omit run IDs and storage metadata.

- [ ] **Step 4: Wire lifecycle boundaries**

Call `beginTrackedRun` in store `start`, retain the current run on `resume`, call `recordFinishedRun` in `beginMapOutro` before UI state changes, and pause/resume from `GameApp` on `visibilitychange`, `pagehide`, `screen !== "playing"`, and unmount. Ensure online/hotseat/AI/solo all share the same device-local run.

- [ ] **Step 5: Run stats and store regression tests**

Run: `node --experimental-strip-types --test src/lib/game/play-stats.test.ts src/lib/game/engine.test.ts src/lib/game/persist.test.ts`

Expected: PASS; existing game persistence remains version 7 compatible.

- [ ] **Step 6: Commit**

```bash
git add src/lib/game/play-stats.ts src/lib/game/play-stats.test.ts src/store/game-store.ts src/components/game/GameApp.tsx src/lib/game/persist.ts
git commit -m "feat: track local Poker Park play statistics"
```

---

### Task 3: Presentar los finales en orden y reabrir la hazaña

**Files:**
- Create: `src/components/game/ParkEndingReveal.tsx`
- Create: `src/components/game/FinaleSequence.tsx`
- Modify: `src/components/game/PentonuiMedalReveal.tsx`
- Modify: `src/components/game/EndScreen.tsx`
- Modify: `src/components/game/TitleScreen.tsx`
- Modify: `src/components/game/MascotMedals.tsx`
- Modify: `src/styles.css`
- Create: `scripts/finales-achievement-smoke.mjs`

**Interfaces:**
- Consumes: Task 1 progression helpers and Task 2 stats snapshot.
- Produces: `FinaleSequence({ active, allowAchievementForm }: { active: boolean; allowAchievementForm?: boolean })`.
- Produces: `PentonuiMedalReveal({ onClose, onShare, alreadySubmitted })`.
- Produces: `MascotMedals({ progress, onPentonuiClick? })`.

- [ ] **Step 1: Add a failing browser smoke for narrative order**

Create fixtures for: six completed challenges with zero mascot golds; six completed challenges with three golds; pre-existing progress that satisfies both; and an already-seen first ending. Assert the first heading contains `todo día en el parque llega a su fin`, the ultimate heading appears only after dismissal, neither repeats after reload, and the blue medal button reopens the sharing entry point.

- [ ] **Step 2: Run the smoke and verify RED**

Run: `node --experimental-strip-types scripts/finales-achievement-smoke.mjs --phase=narrative`

Expected: FAIL because the two reveals and sequence do not exist.

- [ ] **Step 3: Implement the shared sequence and reveal components**

Reuse the existing Pentonúi visual system, focus trap/dialog semantics and reduced-motion rules. `FinaleSequence` calls `nextPendingFinale`, marks a finale only when its primary close action is used, and immediately re-evaluates so `park` can lead to `ultimate` without remounting.

- [ ] **Step 4: Replace duplicated medal-claim effects**

Remove `pentonuiReveal` claim logic from `EndScreen` and `TitleScreen`. Mount `FinaleSequence` with `active={resolved}` in the tally and with `active={opening.stage === "ready"}` on the title. Make the blue medal a real button that opens the achievement entry point without replaying narrative text.

- [ ] **Step 5: Run narrative smoke and accessibility checks**

Run: `node --experimental-strip-types scripts/finales-achievement-smoke.mjs --phase=narrative`

Expected: PASS on 390×844 and 1280×800 with no console errors, horizontal overflow or focus escaping the active dialog.

- [ ] **Step 6: Commit**

```bash
git add src/components/game/ParkEndingReveal.tsx src/components/game/FinaleSequence.tsx src/components/game/PentonuiMedalReveal.tsx src/components/game/EndScreen.tsx src/components/game/TitleScreen.tsx src/components/game/MascotMedals.tsx src/styles.css scripts/finales-achievement-smoke.mjs
git commit -m "feat: add Poker Park narrative endings"
```

---

### Task 4: Construir el formulario y contrato de la hazaña

**Files:**
- Create: `src/lib/achievement.ts`
- Create: `src/lib/achievement.test.ts`
- Create: `src/components/game/AchievementForm.tsx`
- Modify: `src/components/game/FinaleSequence.tsx`
- Modify: `src/components/game/PentonuiMedalReveal.tsx`
- Modify: `src/styles.css`
- Modify: `scripts/finales-achievement-smoke.mjs`

**Interfaces:**
- Consumes: `AchievementStats` and `markAchievementSubmitted` from Tasks 1–2.
- Produces: `achievementSchema`, `AchievementSubmission`, `normalizeAchievementSubmission(input: unknown): AchievementSubmission`.
- Payload fields: `name`, `email`, `rating`, `message`, `stats`, `completedChallenges`, `consent`, `website`, `formStartedAt`.

- [ ] **Step 1: Write failing schema tests**

Assert trimmed name length 1–80, email length ≤254 and valid syntax, integer rating 1–5, optional message ≤600, `consent === true`, exact known challenge IDs, nonnegative bounded stats, empty `website`, and `formStartedAt` old enough to be human. Include HTML-looking strings as accepted plain text that remains data, not markup.

- [ ] **Step 2: Run schema tests and verify RED**

Run: `node --experimental-strip-types --test src/lib/achievement.test.ts`

Expected: FAIL because the shared schema does not exist.

- [ ] **Step 3: Implement schema and form states**

Implement `idle | submitting | success | error`. Render required name/email/rating, optional message, stats summary, consent, hidden `website`, and accessible field errors. On `2xx`, call `markAchievementSubmitted(new Date().toISOString())`; on failure preserve every entered value and allow retry.

- [ ] **Step 4: Extend browser smoke for cancel, invalid, error and success**

Mock `/api/achievement` per scenario. Assert cancel sends no request; invalid fields stay client-side; a `503` preserves values and leaves `achievementSubmittedAt` null; a `200` shows receipt, stores the timestamp and prevents a second successful submission from the same device.

- [ ] **Step 5: Run unit and browser tests**

Run: `node --experimental-strip-types --test src/lib/achievement.test.ts && node --experimental-strip-types scripts/finales-achievement-smoke.mjs --phase=form`

Expected: PASS in mobile and desktop viewports with no recipient address visible in DOM or network payload.

- [ ] **Step 6: Commit**

```bash
git add src/lib/achievement.ts src/lib/achievement.test.ts src/components/game/AchievementForm.tsx src/components/game/FinaleSequence.tsx src/components/game/PentonuiMedalReveal.tsx src/styles.css scripts/finales-achievement-smoke.mjs
git commit -m "feat: add voluntary achievement report form"
```

---

### Task 5: Enviar el correo desde Railway sin revelar el destinatario

**Files:**
- Create: `src/lib/achievement.server.ts`
- Create: `src/lib/achievement.server.test.ts`
- Create: `src/routes/api/achievement.ts`
- Modify: `src/routeTree.gen.ts` through the repository's normal route generation/build.

**Interfaces:**
- Consumes: `normalizeAchievementSubmission(input)` from Task 4.
- Produces: `sendAchievementEmail(input: AchievementSubmission, config?: AchievementMailConfig): Promise<{ id: string }>`.
- Produces: `handleAchievement(request: Request): Promise<Response>`.
- `AchievementMailConfig` injects `apiKey`, `to`, `from`, `fetcher`, `now` and an in-memory limiter for deterministic tests; production reads environment variables server-side.

- [ ] **Step 1: Write failing server tests**

Assert `POST` only, JSON content type and size limit, schema rejection, honeypot/minimum-time rejection, per-origin cooldown, missing configuration `503`, Resend failure `502`, and success `200`. Inspect fake Resend calls to confirm HTML escaping, text alternative, player email as reply-to, and that neither response nor logs contain `to`.

- [ ] **Step 2: Run server tests and verify RED**

Run: `node --experimental-strip-types --test src/lib/achievement.server.test.ts`

Expected: FAIL because the server service and route do not exist.

- [ ] **Step 3: Implement the server service**

Call `https://api.resend.com/emails` with server-only environment values. Build both HTML and plain text from the normalized payload. Key the bounded in-memory limiter by a one-way hash of the first trusted proxy address; never persist or include that hash in the email. Do not print payloads or secret configuration.

- [ ] **Step 4: Implement the route boundary**

Expose only `POST` with the repository's established `createFileRoute(...).server.handlers` pattern in `src/routes/api/achievement.ts`, cap the request body before parsing, return `{ ok: true }` on success and generic Spanish error codes on failure. Let the build regenerate the route tree.

- [ ] **Step 5: Run server tests, typecheck and source secret scan**

Run: `node --experimental-strip-types --test src/lib/achievement.server.test.ts && npm run typecheck`, followed by a silent `git grep` using the private recipient supplied only in the operator shell.

Expected: PASS and the scan of every tracked file returns no match.

- [ ] **Step 6: Commit**

```bash
git add src/lib/achievement.server.ts src/lib/achievement.server.test.ts src/routes/api/achievement.ts src/routeTree.gen.ts
git commit -m "feat: deliver achievement reports from server"
```

---

### Task 6: Documentar privacidad y conectar los dos despliegues

**Files:**
- Modify: `netlify.toml`
- Modify: `PRIVACY.md`
- Modify: `docs/CODEX.md`
- Modify: `docs/REGLAS.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `/api/achievement` from Task 5 and all user-visible behavior from Tasks 1–4.
- Produces: Netlify proxy to `https://poker-park-production.up.railway.app/api/achievement` with forced status 200, before the catch-all rules.
- Produces: documented private variables `RESEND_API_KEY`, `PENTONUI_ACHIEVEMENT_TO`, `PENTONUI_ACHIEVEMENT_FROM`.

- [ ] **Step 1: Add a failing configuration assertion**

Extend a small Node test or smoke assertion to parse `netlify.toml` and require the exact `/api/achievement` proxy before broader redirects. Assert privacy text names every player field and states that submission is voluntary.

- [ ] **Step 2: Run the configuration assertion and verify RED**

Run: `node --test 'scripts/**/*.test.mjs'`

Expected: FAIL because the proxy and privacy copy are absent.

- [ ] **Step 3: Add proxy, documentation and scripts**

Document that timing begins with this release and older time cannot be reconstructed. Add `test:finales` for unit/browser coverage and include the new unit files in `test:game` without changing unrelated scripts.

- [ ] **Step 4: Run full local verification**

Run: `npm run test:game && npm test && npm run test:finales && npm run typecheck && npm run build && git diff --check`

Expected: every command exits 0.

- [ ] **Step 5: Verify built output visually**

Run the standard built preview and `scripts/browser-smoke.mjs` against desktop/mobile baseline, then inspect both screenshots. Run `scripts/finales-achievement-smoke.mjs` against the built preview with a mocked endpoint.

Expected: visible content, no console/page errors, no horizontal overflow, no baseline divergence, correct modal order and form states.

- [ ] **Step 6: Commit**

```bash
git add netlify.toml PRIVACY.md docs/CODEX.md docs/REGLAS.md package.json scripts
git commit -m "docs: connect and explain achievement reports"
```

---

### Task 7: Configurar, publicar y verificar el flujo real

**Files:**
- No source edits expected after the release candidate passes.
- External configuration: Railway environment and Resend sender.

**Interfaces:**
- Consumes: final pushed SHA and three server variables from Task 6.
- Produces: a terminal successful Railway deployment, then the same SHA live on Netlify, plus one controlled delivery receipt.

- [ ] **Step 1: Prepare the exact release candidate**

Fetch `origin/main`, rebase only if it advanced, rerun Task 6 verification, push the exact commit, and record `git rev-parse HEAD`.

- [ ] **Step 2: Configure private mail values**

Create or connect the Resend account/sender only with explicit credential authorization. Set `RESEND_API_KEY`, `PENTONUI_ACHIEVEMENT_TO`, and `PENTONUI_ACHIEVEMENT_FROM` in Railway without printing their values. Confirm the recipient and sender are valid in the provider.

- [ ] **Step 3: Deploy Railway and wait for terminal success**

Verify `/api/achievement` returns a validation error for an empty request without leaking configuration. Submit one controlled valid report, confirm its API success and confirm delivery in Resend/the destination inbox.

- [ ] **Step 4: Deploy Netlify from the identical SHA**

Wait until the production deployment is terminal successful. Confirm the proxy reaches the Railway endpoint and the public bundle/source maps do not contain the destination address.

- [ ] **Step 5: Run production browser verification**

Run the standard public smoke on `https://poker-park.netlify.app/` and the full final/form flow with a deliberately identified controlled submission. Confirm mobile/desktop rendering, exact final order, success receipt and no console errors.

- [ ] **Step 6: Record release evidence**

Report final SHA, Railway deployment ID/status, Netlify terminal status, public URL and controlled delivery result. Do not report or quote any secret value or the private recipient address.
