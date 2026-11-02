# Bowling Scorer BD

A free, fully offline, bilingual (English / বাংলা) ball-by-ball ten-pin
bowling scorer. No account, no network calls — your games live only in your
browser's localStorage.

## Features

- **Up to 4 players**, alternating frame by frame, exactly like real bowling.
- **Ball-by-ball pin pad** that only offers the pins actually standing
  (after a 7, the pad caps at 3 — you cannot enter an impossible ball).
- **Exact ten-pin scoring**: strikes (X = 10 + next 2 balls), spares
  (/ = 10 + next ball), and the 10th frame's bonus ball after a strike
  or spare, including the strike-then-non-strike fill-ball rule.
- **Live scorecards**: all 10 frames per player, with X / / / − symbols
  and running cumulative scores that appear only once a frame's bonus
  is known (no guessed totals).
- **Undo that respects chronology**: undo removes the last ball actually
  bowled, even when the turn has already passed to another player.
- **Player stats**: strikes, spares, open frames, average pins per ball.
- **Finished-game history** with winner/tie detection, delete, and
  clear-all (with confirmation).
- **EN / বাংলা toggle** (persisted) with Bengali digits in বাংলা mode,
  and a mobile-friendly layout (checked at 390 px).

## How to use

1. Open `index.html` in any modern browser (or the GitHub Pages site).
2. Enter player names (1–4) and press **Start game**.
3. Tap the pins knocked down for the player shown as "Bowling now".
   The turn passes automatically when a frame is finished.
4. When every player has bowled 10 frames, the winner is announced and
   the game is saved to history.

## Scoring rules (as implemented)

- Frames 1–9: a strike is one ball; otherwise two balls.
- 10th frame: two balls, plus a third ball after a strike or a spare.
- After a 10th-frame strike followed by a non-strike, the third ball is
  capped at the pins left standing (10 − second ball); after a spare,
  or after two 10th-frame strikes, the third ball is a fresh rack (0–10).
- A frame's cumulative score is shown only when all its bonus balls are
  known — e.g. a lone strike shows no total until two more balls exist.

## Stack

Vanilla HTML, CSS, and JavaScript. No build step, no dependencies, no
network requests. Logic is dependency-free (`js/logic.js`) so it can be
unit-tested in Node as well as in the browser.

## Development

```sh
# Unit tests (scoring engine)
node tests/unit.test.js

# Headless-Chrome smoke tests (needs the Playwright headless_shell binary)
node tests/smoke.mjs
```

## Project structure

```
index.html        — page shell
css/style.css     — styling (navy + teal, responsive)
js/logic.js       — pure scoring engine (frames, bonuses, validation, stats)
js/i18n.js        — English / বাংলা strings
js/app.js         — UI glue + localStorage persistence
tests/            — local QA only (not part of the deployed site)
```

## Limitations

- This is a casual scorekeeper, not a tournament-certified system: it
  trusts the pins you enter and does not verify fouls, lane conditions,
  or league handicap rules.
- Games are stored per browser (localStorage); clearing browser data
  removes them. Export is not yet implemented.
- No live bowling-alley data or online multiplayer.

## Status

MVP complete and tested: 19/19 Node unit checks and 19/19 headless-Chrome
smoke checks pass with zero console/page errors. See `TEST_RESULTS.md`
for the hand-verified games (perfect 300, all-spares 150, gutter 0,
classic 133 game, and 10th-frame edge cases).
