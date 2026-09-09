# Poker Park

Juego de cartas cooperativo para 2 jugadores (móvil primero). Una baraja francesa de 52 cartas os guía para montar en las atracciones de un parque. **No hay ganador**: al final se evalúa el día según las atracciones completadas.

Creado por **Pentonúi Games**.

Si vas a continuar el desarrollo en **ChatGPT Codex**, lee primero [`docs/CODEX.md`](docs/CODEX.md). Es la especificación canónica del producto, las reglas y los invariantes que no se pueden romper.

## Arranque

```bash
npm install
npm run dev          # http://0.0.0.0:8080
npm run typecheck
node --experimental-strip-types --test src/lib/game/attractions.test.ts
npm run build        # estático + prerender de /
```

Auth y base de datos están **apagados**. Toda la partida vive en `localStorage`.

## Stack

- React 19 + TypeScript + Vite 8
- TanStack Start / Router (ruta única `/`)
- Tailwind v4 (`src/styles.css`)
- Zustand persistido (`src/store/game-store.ts`)
- Motor puro en `src/lib/game/` (sin React)
- Audio procedural Web Audio (`src/lib/game/audio.ts`)
- PWA: `public/manifest.webmanifest` + iconos
- Control táctil por toque o arrastre, manteniendo siempre visibles los naipes
- Plano ilustrado desplegable propio de cada modo, con caminos, jardines y las
  atracciones superpuestas como paradas de la ruta que los jugadores recorren
  guiados por la baraja francesa; al cerrar el parque, el plano vuelve a plegarse

## Distribución

- Versión de producto: **1.0.0**
- Icono maestro para tiendas: `public/app-store-icon-1024.png`
- Privacidad: [`PRIVACY.md`](PRIVACY.md)
- Créditos: [`CREDITS.md`](CREDITS.md)
- Licencia: [`LICENSE`](LICENSE)

## Mapa rápido

| Qué | Dónde |
|---|---|
| Reglas de colocación | `src/lib/game/attractions.ts` |
| Turnos, fin, recuento | `src/lib/game/engine.ts` |
| UI del parque | `src/components/game/` |
| Estado de la sesión | `src/store/game-store.ts` |
| Tests de reglas | `src/lib/game/attractions.test.ts` |
