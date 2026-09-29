/* Camino a Coricancha: deterministic rules, shared by browser and Node tests. */
(function (root, factory) {
  'use strict';
  const engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) root.IncaEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const roles = ['farmers', 'priests', 'builders'];
  const worldIds = ['hanan', 'kay', 'uku'];
  const eventIds = ['mita', 'rain', 'drought', 'neighbor', 'repay', 'frost', 'migration', 'festival'];
  const technologies = Object.freeze([
    { id: 'quipu', title: 'Quipu', description: 'Registra reservas, revela previsiones y reduce pérdidas de almacenamiento. El consumo de las personas no cambia.', food: 45, faith: 10, requires: [], month: 2 },
    { id: 'canals', title: 'Canales', description: 'Distribuyen el agua: +12% a las cosechas y una respuesta posible ante la sequía.', food: 65, faith: 10, requires: [], month: 4 },
    { id: 'qollqa', title: 'Qollqa', description: 'Amplía la capacidad de 180 a 400 alimentos y protege las reservas.', food: 70, faith: 10, requires: ['quipu'], month: 5 },
    { id: 'terraces', title: 'Andenes mejorados', description: 'Mejora las terrazas: +18% a las cosechas y menor vulnerabilidad a las heladas estacionales.', food: 85, faith: 15, requires: ['canals'], month: 8 },
    { id: 'masonry', title: 'Cantería', description: 'Permite superar el 50% del templo y aumenta el avance de cada constructor.', food: 85, faith: 25, requires: ['quipu'], month: 10 },
    { id: 'chasquis', title: 'Red de chasquis', description: 'Organiza las comunicaciones por los caminos y habilita conexiones entre comunidades.', food: 70, faith: 15, requires: ['quipu'], month: 10 }
  ].map(t => Object.freeze({ ...t, requires: Object.freeze(t.requires) })));
  const routes = Object.freeze({
    puna: { title: 'Puna', food: 65, faith: 0, month: 8, description: '+7 alimentos mensuales por intercambio de productos de altura.' },
    neighbor: { title: 'Ayllu vecino', food: 55, faith: 0, month: 10, description: '+0,8 Ayni al mes y una red de apoyo.' },
    sanctuary: { title: 'Santuario', food: 55, faith: 20, month: 12, description: '+2 fe y +0,5 Hanan al mes.' }
  });

  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const round = value => Math.round(value * 10) / 10;
  const has = (state, id) => state.tech.includes(id);
  const fail = message => ({ ok: false, message });
  const free = state => state.population - (state.mita ? state.mita.workers : 0) - roles.reduce((sum, role) => sum + state.workers[role], 0);
  function log(state, text) {
    state.history.unshift({ month: state.month, text });
    state.history = state.history.slice(0, 80);
  }
  function success(state, message) { log(state, message); return { ok: true, message }; }
  function normalize(state) {
    state.food = round(Math.max(0, state.food));
    state.faith = round(clamp(state.faith, 0, 9999));
    state.ayni = round(clamp(state.ayni, 0, 100));
    state.temple = round(clamp(state.temple, 0, 100));
    worldIds.forEach(id => { state.worlds[id] = round(clamp(state.worlds[id], 0, 100)); });
  }
  function reassignOverflow(state) {
    let excess = Math.max(0, -free(state));
    ['builders', 'priests', 'farmers'].forEach(role => {
      const release = Math.min(excess, state.workers[role]);
      state.workers[role] -= release;
      excess -= release;
    });
  }
  function guard(state) {
    if (!state || state.status !== 'playing') return fail('La partida ha terminado. Podés comenzar otra desde el menú.');
    if (state.pendingEvent) return fail('Primero resolvé el acontecimiento pendiente.');
    return null;
  }
  function createState() {
    return {
      version: 2, id: 'inca-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9),
      month: 1, population: 15, food: 100, faith: 35, ayni: 65,
      worlds: { hanan: 65, kay: 65, uku: 65 }, workers: { farmers: 5, priests: 1, builders: 0 },
      temple: 0, tech: [], connections: [], mita: null, pendingEvent: null,
      history: [{ month: 1, text: 'El ayllu comienza su camino. Cuidá las reservas, repartí el trabajo y sostené los vínculos.' }],
      status: 'playing', cause: '', tutorial: 0, cooldowns: {}, crises: 0, flags: {}, lastSummary: null
    };
  }
  function seasonAt(month) {
    const cycle = ((month - 1) % 12) + 1;
    if (cycle >= 6 && cycle <= 8) return { id: 'frost', name: 'Tiempo de heladas', icon: '❄', factor: 0.72 };
    if (cycle >= 9) return { id: 'dry', name: 'Tiempo seco', icon: '☀', factor: 0.9 };
    return { id: 'wet', name: 'Tiempo de lluvias', icon: '☂', factor: 1.12 };
  }
  function forecast(state) {
    const season = seasonAt(state.month);
    const capacity = has(state, 'qollqa') ? 400 : 180;
    const equilibrium = Math.round(Math.min(...worldIds.map(id => state.worlds[id])));
    let seasonal = season.factor;
    if (season.id === 'frost' && has(state, 'terraces')) seasonal = 0.9;
    let multiplier = seasonal;
    const modifiers = [season.name];
    if (has(state, 'canals')) { multiplier *= 1.12; modifiers.push('Canales +12%'); }
    if (has(state, 'terraces')) { multiplier *= 1.18; modifiers.push('Andenes +18%'); }
    if (state.ayni >= 75) { multiplier *= 1.1; modifiers.push('Cooperación +10%'); }
    if (state.ayni < 35) { multiplier *= 0.8; modifiers.push('Conflicto −20%'); }
    if (equilibrium >= 60) { multiplier *= 1.08; modifiers.push('Equilibrio +8%'); }
    if (equilibrium < 25) { multiplier *= 0.9; modifiers.push('Desequilibrio −10%'); }
    if (state.flags.droughtUntil >= state.month) { multiplier *= state.flags.droughtFactor || 0.65; modifiers.push('Sequía'); }
    if (state.flags.frostUntil >= state.month) { multiplier *= state.flags.frostFactor || 0.7; modifiers.push('Helada extraordinaria'); }
    if (state.flags.restMonth === state.month) { multiplier *= 0.8; modifiers.push('Descanso −20%'); }
    if (state.flags.intensifyMonth === state.month) { multiplier *= 1.35; modifiers.push('Jornada extra +35%'); }
    const production = Math.floor(state.workers.farmers * 6 * multiplier) + (state.connections.includes('puna') ? 7 : 0);
    const consumption = state.population * 2;
    const faith = Math.max(-state.faith, state.workers.priests * 3 + (state.connections.includes('sanctuary') ? 2 : 0) - 1);
    const ceiling = has(state, 'masonry') ? 100 : 50;
    const constructionRate = (has(state, 'masonry') ? 1 : 0.75) * (state.flags.restMonth === state.month ? 0.5 : 1);
    const affordable = Math.max(0, state.food + production - consumption - state.population) / 3;
    const construction = state.month >= 3 ? Math.floor((Math.max(0, Math.min(4, state.workers.builders * constructionRate, ceiling - state.temple, affordable)) + 1e-8) * 10) / 10 : 0;
    const constructionCost = Math.ceil(construction * 3);
    const remaining = Math.max(0, state.food + production - consumption - constructionCost);
    const spoilRate = has(state, 'qollqa') ? (has(state, 'quipu') ? 0.007 : 0.012) : (has(state, 'quipu') ? 0.02 : 0.04);
    const spoilage = Math.floor(Math.max(0, remaining - 60) * spoilRate);
    const overflow = Math.max(0, remaining - spoilage - capacity);
    const loss = round(spoilage + overflow);
    const net = round(production - consumption - constructionCost - loss);
    let populationStatus = 'Estable';
    if (state.flags.hunger || state.food + production < consumption) populationStatus = 'Hambruna';
    else if (state.food < consumption * 2 || state.ayni < 40) populationStatus = 'Preocupado';
    else if (state.food >= consumption * 3 && state.ayni >= 70 && equilibrium >= 45) populationStatus = 'Próspero';
    return { production, consumption, faith, net, loss, season, capacity, available: free(state), equilibrium,
      populationStatus, construction, constructionCost, spoilage, overflow, detailed: has(state, 'quipu'),
      modifiers, nextSeason: seasonAt(state.month + 1), projectedFood: round(Math.max(0, state.food + net)) };
  }
  function assign(state, role, delta) {
    const blocked = guard(state); if (blocked) return blocked;
    if (!roles.includes(role) || !Number.isInteger(delta) || delta === 0) return fail('Asignación no válida.');
    if (role === 'builders' && state.month < 3) return fail('La construcción comienza en el mes 3.');
    if (state.workers[role] + delta < 0) return fail('No hay más personas que retirar de esta tarea.');
    if (delta > free(state)) return fail('No quedan personas disponibles. Retirá alguien de otra tarea.');
    state.workers[role] += delta;
    return { ok: true, message: 'Trabajo redistribuido. El cambio se aplicará en el próximo mes.' };
  }
  function victoryRequirements(state) {
    const reasons = [];
    if (state.temple < 100) reasons.push('Completar la obra al 100%');
    if (state.food < 100) reasons.push('Reunir 100 alimentos para la dedicación');
    if (state.faith < 80) reasons.push('Reunir 80 de fe');
    if (state.ayni < 60) reasons.push('Sostener el Ayni en 60 o más');
    if (worldIds.some(id => state.worlds[id] < 45)) reasons.push('Mantener cada mundo en 45 o más');
    if (state.pendingEvent) reasons.push('Resolver el acontecimiento pendiente');
    return { ready: state.status === 'playing' && reasons.length === 0, reasons };
  }
  function act(state, action, id) {
    const blocked = guard(state); if (blocked) return blocked;
    if (action === 'research') {
      const tech = technologies.find(item => item.id === id);
      if (!tech) return fail('Conocimiento desconocido.');
      if (has(state, id)) return fail('El ayllu ya domina este conocimiento.');
      if (state.month < tech.month) return fail('Este conocimiento se abre en el mes ' + tech.month + '.');
      if (tech.requires.some(requirement => !has(state, requirement))) return fail('Primero desarrollá el conocimiento anterior.');
      if (state.food < tech.food || state.faith < tech.faith) return fail('No hay reservas suficientes para este conocimiento.');
      state.food -= tech.food; state.faith -= tech.faith; state.tech.push(id);
      if (id === 'chasquis') state.flags.road = true;
      return success(state, tech.title + ': ' + tech.description);
    }
    if (action === 'connect') {
      const route = Object.hasOwn(routes, id) ? routes[id] : null;
      if (!route) return fail('Destino desconocido.');
      if (state.connections.includes(id)) return fail('Esta comunidad ya está conectada.');
      if (state.month < route.month) return fail('Esta conexión se abre en el mes ' + route.month + '.');
      if (!state.flags.road) return fail('Completá la mita del camino o desarrollá la red de chasquis.');
      if (state.food < route.food || state.faith < route.faith) return fail('No hay reservas suficientes para abrir este camino.');
      state.food -= route.food; state.faith -= route.faith; state.connections.push(id); state.ayni += 5;
      normalize(state);
      return success(state, 'El camino llega a ' + route.title + '. ' + route.description);
    }
    if (action === 'dedicate') {
      const victory = victoryRequirements(state);
      if (!victory.ready) return fail(victory.reasons.join(' · '));
      state.food -= 100; state.faith -= 80; state.status = 'won';
      state.cause = 'El Coricancha se alza gracias al trabajo, los saberes y los vínculos sostenidos por el ayllu.';
      return success(state, 'El Coricancha se alza. El ayllu celebra una obra compartida.');
    }
    if (!['offering', 'ancestors', 'redistribute', 'rest', 'intensify'].includes(action)) return fail('Acción desconocida.');
    if (state.cooldowns[action] === state.month) return fail('Esta acción ya se realizó este mes.');
    if (action === 'ancestors' && state.month < 3) return fail('El encuentro con la memoria ancestral se abre en el mes 3.');
    const foodCost = action === 'offering' ? 12 : action === 'redistribute' ? 24 : 0;
    const faithCost = action === 'ancestors' ? 12 : 0;
    if (state.food < foodCost || state.faith < faithCost) return fail('No hay reservas suficientes para esta acción.');
    if ((action === 'rest' && state.flags.intensifyMonth === state.month) || (action === 'intensify' && state.flags.restMonth === state.month)) return fail('El descanso y la jornada extra son decisiones alternativas para este mes.');
    state.food -= foodCost; state.faith -= faithCost; state.cooldowns[action] = state.month;
    let message;
    if (action === 'offering') {
      state.faith += 12; state.worlds.hanan += 13;
      message = 'La ofrenda reúne al ayllu: −12 alimentos, +12 fe y +13 Hanan.';
    } else if (action === 'ancestors') {
      state.worlds.uku += 14; state.worlds.hanan += 4; state.ayni += 3;
      message = 'La memoria de los ancestros fortalece los vínculos: −12 fe, +14 Uku, +4 Hanan y +3 Ayni.';
    } else if (action === 'redistribute') {
      state.ayni += 12; state.worlds.kay += 6; state.worlds.uku += 3;
      message = 'Las reservas se comparten: −24 alimentos, +12 Ayni, +6 Kay y +3 Uku.';
    } else if (action === 'rest') {
      state.ayni += 6; state.worlds.uku += 8; state.worlds.kay += 4; state.flags.restMonth = state.month;
      message = 'El ayllu descansa: +6 Ayni, +8 Uku y +4 Kay. Este mes cosecha −20% y obra −50%.';
    } else {
      state.ayni -= 10; state.worlds.kay -= 7; state.worlds.uku -= 3; state.flags.intensifyMonth = state.month;
      message = 'Se extiende la jornada: cosecha +35% este mes, −10 Ayni, −7 Kay y −3 Uku.';
    }
    normalize(state);
    return success(state, message);
  }

  function eventDefinition(state) {
    const choice = (id, title, description, food = 0, faith = 0, requirement = true, costLabel) => ({
      id, title, description, food, faith,
      cost: costLabel || (food || faith ? [food ? food + ' alimentos' : '', faith ? faith + ' fe' : ''].filter(Boolean).join(' · ') : 'Sin costo de recursos'),
      disabled: state.food < food || state.faith < faith || !requirement
    });
    const define = (title, description, icon, theme, choices) => ({ id: state.pendingEvent, title, description, icon, theme, choices });
    switch (state.pendingEvent) {
      case 'mita': return define('Un camino que nos conecta', 'Llega una solicitud de mita estatal: tres personas trabajarán durante tres meses en un tramo del Qhapaq Ñan. Volverán disponibles para nuevas tareas. La obligación tiene un costo para la vida cotidiana del ayllu.', '↟', 'earth', [
        choice('accept', 'Participar en la mita', 'Apartá tres personas. Al regresar, el camino habilitará intercambios y aumentará el Ayni.', 0, 0, state.population >= 6, '3 personas durante 3 meses'),
        choice('decline', 'Conservar el trabajo local', 'Mantené todas las manos en el ayllu. La relación con otras comunidades se resiente: −8 Ayni. Podrás abrir caminos con chasquis más adelante.')
      ]);
      case 'rain': return define('Las lluvias se hacen esperar', 'Quienes observan los campos advierten que el agua escasea. La decisión de hoy cambiará la respuesta del ayllu si la sequía llega.', '☂', 'rain', [
        choice('store', 'Separar una reserva', 'Guardá 30 alimentos de emergencia fuera del consumo habitual. Se recuperarán durante la sequía.', 30),
        choice('canals', 'Organizar canales', has(state, 'canals') ? 'Revisá los canales ya construidos y prepará su uso.' : 'Construí canales: mejoran la distribución del agua de forma permanente.', has(state, 'canals') ? 10 : 65, has(state, 'canals') ? 0 : 10),
        choice('gather', 'Reunir a las comunidades', 'La ceremonia sostiene acuerdos para compartir agua. Aumenta el Ayni y mejora la respuesta colectiva, sin cambiar el clima.', 0, 20),
        choice('wait', 'Esperar y observar', 'Conservá tus recursos. Si la sequía llega, habrá menos preparación.')
      ]);
      case 'drought': return define('La tierra pide agua', state.flags.rainPlan === 'canals' ? 'La sequía ha llegado, pero los canales preparados permiten organizar el riego.' : state.flags.rainPlan === 'store' ? 'La sequía ha llegado. Los alimentos que separaste ahora pueden sostener a la comunidad.' : state.flags.rainPlan === 'gather' ? 'La sequía ha llegado. Los acuerdos anteriores permiten compartir el agua disponible.' : 'La sequía ha llegado y el ayllu no tiene una respuesta preparada. Los próximos dos meses serán más difíciles.', '☀', 'drought', [
        choice('irrigate', 'Distribuir el riego', 'Con canales: cosecha −10% durante dos meses y +4 Kay.', 15, 0, has(state, 'canals'), '15 alimentos · requiere canales'),
        choice('reserve', 'Abrir la reserva de emergencia', 'Recuperá los 30 alimentos separados. Cosecha −25% durante dos meses y +6 Ayni.', 0, 0, state.flags.emergencyCache === 30, 'Requiere la reserva del mes 7'),
        choice('cooperate', 'Cumplir los acuerdos de agua', 'La cooperación limita las pérdidas: cosecha −20% durante dos meses y +6 Ayni.', 0, 0, state.flags.rainPlan === 'gather', 'Requiere los acuerdos del mes 7'),
        choice('endure', 'Atravesar la escasez', 'Cosecha −35% durante dos meses, −8 Ayni y −6 Kay. Reorganizá el trabajo para sostener al ayllu.')
      ]);
      case 'neighbor': return define('Del otro lado del valle', 'Un ayllu vecino perdió parte de sus reservas. Pide ayuda para alimentar a sus familias. La reciprocidad puede tejer una relación que perdure.', '↔', 'earth', [
        choice('help', 'Compartir las reservas', 'Entregá 30 alimentos y ganá 12 Ayni. La comunidad recordará esta ayuda.', 30),
        choice('limited', 'Enviar una ayuda pequeña', 'Entregá 15 alimentos y ganá 5 Ayni. La ayuda puede volver más adelante.', 15),
        choice('decline', 'Priorizar las reservas del ayllu', 'Conservá los alimentos. La comunidad vecina tendrá que buscar otro apoyo: −8 Ayni.')
      ]);
      case 'repay': return define('La ayuda encuentra su regreso', 'La comunidad a la que ayudaste ha recuperado su cosecha. Una caravana llega con alimentos y recuerda el compromiso compartido.', '↔', 'prosperity', [
        choice('receive', 'Recibir y renovar el vínculo', (state.flags.neighborHelp === 'full' ? '+55' : '+25') + ' alimentos y +6 Ayni. El intercambio queda abierto de forma permanente.'),
        choice('share', 'Compartirlo con otra comunidad', '+14 Ayni y +8 Kay. Las reservas viajan hacia quienes hoy las necesitan.')
      ]);
      case 'frost': return define('La gran helada', 'El frío desciende sobre las terrazas. El ayllu deberá proteger sus reservas y organizar los próximos dos meses.', '❄', 'frost', [
        choice('protect', 'Proteger campos y depósitos', 'Invertí reservas en coberturas y cuidados: cosecha −10% durante dos meses.', has(state, 'qollqa') ? 18 : 30),
        choice('network', 'Pedir apoyo a la puna', 'Los intercambios de altura aportan 20 alimentos. Cosecha −20% durante dos meses.', 0, 0, state.connections.includes('puna'), 'Requiere conexión con la Puna'),
        choice('endure', 'Reorganizar con lo disponible', 'Cosecha −30% durante dos meses y −5 Ayni. Conservá las reservas para la alimentación.')
      ]);
      case 'migration': return define('Nuevas familias en el camino', 'Dos personas solicitan sumarse al ayllu. Aportarán su trabajo, pero también necesitarán alimentos cada mes.', '♧', 'earth', [
        choice('welcome', 'Recibir a las familias', '+2 población, +6 Ayni. El consumo crece en 4 alimentos por mes.', 20, 0, state.population <= 28),
        choice('supply', 'Ayudar a continuar el viaje', '+6 Ayni. Las familias seguirán su camino.', 10),
        choice('decline', 'Explicar que hoy no hay lugar', 'La población no cambia y el Ayni disminuye en 3.')
      ]);
      case 'festival': return define('Una celebración compartida', 'El calendario reúne al ayllu. La fiesta puede renovar los vínculos si las reservas permiten sostenerla.', '☼', 'gold', [
        choice('celebrate', 'Preparar una fiesta comunitaria', '+12 Ayni, +12 Hanan y +8 Uku.', 25, 10),
        choice('remember', 'Reunir relatos y memoria', '+8 Uku y +4 Hanan. Una celebración sobria, sin gasto de alimentos.', 0, 12),
        choice('simple', 'Celebrar con un encuentro sencillo', '+3 Ayni y +3 Uku, sin costo de recursos.')
      ]);
      default: return null;
    }
  }
  function getEvent(state) {
    if (!state || state.status !== 'playing') return null;
    return eventDefinition(state);
  }
  function choose(state, optionId) {
    if (state.status !== 'playing') return fail('La partida ha terminado.');
    const event = getEvent(state);
    if (!event) return fail('No hay un acontecimiento pendiente.');
    const option = event.choices.find(item => item.id === optionId);
    if (!option) return fail('Decisión no válida.');
    if (option.disabled) return fail('Esta decisión necesita recursos o preparativos que todavía no tenés.');
    state.food -= option.food; state.faith -= option.faith;
    let message = event.title + ': ' + option.title + '.';
    switch (event.id) {
      case 'mita':
        if (optionId === 'accept') {
          state.mita = { workers: 3, remaining: 3 }; reassignOverflow(state);
          message += ' Tres personas parten y regresarán sin tarea asignada dentro de tres meses.';
        } else { state.ayni -= 8; state.flags.mitaDeclined = true; }
        break;
      case 'rain':
        state.flags.rainPlan = optionId;
        if (optionId === 'store') state.flags.emergencyCache = 30;
        if (optionId === 'canals' && !has(state, 'canals')) state.tech.push('canals');
        if (optionId === 'gather') state.ayni += 10;
        if (optionId === 'wait') state.worlds.kay -= 4;
        break;
      case 'drought':
        state.flags.droughtUntil = state.month + 1;
        state.flags.droughtFactor = { irrigate: 0.9, reserve: 0.75, cooperate: 0.8, endure: 0.65 }[optionId];
        if (optionId === 'irrigate') state.worlds.kay += 4;
        if (optionId === 'reserve') { state.food += 30; state.flags.emergencyCache = 0; state.ayni += 6; }
        if (optionId === 'cooperate') state.ayni += 6;
        if (optionId === 'endure') { state.ayni -= 8; state.worlds.kay -= 6; }
        state.crises += 1;
        break;
      case 'neighbor':
        if (optionId === 'help' || optionId === 'limited') {
          state.flags.neighborHelp = optionId === 'help' ? 'full' : 'small';
          state.flags.repayMonth = state.month + 4;
          state.ayni += optionId === 'help' ? 12 : 5;
        } else { state.flags.neighborHelp = 'none'; state.ayni -= 8; }
        break;
      case 'repay':
        if (optionId === 'receive') {
          state.food += state.flags.neighborHelp === 'full' ? 55 : 25;
          state.ayni += 6;
          if (!state.connections.includes('neighbor')) state.connections.push('neighbor');
        } else { state.ayni += 14; state.worlds.kay += 8; }
        state.flags.repayMonth = 0;
        break;
      case 'frost':
        state.flags.frostUntil = state.month + 1;
        state.flags.frostFactor = { protect: 0.9, network: 0.8, endure: 0.7 }[optionId];
        if (optionId === 'network') state.food += 20;
        if (optionId === 'endure') state.ayni -= 5;
        state.crises += 1;
        break;
      case 'migration':
        if (optionId === 'welcome') { state.population += 2; state.ayni += 6; }
        else state.ayni += optionId === 'supply' ? 6 : -3;
        break;
      case 'festival':
        if (optionId === 'celebrate') { state.ayni += 12; state.worlds.hanan += 12; state.worlds.uku += 8; }
        if (optionId === 'remember') { state.worlds.uku += 8; state.worlds.hanan += 4; }
        if (optionId === 'simple') { state.ayni += 3; state.worlds.uku += 3; }
        break;
    }
    state.pendingEvent = null;
    normalize(state);
    return success(state, message);
  }
  function scheduleEvent(state) {
    const fixed = { 5: 'mita', 7: 'rain', 9: 'drought', 12: 'neighbor' };
    if (fixed[state.month]) return fixed[state.month];
    if (state.flags.repayMonth === state.month) return 'repay';
    if (state.month >= 16 && (state.month - 16) % 4 === 0) return ['festival', 'frost', 'migration'][((state.month - 16) / 4) % 3];
    return null;
  }
  function advance(state) {
    const blocked = guard(state); if (blocked) return blocked;
    const f = forecast(state);
    const priorAyni = state.ayni;
    const finishedMonth = state.month;
    const starving = state.food + f.production < f.consumption;
    state.food = Math.max(0, state.food + f.net);
    state.faith += f.faith;
    state.temple += f.construction;
    state.worlds.hanan += state.workers.priests * 0.7 - 1.3 + (state.connections.includes('sanctuary') ? 0.5 : 0);
    state.worlds.uku += -1 + Math.min(6, f.available) * 0.12;
    state.worlds.kay += starving ? -14 : 0.4;
    state.ayni += f.available >= 2 ? 0.7 : -0.8;
    if (f.equilibrium < 30) state.ayni -= 0.8;
    if (state.connections.includes('neighbor')) state.ayni += 0.8;
    if (starving) {
      state.flags.hunger = (state.flags.hunger || 0) + 1;
      state.ayni -= 18;
      if (state.flags.hunger >= 2) { state.population = Math.max(0, state.population - 1); reassignOverflow(state); }
      log(state, 'No alcanzó el alimento para todas las personas. Reasigná trabajo o buscá apoyo antes del próximo mes.');
    } else state.flags.hunger = 0;
    normalize(state);
    state.flags.conflict = state.ayni <= 10 ? (state.flags.conflict || 0) + 1 : 0;
    const summary = { month: finishedMonth, production: f.production, consumption: f.consumption, faith: f.faith,
      ayni: round(state.ayni - priorAyni), construction: f.construction, constructionCost: f.constructionCost,
      loss: f.loss, net: f.net, food: state.food };
    state.lastSummary = summary;
    state.month += 1;
    if (state.mita) {
      state.mita.remaining -= 1;
      if (state.mita.remaining <= 0) {
        state.mita = null; state.flags.road = true; state.ayni = Math.min(100, state.ayni + 8);
        log(state, 'Las tres personas vuelven de la mita y quedan disponibles. El camino se abre: +8 Ayni.');
        summary.ayni = round(state.ayni - priorAyni);
      }
    }
    if (state.flags.hunger >= 3 || state.population < 6) {
      state.status = 'lost';
      state.cause = 'Las reservas no alcanzaron durante tres meses seguidos. El ayllu se dispersó buscando sustento. Reservar alimento y mantener la agricultura puede sostener una próxima comunidad.';
    } else if (state.flags.conflict >= 2) {
      state.status = 'lost';
      state.cause = 'El Ayni permaneció en 10 o menos durante dos meses. La sobrecarga y los vínculos debilitados rompieron la cooperación. Compartir reservas y dejar tiempo de descanso ayuda a recuperarla.';
    }
    log(state, 'Cierre del mes ' + finishedMonth + ': cosecha +' + f.production + ', consumo −' + f.consumption + ', obra +' + f.construction + '%.');
    if (state.status === 'playing') state.pendingEvent = scheduleEvent(state);
    return { ok: true, message: state.status === 'lost' ? state.cause : 'Comienza el mes ' + state.month + '.', summary, event: getEvent(state) };
  }
  function score(state) {
    const balance = worldIds.reduce((sum, id) => sum + state.worlds[id], 0) / 3;
    return Math.round(state.population * 60 + state.ayni * 12 + balance * 8 + state.temple * 15 +
      state.tech.length * 120 + state.connections.length * 100 + Math.min(10, state.crises) * 80 +
      (state.status === 'won' ? 2500 + Math.max(0, 60 - state.month) * 30 : 0));
  }

  // Only recognized fields are hydrated; persisted objects never supply behavior.
  function restoreState(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 2) return null;
    const required = ['month', 'population', 'food', 'faith', 'ayni', 'temple'];
    if (required.some(key => typeof raw[key] !== 'number' || !Number.isFinite(raw[key]))) return null;
    if (!raw.worlds || !raw.workers || worldIds.some(id => !Number.isFinite(raw.worlds[id])) || roles.some(id => !Number.isFinite(raw.workers[id]))) return null;
    const state = createState();
    state.id = typeof raw.id === 'string' && /^inca-[a-zA-Z0-9-]{1,80}$/.test(raw.id) ? raw.id : state.id;
    state.month = Math.floor(clamp(raw.month, 1, 10000));
    state.population = Math.floor(clamp(raw.population, 0, 30));
    state.food = clamp(raw.food, 0, 10000); state.faith = clamp(raw.faith, 0, 9999);
    state.ayni = raw.ayni; state.temple = raw.temple;
    state.worlds = Object.fromEntries(worldIds.map(id => [id, raw.worlds[id]]));
    state.workers = Object.fromEntries(roles.map(id => [id, Math.floor(clamp(raw.workers[id], 0, state.population))]));
    state.tech = Array.isArray(raw.tech) ? [...new Set(raw.tech.filter(id => technologies.some(t => t.id === id)))] : [];
    // Strip upgrades whose prerequisite was not actually preserved.
    state.tech = state.tech.filter(id => technologies.find(t => t.id === id).requires.every(requirement => state.tech.includes(requirement)));
    state.connections = Array.isArray(raw.connections) ? [...new Set(raw.connections.filter(id => Object.hasOwn(routes, id)))] : [];
    if (raw.mita && raw.mita.workers === 3 && Number.isInteger(raw.mita.remaining) && raw.mita.remaining >= 1 && raw.mita.remaining <= 3 && state.population >= 3) state.mita = { workers: 3, remaining: raw.mita.remaining };
    state.status = ['playing', 'won', 'lost'].includes(raw.status) ? raw.status : 'playing';
    state.pendingEvent = state.status === 'playing' && eventIds.includes(raw.pendingEvent) ? raw.pendingEvent : null;
    state.cause = typeof raw.cause === 'string' ? raw.cause.slice(0, 600) : '';
    state.tutorial = Number.isFinite(raw.tutorial) ? Math.floor(clamp(raw.tutorial, 0, 10)) : 0;
    state.crises = Number.isFinite(raw.crises) ? Math.floor(clamp(raw.crises, 0, 1000)) : 0;
    if (raw.cooldowns && typeof raw.cooldowns === 'object') ['offering', 'ancestors', 'redistribute', 'rest', 'intensify'].forEach(key => {
      if (Number.isInteger(raw.cooldowns[key]) && raw.cooldowns[key] >= 1 && raw.cooldowns[key] <= state.month) state.cooldowns[key] = raw.cooldowns[key];
    });
    const flags = raw.flags && typeof raw.flags === 'object' ? raw.flags : {};
    ['road', 'mitaDeclined'].forEach(key => { if (flags[key] === true) state.flags[key] = true; });
    ['droughtUntil', 'frostUntil', 'restMonth', 'intensifyMonth', 'repayMonth'].forEach(key => {
      if (Number.isInteger(flags[key]) && flags[key] >= 0 && flags[key] <= state.month + 4) state.flags[key] = flags[key];
    });
    ['droughtFactor', 'frostFactor'].forEach(key => { if (typeof flags[key] === 'number' && Number.isFinite(flags[key])) state.flags[key] = clamp(flags[key], 0.5, 1); });
    ['hunger', 'conflict'].forEach(key => { if (Number.isInteger(flags[key])) state.flags[key] = clamp(flags[key], 0, 3); });
    if (flags.emergencyCache === 30) state.flags.emergencyCache = 30;
    if (['store', 'canals', 'gather', 'wait'].includes(flags.rainPlan)) state.flags.rainPlan = flags.rainPlan;
    if (['full', 'small', 'none'].includes(flags.neighborHelp)) state.flags.neighborHelp = flags.neighborHelp;
    if (has(state, 'chasquis')) state.flags.road = true;
    if (Array.isArray(raw.history)) state.history = raw.history.filter(item => item && Number.isInteger(item.month) && typeof item.text === 'string').slice(0, 80).map(item => ({ month: clamp(item.month, 1, state.month), text: item.text.slice(0, 600) }));
    if (raw.lastSummary && typeof raw.lastSummary === 'object') {
      const keys = ['month', 'production', 'consumption', 'faith', 'ayni', 'construction', 'constructionCost', 'loss', 'net', 'food'];
      if (keys.every(key => Number.isFinite(raw.lastSummary[key]))) state.lastSummary = Object.fromEntries(keys.map(key => [key, clamp(raw.lastSummary[key], -10000, 10000)]));
    }
    reassignOverflow(state); normalize(state);
    return state;
  }
  return Object.freeze({ createState, forecast, assign, act, advance, choose, getEvent, technologies, routes, victoryRequirements, score, restoreState });
});
