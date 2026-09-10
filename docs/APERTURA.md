# Apertura interactiva

La primera visita muestra estudio → entrada → rasgado → validación → vuelo → parque y rayo de sol → título → caída del menú. Las visitas posteriores comienzan en el parque. «Ver secuencia de apertura» reproduce el recorrido completo; «Omitir apertura» permite entrar directamente. Reiniciar el progreso elimina también la preferencia de apertura. Las invitaciones con `sala` acceden directamente al menú online.

La marca `poker-park.opening-seen.v1` se guarda al llegar al menú o al omitir. Es una preferencia local de cada navegador, no una cuenta compartida entre dispositivos. No se modifican las reglas, las cartas, las partidas ni las duraciones del mapa. Se respeta el silencio guardado y la preferencia de movimiento reducido.

## Arte

- Archivo: `public/images/opening-ticket-sprites.png`.
- Generación: herramienta integrada de imágenes, no CLI. PNG RGBA, 1254 × 1254; cuatro celdas de 627 × 627 en orden de lectura. Se utiliza directamente como atlas raster con renderizado pixelado, sin sustitutos vectoriales.
- Registro: intacta, rasgado parcial, talón separado, validada sin talón.
- Copia anterior: `PokerPark-backups/PokerPark-pre-opening-ritual.tgz`; SHA-256 `dab81726336c7ad556a75677c513a9c1413fca4e72e68c88fbc74465d4f42b32`.

### Prompt utilizado

Create a production game sprite sheet PNG for Poker Park, a French-deck amusement park game. Transparent alpha background. Crisp gorgeous 16-bit PIXEL ART, no vector, no soft blur, limited warm cream/gold/coral/deep teal palette, pixel clusters and stepped edges. EXACT GRID: 2 columns by 2 rows, four equal rectangular cells in a square 1024x1024 image. Each cell is 512x512. The SAME horizontal paper admission ticket centered in each cell at exactly the same position, x=64 to448 y=160 to352 relative to cell. All four main ticket bodies must match exactly in scale, text, pattern and position. Ticket has beautiful gold pixel border, small ferris wheel and French card suits, large crisp text 'POKER PARK', smaller 'ENTRADA', a perforated narrow stub on RIGHT edge. Four consecutive animation frames in reading order: top left INTACT ticket and attached stub; top right same ticket with upper half of right stub tearing along jagged pixel perforation, tilted out slightly; bottom left same ticket with stub fully torn and falling slightly down/right separated by transparent gap; bottom right main ticket remains at identical coordinates, right edge now jagged torn paper, stub gone, small coral validation seal in bottom corner. No frame labels, no numbers, no scenery, no hands, no shadows outside sprite, no white background. Transparent pixels between sprites. Consistent registration for frame animation. Entire ticket including detached stub stays inside its own cell. Make ticket richly detailed but readable at mobile size.

## Comprobación

`node scripts/opening-sequence-smoke.mjs <URL>` recorre primera visita, visitas posteriores, reproducción, omisión, audio, movimiento reducido, menú desbloqueado y entrada a una partida. Produce capturas en `screenshots/`. Ejecutar también compilación, comprobación de tipos, pruebas de juego y prueba online en la versión publicada.
