// Ember Court boot: wire the state machine to the page.
//
// Click a hand card to play it. Click one of your creatures, then a rival
// creature or the Duchess herself, to attack. Keys 1–5 play a hand card,
// Enter ends the turn, M mutes the blips. A tiny WebAudio oscillator stands
// in for sound effects — no audio files, no network.

import { CONFIG } from './config.js';
import { createGame, playCard, attack, canPlay, canAttack, endTurn } from './game.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

let state = shot ? stageShot(shot, seed) : createGame(seed);
if (!shot) state.phase = 'title';

const ui = { selectedHand: null, selectedAttacker: null, muted: false };

// --- Sound: small synthesized blips, created only after a user gesture. ---
let audioCtx = null;
function blip(freq, ms = 90, type = 'sine', gain = 0.05) {
  if (ui.muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = gain;
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start();
    amp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch {
    // Sound is garnish; a browser without WebAudio still plays fine.
  }
}

function draw() {
  render(state, ui);
}

function playHandCard(index) {
  if (state.phase !== 'play' || state.active !== 0) return;
  const check = canPlay(state, 0, index);
  if (!check.ok) {
    blip(140, 120, 'square', 0.04);
    return;
  }
  const card = state.players[0].hand[index];
  playCard(state, 0, index);
  blip(card.type === 'creature' ? 330 : 520, 110, 'triangle');
  ui.selectedHand = null;
  ui.selectedAttacker = null;
  draw();
}

function attackWith(boardIndex, target) {
  const result = attack(state, 0, boardIndex, target);
  if (!result.ok) {
    blip(140, 120, 'square', 0.04);
    return;
  }
  blip(220, 140, 'sawtooth', 0.04);
  ui.selectedAttacker = null;
  draw();
}

function onEndTurn() {
  if (state.phase !== 'play' || state.active !== 0) return;
  blip(440, 90, 'triangle');
  endTurn(state);
  blip(660, 90, 'triangle');
  ui.selectedAttacker = null;
  draw();
}

function newDuel() {
  state = createGame(seed + Math.floor(Math.random() * 100000));
  state.phase = 'play';
  ui.selectedHand = null;
  ui.selectedAttacker = null;
  draw();
}

// --- Input: one delegated click handler for the whole table. ---
document.getElementById('app').addEventListener('click', (event) => {
  const target = event.target.closest('[data-hand], [data-my-board], [data-rival-board], [data-rival-hero], #end-turn-btn, #mute-btn, #begin-btn, #again-btn');
  if (!target) return;

  if (target.id === 'mute-btn') {
    ui.muted = !ui.muted;
    draw();
    return;
  }
  if (target.id === 'begin-btn') {
    state.phase = 'play';
    blip(523, 120, 'triangle');
    draw();
    return;
  }
  if (target.id === 'again-btn') {
    newDuel();
    return;
  }
  if (target.id === 'end-turn-btn') {
    onEndTurn();
    return;
  }
  if (state.phase !== 'play' || state.active !== 0) return;

  if (target.hasAttribute('data-hand')) {
    playHandCard(Number(target.getAttribute('data-hand')));
    return;
  }
  if (target.hasAttribute('data-my-board')) {
    const index = Number(target.getAttribute('data-my-board'));
    if (!canAttack(state, 0, index).ok) {
      blip(140, 120, 'square', 0.04);
      return;
    }
    ui.selectedAttacker = ui.selectedAttacker === index ? null : index;
    blip(392, 70, 'triangle', 0.04);
    draw();
    return;
  }
  if (ui.selectedAttacker !== null) {
    if (target.hasAttribute('data-rival-board')) {
      attackWith(ui.selectedAttacker, { kind: 'creature', index: Number(target.getAttribute('data-rival-board')) });
    } else if (target.hasAttribute('data-rival-hero')) {
      attackWith(ui.selectedAttacker, { kind: 'hero' });
    }
  }
});

document.addEventListener('keydown', (event) => {
  if (shot) return;
  if (event.key >= '1' && event.key <= String(Math.min(5, CONFIG.maxHand))) {
    playHandCard(Number(event.key) - 1);
  } else if (event.key === 'Enter') {
    if (state.phase === 'title') {
      state.phase = 'play';
      draw();
    } else if (state.phase === 'over') {
      newDuel();
    } else {
      onEndTurn();
    }
  } else if (event.key === 'm' || event.key === 'M') {
    ui.muted = !ui.muted;
    draw();
  }
});

draw();
