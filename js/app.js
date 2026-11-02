// bowling-scorer-bd — UI glue. Pure scoring lives in logic.js.
'use strict';
(function () {
  const KEY = 'bowling-scorer-bd-v1';
  const $ = (id) => document.getElementById(id);
  const L = window.Bowling;
  const STR = window.STR;

  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.players) && Array.isArray(s.history)) {
          if (!Array.isArray(s.order)) s.order = [];
          return s;
        }
      }
    } catch (e) { /* corrupted storage: start fresh */ }
    return { lang: 'en', players: [], history: [], active: false, turn: 0, recorded: false, order: [] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function t(k) { return STR[state.lang][k]; }
  function fmt(n) { return state.lang === 'bn' ? L.toBnDigits(String(n)) : String(n); }
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function completedCount(p) {
    return L.frameLayout(p.rolls).filter((f) => f.complete).length;
  }
  function currentPlayer() { return state.players[state.turn]; }

  // Advance turn to the next player who still has frames left.
  function advanceTurn(prevCompleted) {
    const cur = currentPlayer();
    if (!cur) return;
    if (completedCount(cur) <= prevCompleted) return; // frame not finished yet
    for (let step = 1; step <= state.players.length; step++) {
      const idx = (state.turn + step) % state.players.length;
      if (completedCount(state.players[idx]) < 10) { state.turn = idx; return; }
    }
    // everyone finished: keep turn where it is; game is complete
  }
  function gameComplete() {
    return state.active && state.players.length > 0 &&
      state.players.every((p) => completedCount(p) >= 10);
  }
  function recordHistory() {
    if (state.recorded) return;
    state.recorded = true;
    state.history.unshift({
      date: new Date().toISOString().slice(0, 10),
      players: state.players.map((p) => ({ name: p.name, score: L.finalScore(p.rolls) }))
    });
  }

  function render() {
    $('langBtn').textContent = state.lang === 'en' ? 'বাংলা' : 'English';
    $('appTitle').textContent = t('appTitle');
    $('tagline').textContent = t('tagline');
    $('setupTitle').textContent = t('setupTitle');
    $('addPlayerBtn').textContent = t('addPlayer');
    $('maxPlayersNote').textContent = t('maxPlayersNote');
    $('startBtn').textContent = t('startGame');
    $('howTitle').textContent = t('howTitle');
    $('howText').textContent = t('howText');
    $('footerText').textContent = t('footer');
    $('pinsLabel').textContent = t('pinsDown');
    $('historyTitle').textContent = t('historyTitle');
    renderSetup();
    renderGame();
    renderHistory();
  }

  function renderSetup() {
    $('setupCard').style.display = state.active ? 'none' : 'block';
    const box = $('nameInputs');
    box.innerHTML = '';
    const names = state.players.length ? state.players.map((p) => p.name) : ['', ''];
    names.forEach((name, i) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'nameinput';
      input.placeholder = (state.lang === 'en' ? 'Player ' : 'খেলোয়াড় ') + fmt(i + 1);
      input.value = name;
      input.maxLength = 24;
      box.appendChild(input);
    });
    $('addPlayerBtn').disabled = names.length >= 4;
    $('setupError').textContent = '';
  }

  function renderGame() {
    const card = $('gameCard');
    if (!state.active) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    $('newGameBtn').textContent = t('newGame');
    $('undoBtn').textContent = t('undo');
    $('resetBtn').textContent = t('resetGame');
    $('statsTitle').textContent = t('statsTitle');
    const done = gameComplete();
    if (done) recordHistory();
    const cur = currentPlayer();
    $('nowBowling').textContent = done
      ? t('gameComplete')
      : t('currentPlayer') + ': ' + (cur ? cur.name : '');
    if (done) {
      const scores = state.players.map((p) => L.finalScore(p.rolls));
      const best = Math.max.apply(null, scores);
      const winners = state.players.filter((p, i) => scores[i] === best);
      $('winnerLine').textContent = winners.length === 1
        ? t('winner') + ': ' + winners[0].name + ' (' + fmt(best) + ')'
        : t('tie') + ' (' + fmt(best) + ')';
    } else {
      $('winnerLine').textContent = '';
    }
    // Scorecards
    const wrap = $('cards');
    wrap.innerHTML = '';
    state.players.forEach((p, pi) => {
      const frames = L.frameLayout(p.rolls);
      const cum = L.scoreFrames(p.rolls);
      const div = document.createElement('div');
      div.className = 'playercard' + (pi === state.turn && !done ? ' current' : '');
      let html = '<div class="playerhead"><span class="playername">' + esc(p.name) + '</span>' +
        '<span class="playertotal">' + t('total') + ': ' + fmt(cum.filter((c) => c !== null).pop() ?? 0) + '</span></div>';
      html += '<div class="frames">';
      frames.forEach((f, fi) => {
        const balls = [0, 1, 2].map((pos) => {
          if (fi < 9 && pos === 2) return '';
          if (fi === 9 && pos === 2 && !(f.rolls[0] === 10 || (f.rolls[0] !== undefined && f.rolls[1] !== undefined && f.rolls[0] + f.rolls[1] === 10))) return '';
          const sym = L.rollSymbol(f.rolls, pos, fi);
          return '<span class="ball">' + esc(sym) + '</span>';
        }).join('');
        html += '<div class="frame"><div class="frameballs">' + balls + '</div>' +
          '<div class="framescore">' + (cum[fi] === null ? '' : fmt(cum[fi])) + '</div>' +
          '<div class="framelabel">' + fmt(fi + 1) + '</div></div>';
      });
      html += '</div>';
      div.innerHTML = html;
      wrap.appendChild(div);
    });
    // Pad
    const pad = $('pad');
    pad.innerHTML = '';
    const max = done || !cur ? null : L.nextRollMax(cur.rolls);
    for (let pins = 0; pins <= 10; pins++) {
      const b = document.createElement('button');
      b.className = 'padbtn';
      b.textContent = fmt(pins);
      b.disabled = max === null || pins > max;
      b.setAttribute('data-pins', String(pins));
      b.addEventListener('click', () => onBowl(pins));
      pad.appendChild(b);
    }
    $('padHint').textContent = done ? '' : (t('pinsDown') + ' — ' + t('currentPlayer') + ': ' + (cur ? cur.name : ''));
    $('padError').textContent = '';
    // Stats for current player (or first player when done)
    const sp = done ? state.players[0] : cur;
    if (sp) {
      const st = L.gameStats(sp.rolls);
      $('statsBox').innerHTML =
        '<div class="stat"><b>' + fmt(st.strikes) + '</b><span>' + t('strikes') + '</span></div>' +
        '<div class="stat"><b>' + fmt(st.spares) + '</b><span>' + t('spares') + '</span></div>' +
        '<div class="stat"><b>' + fmt(st.opens) + '</b><span>' + t('opens') + '</span></div>' +
        '<div class="stat"><b>' + fmt(st.avg.toFixed(2)) + '</b><span>' + t('avgPins') + '</span></div>';
    }
    save();
  }

  function renderHistory() {
    const box = $('historyList');
    $('clearHistoryBtn').textContent = t('clearHistory');
    if (!state.history.length) {
      box.innerHTML = '<p class="muted">' + esc(t('noHistory')) + '</p>';
      return;
    }
    box.innerHTML = '';
    state.history.forEach((h, hi) => {
      const row = document.createElement('div');
      row.className = 'histrow';
      const line = h.players.map((p) => esc(p.name) + ' ' + fmt(p.score)).join(' · ');
      row.innerHTML = '<span>' + esc(h.date) + ' — ' + line + '</span>' +
        '<button class="smallbtn" data-hist="' + hi + '">' + t('deleteGame') + '</button>';
      row.querySelector('button').addEventListener('click', () => {
        state.history.splice(hi, 1); save(); render();
      });
      box.appendChild(row);
    });
  }

  function onBowl(pins) {
    const cur = currentPlayer();
    if (!cur) return;
    const prev = completedCount(cur);
    const v = L.validateRoll(cur.rolls, pins);
    if (!v.ok) {
      $('padError').textContent = v.error === 'tooManyPins' ? t('invalidPins') + ' ' + fmt(v.max) : t('invalidPins');
      return;
    }
    cur.rolls.push(pins);
    state.order.push(state.turn);
    advanceTurn(prev);
    save(); render();
  }

  function wire() {
    $('langBtn').addEventListener('click', () => {
      state.lang = state.lang === 'en' ? 'bn' : 'en'; save(); render();
    });
    $('addPlayerBtn').addEventListener('click', () => {
      const inputs = Array.from(document.querySelectorAll('.nameinput'));
      state.players = inputs.map((el) => ({ name: el.value.trim(), rolls: [] }));
      if (state.players.length < 4) state.players.push({ name: '', rolls: [] });
      save(); render();
    });
    $('startBtn').addEventListener('click', () => {
      const inputs = Array.from(document.querySelectorAll('.nameinput'));
      // Empty boxes are dropped; at least one named player is required.
      const names = inputs.map((el) => el.value.trim()).filter((n) => n !== '');
      if (!names.length) { $('setupError').textContent = t('needPlayer'); return; }
      if (new Set(names).size !== names.length) { $('setupError').textContent = t('duplicateName'); return; }
      state.players = names.map((n) => ({ name: n, rolls: [] }));
      state.active = true; state.turn = 0; state.recorded = false; state.order = [];
      save(); render();
    });
    $('undoBtn').addEventListener('click', () => {
      // Undo removes the chronologically last ball, tracked in state.order
      // (turn order alone is wrong: the current player may hold earlier balls).
      if (!state.order.length) return;
      const idx = state.order.pop();
      const p = state.players[idx];
      if (!p || !p.rolls.length) return;
      // If the undone ball had finished the game, drop the history
      // entry it just recorded so re-completing does not duplicate it.
      if (state.recorded && state.history.length &&
          state.history[0].players.map((h) => h.name).join('|') ===
          state.players.map((q) => q.name).join('|')) {
        state.history.shift();
      }
      p.rolls.pop();
      state.turn = idx;
      state.recorded = false;
      save(); render();
    });
    $('resetBtn').addEventListener('click', () => {
      if (!window.confirm(t('confirmReset'))) return;
      state.players.forEach((p) => { p.rolls = []; });
      state.turn = 0; state.recorded = false; state.order = [];
      save(); render();
    });
    $('newGameBtn').addEventListener('click', () => {
      state.players = []; state.active = false; state.turn = 0; state.recorded = false; state.order = [];
      save(); render();
    });
    $('clearHistoryBtn').addEventListener('click', () => {
      if (!window.confirm(t('confirmClear'))) return;
      state.history = []; save(); render();
    });
  }

  document.addEventListener('DOMContentLoaded', () => { wire(); render(); });
})();
