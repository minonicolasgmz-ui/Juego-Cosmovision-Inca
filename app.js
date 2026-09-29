/* UI, persistence and optional media. Game rules live in engine.js. */
(() => {
  'use strict';
  const E = window.IncaEngine, A = window.IncaArt, C = window.IncaContent;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const num = value => Number(value || 0).toLocaleString('es-AR', {maximumFractionDigits:1});
  const signed = value => (value >= 0 ? '+' : '−') + num(Math.abs(value));
  const icon = name => A.icon(name);
  const SAVE_KEY = 'inca_save_v2';
  const DEFAULT_API = 'https://script.google.com/macros/s/AKfycbynwOPQoiMeC0CD9KobexcriT9X4-8PvtIRj-DQImUaYf39fxBlk2-ePsJSR8Ruk70/exec';
  const schools = ['DVS','IPET 263','GMZ','ProA','GMZ Nivel Superior','D.F.Sarmiento','El Amanecer','Visitante de la Comunidad'];
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key,value) { try { localStorage.setItem(key,value); return true; } catch { return false; } },
    json(key,fallback) { try { return JSON.parse(this.get(key)) ?? fallback; } catch { return fallback; } }
  };
  let saved = E.restoreState(storage.json(SAVE_KEY,null));
  let state = saved || E.createState();
  let playing = false, timer = null, speed = 0, panelKind = '', toastTimer, summaryTimer, lastStage = -1;
  let sound = storage.get('inca_sound') === 'on', haptic = storage.get('inca_haptic') !== 'off', audioContext;
  const player = {name:storage.get('inca_jugador_nombre') || '',school:storage.get('inca_jugador_colegio') || ''};
  let finalReturn = false, newWithGuide = false;
  const inFlightScores = new Set(), scoreSession = new Map();
  const panel = $('panel');
  const panelStatus = document.createElement('p');
  panelStatus.id = 'panel-status'; panelStatus.className = 'panel-note panel-feedback'; panelStatus.hidden = true;
  panelStatus.setAttribute('role','status'); panelStatus.setAttribute('aria-live','polite');
  panelStatus.style.cssText = 'position:sticky;z-index:4;margin:0;border-radius:0;';
  panel.insertBefore(panelStatus,$('panel-body'));
  const costs = {offering:[12,0],ancestors:[0,12],redistribute:[24,0],rest:[0,0],intensify:[0,0]};
  const titles = {farmers:'Agricultura',priests:'Culto',builders:'Construcción'};

  function hydrateIcons(scope=document) { scope.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  function notify(message,error=false) {
    clearTimeout(toastTimer);
    if(panel.open) {
      $('toast').classList.remove('visible');
      panelStatus.style.top = panel.querySelector('.dialog-top').offsetHeight + 'px';
      panelStatus.style.color = error ? 'var(--danger)' : 'var(--ink)';
      panelStatus.textContent = message; panelStatus.hidden = false;
      return;
    }
    $('toast').textContent = message; $('toast').className = 'toast visible' + (error ? ' error' : '');
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'),4200);
  }
  function save() {
    const ok = storage.set(SAVE_KEY,JSON.stringify(state));
    $('save-state').textContent = ok ? 'Guardado en este dispositivo' : 'Guardado no disponible';
    saved = state;
  }
  function soundNote(special=false) {
    if (!sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume().catch(()=>{});
      const now = audioContext.currentTime;
      (special ? [261.63,329.63,392] : [392]).forEach((frequency,i) => {
        const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
        oscillator.type='sine'; oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(0,now+i*.1); gain.gain.linearRampToValueAtTime(.035,now+i*.1+.02); gain.gain.exponentialRampToValueAtTime(.001,now+i*.1+.45);
        oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(now+i*.1);oscillator.stop(now+i*.1+.5);
      });
    } catch { /* Sound is optional, including unsupported Web Audio browsers. */ }
  }
  function vibrate(pattern=25) { if(haptic && navigator.vibrate && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(pattern); }
  function pause() {
    if(timer) clearInterval(timer); timer=null; speed=0;
    $('time-state').textContent='El tiempo está en pausa';
    ['pause','play','fast'].forEach(key=>$(`${key}-button`).classList.toggle('active',key==='pause'));
  }
  function run(rate) {
    pause();
    if(!playing || state.status!=='playing' || panel.open || $('event-dialog').open) return;
    speed=rate;
    $('time-state').textContent=rate===1?'Un mes cada 9 segundos':'Un mes cada 4,5 segundos';
    ['pause','play','fast'].forEach(key=>$(`${key}-button`).classList.toggle('active',key===(rate===1?'play':'fast')));
    timer=setInterval(nextMonth,rate===1?9000:4500);
  }
  function canAct(action) {
    const cost=costs[action] || [0,0];
    return state.status==='playing' && !state.pendingEvent && state.cooldowns[action]!==state.month && state.food>=cost[0] && state.faith>=cost[1]
      && !(action==='ancestors' && state.month<3) && !(action==='rest' && state.flags.intensifyMonth===state.month) && !(action==='intensify' && state.flags.restMonth===state.month);
  }
  function resourceValue(id,value) {
    const element=$(id),previous=Number(element.dataset.amount);
    element.textContent=num(value);element.dataset.amount=value;
    if(!playing||!Number.isFinite(previous)||Math.abs(value-previous)<1||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const resource=element.closest('.resource');resource.querySelector('.resource-delta')?.remove();
    const delta=document.createElement('span');delta.className='resource-delta';delta.textContent=signed(value-previous);delta.setAttribute('aria-hidden','true');
    resource.appendChild(delta);setTimeout(()=>delta.remove(),700);
  }
  function render() {
    const f=E.forecast(state);
    $('month-label').textContent='Mes '+state.month;
    $('season-label').textContent=f.season.name.replace('Tiempo de ','').replace('Tiempo ',''); $('season-symbol').textContent=f.season.icon;
    resourceValue('food-value',state.food);resourceValue('faith-value',state.faith);resourceValue('population-value',state.population);resourceValue('ayni-value',state.ayni);
    $('food-trend').textContent=(f.net<0?'▼ ':'▲ ')+signed(f.net)+'/mes';$('food-trend').className=f.net<0?'negative':'positive';
    $('faith-trend').textContent=signed(f.faith)+'/mes';$('population-state').textContent=f.populationStatus;
    $('temple-percent').textContent=num(state.temple)+' %';$('temple-mini').style.width=state.temple+'%';
    const stage=Math.min(4,Math.floor(state.temple/25));
    if(stage!==lastStage) {
      $('temple-art').innerHTML=A.temple(state.temple);
      $('temple-art').classList.remove('pulse');void $('temple-art').offsetWidth;$('temple-art').classList.add('pulse');lastStage=stage;
    }
    $('temple-art').setAttribute('aria-label','Coricancha: '+num(state.temple)+' por ciento construido');
    $('temple-stage').textContent=['Los cimientos de un sueño','La piedra encuentra su lugar','Un templo toma forma','El oro recibe la luz','Una obra de todo el ayllu'][stage];
    $('temple-caption').textContent=state.temple>=100?'La obra está lista para su dedicación.':state.month<3?'La construcción comienza en el mes 3.':state.temple>=50&&!state.tech.includes('masonry')?'La cantería permitirá continuar la obra.':f.construction>0?`Avance previsto: +${num(f.construction)} % / mes`:state.workers.builders>0?'Faltan reservas para sostener la obra.':'Asigná constructores para continuar la obra.';
    ['hanan','kay','uku'].forEach(world=>{const value=state.worlds[world],meter=$(`${world}-meter`);$(`${world}-value`).textContent=num(value);meter.value=value;meter.textContent=num(value)+' de 100';meter.setAttribute('aria-label',world[0].toUpperCase()+world.slice(1)+' Pacha: '+num(value)+' de 100');});
    $('worker-preview').innerHTML=Object.entries(state.workers).map(([role,n])=>`<span><strong>${n}</strong>${titles[role]}</span>`).join('');
    $('village-state').textContent=`${state.population} personas · ${f.populationStatus}${f.net<0?' · Reservas en descenso':''}`;
    $('capacity-label').textContent=`${num(state.food)} / ${f.capacity} alimentos`;$('capacity-bar').style.width=Math.min(100,state.food/f.capacity*100)+'%';
    $('qollqa-label').textContent=state.tech.includes('qollqa')?'Qollqa · reservas protegidas':'Reservas del ayllu';
    $('mita-preview').hidden=!state.mita;
    if(state.mita) $('mita-preview').textContent=`Mita del camino: ${state.mita.workers} personas · regresan en ${state.mita.remaining} ${state.mita.remaining===1?'mes':'meses'}.`;
    $('balance-label').textContent=f.equilibrium>=60?'Los tres mundos se sostienen':f.equilibrium>=45?'El equilibrio necesita cuidado':'Un vínculo se está debilitando';
    $('balance-description').textContent=`Vínculo más frágil: ${f.equilibrium}/100 · Ayni ${num(state.ayni)}/100`;
    $('world-scene').className='world-scene '+(f.populationStatus==='Hambruna'?'famine ':state.flags.droughtUntil>=state.month?'drought ':f.season.id==='frost'?'frost ':'')+(f.equilibrium>=60?'harmonious':'');
    document.querySelectorAll('[data-game-action]').forEach(button=>{
      const action=button.dataset.gameAction;button.disabled=!canAct(action);
      button.title=state.cooldowns[action]===state.month?'Ya realizado este mes':action==='ancestors'&&state.month<3?'Se abre en el mes 3':'';
    });
    $('ancestors-cost').textContent=state.month<3?'Disponible desde el mes 3':'12 fe · +14 Uku · +3 Ayni';
    $('offering-cost').textContent=state.cooldowns.offering===state.month?'Ofrenda realizada · disponible el próximo mes':'12 alimento · +12 fe · +13 Hanan';
    $('tech-dot').hidden=!E.technologies.some(t=>!state.tech.includes(t.id)&&state.month>=t.month&&t.requires.every(id=>state.tech.includes(id))&&state.food>=t.food&&state.faith>=t.faith);
    updateGuide();
  }
  function updateGuide() {
    const guide=$('guide'),f=E.forecast(state);
    if(!playing || state.status!=='playing') {guide.hidden=true;return;}
    let message='',label='EL CONSEJO DEL AMAUTA',cta='',action='';
    if(state.tutorial===0) {label='1 / PROBÁ UNA DECISIÓN';message='Ajustá cuántas personas cultivan y mirá cómo cambia la cosecha. Podés reasignar a alguien de otra tarea.';cta='Organizar';action='work';}
    else if(state.tutorial===1) {label='2 / OBSERVÁ LA CONSECUENCIA';message='El trabajo ya cambió la previsión. Pasá un mes para ver cosecha y consumo.';cta='Pasar mes';action='next';}
    else if(state.tutorial===2) {label='3 / CUIDÁ LOS VÍNCULOS';message='El ayllu también se reúne en torno a Inti. Probá una ofrenda y observá qué cambia.';cta='Ir a Hanan';action='hanan';}
    else if(state.tutorial===3) {label='TU HISTORIA CONTINÚA';message='Desde el mes 3, la construcción y los ancestros abren nuevas decisiones. El tiempo queda en tus manos.';cta='Entendido';action='skip-guide';}
    else if(f.populationStatus==='Hambruna') {message='El alimento no alcanzó. La cosecha y el consumo en Trabajo muestran dónde nace el problema.';cta='Ver trabajo';action='work';}
    else if(f.net<0&&state.food<f.consumption*2) {message='Las reservas bajan: alimento, obra y pérdidas superan la cosecha. Revisá el balance del mes.';cta='Ver balance';action='resources';}
    else if(state.ayni<40) {message='La cooperación se debilita. El trabajo sin descanso y el hambre dejan huellas en el Ayni.';cta='Ver vínculos';action='balance';}
    else if(state.temple>=50&&!state.tech.includes('masonry')) {message='Los muros llegaron al 50%. El saber de la cantería permite levantar la siguiente etapa.';cta='Ir a Saber';action='tech';}
    else if(E.victoryRequirements(state).ready) {message='La obra está lista y el ayllu sostiene sus vínculos. Podés dedicar el Coricancha.';cta='Ver templo';action='construction';}
    guide.hidden=!message;
    if(message){$('guide-label').textContent=label;$('guide-text').textContent=message;$('guide-cta').textContent=cta;$('guide-cta').dataset.action=action;}
  }
  function updateMenu() {
    $('player-label').textContent=player.name || 'Curaca';
    $('start-button').innerHTML=(saved?(state.status==='playing'?'Continuar historia':'Ver mi última historia'):'Comenzar')+' '+icon('arrow');
    $('new-button').hidden=!saved;
    document.querySelectorAll('.sound-toggle').forEach(button=>{button.innerHTML=icon(sound?'sound':'muted');button.setAttribute('aria-label',sound?'Desactivar sonido':'Activar sonido');});
  }
  function start(fresh=false) {
    if(fresh){state=E.createState();state.tutorial=storage.get('inca_tutorial_v2')==='done'?4:0;lastStage=-1;}
    playing=true;$('menu').hidden=true;$('game').hidden=false;pause();save();render();window.scrollTo(0,0);
    if(state.status!=='playing') showFinal();else if(state.pendingEvent) showEvent();
  }
  function returnMenu() {pause();save();playing=false;panel.close();panelKind='';$('game').hidden=true;$('menu').hidden=false;$('guide').hidden=true;updateMenu();window.scrollTo(0,0);}
  function nextMonth() {
    if(!playing || panel.open || $('event-dialog').open || state.status!=='playing')return;
    const before=state.temple,result=E.advance(state);if(!result.ok){notify(result.message,true);return;}
    if(state.tutorial===1) state.tutorial=2;
    save();render();
    if(Math.floor(before/25)<Math.floor(state.temple/25)){soundNote(true);vibrate(25);}
    if(state.status!=='playing'){pause();showFinal();return;}
    if(result.event){pause();showEvent();return;}
    showSummary(result.summary);
  }
  function showSummary(summary) {
    if(!summary)return;clearTimeout(summaryTimer);
    $('month-summary').innerHTML=`<strong>MES ${summary.month} → MES ${state.month}</strong><div class="summary-grid"><span>Cosecha<b>+${num(summary.production)}</b></span><span>Consumo<b class="debit">−${num(summary.consumption)}</b></span><span>Culto<b>${signed(summary.faith)}</b></span><span>Ayni<b>${signed(summary.ayni)}</b></span></div><small class="action-cost">Obra +${num(summary.construction)} % · ${num(summary.constructionCost)} alimentos · Pérdidas ${num(summary.loss)}</small>`;
    $('month-summary').hidden=false;summaryTimer=setTimeout(()=>$('month-summary').hidden=true,3000);
  }
  function doAction(action,id) {
    const result=E.act(state,action,id);
    if(!result.ok){notify(result.message,true);return;}
    if(action==='offering' && state.tutorial===2)state.tutorial=3;
    save();render();soundNote();notify(result.message);
    if(state.status!=='playing'){panel.close();showFinal();return;}
    if(panel.open)refreshPanel();
  }
  function openPanel(kind) {
    pause();$('month-summary').hidden=true;panelStatus.hidden=true;panelStatus.textContent='';panelKind=kind;refreshPanel();if(!panel.open)panel.showModal();
  }
  function setPanel(kicker,title,body) {$('panel-kicker').textContent=kicker;$('panel-title').textContent=title;$('panel-body').innerHTML=body;}
  function workBody() {
    const f=E.forecast(state);
    return `<p>El trabajo cotidiano cambia la vida del ayllu cada mes. Dejar personas disponibles también da tiempo para cuidados y descanso.</p>${Object.keys(titles).map(role=>`<div class="work-row"><div><strong>${titles[role]}</strong><p>${role==='farmers'?'Sostiene las cosechas':role==='priests'?'Culto y vínculo con Hanan':state.month<3?'Disponible desde el mes 3':'Levanta el Coricancha; usa alimento'}</p></div><div class="stepper"><button data-role="${role}" data-delta="-1" aria-label="Menos ${titles[role].toLowerCase()}" ${state.workers[role]===0?'disabled':''}>−</button><output aria-label="Personas en ${titles[role]}">${state.workers[role]}</output><button data-role="${role}" data-delta="1" aria-label="Más ${titles[role].toLowerCase()}" ${f.available===0 || role==='builders'&&state.month<3?'disabled':''}>+</button></div></div>`).join('')}<div class="work-total"><span>Disponibles <strong>${f.available}</strong></span><span>${state.mita?`En mita <strong>${state.mita.workers}</strong>`:`Población <strong>${state.population}</strong>`}</span></div>${forecastTiles(f)}${state.mita?`<div class="panel-note"><strong>Mita del Qhapaq Ñan</strong><br>${state.mita.workers} personas regresarán en ${state.mita.remaining} meses. Volverán disponibles: podrás asignarles una tarea.</div>`:''}<div class="panel-actions"><button class="secondary" data-game-action="rest" ${canAct('rest')?'':'disabled'}>Dar descanso</button><button class="secondary" data-game-action="intensify" ${canAct('intensify')?'':'disabled'}>Pedir jornada extra</button></div><p class="compact-help">Descanso: cosecha −20%, obra −50%, recupera vínculos. Jornada extra: cosecha +35%, Ayni −10 y desgaste de Kay/Uku. Son alternativas del mes.</p>`;
  }
  function forecastTiles(f) {
    return `<div class="forecast-grid"><div class="stat-tile"><small>Cosecha estimada</small><strong>+${num(f.production)}</strong><em>alimentos / mes</em></div><div class="stat-tile"><small>Alimentación</small><strong>−${num(f.consumption)}</strong><em>${state.population} personas × 2</em></div><div class="stat-tile"><small>Obra y pérdidas</small><strong>−${num(f.constructionCost+f.loss)}</strong><em>Obra ${num(f.constructionCost)} · pérdidas ${num(f.loss)}</em></div><div class="stat-tile"><small>Balance previsto</small><strong>${signed(f.net)}</strong><em>${f.net<0?'Las reservas disminuyen':'Las reservas se sostienen'}</em></div></div>`;
  }
  function techBody() {
    const node=t=>{
      const learned=state.tech.includes(t.id),locked=state.month<t.month||t.requires.some(id=>!state.tech.includes(id));
      const enabled=!learned&&!locked&&state.food>=t.food&&state.faith>=t.faith;
      return `<article class="tech-node ${learned?'learned':locked?'locked':''}"><span class="node-state">${learned?'✓ APRENDIDO':locked?'POR DESCUBRIR':'DISPONIBLE'}</span><h3>${locked?'◇ ':''}${esc(t.title)}</h3><p>${esc(t.description)}</p>${t.requires.length?`<small>Desde ${t.requires.map(id=>E.technologies.find(v=>v.id===id).title).join(', ')}</small>`:''}<small>${t.food} alimento · ${t.faith} fe</small><button data-research="${t.id}" ${enabled?'':'disabled'}>${learned?'Parte de tu ayllu':state.month<t.month?`Se abre en el mes ${t.month}`:locked?'Requiere '+t.requires.map(id=>E.technologies.find(v=>v.id===id).title).join(', '):!enabled?'Faltan recursos':'Desarrollar'}</button></article>`;
    };
    return `<p>Yachaywasi <button class="term-info" data-term="Yachaywasi" aria-label="Qué es el Yachaywasi">i</button> · Cada saber abre una posibilidad. Este árbol representa una progresión jugable, no el orden histórico de los descubrimientos.</p><div class="tech-tree">${E.technologies.filter(t=>!t.requires.length).map(root=>`<div class="tech-branch">${node(root)}<div class="tech-children">${E.technologies.filter(t=>t.requires.includes(root.id)).map(node).join('')}</div></div>`).join('')}</div>`;
  }
  function mapBody() {
    return `<p>Qhapaq Ñan <button class="term-info" data-term="Qhapaq Ñan" aria-label="Sobre el Qhapaq Ñan">i</button> · Los caminos acercan recursos de distintos paisajes. La mita del mes 5 o la red de chasquis permiten abrir estas conexiones.</p><div class="map-illustration"><svg viewBox="0 0 460 130" role="img" aria-label="Tu ayllu en el valle, conectado con la Puna, el ayllu vecino y un santuario"><path d="M0 95L77 15 145 75 210 25 310 110 384 10 460 95V130H0" fill="#91a88f"/><path d="M77 15L48 47 85 38 99 40Z M210 25L182 57 207 47 232 51Z M384 10L356 42 390 31 403 35Z" fill="#f6f1dc"/><path d="M220 96L77 61M220 96L373 59M220 96L330 112" fill="none" stroke="#e4bb6b" stroke-width="3" stroke-dasharray="5 5"/><g fill="#2c4c42" stroke="#f3e1b9" stroke-width="3"><circle cx="220" cy="96" r="9"/><circle cx="77" cy="61" r="6"/><circle cx="373" cy="59" r="6"/><circle cx="330" cy="112" r="6"/></g><g fill="#203e37" font-family="sans-serif" font-size="10"><text x="188" y="122">Tu ayllu · Valle</text><text x="40" y="83">Puna</text><text x="345" y="47">Santuario</text><text x="350" y="116">Ayllu vecino</text></g></svg></div>${Object.entries(E.routes).map(([id,r])=>{const connected=state.connections.includes(id),available=state.flags.road&&state.month>=r.month&&state.food>=r.food&&state.faith>=r.faith;return `<article class="connection-row"><h3>${connected?'✓ ':''}${esc(r.title)}</h3><p>${esc(r.description)}</p><small class="action-cost">${r.food} alimento${r.faith?' · '+r.faith+' fe':''}</small><button class="secondary" data-connect="${id}" ${connected||!available?'disabled':''}>${connected?'Camino abierto':!state.flags.road?'Esperando el camino':state.month<r.month?'Disponible en el mes '+r.month:!available?'Faltan reservas':'Conectar comunidad'}</button></article>`;}).join('')}`;
  }
  function ritualBody() {
    return [{action:'offering',title:'Ofrendar a Inti',text:'Un alimento entregado al ritual es una decisión sobre las reservas compartidas.',effect:'12 alimento → +12 fe · +13 Hanan'}, {action:'ancestors',title:'Honrar a los ancestros',text:'Una reunión en torno a la memoria fortalece los vínculos del ayllu.',effect:state.month<3?'Se abre en el mes 3':'12 fe → +14 Uku · +4 Hanan · +3 Ayni'},{action:'redistribute',title:'Compartir las reservas',text:'Redistribuir alimento sostiene la reciprocidad. Acumular no es el único camino.',effect:'24 alimento → +12 Ayni · +6 Kay · +3 Uku'}].map(r=>`<article class="ritual-option"><h3>${r.title}</h3><p>${r.text}</p><small>${r.effect}</small><button class="primary" data-game-action="${r.action}" ${canAct(r.action)?'':'disabled'}>${state.cooldowns[r.action]===state.month?'Ya realizado este mes':r.title} ${icon('arrow')}</button></article>`).join('');
  }
  function balanceBody() {
    return `<p>La armonía depende del vínculo más frágil. Cada medidor es una regla del juego para hacer visibles tus decisiones.</p>${[['hanan','Hanan · el cuidado ritual','El culto cotidiano y las ofrendas lo sostienen.'],['kay','Kay · la vida en la tierra','La alimentación y la redistribución lo fortalecen.'],['uku','Uku · memoria y cuidado','El descanso y el encuentro con los ancestros renuevan este vínculo.']].map(([id,title,desc])=>`<div class="balance-row"><div><strong>${title}</strong><span>${num(state.worlds[id])}/100</span></div><div class="progress-line"><i style="width:${state.worlds[id]}%"></i></div><p>${desc}</p></div>`).join('')}<div class="panel-note"><strong>Ayni ${num(state.ayni)}/100</strong><br>Con 75 o más, la cooperación mejora la cosecha. Por debajo de 35, los conflictos la reducen. La sobrecarga y el hambre debilitan los vínculos.</div><p class="compact-help">La dedicación del templo requiere Ayni ≥60 y cada mundo ≥45. Mantener los tres mundos en 60 o más mejora la cooperación productiva.</p><button class="secondary" data-term="Equilibrio de los mundos">Historia y simplificación jugable</button>`;
  }
  function constructionBody() {
    const f=E.forecast(state),requirements=E.victoryRequirements(state);
    return `<div class="final-temple">${A.temple(state.temple)}</div><div class="milestones">${[0,25,50,75,100].map(n=>`<span class="${state.temple>=n?'done':''}">${n}%</span>`).join('')}</div><p>La obra avanza con quienes asignás a construcción. Usa alimento y deja una reserva mínima para la comunidad. La cantería permite superar el 50%.</p><div class="panel-note"><strong>${num(state.temple)} % construido</strong><br>Próximo mes: +${num(f.construction)} % · ${num(f.constructionCost)} alimentos para la obra.</div><p>Para la dedicación: obra terminada, 100 alimentos, 80 de fe, Ayni ≥60 y cada mundo ≥45.</p>${requirements.reasons.length?'<ul class="requirements">'+requirements.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')+'</ul>':'<p>El ayllu está preparado para celebrar su obra.</p>'}<div class="panel-actions"><button class="secondary" data-action="work">Organizar construcción</button><button class="primary" data-dedicate ${requirements.ready?'':'disabled'}>Dedicar el Coricancha</button></div><p class="compact-help">Este templo es una interpretación visual. La meta desde un pequeño ayllu es ficticia.</p>`;
  }
  function glossaryItems(query='') {
    const term=query.toLocaleLowerCase('es');
    const entries=C.glossary.filter(item=>(item.term+' '+item.text).toLocaleLowerCase('es').includes(term));
    return entries.length?entries.map(item=>`<article class="glossary-item"><span class="kind">${esc(item.kind)}</span><h3>${esc(item.term)}</h3><p>${esc(item.text)}</p>${item.url?`<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.source)} ↗</a>`:''}</article>`).join(''):'<p>No encontramos ese término. Probá con otra palabra.</p>';
  }
  function registerBody() {
    const custom=player.school&&!schools.includes(player.school);
    return `<p>Elegí un nombre de Curaca para reconocer tu historia. Podés jugar sin registrarte y completar estos datos al compartir un resultado.</p><form class="player-form" id="player-form"><label for="player-name">Nombre o apodo</label><input id="player-name" name="name" maxlength="60" autocomplete="nickname" value="${esc(player.name)}" required><label for="player-school">Colegio o comunidad</label><select id="player-school" name="school" required><option value="">Elegí una opción</option>${schools.map(s=>`<option ${s===player.school?'selected':''}>${esc(s)}</option>`).join('')}<option value="__other__" ${custom?'selected':''}>Otra institución</option></select><div id="other-school-wrap" ${custom?'':'hidden'}><label for="other-school">Nombre de la institución</label><input id="other-school" maxlength="100" value="${custom?esc(player.school):''}" ${custom?'required':''}></div><button class="primary" type="submit">Guardar Curaca ${icon('arrow')}</button></form>`;
  }
  function helpBody() {
    return `<p>Tu objetivo es levantar el Coricancha y sostener una comunidad capaz de celebrarlo. No hay preguntas ni respuestas correctas: hay decisiones y consecuencias.</p><ol class="help-steps"><li><strong>Organizá el trabajo</strong><p>El campo alimenta al ayllu; el culto sostiene Hanan; la construcción levanta el templo desde el mes 3.</p></li><li><strong>Hacé avanzar el tiempo</strong><p>Pasá un mes por vez o activá el tiempo. Abrir un panel o salir de la pestaña pausa la partida.</p></li><li><strong>Cuidá lo que une al ayllu</strong><p>Distribuí reservas, atendé la memoria y decidí frente a las crisis. Cada acción deja un rastro en la Crónica.</p></li></ol><div class="settings-row"><span>Sonidos breves</span><button data-action="sound">${sound?'Activados':'Desactivados'}</button></div><div class="settings-row"><span>Vibración en momentos especiales</span><button data-action="haptic">${haptic?'Activada':'Desactivada'}</button></div><div class="panel-actions"><button class="secondary" data-action="guide-start">${playing?'Repetir guía contextual':'Comenzar con guía'}</button><button class="secondary" data-action="glossary">Explorar el glosario</button></div><div class="panel-note">${esc(C.note)}</div>`;
  }
  function refreshPanel() {
    const f=E.forecast(state);
    if(panelKind==='work')setPanel('EL MUNDO DE AQUÍ','Las manos del ayllu',workBody());
    else if(panelKind==='tech')setPanel('SABERES QUE ABREN CAMINOS','Yachaywasi',techBody());
    else if(panelKind==='map')setPanel('DIFERENTES TIERRAS, VÍNCULOS COMPARTIDOS','Qhapaq Ñan',mapBody());
    else if(panelKind==='ritual')setPanel('REUNIR, COMPARTIR, RECORDAR','Los vínculos del ayllu',ritualBody());
    else if(panelKind==='balance')setPanel('LA RECIPROCIDAD SOSTIENE LA VIDA','Tres mundos en relación',balanceBody());
    else if(panelKind==='construction')setPanel('PIEDRA SOBRE PIEDRA','Camino al Coricancha',constructionBody());
    else if(panelKind==='resources'||panelKind==='calendar')setPanel('MES '+state.month+' · '+f.season.name,'El balance del ayllu',`<p>Previsión con las tareas actuales para el próximo cierre. El alimento se destina primero a la población, luego a la obra y al almacenamiento.</p>${forecastTiles(f)}<div class="panel-note"><strong>Reservas ${num(state.food)} / ${f.capacity}</strong><br>${f.detailed?`Quipucamayoc: quedarían ${num(f.projectedFood)} alimentos. Desgaste: ${num(f.spoilage)}; excedente sin guardar: ${num(f.overflow)}.<br>Próxima estación: ${esc(f.nextSeason.name)}.<br>${f.modifiers.map(esc).join(' · ')}`:'El quipu permite anticipar reservas, pérdidas detalladas y cambios de estación. El registro no reduce lo que necesita comer cada persona.'}</div><p class="compact-help">Culto: ${signed(f.faith)} fe / mes · Obra: +${num(f.construction)} % / mes. Las decisiones de un evento pueden modificar estas previsiones.</p>${state.lastSummary?'<button class="secondary" data-action="last-summary">Revisar el último mes</button>':''}`);
    else if(panelKind==='journal')setPanel('LAS HUELLAS DE TUS DECISIONES','Crónica del ayllu',`<p>Cada decisión forma parte de tu historia. Se conservan los últimos 80 registros.</p><ol class="journal">${state.history.map(entry=>`<li><small>MES ${entry.month}</small><p>${esc(entry.text)}</p></li>`).join('')}</ol><div class="panel-actions"><button class="secondary" data-action="glossary">Glosario</button><a href="tablero.html">Clasificación ↗</a><button class="secondary" data-action="menu">Guardar y salir</button></div>`);
    else if(panelKind==='glossary')setPanel('HISTORIA, INTERPRETACIONES Y REGLAS','Palabras de este mundo',`<p>${esc(C.note)}</p><label class="eyebrow" for="glossary-search">BUSCAR UN CONCEPTO</label><input id="glossary-search" class="glossary-search" type="search" placeholder="Ayni, mita, quipu…"><div id="glossary-list">${glossaryItems()}</div><details><summary class="secondary">Fuentes para seguir explorando</summary><ul class="source-list">${C.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ul></details>`);
    else if(panelKind==='register')setPanel('TU HISTORIA TIENE UN NOMBRE','El Curaca',registerBody());
    else if(panelKind==='help')setPanel('APRENDER HACIENDO','Cómo jugar',helpBody());
    else if(panelKind==='new')setPanel('UN NUEVO COMIENZO','Otra historia te espera',`<p>Tu partida actual será reemplazada en este dispositivo. Los resultados terminados y tu registro de Curaca se conservan.</p><div class="panel-actions"><button class="secondary" data-action="close">Volver</button><button class="primary" data-action="confirm-new">Comenzar otra historia</button></div>`);
    else if(panelKind==='retry-score')setPanel('CONFIRMACIÓN PENDIENTE','Volver a enviar el puntaje',`<p>El servicio todavía no confirmó este resultado. El envío anterior podría haberse guardado: repetirlo puede crear una partida duplicada en la clasificación.</p><div class="panel-actions"><button class="secondary" data-action="check-score">Comprobar antes</button><button class="primary" data-action="confirm-share">Reenviar de todas formas</button></div>`);
    else if(panelKind==='final')renderFinal();
  }
  function showTerm(term) {
    pause();panelStatus.hidden=true;panelStatus.textContent='';const item=C.glossary.find(entry=>entry.term===term)||C.glossary.find(entry=>entry.term.toLowerCase().includes(term.toLowerCase()));
    if(!item){openPanel('glossary');return;}
    panelKind='term';setPanel(item.kind,item.term,`<p>${esc(item.text)}</p>${item.url?`<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.source)} ↗</a>`:''}<div class="panel-actions"><button class="secondary" data-action="glossary">Abrir glosario completo</button></div>`);if(!panel.open)panel.showModal();
  }
  function showEvent() {
    const event=E.getEvent(state);if(!event)return;pause();panel.close();$('month-summary').hidden=true;
    $('event-art').innerHTML=A.event(event.theme);$('event-kicker').textContent=`MES ${state.month} · UN GIRO EN TU HISTORIA`;$('event-icon').textContent=event.icon;
    $('event-title').textContent=event.title;$('event-description').textContent=event.description;
    $('event-choices').innerHTML=event.choices.map(choice=>`<button class="event-choice" data-choice="${esc(choice.id)}" ${choice.disabled?'disabled':''}><strong>${esc(choice.title)}</strong><p>${esc(choice.description)}</p><small>${choice.disabled?'No disponible · ':''}${esc(choice.cost)}</small></button>`).join('');
    if(!$('event-dialog').open)$('event-dialog').showModal();soundNote(true);if(event.theme==='frost'||event.theme==='drought')vibrate(30);
  }
  function localScores() {const rows=storage.json('inca_local_scores',[]);return Array.isArray(rows)?rows.filter(row=>row&&typeof row==='object'):[];}
  function scoreRecord() {
    return {partidaId:state.id,jugador:player.name||'Curaca visitante',colegio:player.school||'Visitante de la Comunidad',puntaje:E.score(state),resultado:state.status==='won'?'Victoria · Coricancha v2':'Fin del ayllu · v2 (Mes '+state.month+')',meses:state.month,poblacion:state.population,alimento:state.food,fe:state.faith,fecha:new Date().toISOString()};
  }
  function scoreFor(id) {return scoreSession.get(id)||localScores().find(row=>row.partidaId===id);}
  function persistScore(record) {
    const rows=localScores(),index=rows.findIndex(row=>row.partidaId===record.partidaId);
    const copy={...record};delete copy.localSaved;
    if(index>=0)rows[index]=copy;else rows.push(copy);
    const localSaved=storage.set('inca_local_scores',JSON.stringify(rows));
    scoreSession.set(record.partidaId,{...copy,localSaved});return localSaved;
  }
  function saveScore() {
    if(!scoreFor(state.id))persistScore(scoreRecord());
  }
  function showFinal() {pause();saveScore();openPanel('final');if(state.status==='won'){soundNote(true);vibrate([25,60,25]);}}
  function renderFinal() {
    const won=state.status==='won';
    const row=scoreFor(state.id),busy=inFlightScores.has(state.id),pending=row?.requested||row?.sent;
    const status=busy?'Consultando el servicio de clasificación…':row?.confirmed?'Resultado encontrado en la clasificación.':pending?'Envío solicitado; confirmación pendiente. Podés comprobar si aparece en la hoja.':row&&row.localSaved!==false?'Resultado guardado en este dispositivo.':'El navegador no permitió guardar el resultado; se conserva mientras esta página siga abierta.';
    setPanel('LA HISTORIA DE TU AYLLU',won?'El Coricancha se alza':'El Ayni se ha roto',`<div class="final-temple">${A.temple(won?100:state.temple)}</div><div class="final-heading"><h3>${won?'Una obra de muchas manos':'Cada historia deja una enseñanza'}</h3><p>${esc(state.cause)}</p></div><div class="final-stats"><span>Meses<b>${state.month}</b></span><span>Población<b>${state.population}</b></span><span>Ayni<b>${num(state.ayni)}</b></span><span>Saberes<b>${state.tech.length}/6</b></span><span>Crisis superadas<b>${state.crises}</b></span><span>Equilibrio<b>${E.forecast(state).equilibrium}</b></span></div><div class="final-score">PUNTAJE · REGLAS V2<strong>${num(E.score(state))}</strong></div><p class="compact-help" id="score-status" role="status" aria-live="polite">${status}</p><div class="panel-actions"><button class="primary" data-action="new">Jugar nuevamente</button><button class="secondary" data-action="${pending?'check-score':'share-score'}" ${busy||row?.confirmed?'disabled':''}>${row?.confirmed?'Puntaje registrado':pending?'Comprobar envío':'Compartir puntaje'}</button><a href="tablero.html">Clasificación ↗</a></div>${pending&&!row?.confirmed?`<div class="panel-actions"><button class="secondary" data-action="retry-score" ${busy?'disabled':''}>Reintentar envío…</button></div>`:''}<div class="panel-actions"><button class="secondary" data-action="journal">Leer la crónica</button><button class="secondary" data-action="menu">Volver al inicio</button></div>`);
  }
  function scoreApiUrl() {
    const configured=storage.get('inca_google_script_url');
    return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(configured||'')?configured:DEFAULT_API;
  }
  async function confirmScore(payload,url) {
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url||''))return false;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(url+'?action=getScores&t='+Date.now(),{signal:controller.signal,cache:'no-store'});
      if(!response.ok)return false;
      const json=await response.json();
      if(json?.success!==true||!Array.isArray(json.data))return false;
      // The existing Sheets API has no partidaId column. Match its public fields.
      return json.data.some(row=>row&&String(row.jugador).trim()===payload.jugador.trim()&&String(row.colegio).trim().toUpperCase()===payload.colegio.trim().toUpperCase()&&row.resultado===payload.resultado&&['puntaje','meses','poblacion','alimento','fe'].every(key=>Number(row[key])===Math.trunc(payload[key])));
    } catch {return false;} finally {clearTimeout(timeout);}
  }
  function updateScoreFeedback(id,message) {
    if(state.id!==id||panelKind!=='final'||!panel.open)return;
    renderFinal();if(message&&$('score-status'))$('score-status').textContent=message;
  }
  async function checkScore() {
    if(state.status==='playing')return;
    const id=state.id,row=scoreFor(id);
    if(!row||inFlightScores.has(id)||row.confirmed)return;
    if(panelKind!=='final')openPanel('final');
    inFlightScores.add(id);updateScoreFeedback(id);
    const confirmed=await confirmScore(row,row.requestUrl||scoreApiUrl());
    if(confirmed)persistScore({...scoreFor(id),confirmed:true});
    inFlightScores.delete(id);
    updateScoreFeedback(id,confirmed?'Resultado encontrado en la clasificación.':'Todavía no pudimos encontrar este resultado en la hoja. Podés comprobar más tarde o reintentar el envío.');
  }
  async function shareScore(force=false) {
    if(state.status==='playing')return;
    if(!player.name||!player.school){finalReturn=true;openPanel('register');return;}
    const id=state.id,previous=scoreFor(id);
    if(inFlightScores.has(id)||previous?.confirmed)return;
    if((previous?.requested||previous?.sent)&&!force)return checkScore();
    const payload={...scoreRecord(),fecha:previous?.fecha||new Date().toISOString()},url=scoreApiUrl();
    inFlightScores.add(id);
    // A timeout can happen after the server stores a score, so preserve the attempt.
    persistScore({...payload,requested:true,confirmed:false,requestUrl:url});
    updateScoreFeedback(id,'Solicitando el envío a la clasificación…');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    let received=false,confirmed=false;
    try {
      await fetch(url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:controller.signal});
      received=true;
    } catch { /* An opaque or interrupted response does not prove storage. */ }
    finally {clearTimeout(timeout);}
    if(received)confirmed=await confirmScore(payload,url);
    if(confirmed)persistScore({...scoreFor(id),confirmed:true});
    inFlightScores.delete(id);
    updateScoreFeedback(id,confirmed?'Resultado encontrado en la clasificación.':received?'Envío solicitado, todavía sin confirmación. Podés comprobar más tarde si aparece en la hoja.':'No pudimos confirmar el envío. Podés comprobar la clasificación o reintentar; un nuevo envío podría duplicar el anterior.');
  }
  function closePanel() {panel.close();panelKind='';finalReturn=false;newWithGuide=false;}
  function handleAction(action) {
    if(['work','tech','map','ritual','balance','resources','calendar','construction','journal','glossary','register','help','new','retry-score'].includes(action)){if(action==='new')newWithGuide=false;openPanel(action);return;}
    if(action==='close')closePanel();
    else if(action==='start')start();
    else if(action==='confirm-new'){const guided=newWithGuide;newWithGuide=false;panel.close();start(true);if(guided){state.tutorial=0;save();render();openPanel('work');}}
    else if(action==='menu')returnMenu();
    else if(action==='pause')pause();
    else if(action==='play')run(1);
    else if(action==='fast')run(2);
    else if(action==='next'){if(panel.open)closePanel();nextMonth();}
    else if(action==='hanan'){closePanel();$('hanan').scrollIntoView({behavior:'smooth'});}
    else if(action==='skip-guide'){state.tutorial=4;storage.set('inca_tutorial_v2','done');save();$('guide').hidden=true;}
    else if(action==='guide-start'){
      if(state.status!=='playing'){newWithGuide=true;openPanel('new');return;}
      panel.close();state.tutorial=0;if(!playing)start();save();render();openPanel('work');
    }
    else if(action==='sound'){sound=!sound;storage.set('inca_sound',sound?'on':'off');soundNote();updateMenu();if(panelKind==='help')refreshPanel();}
    else if(action==='haptic'){haptic=!haptic;storage.set('inca_haptic',haptic?'on':'off');refreshPanel();}
    else if(action==='share-score')shareScore();
    else if(action==='check-score')checkScore();
    else if(action==='confirm-share'){openPanel('final');shareScore(true);}
    else if(action==='last-summary'){closePanel();showSummary(state.lastSummary);}
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button,a');if(!button||button.disabled)return;
    if(button.dataset.action){handleAction(button.dataset.action);return;}
    if(button.dataset.term){showTerm(button.dataset.term);return;}
    if(button.dataset.gameAction){doAction(button.dataset.gameAction);return;}
    if(button.hasAttribute('data-dedicate')){doAction('dedicate');return;}
    if(button.dataset.research){doAction('research',button.dataset.research);return;}
    if(button.dataset.connect){doAction('connect',button.dataset.connect);return;}
    if(button.dataset.role){
      const role=button.dataset.role,delta=Number(button.dataset.delta),result=E.assign(state,role,delta);
      if(!result.ok){notify(result.message,true);return;}
      if(state.tutorial===0&&role==='farmers')state.tutorial=1;
      save();render();refreshPanel();
      const replacement=panel.querySelector(`[data-role="${role}"][data-delta="${delta}"]`);if(replacement&&!replacement.disabled)replacement.focus();
      return;
    }
    if(button.dataset.choice){const result=E.choose(state,button.dataset.choice);if(!result.ok){notify(result.message,true);return;}$('event-dialog').close();save();render();notify(result.message);soundNote();return;}
  });
  document.addEventListener('input',event=>{if(event.target.id==='glossary-search')$('glossary-list').innerHTML=glossaryItems(event.target.value);});
  document.addEventListener('change',event=>{if(event.target.id==='player-school'){const custom=event.target.value==='__other__';$('other-school-wrap').hidden=!custom;$('other-school').required=custom;if(custom)$('other-school').focus();}});
  document.addEventListener('submit',event=>{
    if(event.target.id!=='player-form')return;event.preventDefault();
    const name=$('player-name').value.trim(),selection=$('player-school').value,school=selection==='__other__'?$('other-school').value.trim():selection;
    if(!name||!school){notify('Completá el nombre y la institución.',true);return;}
    player.name=name;player.school=school;const okName=storage.set('inca_jugador_nombre',name),okSchool=storage.set('inca_jugador_colegio',school);
    updateMenu();
    if(finalReturn){finalReturn=false;openPanel('final');}else closePanel();
    notify(okName&&okSchool?'Tu nombre de Curaca quedó guardado.':'Curaca actualizado para esta sesión; el navegador no permitió guardarlo.',!okName||!okSchool);
  });
  $('event-dialog').addEventListener('cancel',event=>event.preventDefault());
  panel.addEventListener('cancel',()=>{panelKind='';finalReturn=false;newWithGuide=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();if(playing)save();}});
  window.addEventListener('pagehide',()=>{pause();if(playing)save();});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('.pacha-nav a').forEach(link=>link.classList.toggle('active',link.hash==='#'+entry.target.id));});},{rootMargin:'-20% 0px -50% 0px'});document.querySelectorAll('.world').forEach(world=>observer.observe(world));}
  $('menu-art').innerHTML=A.landscape();$('landscape').innerHTML=A.landscape();$('menu-temple').innerHTML=A.temple(100);hydrateIcons();updateMenu();render();
})();
