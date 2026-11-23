// Seeded randomness for Ember Court. One small generator (mulberry32) keeps
// every shuffled deck and every screenshot staging run reproducible from a
// single seed, which is what makes ?shot=...&seed=1 deterministic.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates shuffle in place, driven by the seeded generator.
export function shuffle(rng, list) {
  if (list.length < 2) return list;
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// An integer in [0, n).
export function roll(rng, n) {
  return Math.floor(rng() * n);
}
