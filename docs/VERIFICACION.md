# Verificación de Camino a Coricancha v2

Revisión final: 27 de septiembre de 2026. Se trabajó y probó la versión local del proyecto, servida en `http://127.0.0.1:4173`. Los cambios no se publicaron en Vercel.

## Resultado

Las reglas superaron 20 pruebas automatizadas. Además, se recorrieron partidas desde la interfaz del navegador, incluida una victoria en el mes 42 y una derrota por hambre y deterioro social en el mes 7. No se modificó el estado mediante la consola para obtener esos finales.

La revisión final de integración no encontró bloqueos entre la interfaz y el motor. Se corrigió un mensaje que pedía asignar constructores cuando ya había trabajadores y lo que faltaba era alimento para sostener la obra.

## Pruebas de reglas

Ejecutar con `npm test`. Resultado de la última ejecución: **20 aprobadas, 0 fallidas**.

Se comprobaron conservación de trabajadores; costes y previsiones mensuales; límites de almacenamiento; cooldowns; prerrequisitos de conocimientos; construcción y finalización con avances decimales; función administrativa del quipu; retiro y devolución de trabajadores de la mita; pérdida de población durante la mita; decisiones encadenadas; alternativas gratuitas ante falta de recursos; condiciones de derrota y victoria; bloqueo de acciones después de un final; restauración de partidas; persistencia de eventos; dos estrategias completas y secuencias variadas de acciones válidas.

Se comprobó también la sintaxis de los scripts y `git diff --check`, sin errores. No se agregó una instalación de paquetes ni una compilación obligatoria.

## Recorridos en navegador

| Flujo | Resultado observado |
| --- | --- |
| Portada y primera partida | Acción principal clara, tiempo inicialmente detenido y guía contextual integrada. |
| Registro de Curaca | Nombre y colegio personalizado conservados localmente. |
| Trabajo cotidiano | Cambios de agricultores, culto y construcción actualizan previsiones y respetan la población disponible. |
| Tiempo | Avance manual y automático; pausa al abrir paneles. La partida restaurada vuelve en pausa. |
| Recursos y rituales | Costes visibles, feedback de cambios, enfriamiento mensual y explicación de producción/consumo. |
| Mita | Evento del mes 5; trabajadores retirados temporalmente y devueltos para reasignación. |
| Eventos encadenados | Preparación del mes 7, sequía posterior y consecuencias de la ayuda entre comunidades. |
| Guardado durante evento | Recargar conserva la decisión pendiente y no permite saltarla. |
| Conocimientos y caminos | Se recorrieron las seis tecnologías y sus requisitos; la campaña utilizó conexiones territoriales. |
| Coricancha | Avance sostenido y cambios de ilustración por etapas; dedicación habilitada al cumplir todas las condiciones. |
| Victoria | Mes 42; 15 habitantes, Ayni 100, equilibrio mínimo 66 y puntaje 8386. Resultado conservado localmente. |
| Derrota | Mes 7; causa narrativa y posibilidad de comenzar otra historia. Resultado conservado localmente. |
| Repetir la guía | Desde una partida terminada solicita comenzar otra historia y reinicia la guía correctamente. |
| Glosario | Búsqueda de conceptos, explicaciones contextuales y fuentes accesibles. |
| Clasificación | Lectura real de Google Sheets; filtros de versión y colegio, búsqueda y resultados locales diferenciados. |

No se enviaron puntajes de prueba a Google Sheets. La lectura remota se verificó; el envío y su confirmación se revisaron en el código, sin una escritura real de extremo a extremo. La API existente no conserva un identificador único de partida: el reintento muestra el riesgo de duplicación y un envío opaco no se anuncia como confirmado.

## Verificación visual

Se inspeccionaron los anchos **360, 390 y 430 px**, además de escritorio a **1366 × 900 px**. Se revisaron portada, paisaje, HUD, navegación, controles de tiempo, diálogos, árbol de conocimientos, eventos y finales.

- Sin desbordamiento horizontal de página en los tamaños comprobados. La tabla del ranking tiene su propio desplazamiento horizontal en móvil.
- Los paneles pueden desplazarse verticalmente y mantienen sus acciones alcanzables.
- El poblado central conserva viviendas, cultivos y habitantes visibles en el recorte móvil.
- Se reforzó el contraste del encabezado y la descripción de Uku Pacha.
- Los eventos detienen el tiempo y presentan decisiones diferenciadas. Los diálogos comunes se pueden cerrar mediante sus controles y teclado.
- No se registraron errores de JavaScript en los recorridos inspeccionados ni en la comprobación final.

### Capturas

- [Escritorio: templo en construcción](screenshots/escritorio.png)
- [Móvil de 360 px: Hanan Pacha](screenshots/movil-hanan-360.png)
- [Móvil de 390 px: Kay Pacha](screenshots/movil-kay.png)
- [Móvil de 390 px: Uku Pacha](screenshots/movil-uku.png)
- [Móvil de 430 px: árbol de conocimientos](screenshots/movil-saberes-430.png)
- [Victoria obtenida desde la interfaz](screenshots/victoria.png)

## Rendimiento, accesibilidad y límites de la comprobación

La escena usa SVG locales y animaciones breves de opacidad y transformaciones. No se cargan los vídeos o audios originales al iniciar una partida ni se requieren fuentes remotas. Los controles respetan el zoom; hay nombres accesibles, indicadores textuales además de color, estados de foco, diálogos nativos y reglas para reducir movimiento.

La verificación móvil se hizo ajustando el tamaño del navegador. No equivale a una prueba en un Android físico de gama media. No se midieron FPS, Core Web Vitals ni consumo de batería; tampoco se comprobaron sonido o vibración en hardware móvil, un lector de pantalla completo ni todos los navegadores. El audio comienza desactivado y la vibración depende del soporte del dispositivo.

## Entrega

El código, la auditoría, las reglas, las ilustraciones y las capturas quedan en este proyecto. La vista previa se inicia con `npm start`. Se conserva el contrato del backend y los archivos originales de medios. No se realizó despliegue, publicación ni envío de resultados ficticios al ranking compartido.
