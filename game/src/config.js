// Ember Court tuning: every number the rules lean on lives here, so a
// balance pass touches one file and nothing else.

export const CONFIG = {
  startLife: 30,
  startEmber: 1,
  maxEmber: 10,
  handSize: 5,
  maxHand: 10,
  maxBoard: 5,
  deckSize: 24,
};

// The four houses. Each house is told apart by colour AND by its symbol, so
// the game never leans on text alone to say which house a card belongs to.
export const HOUSES = {
  flame: { name: 'Flame', symbol: '▲', color: '#e2483d', dark: '#8a211b', glow: '#ff7a5c' },
  tide: { name: 'Tide', symbol: '●', color: '#2f7fd0', dark: '#174a7d', glow: '#6db3f2' },
  thorn: { name: 'Thorn', symbol: '◆', color: '#3d9e57', dark: '#1d5c30', glow: '#7ed491' },
  star: { name: 'Star', symbol: '★', color: '#d9a521', dark: '#7a5c10', glow: '#f5cd5e' },
};

// Balance notes, for the next pass: the curve is deliberately gentle —
// four 1-cost creatures open the game, the 7-cost Dawn Sovereign is the
// only card above 6, and tricks top out at 5 damage so no single card ends
// a duel from a healthy life total. If games run long, trim healing; if
// they end too fast, trim the 4- and 5-damage tricks first.
export const PLAYER_NAME = 'the Kindler';
export const RIVAL_NAME = 'Duchess Cinder';
