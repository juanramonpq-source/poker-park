# Poker Park — instrucciones para el agente

Este repositorio es **Poker Park**. La especificación canónica está en [`docs/CODEX.md`](CODEX.md). Léela antes de cualquier cambio de reglas, UI o flujo de turno.

- UI en español. Créditos: Juan Ramón Pérez Quintanar.
- Motor puro: `src/lib/game/`. Tests: `src/lib/game/attractions.test.ts`.
- Auth OFF. Persistencia: localStorage.
- No sustituyas las reglas de colocación por “cualquier carta en cualquier hueco”.
- Tras cambiar `attractions.ts` o `engine.ts`, ejecuta los tests y `npm run typecheck`.
