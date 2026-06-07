(function () {
  const Scorely = window.Scorely;
  if (!Scorely) return;

  const NUMBERS = ["15", "16", "17", "18", "19", "20", "bull"];
  const LABEL_FOR = { 15: "15", 16: "16", 17: "17", 18: "18", 19: "19", 20: "20", bull: "Bull" };

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function storageKey(gameId) { return `scorely:${gameId}:v1`; }

  function emptyMarks() {
    const m = {};
    for (const n of NUMBERS) m[n] = 0;
    return m;
  }

  function loadDartsState(config) {
    try {
      const raw = localStorage.getItem(storageKey(config.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.marks) parsed.marks = {};
        return parsed;
      }
    } catch {}
    const state = { settings: {}, players: [], marks: {} };
    if (Array.isArray(config.defaultPlayers)) {
      state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
      for (const p of state.players) state.marks[p.id] = emptyMarks();
    }
    return state;
  }

  function saveState(config, state) {
    try { localStorage.setItem(storageKey(config.id), JSON.stringify(state)); } catch {}
  }

  Scorely.createDartsCricketInstance = function (gameId) {
    const config = Scorely.getGame(gameId);
    if (!config) throw new Error(`Unknown game: ${gameId}`);

    const state = loadDartsState(config);
    let container = null;
    let lastWinnerId = null;

    function persist() { saveState(config, state); }

    function marksFor(playerId, num) {
      const m = state.marks[playerId] || (state.marks[playerId] = emptyMarks());
      return Number(m[num]) || 0;
    }

    function isClosed(playerId, num) {
      return marksFor(playerId, num) >= 3;
    }

    function closedCount(playerId) {
      return NUMBERS.filter((n) => isClosed(playerId, n)).length;
    }

    function winner() {
      if (state.players.length < 2) return null;
      for (const p of state.players) {
        if (NUMBERS.every((n) => isClosed(p.id, n))) return p;
      }
      return null;
    }

    function leader() {
      if (state.players.length === 0) return null;
      let best = state.players[0];
      for (const p of state.players) {
        if (closedCount(p.id) > closedCount(best.id)) best = p;
      }
      return closedCount(best.id) > 0 ? best : null;
    }

    function addMark(playerId, num) {
      if (winner()) return;
      const m = state.marks[playerId] || (state.marks[playerId] = emptyMarks());
      const cur = Number(m[num]) || 0;
      if (cur >= 3) return;
      m[num] = cur + 1;
      persist();
      render();
    }

    function removeMark(playerId, num) {
      const m = state.marks[playerId] || (state.marks[playerId] = emptyMarks());
      const cur = Number(m[num]) || 0;
      if (cur <= 0) return;
      m[num] = cur - 1;
      persist();
      render();
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
      state.marks[id] = emptyMarks();
      persist();
      render();
    }

    function removePlayer(id) {
      if (!confirm("Remove this player and their marks?")) return;
      state.players = state.players.filter((p) => p.id !== id);
      delete state.marks[id];
      persist();
      render();
    }

    function resetGame() {
      if (!confirm("Reset everything — players and marks?")) return;
      state.players = [];
      state.marks = {};
      if (Array.isArray(config.defaultPlayers)) {
        state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
        for (const p of state.players) state.marks[p.id] = emptyMarks();
      }
      persist();
      render();
    }

    function resetMarksOnly() {
      if (!confirm("Reset all marks (keep players)?")) return;
      for (const p of state.players) state.marks[p.id] = emptyMarks();
      persist();
      render();
    }

    function markGlyph(count) {
      if (count >= 3) return "⊗";
      if (count === 2) return "X";
      if (count === 1) return "/";
      return "";
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
              <input type="text" id="new-player-name" placeholder="Player name" maxlength="20" />
              <button id="add-player">Add player</button>
            </div>
          </div>
        </section>

        <section class="card">
          <h2>Marks</h2>
          <div id="darts-matrix"></div>
        </section>

        <section id="status" class="card">
          <h2>Status</h2>
          <div id="winner-banner" class="${w ? "" : "hidden"}"></div>
          <ul id="status-list"></ul>
          <div class="row" style="margin-top: 14px;">
            <button id="reset-marks">Reset marks</button>
            <button id="reset-all" class="danger">Reset everything</button>
          </div>
        </section>
      `;

      renderPlayerList();
      renderMatrix();
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

    function renderMatrix() {
      const wrap = container.querySelector("#darts-matrix");
      wrap.innerHTML = "";
      if (state.players.length === 0) {
        wrap.innerHTML = `<p class="empty">Add players to start scoring.</p>`;
        return;
      }
      const w = winner();
      const grid = document.createElement("div");
      grid.className = "darts-matrix";
      grid.style.gridTemplateColumns = `minmax(100px, 1fr) repeat(${NUMBERS.length}, 1fr)`;

      const header = document.createElement("div");
      header.className = "darts-header darts-corner";
      header.textContent = "Player";
      grid.appendChild(header);
      for (const n of NUMBERS) {
        const h = document.createElement("div");
        h.className = "darts-header";
        h.textContent = LABEL_FOR[n];
        grid.appendChild(h);
      }

      for (const p of state.players) {
        const won = w && w.id === p.id;
        const nameCell = document.createElement("div");
        nameCell.className = "darts-name" + (won ? " darts-name-winner" : "");
        nameCell.textContent = p.name;
        grid.appendChild(nameCell);
        for (const n of NUMBERS) {
          const cell = document.createElement("button");
          const count = marksFor(p.id, n);
          cell.className = "darts-cell" + (count >= 3 ? " darts-closed" : "") + (count > 0 ? " darts-marked" : "");
          cell.textContent = markGlyph(count);
          cell.title = `${LABEL_FOR[n]} — ${count}/3 marks`;
          cell.disabled = !!w;
          cell.addEventListener("click", () => addMark(p.id, n));
          cell.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            removeMark(p.id, n);
          });
          grid.appendChild(cell);
        }
      }
      wrap.appendChild(grid);
      const hint = document.createElement("p");
      hint.className = "darts-hint";
      hint.textContent = "Tap a cell to add a mark (1 → / → X → ⊗ closed). Right-click / long-press to remove.";
      wrap.appendChild(hint);
    }

    function renderStatus() {
      const banner = container.querySelector("#winner-banner");
      const w = winner();
      if (w) {
        banner.classList.remove("hidden");
        banner.textContent = `🏆 ${w.name} closed all 7 — wins!`;
      } else {
        banner.classList.add("hidden");
      }
      const list = container.querySelector("#status-list");
      list.innerHTML = "";
      if (state.players.length === 0) {
        list.innerHTML = '<li class="empty">Add players to see status.</li>';
        return;
      }
      const leaderP = leader();
      const sorted = [...state.players].sort((a, b) => closedCount(b.id) - closedCount(a.id));
      for (const p of sorted) {
        const li = document.createElement("li");
        const cc = closedCount(p.id);
        if (leaderP && p.id === leaderP.id && cc > 0) li.classList.add("leader");
        li.innerHTML = `<span>${Scorely.escapeHtml(p.name)}</span><strong>${cc} / 7</strong>`;
        list.appendChild(li);
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
      container.querySelector("#reset-marks").onclick = resetMarksOnly;
      container.querySelector("#reset-all").onclick = resetGame;
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
