# Camino a Coricancha — El equilibrio de los tres mundos

Juego web de estrategia breve inspirado en las relaciones entre trabajo, reciprocidad, territorio y prácticas rituales andinas. La versión 2 conserva el registro de Curaca y la clasificación original, y transforma el tablero en un paisaje continuo.

## Ejecutar y probar

Requiere Node.js para estas herramientas de desarrollo; el juego publicado solo necesita un navegador moderno.

```text
npm start
npm test
```

La vista previa está en http://127.0.0.1:4173. No hay instalación de dependencias ni paso de compilación. Para publicar se sirven los archivos estáticos de la raíz, como en la versión anterior. El servidor local es exclusivamente una herramienta de vista previa.

## Qué cambió

- Paisaje SVG continuo de Hanan, Kay y Uku; templo con cinco etapas ilustradas.
- Trabajo cotidiano separado de la mita temporal; la población que vuelve de la mita queda disponible para reasignar.
- Ayni y tres vínculos con efectos sobre producción, crisis y victoria.
- Construcción mensual, almacenamiento, pérdidas, seis conocimientos y tres conexiones territoriales.
- Historia encadenada: preparación ante pocas lluvias, sequía y ayuda entre comunidades que puede regresar.
- Tiempo inicialmente detenido, avance manual o automático, pausa al abrir paneles y al ocultar la pestaña.
- Guía contextual, previsiones, resumen mensual, crónica, sonidos breves opcionales y vibración limitada.
- Guardado local recuperable, incluso durante un evento. Las partidas siempre se reanudan en pausa.
- Glosario con fuentes y separación entre historia, interpretación y simplificación jugable.
- Clasificación v2 y clásica separadas, sin datos de demostración confundidos con partidas reales.

## Organización

| Archivo | Responsabilidad |
| --- | --- |
| `index.html`, `styles.css` | Escena, controles y presentación móvil/escritorio |
| `engine.js` | Reglas independientes del navegador, previsiones, eventos y restauración de estado |
| `app.js` | Interacción, diálogos, tutorial, guardado y comunicación del puntaje |
| `world-art.js` | Ilustraciones SVG originales sin descargas externas |
| `content.js` | Glosario, advertencia didáctica y fuentes |
| `tablero.html` | Clasificación, filtros y configuración de conexión |
| `google_apps_script.gs` | Backend existente de Google Sheets, conservado |
| `engine.test.js` | Pruebas de reglas, invariantes y campañas completas |

## Datos y compatibilidad

Se conservan las claves `inca_jugador_nombre`, `inca_jugador_colegio`, `inca_google_script_url` e `inca_local_scores`. El guardado de la partida nueva utiliza `inca_save_v2`; las preferencias nuevas usan el prefijo `inca_`. La versión original no guardaba partidas en curso, por lo que no hay un estado antiguo que migrar. El código valida la versión y estructura antes de recuperar una partida.

El contrato de Google Sheets sigue siendo `{fecha, jugador, colegio, puntaje, resultado, meses, poblacion, alimento, fe}`. El texto de `resultado` incluye `v2` para separar reglas en el ranking sin exigir una migración de la hoja. Los campos adicionales locales no cambian las columnas existentes.

Los resultados se guardan localmente al terminar. El jugador decide compartirlos con la clasificación. Un POST opaco no se presenta como confirmación: se intenta encontrar el registro mediante GET. La API existente no conserva un identificador único de partida; por eso un reintento explícito avisa que podría duplicar el envío. No se recorta el historial anterior del usuario.

## Criterio histórico

No se representa el Ayni como un valor histórico medible ni la fe como intervención física verificable sobre el clima. La mita implica obligación y relaciones de poder; ofrecer una elección libre es una simplificación jugable. El quipu mejora información y almacenamiento, no reduce las necesidades de alimentación. La capacocha permanece como contenido histórico contextualizado, sin convertir el sacrificio de personas en una recompensa.

El templo y el paisaje son interpretaciones estilizadas, no reconstrucciones arqueológicas. Las fuentes están enlazadas dentro del glosario.

## Rendimiento y accesibilidad

HTML, CSS y JavaScript sin frameworks. La partida no depende de fuentes, imágenes o vídeo remotos; los medios originales permanecen en el repositorio, pero no se precargan. Las animaciones respetan `prefers-reduced-motion`, el zoom está permitido, los diálogos son nativos y la información combina texto, cifras y color.

La verificación y sus límites se documentan en [docs/VERIFICACION.md](docs/VERIFICACION.md).
