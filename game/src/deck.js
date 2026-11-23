// The Ember Court deck: 24 original cards in four houses of six.
//
// Types:
//   creature — a spirit that takes a place on your side of the table and
//     fights (attack / health). It cannot attack the turn it is played.
//   trick    — an instant that resolves at once: damage the rival, mend your
//     own life, or draw cards.
//   ward     — a shield that soaks damage aimed at you before your life does.
//
// Costs run 1–7 ember so the curve matters: cheap spirits early, the big
// sovereigns only once the ember well has deepened.

import { CONFIG } from './config.js';
import { shuffle } from './random.js';

export const CARD_DEFS = [
  // ---- Flame (red ▲) ----
  { id: 'ember-imp', name: 'Ember Imp', house: 'flame', type: 'creature', cost: 1, attack: 2, health: 1, text: 'A spark with teeth.' },
  { id: 'cinder-wolf', name: 'Cinder Wolf', house: 'flame', type: 'creature', cost: 2, attack: 3, health: 2, text: 'It hunts where the fire went out.' },
  { id: 'spark-burst', name: 'Spark Burst', house: 'flame', type: 'trick', cost: 2, damage: 3, text: 'Deal 3 damage to the rival.' },
  { id: 'flame-drake', name: 'Flame Drake', house: 'flame', type: 'creature', cost: 4, attack: 5, health: 4, text: 'Its wings are still burning.' },
  { id: 'pyre-golem', name: 'Pyre Golem', house: 'flame', type: 'creature', cost: 6, attack: 7, health: 6, text: 'A hearth that learned to walk.' },
  { id: 'rekindle', name: 'Rekindle', house: 'flame', type: 'trick', cost: 1, heal: 4, text: 'Restore 4 life.' },

  // ---- Tide (blue ●) ----
  { id: 'tide-sprite', name: 'Tide Sprite', house: 'tide', type: 'creature', cost: 1, attack: 1, health: 2, text: 'It arrives with the first wave.' },
  { id: 'wavecaller', name: 'Wavecaller', house: 'tide', type: 'creature', cost: 2, attack: 2, health: 3, text: 'The sea answers when she hums.' },
  { id: 'soothing-current', name: 'Soothing Current', house: 'tide', type: 'trick', cost: 2, heal: 6, text: 'Restore 6 life.' },
  { id: 'coral-knight', name: 'Coral Knight', house: 'tide', type: 'creature', cost: 3, attack: 3, health: 4, text: 'Armour grown, not forged.' },
  { id: 'riptide', name: 'Riptide', house: 'tide', type: 'trick', cost: 3, damage: 4, draw: 1, text: 'Deal 4 damage to the rival. Draw a card.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', house: 'tide', type: 'creature', cost: 5, attack: 6, health: 5, text: 'The court below the court.' },

  // ---- Thorn (green ◆) ----
  { id: 'thorn-sprout', name: 'Thorn Sprout', house: 'thorn', type: 'creature', cost: 1, attack: 1, health: 3, text: 'Small. Patient. Sharp.' },
  { id: 'bramble-snare', name: 'Bramble Snare', house: 'thorn', type: 'trick', cost: 1, damage: 2, text: 'Deal 2 damage to the rival.' },
  { id: 'briar-stag', name: 'Briar Stag', house: 'thorn', type: 'creature', cost: 2, attack: 3, health: 3, text: 'Antlered in green fire.' },
  { id: 'overgrowth', name: 'Overgrowth', house: 'thorn', type: 'trick', cost: 2, heal: 3, draw: 1, text: 'Restore 3 life. Draw a card.' },
  { id: 'vine-warden', name: 'Vine Warden', house: 'thorn', type: 'creature', cost: 3, attack: 4, health: 4, text: 'Keeper of the green gate.' },
  { id: 'ancient-oak', name: 'Ancient Oak', house: 'thorn', type: 'creature', cost: 5, attack: 5, health: 7, text: 'Older than the court itself.' },

  // ---- Star (gold ★) ----
  { id: 'star-mote', name: 'Star Mote', house: 'star', type: 'creature', cost: 1, attack: 2, health: 2, text: 'A fallen star, still warm.' },
  { id: 'starlight-ward', name: 'Starlight Ward', house: 'star', type: 'ward', cost: 2, shield: 6, text: 'Gain 6 shield.' },
  { id: 'lantern-wisp', name: 'Lantern Wisp', house: 'star', type: 'creature', cost: 2, attack: 2, health: 4, text: 'It lights the way home.' },
  { id: 'falling-star', name: 'Falling Star', house: 'star', type: 'trick', cost: 3, damage: 5, text: 'Deal 5 damage to the rival.' },
  { id: 'comet-herald', name: 'Comet Herald', house: 'star', type: 'creature', cost: 4, attack: 6, health: 4, text: 'It announces the dawn.' },
  { id: 'dawn-sovereign', name: 'Dawn Sovereign', house: 'star', type: 'creature', cost: 7, attack: 8, health: 8, text: 'The first light of the court.' },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((card) => [card.id, card]));

// The deck is exactly the 24 definitions below: one copy of each card, so
// every duel sees the same pool and the shuffle alone decides the order.
if (CARD_DEFS.length !== CONFIG.deckSize) {
  throw new Error(`Ember Court deck must hold ${CONFIG.deckSize} cards, found ${CARD_DEFS.length}.`);
}

// A fresh deck: one copy of each of the 24 cards, shuffled with the seeded
// generator. A fresh instance is minted per card so play never mutates the
// shared definitions.
export function buildDeck(rng) {
  const deck = CARD_DEFS.map((def, index) => ({
    uid: `card-${index}`,
    ...def,
  }));
  return shuffle(rng, deck);
}
