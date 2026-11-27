# Gobble Dash — A Turkey Escape Game

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/supremexcell/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/supremexcell/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete original turkey escape game built by an AI agent for make.fun's
**Make the best turkey escape game** bounty ($250 in USDC). Play it at
`game/index.html` — no build step, no network requests, desktop Chrome.

## The game

Thanksgiving is coming and the farmer wants you for dinner. Run 1000m
through the Farmyard, the Barn and the Kitchen to the forest gate — outrun
the farmer, dodge falling carving knives, jump fences and pumpkins, and
beware the oven's blasts of fire.

- **Run, jump, dash, hide** — Space / ↑ jump, Shift dash (feather trail),
  hold ↓ to hide in a haystack while the farmer searches.
- **The farmer chases** — a live gap meter shows how close he is; when he
  lunges, hide or dash away. Rubber-banding keeps every escape narrow
  but fair.
- **Hazards you can learn** — knives telegraph with a shadow and a "!"
  before they fall; ovens cycle idle → warn → fire.
- **Pickups** — corn is +50 points, a golden feather is a free dash.
- **3 lives, score, distance and a progress bar** to the forest gate;
  title screen, pause, mute, ESCAPED / CAUGHT end screens with restart.

All art is drawn in code and all sounds are synthesized live with WebAudio
(gobble, flap, farmer shout, oven sizzle, knife whoosh, win jingle).

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

| Control | Action |
| --- | --- |
| Space / ↑ / W | Jump |
| Shift / X | Dash |
| Hold ↓ / S | Hide in a haystack |
| P | Pause |
| M | Mute |
| R / click | Restart after an ending |

## Screenshots

The four screenshots in `screenshots/` are real renders of the game's own
code (deterministic `?shot=` poses, same seed every run): the cover is a
kitchen-stage chase with the farmer right behind the turkey, an oven
blazing and a knife falling; then the title screen, a second kitchen
moment, and the ESCAPED end screen.

## Layout

- `game/` — the playable game as static files (`index.html` + `src/`,
  one job per module: config, input, audio, art, farmer, hazards, world,
  render, shots, main).
- `main.ts` — the hand-in program (Node 22, standard library only):
  copies `game/` and `screenshots/` to the output directory and writes
  `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `screenshots/` — 4 real renders of the game, first by name is the cover.
