# Portada Poker Park — 15 septiembre 2026

Nombre definitivo de esta prueba: **Poker Park**, conservando el nombre del
juego. Rótulo rojo y dorado con los cuatro palos: pica, corazón, diamante y
trébol. Reemplaza el título de texto conservando el botón para entrar.

## Recursos

- `public/brand/poker-park-title-v1.png`: original transparente, 2022 × 778.
- `public/brand/poker-park-title-v1.webp`: versión de uso, calidad 95, alfa 100.
- `public/images/park-cover-mobile-hq-v1.webp`: fondo vertical restaurado,
  1024 × 1536, calidad 96. La copia anterior tenía 768 × 1152.

El fondo mantiene la escena y el encuadre con detalles reconstruidos mediante
ImageGen; no es una ampliación idéntica píxel a píxel. Los fondos originales,
el de PC y los de retos y recompensas se conservan. El letrero se adapta a
pantallas pequeñas sin cambiar las acciones del menú ni el progreso guardado.

Las imágenes se editaron con la herramienta integrada ImageGen y se
convirtieron a WebP con cwebp sin alterar dimensiones ni transparencia.
La propuesta descartada PoPark queda solo en `artifacts/popark-proposal/`.

## Prompt final del letrero

Edit target: the attached transparent red and gold fairground game logo. Change ONLY the lettering from "PoPark" to exactly "Poker Park", two words, capital P in each, spelled P o k e r [space] P a r k. Keep the same premium polished vintage sculpted cream-gold serif letters, red enamel plaque, gold beveled rim, and precisely FOUR gold-edged card suits above: dark spade, red heart, red diamond, dark club. Widen/adapt the plaque as needed to comfortably accommodate the full name in one horizontal line, balanced ornate capital P letters. Keep all four suits fully visible, equally balanced, no duplicates. Preserve clean crisp professional illustration finish and genuinely transparent alpha background. No sky, no scenery, no extra text, no watermark. Full logo visible, small transparent margin around the silhouette, about 2.6:1 aspect ratio for use in an existing mobile game title screen. This is a finished game asset.

## Presentación tranquila

El letrero entra con una pequeña caída y un balanceo que se amortigua durante
2,2 segundos, acompañado de dos destellos cálidos escalonados. Se reproduce
una vez al llegar a «Toca para entrar» y queda quieto después. La zona de
toque no se mueve; se puede entrar antes de que termine. El foco de teclado
se indica con un contorno dorado alrededor del texto de entrada.

Las animaciones solo usan transformaciones y opacidad. No añaden sonidos,
temporizadores de juego ni bloqueos de entrada. Con movimiento reducido,
el letrero aparece estático y los destellos se ocultan.

## Apertura de Pentonúi Games

La presentación usa dos recortes CSS de `pentonui-games-logo.png`, el original
de 1200 × 900: flor y nombre. Solo la palabra Pentonúi recibe más luminosidad;
la ilustración y el renglón Games conservan sus colores originales.

Al pulsar aparece el estado `studio-turn`: desaparece el texto y la flor
gira 180 grados hacia dentro alrededor del eje diagonal del emblema,
orientado hacia el triángulo verde. La cara posterior conserva exactamente
la geometría y orientación del dibujo original; dos filtros localizados
intercambian los colores de los triángulos: rojo arriba, azul abajo a la
izquierda y verde abajo a la derecha. Las caras se intercambian cuando la
flor está de canto para evitar superposiciones en WebKit. Esa posición se
mantiene brevemente y se desvanece antes de
pasar automáticamente a la entrada del parque, a los 2,5 segundos.

Durante el giro se bloquean pulsaciones repetidas sobre el emblema. Omitir
cancela la transición pendiente; movimiento reducido pasa directamente a la
entrada. No modifica guardados, progreso, reglas ni la validación de la entrada.

`node scripts/studio-opening-smoke.mjs <url>` comprueba la orientación visible
final, la transición a la entrada, la cancelación al omitir y movimiento
reducido en escritorio y móvil.
