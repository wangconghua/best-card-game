// Ember Court rendering: the whole table is drawn from the game state, so
// every screen — title, mid-duel, victory, defeat — is one render function
// reading the same state the rules produce. Re-rendering is cheap and total,
// which keeps the picture and the rules from ever disagreeing.

import { CONFIG, HOUSES } from './config.js';

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function houseClass(card) {
  return `house-${card.house}`;
}

function cardHtml(card, opts = {}) {
  const house = HOUSES[card.house];
  const stats =
    card.type === 'creature'
      ? `<div class="card-stats"><span>⚔ ${card.attack}</span><span>♥ ${card.health}</span></div>`
      : `<div class="card-stats"><span>${card.type === 'ward' ? '🛡 shield' : '✦ trick'}</span></div>`;
  const playable = opts.playable ? ' playable' : '';
  const selected = opts.selected ? ' selected' : '';
  const keyBadge = opts.key ? `<div class="card-key">${opts.key}</div>` : '';
  const attrs = opts.attrs || '';
  return `<div class="card ${houseClass(card)}${playable}${selected}" ${attrs}>
    <div class="card-cost" title="Ember cost">${card.cost}</div>
    ${keyBadge}
    <div class="card-symbol" style="color:${house.glow}">${house.symbol}</div>
    <div class="card-name">${esc(card.name)}</div>
    <div class="card-house">${house.symbol} ${house.name}</div>
    <div class="card-text">${esc(card.text)}</div>
    ${stats}
  </div>`;
}

function boardCreatureHtml(creature, opts = {}) {
  const house = HOUSES[creature.house];
  const ready = opts.ready ? ' ready' : '';
  const selected = opts.selected ? ' selected' : '';
  const attrs = opts.attrs || '';
  return `<div class="creature ${houseClass(creature)}${ready}${selected}" ${attrs}>
    <div class="creature-symbol" style="color:${house.glow}">${house.symbol}</div>
    <div class="creature-name">${esc(creature.name)}</div>
    <div class="creature-stats"><span>⚔ ${creature.attack}</span><span>♥ ${creature.hp}</span></div>
    ${creature.canAttack ? '' : '<div class="creature-rest">resting</div>'}
  </div>`;
}

function lifeBar(player) {
  const pct = Math.max(0, Math.min(100, (player.life / CONFIG.startLife) * 100));
  return `<div class="life-wrap">
    <div class="life-num">♥ ${player.life}</div>
    <div class="life-bar"><div class="life-fill" style="width:${pct}%"></div></div>
    ${player.shield > 0 ? `<div class="shield">🛡 ${player.shield}</div>` : ''}
  </div>`;
}

function emberPips(player) {
  let pips = '';
  for (let i = 0; i < CONFIG.maxEmber; i += 1) {
    const lit = i < player.ember;
    const slot = i < player.maxEmber;
    pips += `<span class="pip${lit ? ' lit' : ''}${slot ? '' : ' empty'}">●</span>`;
  }
  return `<div class="ember" title="Ember: ${player.ember} of ${player.maxEmber}">Ember ${player.ember}/${player.maxEmber}<div class="pips">${pips}</div></div>`;
}

export function render(state, ui) {
  const app = document.getElementById('app');
  const me = state.players[0];
  const rival = state.players[1];
  const myTurn = state.phase === 'play' && state.active === 0;

  const rivalHandBacks = rival.hand.map(() => '<div class="card-back">✦</div>').join('');
  const rivalBoard = rival.board
    .map((creature, i) =>
      boardCreatureHtml(creature, {
        attrs: `data-rival-board="${i}" title="${esc(creature.name)} — click to attack it"`,
      }),
    )
    .join('');
  const myBoard = me.board
    .map((creature, i) =>
      boardCreatureHtml(creature, {
        ready: myTurn && creature.canAttack,
        selected: ui.selectedAttacker === i,
        attrs: `data-my-board="${i}" title="${esc(creature.name)} — click to attack with it"`,
      }),
    )
    .join('');
  const myHand = me.hand
    .map((card, i) => {
      const playable = myTurn && card.cost <= me.ember && !(card.type === 'creature' && me.board.length >= CONFIG.maxBoard);
      return cardHtml(card, {
        playable,
        selected: ui.selectedHand === i,
        key: i < 5 ? String(i + 1) : null,
        attrs: `data-hand="${i}" title="Click to play — or press ${i + 1}"`,
      });
    })
    .join('');

  const logLines = state.log.slice(-6).map((line) => `<div class="log-line">${esc(line)}</div>`).join('');

  const hint = !myTurn
    ? 'Duchess Cinder is thinking…'
    : ui.selectedAttacker !== null
      ? 'Choose a target: a rival creature, or the Duchess herself.'
      : 'Click a card to play it. Click one of your creatures, then a target, to attack.';

  app.innerHTML = `
    <header class="topbar">
      <div class="brand">🔥 EMBER COURT</div>
      <div class="turn-label">${state.phase === 'over' ? 'The duel is decided' : myTurn ? 'Your turn — Turn ' + state.turn : 'Duchess Cinder’s turn'}</div>
      <button id="mute-btn" class="icon-btn" title="Mute (M)">${ui.muted ? '🔇 muted' : '🔊 sound'}</button>
    </header>

    <section class="side rival-side">
      <div class="portrait rival-portrait" data-rival-hero="1" title="Duchess Cinder — click to attack her directly">
        <div class="portrait-glyph">👑</div>
        <div class="portrait-name">Duchess Cinder</div>
        <div class="portrait-sub">Rival · AI</div>
      </div>
      <div class="side-info">
        ${lifeBar(rival)}
        ${emberPips(rival)}
        <div class="deck-count">Deck ${rival.deck.length} · Hand ${rival.hand.length}</div>
      </div>
      <div class="hand-backs">${rivalHandBacks}</div>
      <div class="board">${rivalBoard || '<div class="board-empty">No creatures yet</div>'}</div>
    </section>

    <section class="middle">
      <div class="log">${logLines}</div>
      <div class="middle-actions">
        <div class="hint">${esc(hint)}</div>
        <button id="end-turn-btn" class="end-turn" ${myTurn ? '' : 'disabled'}>End Turn ⏎</button>
      </div>
    </section>

    <section class="side player-side">
      <div class="board">${myBoard || '<div class="board-empty">Your side of the table is empty — summon a creature.</div>'}</div>
      <div class="hand">${myHand}</div>
      <div class="side-info">
        <div class="portrait player-portrait">
          <div class="portrait-glyph">🕯️</div>
          <div class="portrait-name">the Kindler</div>
          <div class="portrait-sub">You</div>
        </div>
        ${lifeBar(me)}
        ${emberPips(me)}
        <div class="deck-count">Deck ${me.deck.length} · Hand ${me.hand.length}</div>
      </div>
    </section>

    <div class="overlay${state.phase === 'title' ? ' show' : ''}" id="title-overlay">
      <div class="panel">
        <div class="panel-eyebrow">A turn-based card duel</div>
        <h1>🔥 EMBER COURT 🔥</h1>
        <p class="panel-text">You are <b>the Kindler</b>. Across the table sits <b>Duchess Cinder</b>,
        and the court of ember-spirits is watching. Spend ember, summon creatures of
        Flame ▲, Tide ●, Thorn ◆ and Star ★, and bring her life to zero before she
        brings yours to zero.</p>
        <p class="panel-text small">Both duelists begin at 30 life. Ember starts at 1 and grows
        each turn, up to 10. Draw a card every turn; creatures cannot attack the
        turn they are played.</p>
        <button id="begin-btn" class="big-btn">Begin the Duel</button>
        <p class="panel-text small">Mouse to play and attack · Keys 1–5 play a card · Enter ends the turn · M mutes</p>
      </div>
    </div>

    <div class="overlay${state.phase === 'over' ? ' show' : ''}" id="end-overlay">
      <div class="panel">
        <div class="panel-eyebrow">${state.winner === 0 ? 'The court is yours' : 'The court keeps its Duchess'}</div>
        <h1>${state.winner === 0 ? '👑 VICTORY 👑' : '🥀 DEFEAT 🥀'}</h1>
        <p class="panel-text">${state.winner === 0
          ? 'Duchess Cinder bows, her embers guttering out. The Kindler takes the Ember Court.'
          : 'Your last ember fades. Duchess Cinder keeps her throne — for now.'}</p>
        <p class="panel-text">Final life — You ${me.life} · Duchess Cinder ${rival.life} · ${state.turn} turns</p>
        <button id="again-btn" class="big-btn">Duel Again</button>
      </div>
    </div>`;
}
