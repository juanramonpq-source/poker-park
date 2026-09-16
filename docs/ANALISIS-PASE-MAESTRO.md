# Dificultad y apoyo del Pase Maestro

Fecha: 15 de septiembre de 2026. Base analizada: `e3b166118d0144f318bf892a8bb46aa25a9c7116`.

## Diagnóstico previo

La meta es completar siete atracciones; una jornada parcial sigue siendo un
resultado válido del juego. Completar las siete no está garantizado para
cualquier reparto o decisión. Se evalúan apoyos que reducen la dependencia
del reparto manteniendo el coste de los intercambios.

| Reto | Dificultad que introduce | Recursos previos | Decisión |
|---|---|---|---|
| Festival | Planificar alternancias para sumar luces; no restringe colocaciones | 4 cambios; un pase solo / dos en pareja | Conservar. Ya tiene un cambio más que Día con la misma legalidad. |
| Espejo | Ases de picas, corazones y tréboles necesarios al empezar; dependencias invertidas | 5 cambios; un pase solo / dos en pareja | Caseta en solitario y llavero en todas las modalidades. |
| Tormenta | Replanificar ante el cierre temporal de una atracción | 5 cambios; dos pases solo / cuatro en pareja | Caseta en solitario. El llavero añade poco con este agente. |
| 00:13 | Espejo y cierres simultáneos, más el objetivo opcional del combo | 6 cambios; dos pases solo / cuatro en pareja | Caseta en solitario y llavero en todas las modalidades. |

Fácil añade un cambio en cada reto. La caseta se mantiene solitaria, como
en Guardia: no introduce un depósito común que altere las manos separadas.
El comodín queda reservado a Guardia solitaria Fácil.

## Método y límites

`node --experimental-strip-types scripts/master-balance-analysis.mjs 100`
reproduce el experimento sobre fuentes extraídas del commit anterior. Crea
copias aisladas en `artifacts/`; las adaptaciones experimentales no son el
código de producción. Usa semillas 1–100 por combinación, dificultad
standard, solitario y dos manos controladas por el mismo agente. Compara
reglas originales, llavero, caseta y ambos recursos. Día y Guardia sirven
como controles. Son 4.200 ejecuciones, incluidas combinaciones repetidas de
control. El resultado completo se genera en `artifacts/master-balance-results.json`.

El agente es el heurístico existente, adaptado de igual manera en todas
las variantes para ver la caseta. No mira el orden oculto del mazo. Ejecuta
los pases y cambios de tiempo legales; no da por terminada la partida por
la primera mano sin acción. Se detiene al completar el parque, al terminar
el motor o al entrar en fase de visitantes sin ampliaciones posibles.

Estos datos **no son tasas de victoria humanas**, ni prueban que un reparto
sea insoluble. El agente es voraz, no planifica toda la baraja ni optimiza
las luces del Festival. Una semilla de Espejo con caseta se atasca tras un
intercambio que su política no sabe continuar: se registra como `agentStops`,
no como bloqueo del motor. Ninguna partida alcanzó el límite de 300 acciones.
Las diferencias pequeñas no justifican conclusiones estadísticas firmes.

## Resultados: solitario

Media de atracciones completadas, sobre siete:

| Reto | Original | Solo llavero | Solo caseta | Ambos |
|---|---:|---:|---:|---:|
| Festival | 4,36 | 4,89 | 5,26 | 5,40 |
| Espejo | 3,54 | 4,46 | 4,72 | 4,95 |
| Tormenta | 5,31 | 5,36 | 5,51 | 5,54 |
| 00:13 | 5,46 | 5,65 | 5,73 | 5,83 |

Con la selección propuesta:

| Reto | Parques completos antes → después (de 100) | Finales con más de 10 cartas en el mazo antes → después |
|---|---:|---:|
| Festival, conservado | 0 → 0 | 18 → 18 |
| Espejo, ambos | 2 → 4 | 48 → 14 |
| Tormenta, caseta | 2 → 8 | 1 → 0 |
| 00:13, ambos | 7 → 16 | 3 → 0 |

Los finales tempranos describen lo ocurrido con esa política, no una
imposibilidad matemática. En Espejo, la reducción es considerable aunque
queda mucho margen para que la planificación humana mejore el resultado.
En Tormenta, sumar el llavero a la caseta no aumenta los parques completos
en esta muestra; se elige la intervención menor. 00:13 sigue requiriendo
gestionar los recursos: incluso con ambos apoyos el agente completa 16/100.

## Dos manos

La caseta no se aplica a pareja, compañero automático ni online. Comparación
de la media original con llavero:

| Reto | Original | Llavero |
|---|---:|---:|
| Festival | 5,36 | 5,39 |
| Espejo | 5,48 | 5,69 |
| Tormenta | 5,37 | 5,32 |
| 00:13 | 5,55 | 5,62 |

La mejora menor con dos manos respalda mantener el almacenamiento solo en
solitario. El llavero de Espejo/00:13 aporta además una respuesta estratégica
consistente a sus ases iniciales obligatorios. No se simularon conversaciones
humanas, latencia de red ni decisiones de un compañero humano.

## Contrato del ajuste

- Los ases siguen en las 52 cartas; el llavero no crea ni duplica cartas.
- Cada rescate cuesta una figura de la mano y un intercambio; el as debe
  tener una colocación legal inmediata, incluido el pronóstico.
- La caseta reemplaza las Jotas al recibirlas mientras quede mazo; almacenarlas
  no gasta maniobra. Colocarlas sí consume la colocación del turno.
- Las Jotas guardadas solo se intercambian con la Entrada. Se mantiene el
  cierre de entradas y la obligación de colocar la carta recibida.
- En Espejo/00:13 las figuras van antes de la torre; en Tormenta, después.
- Se conservan los límites 4/5/5/6, la lógica de recompensas y las reglas
  de las siete atracciones. No se promete solución para toda baraja.


## Revisión del 16 de septiembre: alternancia obligatoria

Festival y 00:13 pierden el reto al repetir dos colocaciones consecutivas.
La prohibición no es permanente: A → B → A es válida. Los datos anteriores
corresponden a reglas anteriores y no describen esta versión.

`scripts/festival-repeat-balance.mjs` compara 200 semillas por combinación
(solo y dos manos; Festival y 00:13), usando la misma política voraz que
penaliza repeticiones y sabe utilizar las casetas existentes. Son 2.400
partidas entre reglas previas, nuevas y nuevas con dos cambios adicionales.
Resultados en `artifacts/festival-repeat-balance.json`.

| Reto / modalidad | Media previa | Media nueva | Nueva con +2 cambios |
|---|---:|---:|---:|
| Festival solo | 3,325 | 3,205 | 3,205 |
| Festival dos manos | 4,135 | 3,590 | 3,630 |
| 00:13 solo | 3,130 | 2,450 | 2,450 |
| 00:13 dos manos | 2,675 | 1,525 | 1,525 |

Solo se completó 1/200 Festival en dos manos con reglas nuevas; ninguna
partida de las otras tres combinaciones llegó a siete. El agente concentra
cartas para completar atracciones y no reserva destinos para el final.
Estos resultados muestran un aumento de dificultad y una limitación de la
política; no permiten estimar tasas humanas ni asegurar un equilibrio final.
Dos intercambios extra no corrigen la causa y no se añaden.

`scripts/festival-route-proof.mjs` construye un orden de baraja válido y
reproduce las 46 colocaciones con el motor real, manos iniciales normales,
robos, caseta solitaria y tormenta en 00:13. Verifica las siete atracciones,
sin repeticiones y sin gastar intercambios, en ambos retos y modalidades.
Resultados en `artifacts/festival-route-proof.json`. Prueba existencia de
recorridos completos, no solvencia de todos los repartos ni facilidad humana.

Decisión: conservar presupuestos 4/5 para Festival y 6/7 para 00:13 y los
apoyos existentes. Añadir el consejo de reservar huecos en al menos dos
atracciones hasta el final y señal roja persistente. La planificación de
alternancias forma parte del reto solicitado. Antes de suavizar más, hace
falta valorar partidas humanas o una política que planifique el final.
