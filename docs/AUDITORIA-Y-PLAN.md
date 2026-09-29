# Auditoría y decisiones de rediseño

## Estado inicial revisado

Se inspeccionaron la versión publicada y sus fuentes: intro de vídeo, portada, registro de Curaca, tutorial de seis pantallas, mundos, asignación, mejoras, eventos, crónica, victoria/derrota, glosario y clasificación. Se revisó el contrato del Apps Script existente.

- `index.html` reunía estilo, contenido y reglas en más de 4.400 líneas. La estructura dificultaba probar consecuencias sin abrir la interfaz.
- El inicio exigía una intro, registro y varias explicaciones. El estado comenzaba sin trabajadores asignados y el tiempo podía consumir reservas antes de comprenderlo.
- Los tres mundos eran paneles separados; el templo aparecía como compra final de 2.000 alimentos y 800 fe.
- La «mita» era una asignación permanente. El quipu y los ancestros reducían el consumo de forma poco coherente con el concepto histórico.
- Los eventos eran independientes; algunas opciones cerraban el diálogo incluso cuando no se podían pagar.
- El guardado conservaba identidad y resultados, pero no la partida en curso.
- Al guardar el registro se borraba la intención de iniciar antes de comprobarla. El jugador no entraba como esperaba.
- Un POST `no-cors` anunciaba un guardado confirmado que el navegador no podía comprobar. Los fallos de ranking se mezclaban con puntajes inventados.
- Había afirmaciones categóricas sobre mita, yachaywasi y capacocha; algunas mecánicas atribuían directamente fenómenos físicos a intervenciones divinas.
- El zoom estaba deshabilitado y se dependía de fuentes/medios externos para buena parte de la presentación.

## Orden aplicado

1. Conservar contratos de datos, separar reglas de interfaz y fijar invariantes comprobables.
2. Crear paisaje, Coricancha por etapas, portada, HUD y navegación táctil.
3. Integrar trabajo, Ayni, equilibrio, construcción y eventos con consecuencias diferidas.
4. Incorporar saberes, qollqas, conexiones, previsión y guía contextual.
5. Revisar glosario y explicitar qué es historia y qué es una regla del juego.
6. Recorrer partidas en navegador, revisar tamaños móviles/escritorio y corregir los problemas detectados.

## Simplificaciones intencionales

Una sola cifra reúne alimentos distintos; una población pequeña resume una comunidad; el calendario comprime climas y cosechas. El templo requiere obra y cohesión, pero no pretende reproducir quién construyó históricamente el Coricancha. Las ilustraciones son SVG estilizados y no una reconstrucción arquitectónica. Las crisis están programadas para permitir aprender relaciones y comparar decisiones; no dependen de azar opaco.

La navegación mantiene las funciones secundarias en paneles para dejar protagonismo al mundo. Se conservan los medios originales sin forzar su carga; el audio nuevo utiliza tonos breves y opcionales.
