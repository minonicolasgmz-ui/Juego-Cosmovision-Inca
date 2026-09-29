/* Educational copy is separate from game rules so claims and sources remain reviewable. */
(function () {
  'use strict';

  const refs = {
    ayni: { title: 'Smithsonian · Reciprocidad en los Andes', url: 'https://americanindian.si.edu/nk360/inka-water/reciprocity/reciprocity' },
    ayllu: { title: 'Ministerio de Cultura del Perú · Pueblos Quechuas', url: 'https://bdpi.cultura.gob.pe/pueblos/quechuas' },
    labor: { title: 'Correa-Lau y equipo (2023) · Estado y comunidades incas', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0280511' },
    living: { title: 'Smithsonian · Registros, depósitos y vida inca', url: 'https://americanindian.si.edu/nk360/inka-water/ways-of-living/living' },
    quipu: { title: 'Harvard Library · Los quipus y el registro de información', url: 'https://library.harvard.edu/about/news/2023-04-12/long-w-2-there-was-quipu-accounting-systems-incan-and-andean-peoples' },
    school: { title: 'Museo de Arte Precolombino del Cusco · El yachaywasi', url: 'https://mapcusco.pe/museo/' },
    roads: { title: 'UNESCO · Qhapaq Ñan, sistema vial andino', url: 'https://whc.unesco.org/en/list/1459/' },
    pacha: { title: 'UNAM · El agua en la cosmología andina', url: 'https://rilzea.cialc.unam.mx/jspui/handle/CIALC-UNAM/VID131' },
    ancestors: { title: 'Museo Larco · Muerte en el antiguo Perú', url: 'https://www.museolarco.org/exposicion/exposicion-permanente/exposicion-en-linea/muerte-en-el-antiguo-peru/' },
    capacocha: { title: 'Wilson y equipo (2013) · Investigación de la capacocha, PNAS', url: 'https://www.pnas.org/doi/full/10.1073/pnas.1305117110' },
    temple: { title: 'Ministerio de Cultura del Perú · Rutas ancestrales del Qhapaq Ñan', url: 'https://repositorio.cultura.gob.pe/bitstream/handle/CULTURA/1410/Proyecto%20Qhapaq%20%C3%91an%20-%20Rutas%20ancestrales%20del%20Qhapaq%20%C3%91an.pdf?isAllowed=y&sequence=1' },
    ritual: { title: 'The Metropolitan Museum of Art · Paccha, recipiente ritual inca', url: 'https://www.metmuseum.org/art/collection/search/314954' }
  };

  function entry(term, kind, text, reference) {
    const item = { term, kind, text };
    if (reference) {
      item.source = refs[reference].title;
      item.url = refs[reference].url;
    }
    return item;
  }

  const note = 'El juego simplifica instituciones, prácticas y creencias históricas para convertirlas en decisiones jugables. Las etiquetas distinguen historia documentada, interpretación y reglas creadas para esta experiencia. Las sociedades andinas fueron diversas y sus tradiciones continúan vivas.';

  const glossary = [
    entry('Ayni', 'Historia', 'Práctica de reciprocidad: dar y recibir trabajo, bienes o ayuda dentro de relaciones que continúan en el tiempo. Es anterior al Estado inca y sigue presente en comunidades andinas. No equivale a una reserva de dinero ni a una medida universal de bondad.', 'ayni'),
    entry('Ayni en el juego', 'Regla del juego', 'El indicador de 0 a 100 reúne reciprocidad, confianza y cohesión comunitaria. Redistribuir y ayudar lo fortalece; el hambre y la sobrecarga lo debilitan. Su efecto sobre la cooperación es una simplificación diseñada para que tus decisiones tengan consecuencias.'),
    entry('Ayllu', 'Historia', 'Forma de organización social andina vinculada al parentesco, el territorio y las obligaciones entre sus integrantes. Sus formas variaron según el lugar y el período. No todos los ayllus fueron aldeas idénticas ni grupos aislados.', 'ayllu'),
    entry('Curaca', 'Regla del juego', 'En esta experiencia ocupás el papel de una autoridad local: organizás trabajo, reservas y compromisos. Poder decidir sobre todos estos ámbitos desde una sola pantalla es una simplificación; el mundo andino reunió autoridades, especialistas y comunidades con intereses diferentes.'),
    entry('Mita', 'Historia', 'Prestación laboral por turnos que el Estado inca exigía a las comunidades para diversas tareas. Combinó obligaciones, relaciones de reciprocidad y desigualdades de poder. No era simplemente elegir un oficio. La mita colonial posterior reorganizó estas obligaciones bajo otras condiciones.', 'labor'),
    entry('Turno de mita', 'Regla del juego', 'Una solicitud temporal aparta trabajadores de las tareas habituales durante varios meses y deja una obra o beneficio posterior. Poder aceptar o rechazar cada solicitud, sus plazos y sus recompensas son decisiones de diseño; no describen libertades idénticas para todas las comunidades históricas.'),
    entry('Trabajo cotidiano', 'Regla del juego', 'Agricultura, culto y construcción son categorías de asignación para esta partida. Las personas históricas desempeñaban tareas variadas según el calendario, la comunidad y su posición social. Los controles de trabajo no representan una división fija de toda la sociedad.'),
    entry('Hanan Pacha', 'Interpretación', 'Ámbito de arriba, asociado en esta representación con el cielo y lo celeste. La lectura de tres ámbitos relacionados permite explorar la cosmología andina, pero no debe tomarse como un esquema único y sin cambios de todos los pueblos y períodos.', 'pacha'),
    entry('Kay Pacha', 'Interpretación', 'El ámbito de aquí: el mundo habitado y las relaciones cotidianas entre personas, animales, plantas y entorno. En el paisaje del juego conecta cielo e interior de la tierra. Los ámbitos se relacionan; no son tres sociedades independientes.', 'pacha'),
    entry('Uku Pacha', 'Interpretación', 'Ámbito de adentro o de abajo, vinculado en esta representación con la tierra y los ancestros. No equivale automáticamente al infierno cristiano. La caverna y las raíces de la escena son recursos visuales para representar relaciones con el interior de la tierra.', 'pacha'),
    entry('Equilibrio de los mundos', 'Regla del juego', 'Los tres indicadores convierten el cuidado ritual, material y comunitario en un sistema visible. Sus valores y los requisitos del Coricancha son reglas inventadas. Una ceremonia no controla físicamente el clima: las decisiones del juego representan prácticas sociales, preparación y cooperación.'),
    entry('Inti', 'Historia', 'Divinidad solar central en el culto estatal inca. Las ceremonias dedicadas al Sol articularon prácticas religiosas y autoridad política. Inti Raymi es una celebración vinculada al solsticio de junio, con expresiones actuales que tienen su propia historia.', 'ayni'),
    entry('Ofrendas', 'Historia', 'Las prácticas rituales relacionaban agricultura, agua, alimentos y seres sagrados. Objetos como las pacchas incas muestran la conexión entre cultivo del maíz y ofrendas. Las ceremonias tuvieron sentidos y formas diferentes según el contexto.', 'ritual'),
    entry('Fe', 'Regla del juego', 'Es un recurso simbólico que representa dedicación ritual y capacidad de organizar ceremonias. No mide cuánto creía cada persona, ni afirma la intervención verificable de una divinidad. Los costos y beneficios sirven para plantear decisiones entre necesidades distintas.'),
    entry('Ancestros', 'Historia', 'En distintas sociedades del antiguo Perú, la relación con las personas fallecidas continuaba mediante ritos, memoria y cuidado de sus restos. Estas prácticas variaron. El juego representa ese vínculo con una acción comunitaria de recuerdo.', 'ancestors'),
    entry('Yachaywasi', 'Historia', 'Institución de formación vinculada principalmente con jóvenes de la élite. Evitamos equipararla con una universidad contemporánea o presentarla como una escuela universal. El nombre del panel del juego reúne saberes que también se transmitían en hogares y comunidades.', 'school'),
    entry('Árbol de conocimientos', 'Regla del juego', 'Los nodos y sus requisitos organizan descubrimientos durante la partida. No significan que los incas inventaran estas técnicas en ese orden: muchas tuvieron antecedentes andinos y se desarrollaron en lugares y momentos diversos.'),
    entry('Quipu', 'Historia', 'Conjunto de cuerdas y nudos utilizado para registrar y administrar información, entre ella cantidades, bienes y obligaciones. No era solamente una calculadora. El alcance de su información no numérica y la lectura de muchos ejemplares continúan siendo temas de investigación.', 'quipu'),
    entry('Quipucamayoc', 'Historia', 'Especialista encargado de elaborar, conservar o interpretar quipus. Los registros ayudaban a administrar personas y bienes. En el juego, su consejo permite comprender las reservas y la producción; no reduce las necesidades de alimento de la población.', 'living'),
    entry('Qollqa', 'Historia', 'Depósito destinado a conservar alimentos y otros bienes. Las redes de almacenamiento apoyaron la administración, el abastecimiento y la redistribución. Su capacidad exacta y la protección que ofrece contra pérdidas en la partida son reglas de juego.', 'living'),
    entry('Qhapaq Ñan', 'Historia', 'Red andina de caminos ampliada e integrada por el Estado inca sobre rutas anteriores. Conectaba centros de producción, poblaciones, depósitos y lugares de culto; también permitía comunicaciones y movilización militar. Su mapa de nodos en el juego comprime esa diversidad territorial.', 'roads'),
    entry('Chasquis', 'Historia', 'Mensajeros que recorrían la red vial andina. El Qhapaq Ñan facilitaba la circulación de información además de personas y bienes. Los contactos entre comunidades que aparecen en la partida representan de forma simplificada estas conexiones.', 'roads'),
    entry('Coricancha', 'Historia', 'Importante recinto sagrado del Cusco y centro del culto solar estatal. Su arquitectura expresó la autoridad y el papel religioso de la capital. Construirlo por etapas desde un pequeño ayllu es la meta ficticia de este juego, no una reconstrucción de su obra histórica.', 'temple'),
    entry('Capacocha', 'Historia', 'Complejo ritual imperial que incluyó ofrendas de objetos y sacrificios de niños y niñas. Las evidencias arqueológicas y fuentes coloniales permiten estudiar sus dimensiones religiosas, políticas y territoriales. No podemos atribuir una misma emoción, consentimiento o valoración a todas las personas y familias involucradas.', 'capacocha'),
    entry('Estaciones y alimento', 'Regla del juego', 'Un calendario breve concentra lluvias, frío y sequía para que puedas planificar. El alimento reúne productos distintos bajo un solo número. Los climas, cultivos y ritmos de cosecha reales variaban mucho entre valles, puna y otras regiones andinas.')
  ];

  window.IncaContent = Object.freeze({
    note,
    historicalNote: note,
    glossary: Object.freeze(glossary),
    sources: Object.freeze(Object.values(refs))
  });
}());
