# Bowling Scorer BD — test results (2026-11-02, run #210)

## Node unit tests — 19/19 passed

Run: `node tests/unit.test.js`

Hand-verified scoring cases (all computed by the engine, asserted exactly):

- Perfect game, 12 strikes → **300**; frame cumulatives
  30, 60, 90, 120, 150, 180, 210, 240, 270, 300.
- Gutter game, 20 zeros → **0**.
- All spares (21 balls of 5) → **150**.
- Classic bowling-kata game
  `[1,4,4,5,6,4,5,5,10,0,1,7,3,6,4,10,2,8,6]` → **133**.
- All 9− (10 × [9,0]) → **90**.
- 10th-frame edges (18 gutter balls first): X-X-X → 30; 5-5-X → 20;
  X-3-7 (spare fill) → 20; open 3-4 → 7.
- Partial game: a lone strike scores nothing yet (bonus unknown);
  three strikes score only frame 1 (30).
- Standing-pin caps: after 7, max is 3; 10th-frame X then 3 caps the
  fill ball at 7; after a 10th-frame spare the bonus ball allows 10.
- Symbols: X, /, −, including the 10th-frame spare fill (X-3-7 → /).
- Stats: perfect game → 12 strikes, 0 spares, 0 opens, 120 pins, avg 10.
- i18n: EN/BN key sets identical; BN strings contain real Bengali;
  Bengali digits convert 300 → ৩০০.

## Headless-Chrome smoke tests — 19/19 passed

Run: `node tests/smoke.mjs` (raw CDP, Playwright headless_shell-1187,
`file://` page). Zero page errors, zero console errors.

- Setup with two players (Arif, Mim) starts the game; Arif bowls first.
- Arif strike → X on his card, turn passes to Mim.
- Mim 7 → pad caps at 3; Mim 3 → / on her card, turn returns to Arif.
- Undo removes Mim's spare ball (the chronological last ball) and keeps
  Arif's strike, returning the turn to Mim — this caught a real bug
  during development (undo previously used turn order and would have
  removed Arif's strike); fixed with a chronological ball-order log.
- Reload persistence: strike + 7 survive, turn stays on Mim.
- BN toggle: Bengali title and Bengali pad digits (১০).
- 390 px mobile: no horizontal overflow.

## Repairs during this run

- 1 genuine app bug fixed before smoke: undo used turn order instead of
  chronological ball order (see above). The smoke test now covers it.
- 0 smoke-run app bugs; 0 unit-test repairs after the first green run
  (unit suite passed 19/19 on first execution).

## Not tested

- Real-bowling-alley conditions (fouls, handicaps, league rules) — out
  of scope for a casual scorekeeper; documented in the README.
