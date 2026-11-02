// bowling-scorer-bd — ten-pin bowling scoring logic (pure, no DOM).
// Frames 1-9: strike = 1 roll, otherwise 2 rolls. 10th frame: 2 rolls,
// plus a 3rd roll after a strike or a spare. Standard bonus scoring.
'use strict';

function isInt(n) { return Number.isInteger(n); }

// Walk the roll list and describe where the next ball goes.
// Returns { frame: 0-9, ball: 0-2, max: 0-10, complete: boolean }.
function parseState(rolls) {
  let p = 0;
  for (let f = 0; f < 9; f++) {
    if (p >= rolls.length) return { frame: f, ball: 0, max: 10, complete: false };
    if (rolls[p] === 10) { p += 1; continue; }
    if (p + 1 >= rolls.length) return { frame: f, ball: 1, max: 10 - rolls[p], complete: false };
    p += 2;
  }
  const r = rolls.slice(p);
  if (r.length === 0) return { frame: 9, ball: 0, max: 10, complete: false };
  if (r.length === 1) return { frame: 9, ball: 1, max: r[0] === 10 ? 10 : 10 - r[0], complete: false };
  if (r.length === 2) {
    const a = r[0], b = r[1];
    if (a === 10 || a + b === 10) {
      // Third ball: fresh rack, except strike-then-non-strike leaves 10-b pins.
      const max = (a === 10 && b !== 10) ? 10 - b : 10;
      return { frame: 9, ball: 2, max: max, complete: false };
    }
    return { frame: 9, ball: 2, max: 0, complete: true };
  }
  return { frame: 9, ball: 3, max: 0, complete: true };
}

function isGameComplete(rolls) { return parseState(rolls).complete; }

function nextRollMax(rolls) {
  const s = parseState(rolls);
  return s.complete ? null : s.max;
}

function validateRoll(rolls, pins) {
  if (!isInt(pins)) return { ok: false, error: 'notInteger' };
  const s = parseState(rolls);
  if (s.complete) return { ok: false, error: 'gameComplete' };
  if (pins < 0 || pins > s.max) return { ok: false, error: 'tooManyPins', max: s.max };
  return { ok: true };
}

// Split rolls into 10 frames: [{ rolls: [...], complete: bool }].
// A frame is complete when it holds all its balls (10th: 2, or 3 after
// a strike/spare). Incomplete trailing frames hold what has been bowled.
function frameLayout(rolls) {
  const frames = [];
  let p = 0;
  for (let f = 0; f < 9; f++) {
    if (p >= rolls.length) { frames.push({ rolls: [], complete: false }); continue; }
    if (rolls[p] === 10) { frames.push({ rolls: [10], complete: true }); p += 1; continue; }
    if (p + 1 >= rolls.length) { frames.push({ rolls: [rolls[p]], complete: false }); p += 1; continue; }
    frames.push({ rolls: [rolls[p], rolls[p + 1]], complete: true }); p += 2;
  }
  const rest = rolls.slice(p);
  let complete = false;
  if (rest.length >= 2) {
    const a = rest[0], b = rest[1];
    complete = (a === 10 || a + b === 10) ? rest.length >= 3 : true;
  }
  frames.push({ rolls: rest, complete: complete });
  return frames;
}

// Cumulative score per frame, or null while a frame's bonus is unknown.
// Length is always 10.
function scoreFrames(rolls) {
  const cum = [];
  let total = 0;
  let idx = 0;
  for (let f = 0; f < 10; f++) {
    if (f < 9) {
      if (rolls[idx] === undefined) { cum.push(null); continue; }
      if (rolls[idx] === 10) {
        if (rolls[idx + 1] === undefined || rolls[idx + 2] === undefined) { cum.push(null); continue; }
        total += 10 + rolls[idx + 1] + rolls[idx + 2];
        cum.push(total); idx += 1;
      } else {
        if (rolls[idx + 1] === undefined) { cum.push(null); continue; }
        const frameTotal = rolls[idx] + rolls[idx + 1];
        if (frameTotal === 10) {
          if (rolls[idx + 2] === undefined) { cum.push(null); continue; }
          total += 10 + rolls[idx + 2];
        } else {
          total += frameTotal;
        }
        cum.push(total); idx += 2;
      }
    } else {
      if (rolls[idx] === undefined || rolls[idx + 1] === undefined) { cum.push(null); continue; }
      const a = rolls[idx], b = rolls[idx + 1];
      if (a === 10 || a + b === 10) {
        if (rolls[idx + 2] === undefined) { cum.push(null); continue; }
        total += a + b + rolls[idx + 2];
      } else {
        total += a + b;
      }
      cum.push(total);
    }
  }
  return cum;
}

function finalScore(rolls) {
  if (!isGameComplete(rolls)) return null;
  return scoreFrames(rolls)[9];
}

// Display symbol for one ball: 'X', '/', '-', or the pin count.
function rollSymbol(frameRolls, pos, frameIndex) {
  const v = frameRolls[pos];
  if (v === undefined) return '';
  if (frameIndex < 9) {
    if (pos === 0) return v === 10 ? 'X' : (v === 0 ? '-' : String(v));
    return (frameRolls[0] + v === 10) ? '/' : (v === 0 ? '-' : String(v));
  }
  // 10th frame
  if (v === 10) return 'X';
  if (v === 0) return '-';
  if (pos === 1 && frameRolls[0] !== 10 && frameRolls[0] + v === 10) return '/';
  if (pos === 2 && frameRolls[0] === 10 && frameRolls[1] !== 10 && frameRolls[1] + v === 10) return '/';
  return String(v);
}

// Per-game stats from a finished or in-progress roll list.
function gameStats(rolls) {
  const frames = frameLayout(rolls);
  let strikes = 0, spares = 0, opens = 0;
  for (let f = 0; f < 9; f++) {
    const r = frames[f].rolls;
    if (r.length === 0) continue;
    if (r[0] === 10) strikes += 1;
    else if (r.length === 2 && r[0] + r[1] === 10) spares += 1;
    else if (r.length === 2) opens += 1;
  }
  const t = frames[9].rolls;
  if (t.length >= 1 && t[0] === 10) strikes += 1;
  if (t.length >= 2) {
    if (t[0] === 10 && t[1] === 10) strikes += 1;
    else if (t[0] !== 10 && t[0] + t[1] === 10) spares += 1;
    else if (t[0] !== 10) opens += 1;
  }
  if (t.length >= 3) {
    if (t[2] === 10) strikes += 1;
    else if (t[0] === 10 && t[1] !== 10 && t[1] + t[2] === 10) spares += 1;
  }
  const pins = rolls.reduce((a, b) => a + b, 0);
  return {
    strikes: strikes, spares: spares, opens: opens,
    balls: rolls.length, pins: pins,
    avg: rolls.length ? pins / rolls.length : 0
  };
}

function toBnDigits(s) {
  const map = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(s).replace(/[0-9]/g, (d) => map[Number(d)]);
}

const api = {
  parseState: parseState, isGameComplete: isGameComplete,
  nextRollMax: nextRollMax, validateRoll: validateRoll,
  frameLayout: frameLayout, scoreFrames: scoreFrames,
  finalScore: finalScore, rollSymbol: rollSymbol,
  gameStats: gameStats, toBnDigits: toBnDigits
};
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.Bowling = api;
