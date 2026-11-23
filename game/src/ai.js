// Duchess Cinder's heuristics: a simple, readable opponent.
//
// She plays in a fixed order of priorities — a killing blow first, then the
// strongest affordable creature, then mending and wards when she is hurting,
// then card draw, then any damage she can throw — and she keeps playing
// while ember remains. When her creatures attack, she goes for the rival's
// life whenever her whole board can finish the duel; otherwise she trades
// into the weakest rival creature she can destroy, and only then strikes
// the rival directly.

import { CONFIG } from './config.js';
import { canAttack, canPlay, attack, playCard, totalFaceDamage } from './game.js';

function playableCards(state, aiIndex) {
  const player = state.players[aiIndex];
  const out = [];
  for (let i = 0; i < player.hand.length; i += 1) {
    if (canPlay(state, aiIndex, i).ok) out.push(i);
  }
  return out;
}

// One pass over the hand: return the index of the card she should play
// next, or null when nothing is worth playing.
function chooseCard(state, aiIndex) {
  const player = state.players[aiIndex];
  const rival = state.players[1 - aiIndex];
  const options = playableCards(state, aiIndex);
  if (options.length === 0) return null;

  const byId = (i) => player.hand[i];

  // A trick that ends the duel right now beats everything else.
  for (const i of options) {
    const card = byId(i);
    if (card.type === 'trick' && card.damage && card.damage >= rival.life + rival.shield) return i;
  }
  // The strongest creature she can afford.
  let bestCreature = null;
  for (const i of options) {
    const card = byId(i);
    if (card.type !== 'creature') continue;
    if (bestCreature === null || card.attack > byId(bestCreature).attack) bestCreature = i;
  }
  if (bestCreature !== null) return bestCreature;
  // Mend when hurt, ward when bare.
  for (const i of options) {
    const card = byId(i);
    if (card.type === 'trick' && card.heal && player.life <= 18) return i;
  }
  for (const i of options) {
    const card = byId(i);
    if (card.type === 'ward' && player.shield < 4) return i;
  }
  // Draw, then any damage trick, then a heal or ward anyway.
  for (const i of options) {
    const card = byId(i);
    if (card.type === 'trick' && card.draw) return i;
  }
  for (const i of options) {
    const card = byId(i);
    if (card.type === 'trick' && card.damage) return i;
  }
  for (const i of options) {
    const card = byId(i);
    if (card.type === 'trick' && card.heal) return i;
  }
  for (const i of options) {
    const card = byId(i);
    if (card.type === 'ward') return i;
  }
  return null;
}

function chooseAttackTarget(state, aiIndex, boardIndex) {
  const player = state.players[aiIndex];
  const rival = state.players[1 - aiIndex];
  const attacker = player.board[boardIndex];
  if (!attacker) return null;

  // Lethal from the whole board: strike the rival directly.
  if (totalFaceDamage(state, aiIndex) >= rival.life + rival.shield) return { kind: 'hero' };

  // Trade into the weakest rival creature this attacker can destroy
  // without dying for it; among equals, take the one that hits hardest.
  let target = null;
  for (let i = 0; i < rival.board.length; i += 1) {
    const defender = rival.board[i];
    if (attacker.attack >= defender.hp && defender.attack < attacker.hp) {
      if (
        target === null ||
        defender.hp < rival.board[target.index].hp ||
        (defender.hp === rival.board[target.index].hp && defender.attack > rival.board[target.index].attack)
      ) {
        target = { kind: 'creature', index: i };
      }
    }
  }
  if (target) return target;

  // Nothing worth trading into: go for the rival.
  if (rival.board.length === 0) return { kind: 'hero' };
  // With a board in the way, still strike the rival — a duel is won by
  // taking life, not by clearing the table.
  return { kind: 'hero' };
}

export function takeTurn(state, aiIndex) {
  // Play cards until the hand offers nothing more worth playing.
  for (let guard = 0; guard < 24; guard += 1) {
    const next = chooseCard(state, aiIndex);
    if (next === null) break;
    const result = playCard(state, aiIndex, next);
    if (!result.ok) break;
    if (state.phase !== 'play') return;
  }
  // Attack with every creature that can.
  const player = state.players[aiIndex];
  for (let i = player.board.length - 1; i >= 0; i -= 1) {
    if (state.phase !== 'play') return;
    if (!canAttack(state, aiIndex, i).ok) continue;
    const target = chooseAttackTarget(state, aiIndex, i);
    if (!target) continue;
    attack(state, aiIndex, i, target);
  }
}
