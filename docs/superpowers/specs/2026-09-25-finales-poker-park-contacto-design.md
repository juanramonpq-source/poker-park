# Finales narrativos y notificación de hazaña de Poker Park

**Fecha:** 25 de septiembre de 2026

## Objetivo

Poker Park tendrá dos cierres narrativos distintos y ordenados:

1. Un final del juego al superar los seis retos, independiente de las mascotas.
2. Un final definitivo de Pentonúi al superar los seis retos y conseguir las tres medallas de mascota en oro.

El segundo final permitirá que el jugador comunique voluntariamente su hazaña a Pentonúi Games. La dirección receptora permanecerá en el servidor y no se incluirá en el código descargado por el navegador.

## Criterios de progreso

### Final de Poker Park

Se considera que el jugador ha terminado Poker Park cuando ha completado las siete atracciones, al menos una vez y en cualquier dificultad, en cada uno de estos retos:

- Jornada de día
- La Noche de Guardia
- Festival de las Luces
- Parque Espejo
- Día de Tormenta
- Poker Park 00:13

Se usarán las seis marcas de finalización que ya guarda `Secrets`. Las medallas clásicas y el progreso de las mascotas no intervienen en este hito.

La primera vez que se cumpla la condición aparecerá un diálogo narrativo con la idea central: todo día en un parque de atracciones llega a su fin. El mensaje reconocerá que el jugador ha recorrido todo Poker Park y explicará que las mascotas aún pueden guardar una última despedida, sin convertirlas en requisito para haber terminado el juego.

### Final definitivo de Pentonúi

Se alcanza cuando concurren estas dos condiciones:

- Los seis retos están completados en cualquier dificultad.
- Tuga, Púa y Burbujas tienen su medalla de oro, es decir, más de 100 saludos cada una según las reglas actuales.

Este criterio sustituirá el requisito actual de poseer las seis medallas clásicas para recibir la medalla azul de Pentonúi. Las medallas clásicas seguirán existiendo como distinción adicional y no perderán su progreso.

El final definitivo agradecerá al jugador haber llegado hasta el último secreto del parque, concederá o confirmará la medalla Pentonúi y ofrecerá comunicar la hazaña al estudio.

### Orden y compatibilidad

Los finales se mostrarán una sola vez y en este orden. Si una persona ya cumple ambas condiciones al instalar la actualización, verá primero el final de Poker Park y, tras cerrarlo, el final definitivo. Los jugadores que ya poseen la medalla Pentonúi también podrán ver el nuevo agradecimiento y usar el formulario una vez, porque esta experiencia no existía cuando obtuvieron la medalla.

Un nuevo registro local `poker-park.finales.v1` guardará:

- `parkEndingSeen`
- `ultimateEndingSeen`
- `achievementSubmittedAt`

La detección se ejecutará tanto al resolver el recuento de una partida como al volver a la portada. De este modo, un progreso antiguo o un último oro obtenido desde la portada no dejarán el mensaje pendiente para siempre.

## Estadísticas locales

Se añadirá un registro local versionado `poker-park.stats.v1`. No habrá cuenta de usuario ni sincronización entre dispositivos.

Registrará desde la instalación de esta versión:

- Tiempo activo de juego, en segundos.
- Jornadas terminadas.
- Parques perfectos completados.
- Total acumulado de atracciones completadas al cerrar jornadas.
- Retos completados, obtenidos del progreso ya existente.

El tiempo solo avanzará mientras la aplicación esté visible y haya una partida activa. Se detendrá al pasar la aplicación a segundo plano, cerrar la jornada o volver a la portada. La interfaz indicará que el tiempo histórico anterior a esta actualización no puede reconstruirse.

Las estadísticas se consolidarán una sola vez al finalizar cada jornada. Se evitará duplicarlas si la pantalla final se vuelve a montar, se recarga o se reabre.

## Experiencia de los diálogos

Los dos mensajes usarán el lenguaje visual de los desbloqueos existentes, con tipografía, mascotas, medalla y movimiento reducido ya disponibles. Serán legibles en móvil y no se mezclarán con las ventanas de recompensa del reto que acaba de completarse.

La prioridad de presentación será:

1. Recuento y recompensa de la jornada.
2. Final de Poker Park pendiente.
3. Final definitivo de Pentonúi pendiente.
4. Formulario voluntario de la hazaña.

El final definitivo tendrá dos acciones claras: `Compartir mi hazaña` y `Ahora no`. Si se elige `Ahora no`, la medalla seguirá visible en la portada y permitirá abrir de nuevo el formulario. Cerrar el diálogo no enviará nada.

## Formulario de la hazaña

El formulario solicitará:

- Nombre del jugador, obligatorio, máximo 80 caracteres.
- Correo del jugador, obligatorio y validado, máximo 254 caracteres.
- Satisfacción de 1 a 5 estrellas, obligatoria.
- Mensaje para Pentonúi Games, opcional, máximo 600 caracteres.

Antes de enviar mostrará un resumen de las estadísticas adjuntas y una casilla obligatoria que confirme el envío de estos datos a Pentonúi Games. El texto dejará claro que se enviarán el nombre, correo, valoración, mensaje y estadísticas mostradas.

No se enviarán manos, cartas, partidas guardadas, saludos detallados por mascota, identificadores del dispositivo, dirección receptora ni datos de terceros. El formulario tendrá un campo trampa invisible y un tiempo mínimo de cumplimentación para reducir envíos automáticos.

Tras el éxito, se mostrará un recibo amistoso y se guardará `achievementSubmittedAt`. Si el envío falla, los datos permanecerán en el formulario para reintentar y no se marcará como enviado.

## Envío de correo

El navegador enviará un `POST /api/achievement` con JSON. La ruta vivirá en el servidor Railway y Netlify redirigirá únicamente esa ruta al mismo servidor, igual que ya hace con la señalización online.

El servidor:

1. Validará y limitará todos los campos con Zod.
2. Rechazará el campo trampa, envíos demasiado rápidos y repeticiones abusivas.
3. Escapará el contenido antes de construir la versión HTML y generará también texto plano.
4. Enviará el correo mediante Resend.
5. Responderá únicamente con éxito o un error genérico; nunca devolverá la dirección receptora ni secretos de configuración.

La configuración privada será:

- `RESEND_API_KEY`
- `PENTONUI_ACHIEVEMENT_TO`
- `PENTONUI_ACHIEVEMENT_FROM`

`PENTONUI_ACHIEVEMENT_TO` contendrá la dirección privada del estudio. No se escribirá en el repositorio, en el paquete de Netlify, en mensajes del navegador ni en registros de diagnóstico. El correo del jugador se usará como `reply-to`, mientras que el remitente será una identidad verificada del servicio de envío.

El servidor no guardará una base de datos de formularios. El proveedor de correo procesará la entrega y el destinatario conservará el mensaje recibido. La política de privacidad explicará este tratamiento y que el envío es voluntario.

## Protección y errores

La ruta aplicará un límite de frecuencia por origen de red usando una huella temporal no persistente. Esa información no se incluirá en el correo ni se guardará como estadística. El límite local de un envío exitoso por dispositivo mejora la experiencia, pero no se considerará una medida de seguridad suficiente por sí sola.

Si Resend no está configurado, la ruta devolverá un estado de servicio no disponible y el formulario explicará que no se ha enviado nada. No se ofrecerá `mailto:` como alternativa porque revelaría la dirección privada.

## Cambios de código previstos

- `src/lib/game/persist.ts`: criterio de seis retos y marcas narrativas compatibles.
- `src/lib/game/mascot-progress.ts`: nuevo criterio de la medalla Pentonúi basado en retos completados y tres oros.
- `src/lib/game/play-stats.ts`: registro local y temporizador de actividad.
- `src/components/game/EndScreen.tsx` y `TitleScreen.tsx`: detección y orden de los finales.
- Nuevos componentes para los dos diálogos y el formulario.
- Nueva ruta `src/routes/api/achievement.ts` y servicio de correo aislado del cliente.
- `netlify.toml`: redirección de `/api/achievement` a Railway.
- `PRIVACY.md`, `docs/CODEX.md` y `docs/REGLAS.md`: progreso, estadísticas y tratamiento de datos.

## Pruebas y aceptación

Las pruebas unitarias comprobarán:

- El final de Poker Park exige los seis retos y no exige mascotas ni medallas clásicas.
- El final definitivo exige los seis retos y los tres oros.
- Los hitos se reclaman una sola vez y migran el progreso anterior.
- El tiempo solo cuenta una partida visible y activa.
- Una jornada no duplica estadísticas al reabrirse.
- La validación del formulario rechaza campos ausentes, excesivos o manipulados.
- La dirección receptora nunca aparece en código o respuesta pública.
- Los fallos de correo no marcan la hazaña como enviada.

Las pruebas de navegador cubrirán móvil y escritorio:

- Secuencia de los dos finales cuando se desbloquean juntos.
- Primer final sin oros de mascota.
- Final definitivo desde el último oro y desde progreso antiguo cargado en portada.
- Apertura, validación, cancelación, error, reintento y éxito del formulario.
- Respeto a movimiento reducido, foco del diálogo y ausencia de desbordamiento.

Antes de publicar se ejecutarán pruebas del juego, comprobación de tipos, compilación y smoke de la versión construida. La publicación requerirá configurar las tres variables privadas, desplegar primero Railway, verificar un envío controlado y después publicar Netlify con el mismo SHA. No se considerará terminada hasta que ambos proveedores alcancen estado satisfactorio y el flujo de producción confirme el correo.
