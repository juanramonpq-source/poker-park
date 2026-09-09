# Poker Park — handoff para Codex / ChatGPT

Documento de traslado. Fuente de verdad del juego, arquitectura y decisiones de producto.  
Autor: **Juan Ramón Pérez Quintanar**. Idioma de la UI: **español**.

Si continúas este proyecto en Codex: lee este archivo entero antes de tocar código. No reinventes las reglas; están implementadas y testeadas.

---

## 1. Qué es

**Poker Park** es un juego de cartas cooperativo para **2 jugadores** (hotseat en el mismo móvil, o un humano vs IA). Usa una **baraja francesa de 52**. No hay ganador: se construye un parque de atracciones con las cartas y se evalúa el día juntos.

Estética: feria alegre, colores pastel, sol de tarde. Nunca tenebroso.

---

## 2. Cómo se juega (reglas canónicas)

### Preparación
1. Barajar 52 cartas.
2. 2 cartas boca arriba en el centro = **Entrada**.
3. 3 cartas a cada jugador.
4. El resto es el mazo de robo.

### Turno
1. Robar 1 carta del mazo (si queda).
2. Hacer **una** acción:
   - Colocar una carta en una atracción, **o**
   - Un **intercambio estructural**.

Tras un intercambio el turno **no termina**: hay que colocar la carta que acaba de entrar (`swappedCardId`). Los jugadores pueden hablar libremente.

### Intercambios (aforo)
- Máximo **3 en toda la partida**, compartidos.
- Se cambia una carta de la mano por una ya colocada (entrada o hueco de atracción **no completada**), si la estructura sigue siendo legal.
- 2.º intercambio: se cierra (boca abajo) la primera carta de la entrada.
- 3.º intercambio: se cierra la segunda. Aforo completo: no hay más cambios.

### Figuras (J, Q, K)
**Nunca** se colocan como números ni como palos. No rellenan montaña rusa, túnel, bosque, casa del terror ni restaurante. Solo:
- Sillas Voladoras (cuando la torre de 3 picas está lista)
- Aseos (rey + reina)
- Visitantes, al final, de forma opcional

### Visitantes
Cuando ya no se puede completar ninguna atracción más, las figuras restantes pueden sentarse en atracciones **ya completadas**. No es obligatorio.

### Final
La partida termina si:
- se agotan mazo y manos, **o**
- bloqueo que no se resuelve con intercambio (ambos pasan), **o**
- el parque está **resuelto** (7/7) y el jugador cierra el día.

Si un jugador no puede colocar ni intercambiar: overlay **«Estás bloqueado, no puedes montar en nada»** + **Pasar turno**. El otro puede desbloquear. Si también está bloqueado: **Fin de la jornada**.

Si el parque está completo y solo quedan figuras opcionales: overlay **«El parque está resuelto»** con **Cerrar el parque** y **Dejar un visitante**.

### Evaluación
| Vueltas | Título |
|---|---|
| 0 | Colas eternas |
| 1 | Día tímido |
| 2 | Día improvisado |
| 3 | Día de feria |
| 4 | Día divertido |
| 5 | Día redondo |
| 6 | Día inolvidable |
| 7 | Fuegos sobre el parque |

Insignias según atracciones y secretos. 7/7 = fiesta + fuegos. Créditos: **Fin, gracias por jugar. Creado por Juan Ramón Pérez Quintanar.**

Secreto: tocar 7 veces el recuento desbloquea **pase de por vida** (`localStorage` `poker-park.secrets.v1`).

---

## 3. Atracciones y huecos

Ranks: `1=A, 11=J, 12=Q, 13=K`. Palos: `hearts | diamonds | clubs | spades`.

La validez está en `src/lib/game/attractions.ts` (`isAttractionValid`, `legalSlotsForCard`). Tests: `src/lib/game/attractions.test.ts`.

### Montaña Rusa (`coaster`) — 8 huecos
Números 2–10, **orden ascendente sin saltos**. El primero es **2 o 3**. Las figuras no suben. Se rellena de izquierda a derecha en el array `0..7` (la forma visual es looping, pero el orden lógico es lineal).

Visual aproximada:

```
        [4]
     [2][3][5]
  [1]      [6]
[0]          [7]
```

### Casa del Terror (`haunted`) — 5
Huecos `0–3`: picas de **número** (no as, no figuras). Hueco `4` (tejado): **A♠** obligatorio.

```
    [4] A♠
 [0][1]
 [2][3]
```

### Túnel del Amor (`love`) — 7, forma de arco
Solo corazones de número. El **A♥** va **solo** en el hueco `3` (cumbre). Hay que empezar por un **extremo** (`0` o `6`), subir hasta el as y bajar. No se puede empezar por el as ni saltar huecos.

```
         [3] A♥
      [2]     [4]
   [1]           [5]
[0]                 [6]
```

### Bosque Encantado (`forest`) — 11
- `0–8`: matriz 3×3 de **tréboles o diamantes de número**. Centro `4` = **A♦**.
- `9` y `10`: **dos columnas de diamantes** (número) debajo, a izquierda y derecha. Obligatorias.

```
[0][1][2]
[3][4][5]   [4]=A♦
[6][7][8]
[9]   [10]  diamantes
```

### Sillas Voladoras (`chairs`) — 7, forma en Y
Primero la torre: huecos `4,5,6` = **3 picas de número** (vertical).  
Cuando las tres están, las sillas `0–3` aceptan **figuras** (J/Q/K).

```
[0]           [1]
   [2]     [3]
      [4]
      [5]
      [6]
```

### Restaurante (`restaurant`) — 6, 2×3
Números. Hueco `1` (centro de la fila superior) = **A♣**. Las figuras no entran. El as de tréboles no puede ir a otro hueco.

```
[0][1][2]   [1]=A♣
[3][4][5]
```

### Aseos (`restrooms`) — 2
Un **rey** y una **reina**, cualquier palo, juntos. Sin jotas. Sin dos reyes ni dos reinas.

---

## 4. Arquitectura

App **100 % cliente**. Auth, PGLite y servidor son resto de plantilla y **no se usan** para el juego.

| Capa | Archivos |
|---|---|
| Estado | `src/store/game-store.ts` (Zustand) |
| Motor puro | `src/lib/game/engine.ts` |
| Reglas de formas | `src/lib/game/attractions.ts` |
| Baraja | `src/lib/game/deck.ts` |
| Tipos | `src/lib/game/types.ts` (`GameState.version = 7`) |
| Persistencia | `src/lib/game/persist.ts` (`localStorage`) |
| IA | `src/lib/game/ai.ts` |
| Audio procedural | `src/lib/game/audio.ts` (Web Audio, sin MP3) |
| UI | `src/components/game/*` |
| Estilos | `src/styles.css` (Tailwind v4 + tokens) |
| Ruta única | `src/routes/index.tsx` → `<GameApp />` |

Flujo de pantallas: `title` → `playing` → (hotseat: `pass`) → `end`.

Turno humano: `place` / `visit` / `exchange` / `pass` / `closePark` → `afterHuman`.  
Si se completa una atracción: `pendingAdvance` + animación `RideFinale` (~3,2 s) y luego pasa el turno.

### Persistencia
- Partida: `poker-park.save.v7` (se ignora si `ended` o versión distinta)
- Audio: `poker-park.settings.v1`
- Secretos: `poker-park.secrets.v1` `{ perfect, lifetime }`

---

## 5. UI / producto (no romper)

- **Mobile-first**, un mapa de parque **sin scroll** en juego. Al tocar un recuadro se abre ficha de atracción.
- Cartas: ilustración “de verdad” (pips, ases y figuras dibujadas) en `PlayingCard.tsx` / `CardArt.tsx`.
- Huecos reservados (ases, columnas ♦): **muy transparentes**. En el mapa general **no** se marcan ases.
- Atracciones posibles: halo **verde/dorado** fuerte (`tile-hot`).
- Mano: cartas grandes, flotando, brillo + sonido al seleccionar.
- Completar: animación temática (`RideFinale`) y luego sello **CONSEGUIDO** + bloqueo.
- Entrada de ficha: rebote suave (`scheme-enter` ~0,7 s), no oscilación violenta.
- Recuento final: número grande + redoble (`playRollTick` / `playRollFill` / `playRollCrash`).
- PWA: nombre **Poker Park**, icono diurno del parque en `public/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` y `apple-touch-icon.png`.
- Música de feria **larga** (vals multi-frase en `audio.ts`), no un loop corto.

Colores (`src/styles.css` `@theme`): cielo `#6ec8f0`, acento `#d6453d`, fondo `#eaf6ff`, superficie `#fffaf1`, bien `#2f9e5f`. Fuentes: **Fraunces** (títulos) + **Nunito**.

---

## 6. Stack actual

Plantilla TanStack Start (Vite 8 + React 19 + Tailwind 4 + Nitro, preset Vercel). El juego no necesita SSR.

```
npm install
npm run dev      # Vite :8080
npm run typecheck
node --experimental-strip-types --test src/lib/game/attractions.test.ts
npm run build    # estático + prerender de /
```

Para Netlify: el build deja HTML en `.vercel/output/static` (hay `index.html` prerenderizado). Se puede zippear esa carpeta y arrastrarla a Netlify.

### Qué puede ignorar Codex (plantilla Grok)
No forma parte del juego:
- `src/lib/auth/**`, `src/lib/db.ts`, `src/lib/app-data/**`
- `PreviewHostBridge`, `scripts/grok-pwa-plugin.mjs`, `public/__grok/**`
- `migrations/`, Better Auth, PGLite

Si se porta a un Vite+React SPA limpio, basta con:
`src/lib/game/*`, `src/store/game-store.ts`, `src/components/game/*`, `src/components/ui/button.tsx`, `src/lib/utils.ts`, `src/styles.css`, `public/**` (iconos + `images/`).

---

## 7. Assets públicos

- `public/images/park-day.jpg` — fondo del mapa / título
- `public/images/park-dusk.jpg`
- `public/images/card-back.jpg` — dorso de carta (noria)
- `public/app-store-icon-1024.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`
- `public/manifest.webmanifest` — name/short_name **Poker Park**

---

## 8. Prompt listo para pegar en Codex

```
Eres el agente de código de Poker Park, un juego de cartas cooperativo
en español para 2 jugadores. Lee CODEX.md y no cambies las reglas de
src/lib/game/attractions.ts sin actualizar tests.

Stack: React 19, Zustand, Tailwind v4, audio Web Audio procedural.
La lógica pura no debe importar React.

Objetivo: [describe el cambio].
Mantén estética de feria alegre, UI mobile-first sin scroll en el mapa,
y el crédito “Creado por Juan Ramón Pérez Quintanar” en el final.
```

---

## 9. Invariantes (no “arreglarlos”)

1. Figuras ≠ números. Si un test de figuras falla, el bug es del motor, no del test.
2. El túnel es un **arco** que se rellena desde un extremo; la montaña rusa es **secuencia** 2/3 → +1.
3. Sillas: figuras **después** de las 3 picas.
4. Bosque: dos diamantes extra `9` y `10`.
5. Intercambio no gasta el colocación: obliga a jugar la carta nueva.
6. Visitantes opcionales; no bloquean el cierre del día.
7. No hay ganador.
8. Nombre de la PWA: Poker Park, nunca “Grok App”.
