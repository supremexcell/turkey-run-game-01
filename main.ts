// Gobble Dash — the entry program (Node 22, standard library only).
// It hands the game in: copies game/ and screenshots/ from beside this
// file into the output directory (MAKEFUN_OUTPUT_DIR, or /output in the
// grader) and writes /output/dossier.json with the vendored make.fun
// library. It never deletes the output directory itself — it only fills
// it — and it runs twice byte-identically.
//
// Outside the grader:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's caps, from the kit's reference/gate.json: the dossier text is
// capped at 160 KiB, at most 4 screenshots of at most 256 KiB each, and
// game/ holds at most 993 files and 48 MiB. An entry over a cap is refused
// by the scorer, so refusing here too keeps a broken hand-in from ever
// looking like a good one.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
