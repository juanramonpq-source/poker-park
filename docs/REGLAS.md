# Poker Park — reglas de mesa

Fuente de verdad de diseño. La implementación canónica está en `src/lib/game/attractions.ts` y `src/lib/game/engine.ts`.

## Jugadores

1–2. En solitario, dos personas en el mismo dispositivo (hotseat) o una
persona con la IA.

## Componentes

1 baraja francesa de 52 cartas.

## Preparación

1. Barajar.
2. 2 cartas boca arriba al centro: **Entrada del parque**.
3. 3 cartas a cada jugador. En solitario, una única mano de 5 cartas.
4. El resto es el mazo de robo.
5. Espacio para las 7 atracciones.

## Objetivo

Montar en todas las atracciones posibles durante una jornada, en compañía o
en solitario, guiados por la baraja francesa. No hay que hacerlo perfecto. Hay
que recorrerlo.

En la ayuda de la portada, las reglas de los modos secretos permanecen ocultas
hasta que el progreso guardado haya desbloqueado el modo correspondiente.

## Turno

1. Roba 1 carta del mazo (si queda).
2. Una acción:
   - Colocar una carta en una atracción, **o**
   - Un intercambio estructural dentro del límite compartido del modo.

En dificultad **Clásico**, cada reto tiene su propio límite: 3 cambios en el
parque de día, 4 en Festival, 5 en Noche, Espejo y Tormenta, y 6 en Poker Park
00:13. La dificultad **Fácil** añade un cambio al límite del reto elegido. La
primera carta de la Entrada se cierra cuando solo queda un cambio; la segunda,
al agotar el límite.

Completar las 7 atracciones desbloquea el mismo progreso y las mismas
recompensas tanto en Fácil como en Clásico. Si se consigue en Clásico, se añade
además a la portada una medalla propia de ese modo.

En Fácil, en todos los retos y modalidades, una colocación que reduzca las
cartas disponibles hasta impedir completar otros recorridos con la distribución
actual muestra una advertencia. Se puede **Reconsiderar** o **Colocar igualmente**.
Los intercambios legales en atracciones incompletas pueden reparar algunas de
esas situaciones. La ayuda considera palos, valores y necesidades compartidas,
sin revelar manos ajenas ni el orden del mazo; no garantiza poder ganar.

La interfaz permite hacer la colocación tocando carta y destino o arrastrando
la carta hasta un hueco válido. Son dos controles para la misma acción y no
alteran ninguna regla.

Tras un intercambio el turno **no acaba**: se coloca la carta recibida.

Los jugadores pueden hablar libremente.

### Solitario

- Se juega con una única mano de 5 cartas iniciales; al abrir el primer turno
  se roba una sexta carta, igual que en los demás modos.
- Después de colocar, el turno vuelve a la misma mano y se roba de nuevo si
  quedan cartas en el mazo.
- Está disponible en Clásico, Noche de Guardia, Festival, Espejo, Tormenta y
  Poker Park 00:13.
- Se mantiene el límite de intercambios del modo elegido.
- Si la única mano no puede colocar ni intercambiar, una confirmación termina
  la jornada por bloqueo. En Tormenta y 00:13 se esperan dos turnos bloqueados
  consecutivos para permitir que el siguiente frente abra una jugada.

### En pareja

- Está disponible en los seis retos. Después de elegir el reto y la dificultad,
  la pareja decide si comparte un dispositivo o juega online en una sala privada.
- En online cada persona conserva su propia mano y ve en su tablero la animación
  de la carta que acaba de colocar la otra persona.

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
- bloqueo irresoluble (una confirmación en solitario y dos pases en pareja; en
  Tormenta/00:13 son dos turnos en solitario o cuatro pases en pareja), o
- el parque está resuelto y se elige **Cerrar el parque**.

En **Poker Park 00:13** no hay límite de tiempo: la tormenta solo cierra una
atracción durante un turno. El bloqueo exige dos rondas completas —dos turnos
en solitario o cuatro pases en pareja— para no confundir una mala rotación del
clima con una partida imposible.

## Evaluación

- 0 Colas eternas
- 1 Día tímido
- 2 Día improvisado
- 3 Día de feria
- 4 Día divertido
- 5 Día redondo
- 6 Día inolvidable
- 7 Fuegos sobre el parque

No hay ganador. Solo el parque que habéis sido capaces de crear.

## Secreto de las mascotas

Tuga, Púa y Burbujas aparecen ocasionalmente en la portada y durante la
partida. Cada saludo en esos dos lugares se conserva en el progreso local sin
mostrar un contador durante el juego. En el recuento se revela el total, el
detalle de saludos y la nota «Tu mascota favorita es…»; si hay empate, cuenta
como favorita la última mascota saludada.

Cada mascota tiene tres medallas acumulativas en la portada: bronce al superar
25 saludos, plata al superar 50 y oro al superar 100. Tocar las mascotas del
recuento o de los créditos no suma saludos. Las medallas son cosméticas y no
condicionan retos, reglas ni desbloqueos.

La colección tiene una última sorpresa: al conseguir las seis medallas de los
retos en dificultad Clásica y las tres medallas de mascota en oro, aparece una
décima medalla azul con el emblema de Pentonúi. El juego anuncia el logro una
sola vez y después conserva la medalla en la portada.

## Reto desbloqueable: La Noche de Guardia

Al completar las 7 atracciones del parque clásico se desbloquea este segundo
reto. Puede jugarse en solitario, en pareja o con el compañero automático. En
pareja, cada integrante mantiene su mano independiente.

- La partida empieza con Restaurante y Aseos disponibles; los otros cinco sectores están sin suministro.
- Los cuatro ases se barajan, se reparten y se roban con normalidad. El
  **Llavero de Ases** es una ayuda de emergencia: una figura puede cambiarse
  por un as que todavía siga oculto en el mazo y encaje inmediatamente en un
  sector con suministro. La figura vuelve al mazo y se consume uno de los 5
  cambios.
- La primera elección de suministro siempre ofrece Montaña Rusa y Bosque
  Encantado, para que los recorridos largos no aparezcan demasiado tarde.
- Al completar una atracción, se elige entre dos sectores cuál recibe corriente a continuación.
- Las cartas solo pueden colocarse o intercambiarse con atracciones que ya tengan suministro. Las reglas internas de las siete atracciones no cambian.
- Si no queda ninguna colocación directa y aún existen sectores cerrados, el generador permite abrir uno y continuar el mismo turno. Si todavía existe un intercambio, el equipo puede gastarlo antes o registrar la incidencia. Cada uso del generador queda anotado.
- El final se presenta como informe de mantenimiento: atracciones revisadas, incidencias y autorización de apertura.
- Completar las 7 revisiones concede la acreditación Guardianes del Alba y desbloquea las recompensas de La octava luz.
- En solitario, en ambas dificultades, las Jotas que llegan a la mano (reparto,
  robo o intercambio) pasan automáticamente a la **Caseta de guardia**. Cada
  Jota se reemplaza robando otra carta mientras quede mazo, repitiendo si sale
  otra Jota. Las Jotas de la Entrada permanecen allí hasta recibirse.
- Las Jotas de la caseta se pueden colocar en Sillas cuando su torre esté lista.
  Guardarlas no gasta turno ni cambio; colocarlas consume la colocación del
  turno, seguida del robo normal. También pueden cambiarse desde la caseta por
  una carta visible de la Entrada: la Jota pasa a la Entrada y la carta recibida
  a la mano. Consume un cambio del límite habitual, no termina el turno y no
  roba un reemplazo adicional (salvo si la carta recibida es otra Jota).
- En solitario Fácil, el llavero incluye un **comodín de un solo uso** adicional
  a las 52 cartas. Se eligen valor y palo; quedan fijados al colocarlo. Consume
  la colocación, no un intercambio. Respeta suministro, orden y dependencias.
- En cualquier modalidad Fácil, completar **6 revisiones** ya abre el Pase
  Maestro. Las 7 siguen siendo necesarias para Guardianes del Alba, fondo y
  tema nocturno. Los progresos perfectos anteriores conservan todos sus accesos.

## Modos del Pase Maestro

- **Festival de las Luces:** reglas clásicas y combo por alternar atracciones; 4 cambios en dificultad Clásico.
- **Parque Espejo:** dependencias de las siete atracciones en orden inverso; 5 cambios en dificultad Clásico.
- Todos los retos se pueden jugar en solitario, en pareja o con el compañero automático.
- **Día de Tormenta:** un sector cierra temporalmente y el siguiente se anuncia; 5 cambios en Clásico y bloqueo tras dos turnos solitarios o cuatro pases en pareja.
- **Poker Park 00:13:** reto final con Espejo, Tormenta y Festival activos a la vez. Para completar las 7 atracciones hay que respetar las dependencias invertidas, planificar los cierres anunciados por el pronóstico y alternar destinos para mantener el combo de luces. Las 00:13 indican la apertura, no una cuenta atrás. Concede 6 cambios en Clásico o 7 en Fácil y conserva el margen de dos rondas completas antes de declarar un bloqueo meteorológico.
