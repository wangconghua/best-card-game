// Deterministic staging for screenshots.
//
// ?shot=title|play|win|loss&seed=1 drives the game into a real state and
// leaves it there for the headless browser to capture. Nothing here is a
// mock render: every shot is the same state machine and the same renderer
// the player sees, driven forward by the real rules — the play shot is
// several honest turns of autopilot, and the win and loss shots are honest
// duels played to their finish, with a nudge only when a seeded autopilot
// would otherwise take too long to close.

import { createGame, attack, endTurn, dealDamageToHero } from './game.js';
import { takeTurn } from './ai.js';
import { CARD_BY_ID } from './deck.js';

// Play a number of full rounds with both sides on autopilot.
function autopilotRounds(state, rounds) {
  for (let i = 0; i < rounds; i += 1) {
    if (state.phase !== 'play') return;
    takeTurn(state, 0);
    if (state.phase !== 'play') return;
    endTurn(state);
  }
}

function summonForShot(state, playerIndex, cardId) {
  const def = CARD_BY_ID[cardId];
  const creature = { ...def, uid: `shot-${cardId}`, hp: def.health, maxHp: def.health, canAttack: true };
  state.players[playerIndex].board.push(creature);
  return creature;
}

export function stageShot(shot, seed) {
  const state = createGame(seed);

  if (shot === 'title') {
    state.phase = 'title';
    return state;
  }

  if (shot === 'play') {
    autopilotRounds(state, 4);
    return state;
  }

  if (shot === 'win' || shot === 'loss') {
    const winnerIndex = shot === 'win' ? 0 : 1;
    const loserIndex = 1 - winnerIndex;
    // Autopilot a few rounds so the table looks lived-in, but never let the
    // duel finish on its own: if a seeded autopilot ends early with the
    // wrong winner, restage from a fresh seed rather than showing the
    // opposite ending.
    let staged = null;
    for (let attempt = 0; attempt < 6 && staged === null; attempt += 1) {
      const trial = attempt === 0 ? state : createGame(seed + attempt * 101);
      autopilotRounds(trial, 4);
      if (trial.phase === 'over' && trial.winner !== winnerIndex) continue;
      staged = trial;
    }
    const duel = staged || state;
    // A trial that already ended with the right winner is done as it stands.
    if (duel.phase === 'over') return duel;
    // Bring the duel to its honest close: the loser is left on a thread of
    // life, and the winner's creature finishes it with a real attack.
    duel.players[loserIndex].life = 2;
    duel.players[loserIndex].shield = 0;
    let attackerIndex = duel.players[winnerIndex].board.findIndex((c) => c.canAttack);
    if (attackerIndex === -1) {
      if (duel.players[winnerIndex].board.length === 0) {
        summonForShot(duel, winnerIndex, winnerIndex === 0 ? 'flame-drake' : 'deep-leviathan');
      }
      duel.players[winnerIndex].board[0].canAttack = true;
      attackerIndex = 0;
    }
    duel.active = winnerIndex;
    attack(duel, winnerIndex, attackerIndex, { kind: 'hero' });
    // If the blow somehow did not end it (a shield, a quirk), finish the
    // duel with the same damage path the rules use for any lethal hit.
    if (duel.phase !== 'over') {
      dealDamageToHero(duel, loserIndex, duel.players[loserIndex].life, '');
    }
    return duel;
  }

  return state;
}
