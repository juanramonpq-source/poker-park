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

Montar en todas las atracciones posibles durante una jornada en pareja,
guiados por la baraja francesa. No hay que hacerlo perfecto. Hay que recorrerlo.

En la ayuda de la portada, las reglas de los modos secretos permanecen ocultas
hasta que el progreso guardado haya desbloqueado el modo correspondiente.

## Turno

1. Roba 1 carta del mazo (si queda).
2. Una acción:
   - Colocar una carta en una atracción, **o**
   - Un intercambio estructural dentro del límite compartido del modo.

Hay 3 cambios en Clásico, 4 en Fácil y Festival, 5 en Noche, Espejo y
Tormenta, y 6 en Poker Park 00:13. La primera carta de la Entrada se cierra
cuando solo queda un cambio; la segunda, al agotar el límite.

La interfaz permite hacer la colocación tocando carta y destino o arrastrando
la carta hasta un hueco válido. Son dos controles para la misma acción y no
alteran ninguna regla.

Tras un intercambio el turno **no acaba**: se coloca la carta recibida.

Los jugadores pueden hablar libremente.

## Figuras

J, Q y K **no cuentan como números ni como palos**.
Solo sirven en Sillas Voladoras (cuando la torre está lista), en Aseos (K y Q) o como **visitantes** al final.

## Atracciones

### Montaña Rusa (8)

Números 2–10. Empieza con 2 o 3. Cada carta siguiente es exactamente +1. Sin saltos, sin figuras. Forma de looping visual; relleno lógico de izquierda a derecha en la vía.

### Casa del Terror (5)

4 picas de número + **A♠** en el tejado. El as de picas solo se coloca cuando las cuatro picas anteriores ya están puestas.

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
- bloqueo irresoluble (dos pases seguidos; cuatro en modos con tormenta), o
- el parque está resuelto y se elige **Cerrar el parque**.

En **Poker Park 00:13** no hay límite de tiempo: la tormenta solo cierra una atracción durante un turno. El bloqueo exige dos rondas completas —cuatro pases seguidos— para no confundir una mala rotación del clima con una partida imposible.

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

## Reto desbloqueable: La Noche de Guardia

Al completar las 7 atracciones del parque clásico se desbloquea este segundo reto. Los jugadores pasan a ser el personal de mantenimiento del parque y mantienen sus manos independientes.

- La partida empieza con Restaurante y Aseos disponibles; los otros cinco sectores están sin suministro.
- Antes del reparto se reservan los cuatro ases en el **Llavero de Ases**. Una
  figura puede cambiarse por un as que encaje inmediatamente en un sector con
  suministro; la figura vuelve al mazo y se consume uno de los 5 cambios.
- La primera elección de suministro siempre ofrece Montaña Rusa y Bosque
  Encantado, para que los recorridos largos no aparezcan demasiado tarde.
- Al completar una atracción, se elige entre dos sectores cuál recibe corriente a continuación.
- Las cartas solo pueden colocarse o intercambiarse con atracciones que ya tengan suministro. Las reglas internas de las siete atracciones no cambian.
- Si no queda ninguna colocación directa y aún existen sectores cerrados, el generador permite abrir uno y continuar el mismo turno. Si todavía existe un intercambio, el equipo puede gastarlo antes o registrar la incidencia. Cada uso del generador queda anotado.
- El final se presenta como informe de mantenimiento: atracciones revisadas, incidencias y autorización de apertura.
- Completar las 7 revisiones concede la acreditación Guardianes del Alba y desbloquea las recompensas de La octava luz.

## Modos del Pase Maestro

- **Festival de las Luces:** reglas clásicas y combo por alternar atracciones; 4 cambios.
- **Parque Espejo:** dependencias de las siete atracciones en orden inverso; 5 cambios.
- **Día de Tormenta:** un sector cierra temporalmente y el siguiente se anuncia; 5 cambios y cuatro pases antes del bloqueo.
- **Poker Park 00:13:** combina Espejo, Tormenta y Festival; 6 cambios y cuatro pases antes del bloqueo.
