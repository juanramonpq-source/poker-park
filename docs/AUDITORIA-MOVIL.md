# Auditoría previa a Android e iOS

Fecha: 10 de septiembre de 2026. Base: `fdb4449fd32648de3f44ba1e4496e1050bde4b10`.

## Resultado y alcance

Base web revisada con limpieza incremental y pruebas de regresión. No se han
cambiado las reglas de colocación, balance, recompensas ni condiciones de fin.
La adaptación nativa todavía no está implementada ni certificada en dispositivos.
Esta auditoría no equivale a una prueba de penetración ni a una aprobación de tiendas.

## Copia restaurable

Antes de editar se creó, enumeró y verificó una copia del proyecto, incluido Git:
`../PokerPark-backups/PokerPark-pre-auditoria-20260910-124707.tgz`.

SHA-256: `82c2978da557e5ec5b8b9b646726913addd31a67722a62e9a229ee321aa0979e`.
Se excluyeron dependencias instaladas, resultados de compilación y capturas.
El archivo ajeno `FactorDUALlogo.png` permanece intacto y fuera del cambio.

## Correcciones

| Hallazgo | Corrección |
| --- | --- |
| Ocho pruebas de marca heredaban la identidad y las imágenes del juego | Fixtures aislados; se conservan las expectativas de los ejemplos y el código de marca |
| Una prueba exigía exclusivamente la ruta Linux original | Se comprueba también la raíz real del proyecto, manteniendo las restricciones de salida |
| Dependencia `js-yaml` 4.3.1 vulnerable | Actualizada únicamente a 4.3.2; auditoría de dependencias sin vulnerabilidades conocidas en esta ejecución |
| Manifiestos e iconos de instalación duplicados | Una declaración propia; el inyector conserva los recursos existentes y mantiene su script y metadatos |
| Preferencias con valores desconocidos | Valores de reserva seguros por campo |
| Partidas guardadas incompletas | Validación estructural antes de cargarlas; las rechazadas no se borran automáticamente |
| Mensajes online aceptados sin validar su estructura | Validación compartida del estado; la animación remota se deriva de las cartas recibidas |
| Recarga durante la celebración perdía el temporizador del turno | Reanudación mediante el motor; en Noche se conserva la elección de suministro |
| Temporizador de celebración podía sobrevivir a salir o iniciar otra partida | Cancelación al cambiar de sesión |
| Privacidad y descripción anteriores al online/solitario | Textos actualizados en portada técnica, manifiesto, ayuda y documentos |
| Error de lint y símbolos sin utilizar | Limpieza sin cambiar las operaciones del juego |

La validación online comprueba la forma de los datos, no convierte WebRTC en un
servidor autoritativo ni impide que un participante modifique un estado válido.

## Verificación

- `npm test`: 196 pruebas del andamiaje y 24 de servicios/auth, todas pasan.
- `npm run test:game`: 38 pruebas, incluidas las reglas anteriores y recuperación.
- `npm run typecheck`: pasa.
- `npm run lint`: sin errores; quedan tres avisos de recarga en desarrollo por
  compartir exportaciones de componentes, iconos y hooks. No se han silenciado.
- `npm audit`: sin vulnerabilidades conocidas en la ejecución actual.
- `npm run build:railway`: compilación del servidor y cliente.
- Navegador en desarrollo y compilación: 1280×800 y 390×844, sin errores de
  consola, desbordamiento horizontal ni divergencias de contenido.
- Solitario en retos desbloqueables, entradas online en los seis retos, partida
  de dos sesiones con dos turnos y animación remota, arrastre y reglas por progreso.
- Plegado: comprobación del contorno a opacidad cero y captura del fotograma
  detenido, evitando confundirlo con la pantalla siguiente.
- Recuperación: recarga durante transición, Noche con suministro pendiente,
  datos dañados, manifiesto único y privacidad a 320×568 y 390×844.

Las pruebas de navegador usan Chromium en macOS. No sustituyen WebView Android
ni WKWebView de iOS. No se han probado redes móviles independientes ni el
almacenamiento PostgreSQL; la señalización local utiliza memoria.

## Trabajo necesario para la conversión

1. **Cliente instalable y funcionamiento local.** Todavía no hay proyectos
   Android/iOS ni configuración de Capacitor. No existe service worker para
   garantizar arranque web offline; las fuentes se descargan desde Google.
   Empaquetar recursos del juego, definir su actualización y comprobar el
   arranque en modo avión. El servidor Railway debe conservarse para online.
2. **Acceso al servidor desde el paquete.** La señalización utiliza rutas
   relativas `/api/rtc`. Al servir recursos dentro de una app estas rutas ya
   no apuntarán necesariamente a Railway. Definir origen permitido, endpoint
   HTTPS y política de peticiones antes de generar los paquetes.
3. **Redes restrictivas.** Hay STUN de Google/Cloudflare, pero no TURN. Contratar
   o configurar retransmisión y credenciales temporales, y probar wifi↔datos,
   NAT restrictivo y recuperación tras suspensión. No incrustar credenciales
   duraderas en el cliente.
4. **Salas y abuso.** El código de sala permite el encuentro; no es una cuenta
   autenticada. El servidor recibe identificadores declarados por el cliente.
   Antes de una distribución amplia conviene añadir autorización por sesión,
   límites de solicitudes/cuerpo/memoria y pruebas específicas de intrusión de
   un tercero. La validación añadida no resuelve estos controles de servidor.
5. **Continuidad online.** La portada no ofrece reanudar partidas online tras
   recarga. Definir recuperación de rol/sala y salida explícita cuando la sesión
   ya no existe. No prometer recuperación nativa de una sesión interrumpida sin
   probarla. En memoria, mantener una instancia del servidor; usar almacenamiento
   compartido antes de escalar réplicas.
6. **Almacenamiento.** La web y la futura app tendrán orígenes y almacenamiento
   distintos. Diseñar exportación/importación o migración si se quiere llevar el
   progreso actual. No cambiar ni vaciar las claves v7/v1 existentes sin migración.
7. **Dispositivos y tiendas.** Probar atrás de Android, teclado, zonas seguras,
   rotación, audio tras suspensión, compartir/invitaciones y enlaces externos;
   después generar firmas, identificadores, iconos, capturas y datos de tienda.
   Completar un contacto de soporte real y las declaraciones de privacidad con
   los proveedores efectivamente incluidos. No se garantiza la aprobación.

## Componentes conservados

Se mantiene el servidor y el andamiaje de auth/PGLite/Grok que siguen conectados
al arranque y la compilación. Quitarlos en bloque durante esta limpieza sería una
migración de arquitectura. El documento `CODEX.md` ahora diferencia su antigua
propuesta de portado estático del despliegue online actual. El siguiente trabajo
puede extraer un cliente móvil sin sustituir el juego ni perder la señalización.

## Referencias oficiales para el siguiente paso

- [Configuración de Capacitor](https://capacitorjs.com/docs/config): `webDir`
  contiene los recursos compilados y su `index.html`; separar cliente y servidor.
- [Revisión de Apple](https://developer.apple.com/app-store/review/guidelines/):
  revisar integridad funcional, experiencia de app y privacidad antes del envío.
