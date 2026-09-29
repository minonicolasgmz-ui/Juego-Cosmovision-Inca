'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('./engine.js');

const copy = value => JSON.parse(JSON.stringify(value));
function invariants(state) {
  const forecast = E.forecast(state);
  assert.ok(Number.isFinite(state.food) && state.food >= 0);
  assert.ok(Number.isFinite(state.faith) && state.faith >= 0);
  assert.ok(state.ayni >= 0 && state.ayni <= 100);
  assert.ok(state.temple >= 0 && state.temple <= 100);
  assert.ok(forecast.available >= 0);
  assert.ok(Object.values(state.workers).every(n => Number.isInteger(n) && n >= 0));
  assert.ok(Object.values(state.worlds).every(n => Number.isFinite(n) && n >= 0 && n <= 100));
  assert.equal(Object.values(state.workers).reduce((a, b) => a + b, 0) + forecast.available + (state.mita ? 3 : 0), state.population);
  assert.ok(state.history.length <= 80);
}
function resolveFree(state) {
  const event = E.getEvent(state);
  if (event) {
    const option = event.choices.find(c => !c.disabled && c.food === 0 && c.faith === 0);
    assert.ok(option, event.id + ' needs a free available fallback');
    assert.ok(E.choose(state, option.id).ok);
  }
}
function reach(state, month) {
  while (state.month < month) {
    resolveFree(state);
    assert.ok(E.advance(state).ok);
    assert.equal(state.status, 'playing');
  }
}

test('new games are independent and forecasting does not mutate state', () => {
  const state = E.createState();
  assert.equal(state.version, 2);
  assert.equal(state.population, 15);
  assert.equal(state.workers.farmers, 5);
  const before = copy(state);
  const f = E.forecast(state);
  assert.equal(f.available, 9);
  assert.equal(f.consumption, 30);
  assert.equal(f.detailed, false);
  assert.equal(f.capacity, 180);
  assert.deepEqual(state, before);
  const other = E.createState();
  other.worlds.hanan = 0;
  assert.equal(state.worlds.hanan, 65);
});

test('allocation conserves people and rejects impossible, fractional and unknown assignments', () => {
  const state = E.createState();
  assert.equal(E.assign(state, 'builders', 1).ok, false);
  assert.equal(E.assign(state, 'farmers', 0.5).ok, false);
  assert.equal(E.assign(state, 'farmers', NaN).ok, false);
  assert.equal(E.assign(state, '__proto__', 1).ok, false);
  assert.ok(E.assign(state, 'farmers', 9).ok);
  const before = copy(state);
  assert.equal(E.assign(state, 'priests', 1).ok, false);
  assert.equal(E.assign(state, 'farmers', -15).ok, false);
  assert.deepEqual(state, before);
  assert.ok(E.assign(state, 'farmers', -3).ok);
  assert.ok(E.assign(state, 'priests', 3).ok);
  invariants(state);
});

test('monthly forecast accounts exactly for consumption, construction and storage loss', () => {
  for (const food of [0, 20, 100, 180, 350]) {
    for (const tech of [[], ['quipu'], ['quipu', 'qollqa', 'masonry']]) {
      const state = E.createState();
      Object.assign(state, { month: 4, food, tech });
      state.workers = { farmers: 8, priests: 2, builders: 3 };
      const f = E.forecast(state);
      const initialFaith = state.faith;
      const result = E.advance(state);
      assert.equal(state.food, Math.round(Math.max(0, food + f.net) * 10) / 10);
      assert.equal(state.faith, initialFaith + f.faith);
      assert.equal(state.temple, f.construction);
      assert.equal(result.summary.loss, f.loss);
      assert.ok(state.food <= f.capacity);
      invariants(state);
    }
  }
});

test('rituals have real costs, monthly cooldowns and no magical hunger reduction', () => {
  const state = E.createState();
  state.month = 3;
  const consumption = E.forecast(state).consumption;
  assert.ok(E.act(state, 'offering').ok);
  assert.equal(state.food, 88);
  assert.equal(state.faith, 47);
  const beforeRepeat = copy(state);
  assert.equal(E.act(state, 'offering').ok, false);
  assert.deepEqual(state, beforeRepeat);
  assert.ok(E.act(state, 'ancestors').ok);
  assert.equal(E.forecast(state).consumption, consumption);
  assert.ok(E.advance(state).ok);
  assert.ok(E.act(state, 'offering').ok);
  assert.ok(E.act(state, 'rest').ok);
  const beforeOpposite = copy(state);
  assert.equal(E.act(state, 'intensify').ok, false);
  assert.deepEqual(state, beforeOpposite);
});

test('knowledge prerequisites, costs and construction gates cannot be bypassed', () => {
  const state = E.createState();
  Object.assign(state, { month: 10, food: 500, faith: 200, temple: 50 });
  state.workers.builders = 4;
  assert.equal(E.forecast(state).construction, 0);
  const before = copy(state);
  assert.equal(E.act(state, 'research', 'masonry').ok, false);
  assert.deepEqual(state, before);
  assert.ok(E.act(state, 'research', 'quipu').ok);
  assert.equal(state.food, 455);
  assert.equal(state.faith, 190);
  assert.ok(E.act(state, 'research', 'masonry').ok);
  assert.equal(E.forecast(state).construction, 4);
  assert.equal(E.act(state, 'research', 'masonry').ok, false);
  assert.equal(E.act(state, 'research', 'unknown').ok, false);
});

test('fractional temple progress reaches completion and unknown route keys are harmless', () => {
  const state = E.createState();
  Object.assign(state, { month: 14, food: 100, temple: 99.9, tech: ['quipu', 'masonry'] });
  state.workers = { farmers: 8, priests: 2, builders: 3 };
  const before = copy(state);
  for (const id of ['unknown', '__proto__', 'constructor', 'toString']) assert.equal(E.act(state, 'connect', id).ok, false);
  assert.deepEqual(state, before);
  assert.equal(E.forecast(state).construction, 0.1);
  E.advance(state);
  assert.equal(state.temple, 100);
});

test('quipu improves information and storage, without changing people’s food needs', () => {
  const state = E.createState();
  state.food = 150;
  const before = E.forecast(state);
  state.tech.push('quipu');
  const after = E.forecast(state);
  assert.equal(after.consumption, before.consumption);
  assert.equal(after.production, before.production);
  assert.equal(after.detailed, true);
  assert.ok(after.spoilage < before.spoilage);
  state.tech.push('qollqa');
  assert.equal(E.forecast(state).capacity, 400);
});

test('mita withdraws three workers and returns them unassigned after exactly three months', () => {
  const state = E.createState();
  state.workers.farmers = 12;
  reach(state, 5);
  assert.equal(state.pendingEvent, 'mita');
  assert.ok(E.choose(state, 'accept').ok);
  assert.deepEqual(state.mita, { workers: 3, remaining: 3 });
  assert.equal(state.population, 15);
  assert.ok(E.forecast(state).available >= 0);
  assert.equal(E.assign(state, 'farmers', 1).ok, false);
  assert.ok(E.advance(state).ok);
  assert.equal(state.mita.remaining, 2);
  assert.ok(E.advance(state).ok);
  assert.equal(state.mita.remaining, 1);
  assert.equal(state.pendingEvent, 'rain');
  assert.ok(E.choose(state, 'wait').ok);
  const beforeReturn = E.forecast(state).available;
  assert.ok(E.advance(state).ok);
  assert.equal(state.month, 8);
  assert.equal(state.mita, null);
  assert.equal(state.flags.road, true);
  assert.equal(E.forecast(state).available, beforeReturn + 3);
  invariants(state);
});

test('population loss during mita releases jobs before workers return', () => {
  const state = E.createState();
  Object.assign(state, { month: 5, food: 0, pendingEvent: 'mita' });
  state.workers = { farmers: 0, priests: 15, builders: 0 };
  assert.ok(E.choose(state, 'accept').ok);
  assert.equal(state.workers.priests, 12);
  E.advance(state);
  invariants(state);
  E.advance(state);
  assert.equal(state.population, 14);
  assert.equal(state.mita.workers, 3);
  assert.equal(state.workers.priests, 11);
  assert.equal(E.forecast(state).available, 0);
  invariants(state);
  resolveFree(state);
  E.advance(state);
  assert.equal(state.mita, null);
  assert.equal(state.population, 13);
  invariants(state);
});

test('the rain decision changes drought options and protected reserves are paid only once', () => {
  const state = E.createState();
  state.workers.farmers = 11;
  reach(state, 7);
  assert.equal(state.pendingEvent, 'rain');
  const food = state.food;
  assert.ok(E.choose(state, 'store').ok);
  assert.equal(state.food, food - 30);
  assert.equal(state.flags.emergencyCache, 30);
  reach(state, 9);
  assert.equal(state.pendingEvent, 'drought');
  assert.match(E.getEvent(state).description, /separaste/);
  const beforeReserve = state.food;
  assert.ok(E.choose(state, 'reserve').ok);
  assert.equal(state.food, beforeReserve + 30);
  assert.equal(state.flags.emergencyCache, 0);
  assert.equal(E.choose(state, 'reserve').ok, false);
  assert.ok(E.forecast(state).modifiers.includes('Sequía'));
  E.advance(state);
  assert.ok(E.forecast(state).modifiers.includes('Sequía'));
  E.advance(state);
  assert.ok(!E.forecast(state).modifiers.includes('Sequía'));
});

test('helping a neighboring ayllu creates a later reciprocal event and permanent exchange', () => {
  const state = E.createState();
  state.workers = { farmers: 10, priests: 2, builders: 0 };
  reach(state, 12);
  assert.equal(state.pendingEvent, 'neighbor');
  assert.ok(E.choose(state, 'help').ok);
  assert.equal(state.flags.repayMonth, 16);
  reach(state, 16);
  assert.equal(state.pendingEvent, 'repay');
  const before = state.food;
  assert.ok(E.choose(state, 'receive').ok);
  assert.equal(state.food, before + 55);
  assert.ok(state.connections.includes('neighbor'));
  assert.equal(state.flags.repayMonth, 0);
});

test('every event has a free fallback; unaffordable and unknown decisions cannot dismiss it', () => {
  for (const id of ['mita', 'rain', 'drought', 'neighbor', 'repay', 'frost', 'migration', 'festival']) {
    const state = E.createState();
    Object.assign(state, { pendingEvent: id, food: 0, faith: 0, month: 12 });
    const event = E.getEvent(state);
    const disabled = event.choices.find(option => option.disabled);
    if (disabled) {
      const before = copy(state);
      assert.equal(E.choose(state, disabled.id).ok, false);
      assert.deepEqual(state, before);
    }
    assert.equal(E.choose(state, 'invalid').ok, false);
    assert.equal(E.advance(state).ok, false);
    assert.equal(E.act(state, 'rest').ok, false);
    assert.equal(E.assign(state, 'farmers', 1).ok, false);
    assert.equal(state.pendingEvent, id);
    resolveFree(state);
    assert.equal(state.pendingEvent, null);
    invariants(state);
  }
});

test('persistent famine and broken cohesion produce explicit defeat while brief hunger is recoverable', () => {
  const starving = E.createState();
  starving.food = 0;
  starving.workers.farmers = 0;
  E.advance(starving);
  assert.equal(starving.status, 'playing');
  E.advance(starving);
  assert.equal(starving.status, 'playing');
  E.advance(starving);
  assert.equal(starving.status, 'lost');
  assert.match(starving.cause, /tres meses/);
  const final = copy(starving);
  assert.equal(E.advance(starving).ok, false);
  assert.equal(E.act(starving, 'rest').ok, false);
  assert.deepEqual(starving, final);
  invariants(starving);

  const recovery = E.createState();
  recovery.food = 0; recovery.workers.farmers = 0;
  E.advance(recovery);
  assert.ok(E.assign(recovery, 'farmers', 10).ok);
  E.advance(recovery);
  assert.equal(recovery.flags.hunger, 0);
  assert.equal(recovery.status, 'playing');

  const conflict = E.createState();
  conflict.ayni = 0; conflict.workers.farmers = 9;
  E.advance(conflict); E.advance(conflict);
  assert.equal(conflict.status, 'lost');
  assert.match(conflict.cause, /cooperación/);
});

test('victory requires every world, shared reserves, faith and social cohesion', () => {
  const state = E.createState();
  Object.assign(state, { temple: 100, food: 100, faith: 80, ayni: 60 });
  state.worlds = { hanan: 100, kay: 100, uku: 44 };
  assert.equal(E.victoryRequirements(state).ready, false);
  assert.equal(E.act(state, 'dedicate').ok, false);
  state.worlds.uku = 45;
  state.ayni = 59;
  assert.equal(E.victoryRequirements(state).ready, false);
  state.ayni = 60;
  assert.ok(E.victoryRequirements(state).ready);
  assert.ok(E.act(state, 'dedicate').ok);
  assert.equal(state.status, 'won');
  assert.equal(state.food, 0);
  assert.equal(state.faith, 0);
  assert.equal(E.act(state, 'dedicate').ok, false);
});

test('all paid actions, worker changes and event decisions are blocked after either ending', () => {
  for (const status of ['won', 'lost']) {
    const state = E.createState();
    Object.assign(state, { status, food: 500, faith: 500, month: 20, pendingEvent: 'festival' });
    state.flags.road = true;
    const before = copy(state);
    for (const action of ['offering', 'ancestors', 'redistribute', 'rest', 'intensify', 'dedicate']) assert.equal(E.act(state, action).ok, false);
    assert.equal(E.act(state, 'research', 'quipu').ok, false);
    assert.equal(E.act(state, 'connect', 'puna').ok, false);
    assert.equal(E.assign(state, 'farmers', 1).ok, false);
    assert.equal(E.choose(state, 'celebrate').ok, false);
    assert.equal(E.advance(state).ok, false);
    assert.deepEqual(state, before);
  }
});

test('save hydration preserves a real game while rejecting invalid versions and unsafe data', () => {
  const state = E.createState();
  state.workers.farmers = 10;
  reach(state, 5);
  E.choose(state, 'accept');
  E.advance(state);
  const restored = E.restoreState(copy(state));
  assert.deepEqual(restored, state);
  assert.equal(E.restoreState(null), null);
  assert.equal(E.restoreState({ ...state, version: 1 }), null);
  assert.equal(E.restoreState({ ...state, food: NaN }), null);
  assert.equal(E.restoreState({ ...state, workers: {} }), null);
  const malicious = copy(state);
  malicious.workers = { farmers: 1000, priests: -3, builders: 40.7 };
  malicious.food = -100;
  malicious.worlds.uku = 1000;
  malicious.tech = ['quipu', 'quipu', '__proto__', 'terraces'];
  malicious.flags = { road: 'yes', droughtFactor: -4, surprise: 'ignored' };
  malicious.pendingEvent = '<script>';
  malicious.connections = ['__proto__', 'puna', 'puna'];
  const cleaned = E.restoreState(malicious);
  invariants(cleaned);
  assert.equal(cleaned.food, 0);
  assert.equal(cleaned.worlds.uku, 100);
  assert.deepEqual(cleaned.tech, ['quipu']);
  assert.deepEqual(cleaned.connections, ['puna']);
  assert.equal(cleaned.pendingEvent, null);
  assert.equal(cleaned.flags.surprise, undefined);
});

test('reloading preserves an unresolved event and action cooldowns without bypasses', () => {
  const state = E.createState();
  state.workers.farmers = 10;
  reach(state, 5);
  const restored = E.restoreState(copy(state));
  assert.equal(restored.pendingEvent, 'mita');
  assert.equal(E.advance(restored).ok, false);
  assert.equal(E.act(restored, 'redistribute').ok, false);
  assert.equal(E.assign(restored, 'farmers', -1).ok, false);
  assert.ok(E.choose(restored, 'accept').ok);
  assert.ok(E.act(restored, 'offering').ok);
  const reloadedAgain = E.restoreState(copy(restored));
  const before = copy(reloadedAgain);
  assert.equal(E.act(reloadedAgain, 'offering').ok, false);
  assert.deepEqual(reloadedAgain, before);
  assert.deepEqual(reloadedAgain.mita, { workers: 3, remaining: 3 });
});

function playCampaign(overrides = {}) {
  const state = E.createState();
  const choices = {
    mita: ['accept'], rain: ['canals', 'gather', 'wait'], drought: ['irrigate', 'cooperate', 'reserve', 'endure'],
    neighbor: ['help', 'limited', 'decline'], repay: ['receive'], frost: ['protect', 'network', 'endure'],
    migration: ['supply', 'decline'], festival: ['celebrate', 'remember', 'simple'], ...overrides
  };
  while (state.status === 'playing' && state.month <= 60) {
    const event = E.getEvent(state);
    if (event) {
      const id = choices[event.id].find(id => !event.choices.find(c => c.id === id).disabled);
      assert.ok(E.choose(state, id).ok);
    }
    const targets = { farmers: state.mita ? 7 : 8, priests: 2, builders: state.month >= 3 ? (state.mita ? 1 : 3) : 0 };
    for (const role of ['builders', 'priests', 'farmers']) {
      if (state.workers[role] > targets[role]) assert.ok(E.assign(state, role, targets[role] - state.workers[role]).ok);
    }
    for (const role of ['farmers', 'priests', 'builders']) {
      if (state.workers[role] < targets[role]) {
        const amount = Math.min(E.forecast(state).available, targets[role] - state.workers[role]);
        if (amount) assert.ok(E.assign(state, role, amount).ok);
      }
    }
    for (const id of ['quipu', 'canals', 'qollqa', 'terraces', 'masonry', 'chasquis']) {
      const tech = E.technologies.find(t => t.id === id);
      if (state.food > tech.food + 40) E.act(state, 'research', id);
    }
    if (state.flags.road && state.food > 110) E.act(state, 'connect', 'puna');
    if (state.ayni < 70 && state.food > 65) E.act(state, 'redistribute');
    if (state.worlds.uku < 60 && state.faith > 25) E.act(state, 'ancestors');
    if ((state.worlds.hanan < 55 || state.faith < 30) && state.food > 65) E.act(state, 'offering');
    invariants(state);
    if (E.victoryRequirements(state).ready) { E.act(state, 'dedicate'); break; }
    assert.ok(E.advance(state).ok);
    invariants(state);
    // Saving and reloading every turn must not change the campaign.
    assert.deepEqual(E.restoreState(copy(state)), state);
  }
  return state;
}

test('a complete, affordable strategy wins in 35–55 months through ordinary public actions', () => {
  const state = playCampaign();
  assert.equal(state.status, 'won');
  assert.ok(state.month >= 35 && state.month <= 55, 'campaign ended in month ' + state.month);
  assert.ok(state.tech.includes('masonry'));
  assert.ok(state.flags.road);
  assert.ok(state.crises >= 3);
  assert.equal(state.month, playCampaign().month);
  assert.ok(E.score(state) > 5000);
});

test('declining mita and weather preparation is recoverable through a different affordable strategy', () => {
  const state = playCampaign({ mita: ['decline'], rain: ['wait'], drought: ['endure'], neighbor: ['limited', 'decline'], frost: ['endure'], festival: ['simple'] });
  assert.equal(state.status, 'won');
  assert.ok(state.month >= 35 && state.month <= 55, 'imperfect campaign ended in month ' + state.month);
  assert.ok(state.flags.mitaDeclined);
  assert.ok(state.tech.includes('chasquis'));
  assert.equal(state.flags.rainPlan, 'wait');
});

test('varied action sequences keep resources and workers valid and scoring does not reward idle time', () => {
  let seed = 9026;
  const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let campaign = 0; campaign < 20; campaign++) {
    const state = E.createState();
    for (let turn = 0; turn < 60 && state.status === 'playing'; turn++) {
      const event = E.getEvent(state);
      if (event) {
        const valid = event.choices.filter(c => !c.disabled);
        assert.ok(E.choose(state, valid[random(valid.length)].id).ok);
      }
      for (let action = 0; action < 8; action++) {
        if (random(2)) E.assign(state, ['farmers', 'priests', 'builders'][random(3)], random(2) ? 1 : -1);
        else E.act(state, ['offering', 'ancestors', 'redistribute', 'rest', 'intensify'][random(5)]);
        invariants(state);
      }
      E.advance(state);
      invariants(state);
    }
  }
  const state = E.createState();
  const initialScore = E.score(state);
  state.month = 500;
  assert.equal(E.score(state), initialScore);
});
