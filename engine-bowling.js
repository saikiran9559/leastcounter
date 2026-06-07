(function () {
  const Scorely = window.Scorely;
  if (!Scorely) return;

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function storageKey(gameId) { return `scorely:${gameId}:v1`; }

  function defaultSettings(config) {
    const s = {};
    for (const [key, schema] of Object.entries(config.settings || {})) {
      s[key] = schema.default;
    }
    return s;
  }

  function loadBowlingState(config) {
    try {
      const raw = localStorage.getItem(storageKey(config.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.frames) parsed.frames = {};
        return parsed;
      }
    } catch {}
    const state = {
      settings: defaultSettings(config),
      players: [],
      frames: {},
    };
    if (Array.isArray(config.defaultPlayers)) {
      state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
      for (const p of state.players) state.frames[p.id] = [];
    }
    return state;
  }

  function saveState(config, state) {
    try { localStorage.setItem(storageKey(config.id), JSON.stringify(state)); } catch {}
  }

  Scorely.createBowlingInstance = function (gameId) {
    const config = Scorely.getGame(gameId);
    if (!config) throw new Error(`Unknown game: ${gameId}`);

    const state = loadBowlingState(config);
    let container = null;
    let lastWinnerId = null;

    function persist() { saveState(config, state); }

    function framesFor(playerId) {
      return state.frames[playerId] || [];
    }

    function isFrameClosed(frame, idx) {
      if (!frame || frame.throws.length === 0) return false;
      if (idx === 9) {
        if (frame.throws.length === 3) return true;
        if (frame.throws.length === 2) {
          if (frame.throws[0] === 10) return false;
          if (frame.throws[0] + frame.throws[1] === 10) return false;
          return true;
        }
        return false;
      }
      if (frame.throws[0] === 10) return true;
      return frame.throws.length === 2;
    }

    function isGameComplete(playerId) {
      const frames = framesFor(playerId);
      if (frames.length < 10) return false;
      return isFrameClosed(frames[9], 9);
    }

    function nextThrows(playerId, frameIdx, count) {
      const frames = framesFor(playerId);
      const out = [];
      for (let i = frameIdx; i < frames.length && out.length < count; i++) {
        for (const t of frames[i].throws) {
          if (out.length < count) out.push(t);
        }
      }
      while (out.length < count) out.push(null);
      return out;
    }

    function frameScore(playerId, frameIdx) {
      const frames = framesFor(playerId);
      const frame = frames[frameIdx];
      if (!frame || frame.throws.length === 0) return null;
      const t1 = frame.throws[0];
      const t2 = frame.throws[1];
      const t3 = frame.throws[2];

      if (frameIdx === 9) {
        if (!isFrameClosed(frame, 9)) return null;
        return (t1 || 0) + (t2 || 0) + (t3 || 0);
      }

      if (t1 === 10) {
        const next = nextThrows(playerId, frameIdx + 1, 2);
        if (next[0] === null || next[1] === null) return null;
        return 10 + next[0] + next[1];
      }

      if (t2 === undefined) return null;

      if (t1 + t2 === 10) {
        const next = nextThrows(playerId, frameIdx + 1, 1);
        if (next[0] === null) return null;
        return 10 + next[0];
      }

      return t1 + t2;
    }

    function cumulativeScore(playerId, throughIdx) {
      let total = 0;
      for (let i = 0; i <= throughIdx; i++) {
        const fs = frameScore(playerId, i);
        if (fs === null) return null;
        total += fs;
      }
      return total;
    }

    function totalFor(playerId) {
      const frames = framesFor(playerId);
      let total = 0;
      for (let i = 0; i < Math.min(frames.length, 10); i++) {
        const fs = frameScore(playerId, i);
        if (fs !== null) total += fs;
      }
      return total;
    }

    function winner() {
      if (state.players.length < 2) return null;
      if (!state.players.every((p) => isGameComplete(p.id))) return null;
      let best = state.players[0];
      for (const p of state.players) {
        if (totalFor(p.id) > totalFor(best.id)) best = p;
      }
      return best;
    }

    function leader() {
      if (state.players.length === 0) return null;
      let best = state.players[0];
      for (const p of state.players) {
        if (totalFor(p.id) > totalFor(best.id)) best = p;
      }
      return totalFor(best.id) > 0 ? best : null;
    }

    function addPlayer(name) {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (state.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
        alert("That name is already taken.");
        return;
      }
      const id = uid();
      state.players.push({ id, name: trimmed });
      state.frames[id] = [];
      Scorely.recordPlayerName(trimmed);
      persist();
      render();
    }

    function removePlayer(id) {
      if ((state.frames[id] || []).length > 0) {
        if (!confirm("Remove this player and their game?")) return;
      }
      state.players = state.players.filter((p) => p.id !== id);
      delete state.frames[id];
      persist();
      render();
    }

    function maxThrowsAllowed(playerId) {
      const frames = framesFor(playerId);
      if (frames.length === 0) return 10;
      const last = frames[frames.length - 1];
      const idx = frames.length - 1;
      if (idx === 9) {
        if (last.throws.length === 0) return 10;
        if (last.throws.length === 1) {
          if (last.throws[0] === 10) return 10;
          return 10 - last.throws[0];
        }
        if (last.throws.length === 2) {
          if (last.throws[0] === 10) {
            if (last.throws[1] === 10) return 10;
            return 10 - last.throws[1];
          }
          return 10;
        }
        return 0;
      }
      if (last.throws.length === 0) return 10;
      if (last.throws[0] === 10) return 10;
      if (last.throws.length === 1) return 10 - last.throws[0];
      return 10;
    }

    function recordThrow(playerId, pins) {
      if (isGameComplete(playerId)) return;
      const frames = state.frames[playerId] || (state.frames[playerId] = []);
      const idx = frames.length === 0 ? 0 : frames.length - 1;
      let current = frames[idx];
      if (!current || isFrameClosed(current, idx)) {
        if (frames.length >= 10) return;
        current = { throws: [] };
        frames.push(current);
      }
      current.throws.push(pins);
      Scorely.playTap();
      persist();
      render();
    }

    function undoLast(playerId) {
      const frames = framesFor(playerId);
      if (frames.length === 0) return;
      const last = frames[frames.length - 1];
      last.throws.pop();
      if (last.throws.length === 0) frames.pop();
      persist();
      render();
    }

    function resetGame() {
      if (!confirm("Reset the game (keep players)?")) return;
      for (const p of state.players) state.frames[p.id] = [];
      persist();
      render();
    }

    function resetAll() {
      if (!confirm("Reset everything — players and game?")) return;
      state.players = [];
      state.frames = {};
      state.settings = defaultSettings(config);
      if (Array.isArray(config.defaultPlayers)) {
        state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
        for (const p of state.players) state.frames[p.id] = [];
      }
      persist();
      render();
    }

    function throwLabel(frame, throwIdx, frameIdx) {
      const t = frame.throws[throwIdx];
      if (t === undefined) return "";
      if (t === 10) return "X";
      if (throwIdx === 1 && frame.throws[0] !== 10 && (frame.throws[0] || 0) + t === 10) return "/";
      if (frameIdx === 9 && throwIdx === 2) {
        const prev = frame.throws[1];
        if (prev !== 10 && prev !== undefined && prev + t === 10) return "/";
      }
      if (t === 0) return "−";
      return String(t);
    }

    function render() {
      if (!container) return;
      const iconStyle = config.accent ? ` style="background: ${config.accent};"` : "";
      const iconBadge = config.icon ? `<div class="game-icon"${iconStyle}>${config.icon}</div>` : "";

      const w = winner();

      container.innerHTML = `
        <section class="card game-header">
          ${iconBadge}
          <div>
            <h2>${Scorely.escapeHtml(config.name)}</h2>
            ${config.tagline ? `<p class="tagline">${Scorely.escapeHtml(config.tagline)}</p>` : ""}
          </div>
        </section>

        <section id="setup" class="card">
          <h2>Setup</h2>
          <div class="players">
            <h3>Players</h3>
            <ul id="player-list"></ul>
            <div class="row">
              <input type="text" id="new-player-name" placeholder="Player name" maxlength="20" list="player-names" />
              <button id="add-player">Add player</button>
            </div>
          </div>
        </section>

        <section class="card">
          <h2>Game</h2>
          <div id="bowling-players" class="bowling-grid"></div>
        </section>

        <section id="status" class="card">
          <h2>Status</h2>
          <div id="winner-banner" class="${w ? "" : "hidden"}"></div>
          <div class="row" style="margin-top: 14px;">
            <button id="reset-game">Reset game</button>
            <button id="reset-all" class="danger">Reset everything</button>
          </div>
        </section>
      `;

      renderPlayerList();
      renderBowlingPlayers();
      renderStatus();
      wireEvents();

      if (w && w.id !== lastWinnerId) Scorely.fireConfetti();
      lastWinnerId = w ? w.id : null;
    }

    function renderPlayerList() {
      const list = container.querySelector("#player-list");
      list.innerHTML = "";
      if (state.players.length === 0) {
        list.innerHTML = `<li class="empty">No players yet — add at least two to begin.</li>`;
        return;
      }
      for (const p of state.players) {
        const li = document.createElement("li");
        li.innerHTML = `<span>${Scorely.escapeHtml(p.name)}</span>`;
        const btn = document.createElement("button");
        btn.className = "icon";
        btn.textContent = "×";
        btn.title = "Remove player";
        btn.onclick = () => removePlayer(p.id);
        li.appendChild(btn);
        list.appendChild(li);
      }
    }

    function renderBowlingPlayers() {
      const wrap = container.querySelector("#bowling-players");
      wrap.innerHTML = "";
      if (state.players.length === 0) {
        wrap.innerHTML = `<p class="empty">Add players to start bowling.</p>`;
        return;
      }

      for (const p of state.players) {
        const frames = framesFor(p.id);
        const done = isGameComplete(p.id);
        const max = done ? 0 : maxThrowsAllowed(p.id);

        const card = document.createElement("div");
        card.className = "bowling-player" + (done ? " done" : "");

        const head = document.createElement("div");
        head.className = "bowling-head";
        head.innerHTML = `
          <div class="bowling-name">${Scorely.escapeHtml(p.name)}</div>
          <div class="bowling-total">${totalFor(p.id)}</div>
        `;
        card.appendChild(head);

        const strip = document.createElement("div");
        strip.className = "bowling-strip";
        for (let i = 0; i < 10; i++) {
          const frame = frames[i];
          const cell = document.createElement("div");
          cell.className = "bowling-frame";
          if (i === 9) cell.classList.add("bowling-frame-last");
          if (frame && frames.length - 1 === i && !isFrameClosed(frame, i) && !done) cell.classList.add("active");

          const throws = (frame ? frame.throws : []);
          const slots = i === 9 ? 3 : 2;
          let throwsHtml = '';
          for (let j = 0; j < slots; j++) {
            const v = throws[j];
            const cls = v === undefined ? "bowling-throw empty" : "bowling-throw filled";
            const txt = frame ? throwLabel(frame, j, i) : "";
            throwsHtml += `<span class="${cls}">${txt}</span>`;
          }
          const cumulative = cumulativeScore(p.id, i);
          const scoreText = cumulative === null ? "" : cumulative;
          cell.innerHTML = `
            <div class="bowling-frame-throws">${throwsHtml}</div>
            <div class="bowling-frame-score">${scoreText}</div>
          `;
          strip.appendChild(cell);
        }
        card.appendChild(strip);

        if (!done) {
          const pad = document.createElement("div");
          pad.className = "bowling-pad";
          for (let pin = 0; pin <= 10; pin++) {
            const btn = document.createElement("button");
            btn.className = "bowling-pin" + (pin === 10 ? " bowling-pin-strike" : "");
            btn.textContent = pin === 10 ? "X" : pin === 0 ? "−" : String(pin);
            btn.disabled = pin > max;
            btn.onclick = () => recordThrow(p.id, pin);
            pad.appendChild(btn);
          }
          card.appendChild(pad);

          if (frames.length > 0) {
            const undo = document.createElement("button");
            undo.className = "bowling-undo";
            undo.textContent = "Undo last throw";
            undo.onclick = () => undoLast(p.id);
            card.appendChild(undo);
          }
        } else {
          const done = document.createElement("div");
          done.className = "bowling-done";
          done.textContent = `Game complete · ${totalFor(p.id)}`;
          card.appendChild(done);
        }

        wrap.appendChild(card);
      }
    }

    function renderStatus() {
      const w = winner();
      const banner = container.querySelector("#winner-banner");
      if (w) {
        banner.classList.remove("hidden");
        banner.textContent = `🏆 ${w.name} wins with ${totalFor(w.id)}!`;
      } else {
        banner.classList.add("hidden");
      }
    }

    function wireEvents() {
      container.querySelector("#add-player").onclick = () => {
        const input = container.querySelector("#new-player-name");
        addPlayer(input.value);
        input.value = "";
        input.focus();
      };
      container.querySelector("#new-player-name").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          container.querySelector("#add-player").click();
        }
      });
      container.querySelector("#reset-game").onclick = resetGame;
      container.querySelector("#reset-all").onclick = resetAll;
    }

    return {
      get state() { return state; },
      mount(el) {
        container = el;
        render();
      },
    };
  };
})();
