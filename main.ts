// Ember Court — the make.fun entry program for best-card-game-20261122-1826.
//
// Node 22, standard library only. The game itself is plain static files under
// game/ (an index.html plus ES modules, no libraries, no network requests), and
// the screenshots under screenshots/ are real renders of that game. This program
// gathers those two folders beside it into the output directory and writes
// dossier.json, the summary the judge reads, using the vendored make.fun
// library in vendor/makefun-game.ts.
//
// Run it outside the grader's container with MAKEFUN_OUTPUT_DIR standing in
// for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game locally for play-testing with `node serve.ts`, then open
// http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own gates (see the kit's reference/gate.json):
// text_max_bytes is the only one that shapes the dossier's bytes; the rest
// refuse an entry the scorer would refuse outright — more than 4 screenshots
// or one over 256 KiB, more than 993 files in game/ or 48 MiB of game files
// in total, or any path under game/ longer than 1000 bytes.
const dossierPath = join(out, 'dossier.json');
writeFileSync(dossierPath, buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
console.log(`Ember Court packed into ${out} — dossier at ${dossierPath}`);
