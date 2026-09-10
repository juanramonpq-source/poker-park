# Banda sonora de Poker Park

Siete pistas instrumentales creadas en Suno v6 el 10 de septiembre de 2026,
descargadas con el botón oficial de la cuenta Pro del propietario del juego e
integradas en la web. No se ha utilizado captura del reproductor ni publicación
social de Suno. No se han contratado extras ni ampliado la suscripción.

## Dirección musical y fuentes

El usuario aprobó las dos variantes de introducción y autorizó elegir una,
crear una variante más activa pero calmada para jugar y continuar con los demás
modos sin solicitar más decisiones. Se eligió la primera introducción.

`scripts/export-music-references.mjs` exporta las siete composiciones originales
de `audio.ts`, acompañadas y con melodía aislada, a
`artifacts/music-references/`. El manifiesto local conserva notas, tempo y hashes
de las referencias utilizadas. Público y lluvia no forman parte de esas guías.

Cada generación usó Cover v6, `[Instrumental]`, Weirdness 15 %, Style Influence
65 % y Audio Influence 85 %. La portada y los cinco modos especiales emplean
sus referencias procedurales propias. El parque normal utiliza como referencia
la introducción de Suno aprobada por el usuario, para compartir su tema con más
pulso. Se pidió conservar motivos, fraseo y melodías; la identidad literal de
cada nota no está certificada. Las pruebas técnicas no equivalen a una escucha
crítica ni a una transcripción musical.

| Ambiente | Canción seleccionada | Dirección |
| --- | --- | --- |
| Portada | Bienvenidos al parque · 2:33 | Piano íntimo, celesta, cuerdas cálidas; calma y expectación. |
| Parque | Un día en el parque · 3:13 | Variante de portada con más movimiento, referencia de 104 BPM, pizzicato, piano, maderas y percusión ligera. |
| Guardia nocturna | Guardianes del alba · 2:53 | Piano suave, celesta y cuerdas; noche serena que sugiere el amanecer. |
| Festival | Festival de las luces · 1:13 | Destellos de celesta, flauta y percusión discreta. |
| Espejo | Al otro lado del espejo · 1:42 | Diálogos reflejados de piano y celesta, curiosidad y arpa. |
| Tormenta | Bailando bajo la tormenta · 0:53 | Marimba, pizzicato y pulso inquieto pero amable; sin efectos de lluvia en la grabación. |
| 00:13 | El parque de las 00:13 · 1:10 | Intervalos y ritmo peculiares de la referencia, misterio de cámara sin terror. |

Cada generación produjo dos variantes. Las siete elegidas están identificadas
individualmente en `suno-music-manifest.json`, con enlace, ID, fecha de creación
original, metadatos oficiales y hashes de originales y archivos distribuidos.

## Descarga, licencia y conservación

La cuenta mostraba Pro activo y 27 descargas antes de empezar; se desbloquearon
siete canciones para su descarga oficial (20 restantes). La promoción visible
permitía crear en v6 sin créditos. Los originales MP3 y M4A siguen en Descargas;
se conservó además una copia de los MP3 en `artifacts/suno-originals/`.

El propietario autorizó el aviso de derechos para cargar su propia composición.
No se han utilizado referencias de otros artistas. El uso comercial de descargas
de una suscripción de pago, incluido en videojuegos, se contrastó con la ayuda
y condiciones vigentes en la fecha de la operación:

- https://help.suno.com/en/articles/9601665
- https://suno.com/terms
- https://suno.com/blog/covers

La evidencia conservada documenta las descargas; no garantiza exclusividad de
los resultados generativos ni sustituye una revisión jurídica. La banda sonora
no constituye por sí sola la preparación de una publicación en tiendas móviles.

## Preparación e integración

`scripts/prepare-suno-music.mjs` acepta únicamente los siete nombres esperados,
comprueba metadatos oficiales de Suno, conserva originales y genera MP3 de
128 kbps, 44,1 kHz, con normalización a -18 LUFS / -2 dBTP / LRA 9. Mantiene los
metadatos de procedencia en los archivos distribuidos. Total aproximado: 12,5 MB,
pero cada modo descarga únicamente su canción, no toda la colección al entrar.

`SoundtrackPlayer` comparte el mezclador y el silencio existentes, realiza
fundidos al cambiar de modo y prepara un solapamiento de 1,5 s al repetir.
Conserva únicamente la última pista decodificada para limitar memoria móvil.
Cancela cargas obsoletas. Si una pista falla, entra la composición procedural
original; se desconecta antes de iniciar otra grabación. Los efectos de cartas,
menú y ambientes se mantienen independientes. El audio requiere gesto de usuario
y se pausa cuando la pestaña queda oculta.

Pruebas reproducibles:

- `node --experimental-strip-types --test scripts/soundtrack.test.mjs`
- `node scripts/soundtrack-browser-smoke.mjs http://127.0.0.1:8109`
- `node scripts/opening-sequence-smoke.mjs <url>`
- `npm run typecheck`, `npm run test:game` y `npm run build`

Copia anterior a la integración conservada fuera del repositorio:
`PokerPark-backups/PokerPark-pre-suno-music-5a01b37.tgz`.
