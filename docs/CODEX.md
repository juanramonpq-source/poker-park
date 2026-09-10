# Poker Park — briefing para Codex / ChatGPT

Copia este archivo entero al proyecto (o pégalo como instrucciones de Codex).
El código de referencia vive en `src/lib/game/`, `src/components/game/` y `src/store/game-store.ts`.

**Estudio:** Pentonúi Games
**Producto:** PWA móvil, en español, para 1–2 jugadores, que permite montar en las atracciones de un parque guiados por una baraja francesa de 52 cartas.
**Tono:** feria alegre (algodón, noria, atardecer). Nunca gótico ni siniestro.

---

## Prompt corto para Codex

```
Eres el mantenedor de Poker Park, un juego de cartas para 1 o 2 jugadores
(solitario, hotseat o IA), PWA móvil, UI en español, estética de parque de
atracciones alegre.

El motor es puro y está en src/lib/game/ (types, deck, attractions, engine,
ai, persist, audio). La UI está en src/components/game/. El estado de
pantalla está en src/store/game-store.ts (Zustand).

NO hay ganador. NO hay scroll en el mapa. Las figuras (J/Q/K) NUNCA se
colocan como números. Un intercambio NO termina el turno: el jugador
coloca la carta nueva. Completar una atracción muestra confeti + animación
temática ~3.2s ANTES de pasar el turno. Si el parque está resuelto o no
queda acción obligatoria, se puede Cerrar el parque. Visitantes (figuras
en atracciones completas) son opcionales.

Sigue docs/CODEX.md y no cambies las reglas de atracciones sin que te lo
pidan. Stack objetivo: Vite + React + TypeScript + Tailwind + Zustand.
Sin backend. Persistencia en localStorage.
```

---

## 1. Qué es

Una o dos personas construyen un parque con una baraja. Cada atracción es
un esquema de huecos con palos, ases y formas fijas. Se juega al móvil, a
turno, en solitario, en el mismo teléfono (hotseat) o contra un compañero automático.

No hay puntuación competitiva. Al cerrar el día se recuenta cuántas
atracciones se completaron y se nombra el día.

---

## 2. Stack recomendado al portar

Lleva solo el juego, no el andamiaje del sandbox original.

| Usar | No llevar |
|---|---|
| Vite + React 19 + TypeScript | TanStack Start / Nitro / Vercel |
| Tailwind v4 (`src/styles.css` `@theme`) | Auth, PGLite, Better Auth |
| Zustand persistente | `src/lib/auth`, `src/lib/db`, `src/lib/app-data` |
| Web Audio API procedural | node_modules, `.vercel`, `scripts/` de Grok |
| PWA: `manifest.webmanifest` + iconos | `/__grok/install` |

App de una sola ruta `/`. Viewport `width=device-width, viewport-fit=cover`.
Fuentes: **Fraunces** (títulos) y **Nunito** (cuerpo).

Colores (`@theme` en `src/styles.css`):

```
bg #eaf6ff   surface #fffaf1   fg #3b2416
accent #d6453d   good #2f9e5f   sky #6ec8f0
suit-red #d6453d   suit-ink #243044
```

---

## 3. Archivos que sí importan

```
src/lib/game/types.ts          tipos y ATTRACTION_IDS
src/lib/game/deck.ts           52 cartas, shuffle, isFace/isAce
src/lib/game/attractions.ts    validez, huecos legales, hints
src/lib/game/engine.ts         turnos, colocación, fin, recuento
src/lib/game/ai.ts             compañero automático
src/lib/game/persist.ts        localStorage v7
src/lib/game/audio.ts          música y SFX procedurales
src/lib/game/attractions.test.ts
src/store/game-store.ts        UI store + afterHuman + IA
src/components/game/*
src/styles.css
public/manifest.webmanifest
public/app-store-icon-1024.png  icon-192.png  icon-512.png  icon-maskable-512.png  apple-touch-icon.png
public/images/park-day.jpg  park-dusk.jpg  card-back.jpg
```

Nombre de la PWA: **Poker Park** (nunca “Grok App”).

---

## 4. Modelo de datos

```ts
Card { id, suit: hearts|diamonds|clubs|spades, rank: 1..13 }
// 1=A, 11=J, 12=Q, 13=K. Figuras = rank >= 11. Ases NO son figuras.

AttractionId =
  coaster | haunted | love | forest | chairs | restaurant | restrooms

AttractionState { slots: (Card|null)[], visitors: Card[] }

GameState.version = 7
  mode: hotseat | ai | solo
  difficulty?: standard | easy
  challenge?: classic | night | festival | mirror | storm | impossible
  night?: sectores con suministro, ruta pendiente, elección de apertura,
          incidencias y aceRack? (solo compatibilidad con partidas antiguas)
  names, deck, hands[2], entrance[2], entranceFaceDown[2]
  attractions, exchangesUsed (límite según modo), currentPlayer
  drawnThisTurn, consecutivePasses
  lastMessage, lastCompleted, swappedCardId
  pendingAdvance   // true mientras dura la fiesta de “conseguido”
  ended, endReason: empty | block | closed | null
```

`MAX_EXCHANGES = 3` conserva el valor clásico. `exchangeLimit(state)` devuelve:
Clásico 3, Fácil/Festival 4, Noche/Espejo/Tormenta 5 y 00:13 6. Mano
inicial: 3 cartas por jugador; en solitario, una mano de 5. Entrada del parque:
2 cartas boca arriba.

---

## 5. Flujo de una partida

### Preparación
Barajar 52. 2 cartas → Entrada. 3 a cada jugador, o 5 a la única mano en
solitario. Resto = mazo. En la Noche de Guardia, los cuatro ases permanecen en
la baraja y pueden salir en la Entrada, en las manos o mediante el robo normal.
El Llavero de Ases solo puede recuperar uno que todavía siga oculto en el mazo.

### Turno
1. Al empezar turno se roba 1 del mazo (si queda).
2. **Una colocación** (carta en hueco legal). Los intercambios no consumen la
   colocación, pero sí una maniobra del límite compartido.
3. Si haces **intercambio**: el turno **no acaba**. Animación de swap.
   La carta que entra queda seleccionada (`swappedCardId`) y **debes
   poder colocarla** (o quedar bloqueado).
4. Tras colocar: si la atracción se completa → `pendingAdvance = true`,
   confeti + `RideFinale` ~3200 ms, **después** `advanceTurn`.
   Si no se completa, pasa el turno al instante.

Los jugadores pueden hablar. En solitario, después de cada colocación vuelve a
jugar la misma mano. El solitario está disponible en los seis retos. Si no
puede colocar ni intercambiar, una confirmación termina la jornada por bloqueo,
salvo en Tormenta y 00:13: se esperan dos turnos bloqueados para que el frente
pueda cambiar.

### Intercambios (aforo)
- Compartidos y limitados por `exchangeLimit(state)`.
- Mano ↔ carta de la Entrada, o mano ↔ carta ya colocada en una
  atracción **incompleta**, si la nueva carta sigue siendo legal en ese
  hueco.
- La primera carta de la Entrada se cierra al quedar una maniobra; la segunda,
  al agotar el límite. Aforo completo: no más cambios.
- Completadas: no se intercambia en ellas.
- En Noche, una figura también puede cambiarse mediante el llavero por un as
  que todavía siga oculto en el mazo, solo si ese as puede colocarse
  inmediatamente en un sector con suministro. La figura vuelve al mazo y el
  intercambio consume una maniobra.

### Figuras
J, Q, K **no rellenan** montaña rusa, terror, túnel, bosque ni restaurante.
Solo: sillas (cuando la torre de 3 picas está llena), aseos (K y Q), o
visitantes al final.

### Visitantes
Cuando **ninguna carta restante** (manos + mazo) entra en una atracción
incompleta, empieza la fase visitante. Las figuras pueden sentarse en
atracciones **completas**. Es **opcional**.

### Bloqueo y cierre
- Si el jugador no tiene **acción obligatoria** (colocar o intercambiar):
  overlay. Visitantes no cuentan como obligatorios.
- Parque con las 7 completas, o ya no se puede montar más:
  “El parque está resuelto” + **Cerrar el parque** + opcional
  “Dejar un visitante”.
- Si está atascado de verdad: “Estás bloqueado, no puedes montar en nada”
  + **Pasar turno**. En solitario, una confirmación declara el bloqueo. En los
  modos de dos jugadores sin tormenta bastan dos pases consecutivos.
  Tormenta y 00:13 esperan dos rondas completas: dos turnos solitarios o cuatro
  pases en pareja, para no cerrar por una rotación meteorológica recuperable.
- También acaba si se vacían mazo y manos.

### Pantallas
`title` → `playing` → (hotseat: `pass` entre jugadores) → `end`.

---

## 6. Atracciones (layouts y reglas exactas)

Índices como en `AttractionBoard.tsx` / `Park.tsx`. Completa = todos los
huecos llenos **y** `isAttractionValid`.

### Montaña Rusa `coaster` — 8 números
Forma (vía con looping):

```
          [4]
       [2][3][5]
    [1]      [6]
    [0]         [7]
```

Relleno **en orden de índice 0→7**, ranks consecutivos, sin saltos.
El hueco 0 solo admite **2 o 3**. Ranks 2–10. Sin figuras ni ases.

### Casa del Terror `haunted` — 5
```
     [4]  tejado = A♠ obligatorio, tras completar [0]–[3]
  [0][1]
  [2][3]  picas de número (no as, no figura)
```

### Túnel del Amor `love` — 7 corazones
Arco. As de corazones **solo** en la cumbre `[3]`.

```
          [3] A♥
       [2]     [4]
    [1]           [5]
 [0]                 [6]
```

Se rellena como **prefijo** desde un extremo: 0→6 **o** 6→0. No se puede
colocar un hueco si queda un agujero hacia el origen. Números de corazón
en los lados; as solo en 3.

### Bosque Encantado `forest` — 11
```
[0][1][2]
[3][4][5]     [4] = A♦
[6][7][8]
[9]   [10]    columnas de diamantes (entrada). El hueco del medio no existe.
```

Claro 0–8: tréboles o diamantes de **número** (no as salvo el 4, no figuras).
9 y 10: diamantes de número. El as de diamantes no va a otro hueco.

### Sillas Voladoras `chairs` — 7
```
[0]           [1]     figuras (solo si torre llena)
   [2]     [3]        figuras
        [4]
        [5]           torre: 3 picas de número, vertical
        [6]
```

**Prohibido** colgar figuras (`0..3`) hasta que `4`, `5` y `6` estén
ocupadas. Torre = picas no figuras.

### Restaurante `restaurant` — 6
Grid 2×3:

```
[0][1][2]
[3][4][5]
```

`[1]` = **A♣** obligatorio. Resto: números. El as de tréboles no va a otro
sitio. Figuras no.

### Aseos `restrooms` — 2
Un **rey** y una **reina**, cualquier palo, juntos. Sin jotas. Sin dos reyes
ni dos reinas.

---

## 7. Recuento del día

| Atracciones | Rating | Título |
|---|---|---|
| 0 | empty | Colas eternas |
| 1 | shy | Día tímido |
| 2 | improvised | Día improvisado |
| 3 | fair | Día de feria |
| 4 | fun | Día divertido |
| 5 | round | Día redondo |
| 6 | unforgettable | Día inolvidable |
| 7 | perfect | Fuegos sobre el parque |

Pantalla final (`EndScreen`):
1. Splash “Fin de la jornada en el parque”.
2. Recuento animado con **redobles** (`playRollTick` / `playRollFill` /
   `playRollCrash`). Si 7/7, fiesta (`playParty`) y fuegos.
3. Insignias (`dayBadges`).
4. “Fin, gracias por jugar.”
5. “Creado por Pentonúi Games”.
6. Volver al inicio.

Easter egg: en el título, 7 toques desbloquean “pase de por vida”
(`poker-park.secrets.v1`).

---

## 8. UI (contrato visual)

- Al comenzar una partida nueva en cualquier modo se despliega brevemente un
  plano ilustrado de parque de tres pliegues. El mapa continuo contiene
  caminos, jardines, agua y representaciones de las siete atracciones. Es una
  transición de presentación, se puede omitir, respeta
  `prefers-reduced-motion` y nunca modifica las reglas.
- Al cerrar el parque, el mismo plano se pliega con la animación inversa antes
  de presentar el recuento. Esta espera solo afecta a la presentación: el
  resultado de la partida ya está cerrado y no admite nuevas acciones.
- Durante la partida, el grid de atracciones queda superpuesto sobre ese
  plano. Papel, pliegues, ruta y rotulación se adaptan a la identidad visual
  del modo activo.
- **Sin scroll** en el mapa. Grid de baldosas:
  - fila1: Montaña Rusa (ancha) | Casa del Terror
  - fila2: Túnel | Bosque | Sillas
  - fila3: Restaurante | Aseos | Entrada
- Tocando una baldosa se abre el recuadro (`AttractionSheet`) con reglas
  cortas + esquema grande.
- Animación de entrada del esquema: rebote suave (~0.7s, rotate -8° → 0,
  scale 0.7 → 1.06 → 1). **No** oscilación violenta continua.
- Baldosa completa: sello **CONSEGUIDO**, brillo, bloqueada para colocar
  (sí admite visitante).
- Huecos reservados (A♠ A♥ A♦ A♣ y columnas ♦): **fantasmas muy
  transparentes**. En el mapa mini **no** se pintan marcas de as.
- Mano: cartas grandes, abanico, flotan. Al seleccionar: brillo + sonido
  `playSelect`. El toque sigue siendo el control principal y, como alternativa,
  se puede arrastrar una carta sin perder su identidad visual hasta una
  atracción o hasta un hueco legal iluminado.
- Baldosas legales: `tile-hot` (borde verde + pulso). Si hay visitante
  posible, tocar la baldosa **deja el visitante** directo.
- HUD: chip de mazo, botón de cambios con el saldo real del modo, reglas,
  mute y salir.
- La Entrada nocturna incluye el objeto ilustrado **Llavero de Ases**, con aro,
  cadenita, cuatro colgantes y el estado real de los ases que siguen ocultos en
  el mazo. Los que ya han salido aparecen como «En circulación».
- Intercambio: overlay de dos cartas que cruzan (`swapFx`).

---

## 9. Audio

Todo sintético en `src/lib/game/audio.ts` (Web Audio). Sin mp3.

- Cama del título y cama del parque: vals largo (~90s), no un loop de 4s.
- SFX: select, deal, place, exchange, aforo, complete (por atracción),
  pass, end, redobles del recuento, fiesta.
- Unlock en el primer gesto. Mute en settings.

---

## 10. Store (reglas de implementación)

`useGameStore` orquesta, el motor no conoce React.

- `afterHuman`: persiste; si `pendingAdvance` espera 3200ms y llama
  `advanceTurn`; si `ended` → screen `end`; hotseat → screen `pass`.
- `pass` se niega si `hasRequiredAction`; `closePark` siempre permite terminar
  voluntariamente y pasar al recuento.
- `hasRequiredAction` = colocaciones, intercambios o generador nocturno.
  Visitantes no.
- El generador se ofrece cuando no hay colocación directa aunque aún quede un
  intercambio; el jugador puede elegir entre gastar el cambio o registrar la
  incidencia.
- IA (`chooseAiMove`): si no hay jugada, pasa; nunca cierra el parque por su
  cuenta. Prioriza un as necesario del llavero y la vía larga nocturna.

---

## 11. Tests mínimos a conservar

`src/lib/game/attractions.test.ts` y `src/lib/game/engine.test.ts` cubren:

- montaña: orden ascendente, start 2/3
- amor: arco desde un lado, as en cumbre
- bosque: columnas 9/10 diamantes, A♦ en 4
- sillas: figuras ilegales hasta torre
- figuras ilegales en coaster/love/forest/restaurant
- restaurant A♣ en 1
- restrooms K+Q
- límites por modo y cierre relativo de la Entrada
- Llavero de Ases, intercambio de figura y A♠ condicionado
- generador nocturno aun con cambios disponibles
- dos turnos solitarios o cuatro pases en pareja antes del bloqueo en Tormenta/00:13
- una única mano ampliada en los seis retos solitarios

Al portar, ejecuta esos tests primero.

---

## 12. Cómo recrear el repo en Codex

```bash
npm create vite@latest poker-park -- --template react-ts
# Tailwind v4, Zustand, lucide-react
```

1. Copia `src/lib/game`, `src/components/game`, `src/store`, `src/styles.css`.
2. `App.tsx` renderiza `<GameApp />`.
3. Copia `public/` (iconos, imágenes, manifest).
4. `index.html`: lang=es, theme-color `#6ec8f0`, apple-mobile-web-app-title
   **Poker Park**, fonts Fraunces+Nunito.
5. PWA: `manifest.webmanifest` name/short_name = Poker Park.
6. Netlify: build `vite build`, publish `dist`, `_redirects`:
   `/*    /index.html   200`.

No hace falta servidor. Todo corre en el cliente.

---

## 13. Créditos en producto

Pantalla final y pie: **Creado por Pentonúi Games**.
