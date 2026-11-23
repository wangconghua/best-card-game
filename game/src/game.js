// Ember Court rules: the state machine for a turn-based card duel.
//
// A game is a plain object. Two players sit across the table — index 0 is
// the human Kindler, index 1 is Duchess Cinder, the AI rival — each with a
// life total, a shield that soaks damage first, an ember well that refills
// every turn, a deck, a hand and a board of at most five creatures.
//
// Turns flow like this: a player's ember grows by one (up to ten) and
// refills, they draw a card, their creatures wake up ready to attack, they
// play cards and attack, then the turn passes. When a deck runs dry the
// discard pile is shuffled back in, so a duel can never stall for want of
// cards. A life total of zero ends the game at once.

import { CONFIG, PLAYER_NAME, RIVAL_NAME } from './config.js';
import { buildDeck } from './deck.js';
import { makeRng } from './random.js';
import { takeTurn } from './ai.js';

function freshPlayer(name, isAI, rng) {
  const deck = buildDeck(rng);
  const player = {
    name,
    isAI,
    life: CONFIG.startLife,
    shield: 0,
    ember: CONFIG.startEmber,
    maxEmber: CONFIG.startEmber,
    turnsStarted: 0,
    deck,
    hand: [],
    board: [],
    discard: [],
  };
  return player;
}

export function createGame(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    phase: 'play',
    active: 0,
    turn: 1,
    winner: null,
    log: [],
    players: [freshPlayer(PLAYER_NAME, false, rng), freshPlayer(RIVAL_NAME, true, rng)],
  };
  // Opening hands.
  for (let i = 0; i < CONFIG.handSize; i += 1) {
    drawCard(state, 0);
    drawCard(state, 1);
  }
  startTurn(state, 0);
  log(state, `${PLAYER_NAME} kindles the first ember. The duel begins.`);
  return state;
}

export function log(state, message) {
  state.log.push(message);
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
}

export function drawCard(state, playerIndex) {
  const player = state.players[playerIndex];
  if (player.deck.length === 0) {
    if (player.discard.length === 0) return null;
    player.deck = player.discard;
    player.discard = [];
    // Re-shuffle with a fresh deterministic stream so staging stays stable.
    const rng = makeRng(state.seed + 7919 + player.deck.length);
    for (let i = player.deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
    }
    log(state, `${player.name}'s discard pile is kindled anew into a deck.`);
  }
  const card = player.deck.pop();
  if (player.hand.length >= CONFIG.maxHand) {
    player.discard.push(card);
    log(state, `${player.name}'s hand is full — ${card.name} burns away.`);
    return null;
  }
  player.hand.push(card);
  return card;
}

export function startTurn(state, playerIndex) {
  const player = state.players[playerIndex];
  player.turnsStarted += 1;
  player.maxEmber = Math.min(CONFIG.maxEmber, player.turnsStarted);
  player.ember = player.maxEmber;
  for (const creature of player.board) creature.canAttack = true;
  // The very first turn of the game opens with the dealt hand; every turn
  // after that draws a card.
  if (!(playerIndex === 0 && player.turnsStarted === 1)) drawCard(state, playerIndex);
  state.active = playerIndex;
}

export function canPlay(state, playerIndex, handIndex) {
  if (state.phase !== 'play' || state.active !== playerIndex) return { ok: false, why: 'not your turn' };
  const player = state.players[playerIndex];
  const card = player.hand[handIndex];
  if (!card) return { ok: false, why: 'no such card' };
  if (card.cost > player.ember) return { ok: false, why: 'not enough ember' };
  if (card.type === 'creature' && player.board.length >= CONFIG.maxBoard) {
    return { ok: false, why: 'your side of the table is full' };
  }
  return { ok: true };
}

export function playCard(state, playerIndex, handIndex) {
  const check = canPlay(state, playerIndex, handIndex);
  if (!check.ok) return check;
  const player = state.players[playerIndex];
  const rival = state.players[1 - playerIndex];
  const card = player.hand.splice(handIndex, 1)[0];
  player.ember -= card.cost;

  if (card.type === 'creature') {
    player.board.push({ ...card, hp: card.health, maxHp: card.health, canAttack: false });
    log(state, `${player.name} summons ${card.name} (${card.attack}/${card.health}).`);
  } else if (card.type === 'trick') {
    if (card.damage) {
      dealDamageToHero(state, 1 - playerIndex, card.damage, `${player.name}'s ${card.name} strikes ${rival.name} for ${card.damage}.`);
    }
    if (card.heal) {
      player.life = Math.min(CONFIG.startLife, player.life + card.heal);
      log(state, `${player.name}'s ${card.name} restores ${card.heal} life.`);
    }
    if (card.draw) {
      for (let i = 0; i < card.draw; i += 1) drawCard(state, playerIndex);
      log(state, `${player.name} draws ${card.draw} card${card.draw > 1 ? 's' : ''} from ${card.name}.`);
    }
    player.discard.push(card);
  } else if (card.type === 'ward') {
    player.shield += card.shield;
    log(state, `${player.name}'s ${card.name} raises a shield of ${card.shield}.`);
    player.discard.push(card);
  }
  return { ok: true };
}

export function dealDamageToHero(state, playerIndex, amount, message) {
  const player = state.players[playerIndex];
  let left = amount;
  if (player.shield > 0) {
    const soaked = Math.min(player.shield, left);
    player.shield -= soaked;
    left -= soaked;
  }
  if (left > 0) player.life = Math.max(0, player.life - left);
  if (message) log(state, message);
  checkEnd(state);
}

export function canAttack(state, playerIndex, boardIndex) {
  if (state.phase !== 'play' || state.active !== playerIndex) return { ok: false, why: 'not your turn' };
  const creature = state.players[playerIndex].board[boardIndex];
  if (!creature) return { ok: false, why: 'no such creature' };
  if (!creature.canAttack) return { ok: false, why: `${creature.name} is still resting` };
  return { ok: true };
}

// Attack a rival creature ({ kind: 'creature', index }) or the rival
// directly ({ kind: 'hero' }). Creatures trade blows; a creature that falls
// goes to its owner's discard pile.
export function attack(state, playerIndex, boardIndex, target) {
  const check = canAttack(state, playerIndex, boardIndex);
  if (!check.ok) return check;
  const player = state.players[playerIndex];
  const rival = state.players[1 - playerIndex];
  const attacker = player.board[boardIndex];
  attacker.canAttack = false;

  if (target.kind === 'hero') {
    dealDamageToHero(state, 1 - playerIndex, attacker.attack, `${attacker.name} strikes ${rival.name} for ${attacker.attack}.`);
    return { ok: true };
  }

  const defender = rival.board[target.index];
  if (!defender) return { ok: false, why: 'no such target' };
  defender.hp -= attacker.attack;
  attacker.hp -= defender.attack;
  log(state, `${attacker.name} clashes with ${defender.name} (${attacker.attack} vs ${defender.attack}).`);
  if (defender.hp <= 0) {
    rival.board.splice(target.index, 1);
    rival.discard.push(defender);
    log(state, `${defender.name} crumbles to embers.`);
  }
  if (attacker.hp <= 0) {
    player.board.splice(boardIndex, 1);
    player.discard.push(attacker);
    log(state, `${attacker.name} crumbles to embers.`);
  }
  checkEnd(state);
  return { ok: true };
}

export function totalFaceDamage(state, playerIndex) {
  return state.players[playerIndex].board
    .filter((creature) => creature.canAttack)
    .reduce((sum, creature) => sum + creature.attack, 0);
}

function checkEnd(state) {
  if (state.phase !== 'play') return;
  for (let i = 0; i < 2; i += 1) {
    if (state.players[i].life <= 0) {
      state.players[i].life = 0;
      state.phase = 'over';
      state.winner = 1 - i;
      const winner = state.players[1 - i];
      log(state, `${winner.name} takes the court — ${state.players[i].name} falls.`);
      return;
    }
  }
}

// Pass the turn: the rival takes her turn, then the Kindler's next turn begins.
export function endTurn(state) {
  if (state.phase !== 'play' || state.active !== 0) return { ok: false, why: 'not your turn' };
  state.turn += 1;
  startTurn(state, 1);
  log(state, `${RIVAL_NAME} takes her turn.`);
  takeTurn(state, 1);
  if (state.phase !== 'play') return { ok: true };
  startTurn(state, 0);
  log(state, `Turn ${state.turn} — your ember burns brighter.`);
  return { ok: true };
}
