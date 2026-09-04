# Poker Park — reglas de mesa

Fuente de verdad de diseño. La implementación canónica está en `src/lib/game/attractions.ts` y `src/lib/game/engine.ts`.

## Jugadores

2. Mismo dispositivo (hotseat) o uno contra la IA.

## Componentes

1 baraja francesa de 52 cartas.

## Preparación

1. Barajar.
2. 2 cartas boca arriba al centro: **Entrada del parque**.
3. 3 cartas a cada jugador.
4. El resto es el mazo de robo.
5. Espacio para las 7 atracciones.

## Objetivo

Montar todas las atracciones posibles durante una jornada en pareja. No hay que hacerlo perfecto. Hay que recorrerlo.

## Turno

1. Roba 1 carta del mazo (si queda).
2. Una acción:
   - Colocar una carta en una atracción, **o**
   - Un intercambio estructural (máximo 3 en toda la partida).

Tras un intercambio el turno **no acaba**: se coloca la carta recibida.

Los jugadores pueden hablar libremente.

## Figuras

J, Q y K **no cuentan como números ni como palos**.
Solo sirven en Sillas Voladoras (cuando la torre está lista), en Aseos (K y Q) o como **visitantes** al final.

## Atracciones

### Montaña Rusa (8)

Números 2–10. Empieza con 2 o 3. Cada carta siguiente es exactamente +1. Sin saltos, sin figuras. Forma de looping visual; relleno lógico de izquierda a derecha en la vía.

### Casa del Terror (5)

4 picas de número + **A♠** en el tejado.

### Túnel del Amor (7)

7 corazones de número en arco. Empieza por un extremo, sube, **A♥ en la cumbre**, baja. Sin figuras.

### Bosque Encantado (11)

Matriz 3×3 de tréboles y diamantes de número, **A♦ al centro**. Debajo, **dos columnas de diamantes** (entrada del bosque).

### Sillas Voladoras (7)

Torre: 3 picas de número en vertical. **Después**, 4 figuras en las sillas. Sin torre no hay figuras.

### Restaurante (6)

2×3 de números. **A♣ en el centro**. Sin figuras.

### Aseos (2)

1 rey + 1 reina, cualquier palo, juntos.

## Visitantes

Cuando ya no se puede ampliar ninguna atracción (o el parque está completo), las figuras restantes **pueden** sentarse en atracciones completadas. No es obligatorio.

## Final

- Se agotan mazo y manos, o
- bloqueo irresoluble (los dos jugadores pasan), o
- el parque está resuelto y se elige **Cerrar el parque**.

## Evaluación

- 0 Colas eternas
- 1 Día tímido
- 2 Día improvisado
- 3 Día de feria
- 4 Día divertido
- 5 Día redondo
- 6 Día inolvidable
- 7 Fuegos sobre el parque

No hay ganador. Solo el parque que habéis sido capaces de crear juntos.
