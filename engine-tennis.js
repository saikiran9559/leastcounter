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

  function freshMatch() {
    return {
      completedSets: [],
      games: [0, 0],
      points: [0, 0],
      winnerId: null,
    };
  }

  function loadTennisState(config) {
    try {
      const raw = localStorage.getItem(storageKey(config.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.match) parsed.match = freshMatch();
        return parsed;
      }
    } catch {}
    const state = {
      settings: defaultSettings(config),
      players: [],
      match: freshMatch(),
    };
    if (Array.isArray(config.defaultPlayers)) {
      state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
    }
    return state;
  }

  function saveState(config, state) {
    try { localStorage.setItem(storageKey(config.id), JSON.stringify(state)); } catch {}
  }

  Scorely.createTennisInstance = function (gameId) {
    const config = Scorely.getGame(gameId);
    if (!config) throw new Error(`Unknown game: ${gameId}`);

    const state = loadTennisState(config);
    let container = null;
    let lastWinnerId = null;

    function persist() { saveState(config, state); }

    function setsTarget() { return state.settings.setsToWin || 2; }
    function gamesTarget() { return state.settings.gamesToWinSet || 6; }

    function gameWonBy(points) {
      const [a, b] = points;
      if (a >= 4 && a - b >= 2) return 0;
      if (b >= 4 && b - a >= 2) return 1;
      return -1;
    }

    function setWonBy(games) {
      const [a, b] = games;
      const T = gamesTarget();
      if (a >= T && a - b >= 2) return 0;
      if (b >= T && b - a >= 2) return 1;
      return -1;
    }

    function setsWonBy(playerIdx) {
      if (state.players.length < 2) return 0;
      const pid = state.players[playerIdx].id;
      return state.match.completedSets.filter((s) => s.winnerId === pid).length;
    }

    function matchWinner() {
      if (state.players.length < 2) return null;
      const target = setsTarget();
      for (let i = 0; i < 2; i++) {
        if (setsWonBy(i) >= target) return state.players[i];
      }
      return null;
    }

    function pointLabel(idx) {
      const [a, b] = idx === 0 ? state.match.points : [state.match.points[1], state.match.points[0]];
      if (a < 3 && b < 3) return ["0", "15", "30"][a];
      if (a === b) return "Deuce";
      if (a >= 3 && b >= 3) return a > b ? "AD" : "40";
      if (a < 3) return ["0", "15", "30"][a];
      return "40";
    }

    function addPlayer(name) {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (state.players.length >= 2) {
        alert("Tennis is a 2-player game. Reset to change players.");
        return;
      }
      if (state.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
        alert("That name is already taken.");
        return;
      }
      state.players.push({ id: uid(), name: trimmed });
      persist();
      render();
    }

    function removePlayer(id) {
      if (state.match.completedSets.length > 0 || state.match.games.some(g => g > 0) || state.match.points.some(p => p > 0)) {
        if (!confirm("Removing a player will reset the match. Continue?")) return;
        state.match = freshMatch();
      }
      state.players = state.players.filter((p) => p.id !== id);
      persist();
      render();
    }

    function addPoint(idx) {
      if (matchWinner()) return;
      if (state.players.length < 2) return;
      const m = state.match;
      m.points[idx] = (m.points[idx] || 0) + 1;
      const gw = gameWonBy(m.points);
      if (gw >= 0) {
        m.games[gw]++;
        m.points = [0, 0];
        const sw = setWonBy(m.games);
        if (sw >= 0) {
          m.completedSets.push({
            games: [m.games[0], m.games[1]],
            winnerId: state.players[sw].id,
          });
          m.games = [0, 0];
        }
      }
      persist();
      render();
    }

    function resetMatch() {
      if (!confirm("Reset the match (keep players)?")) return;
      state.match = freshMatch();
      persist();
      render();
    }

    function resetAll() {
      if (!confirm("Reset everything — players and match?")) return;
      state.players = [];
      state.match = freshMatch();
      state.settings = defaultSettings(config);
      if (Array.isArray(config.defaultPlayers)) {
        state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
      }
      persist();
      render();
    }

    function updateSetting(key, rawValue) {
      const schema = (config.settings || {})[key];
      if (!schema) return;
      let value = rawValue;
      if (schema.type === "number") {
        value = parseInt(rawValue, 10);
        if (!Number.isFinite(value)) return;
        if (schema.min !== undefined && value < schema.min) return;
      }
      state.settings[key] = value;
      persist();
      render();
    }

    function render() {
      if (!container) return;
      const iconStyle = config.accent ? ` style="background: ${config.accent};"` : "";
      const iconBadge = config.icon ? `<div class="game-icon"${iconStyle}>${config.icon}</div>` : "";

      const w = matchWinner();

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
          <div class="row" id="settings-row"></div>
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
          <h2>Match</h2>
          <div id="tennis-board"></div>
        </section>

        <section id="status" class="card">
          <h2>Status</h2>
          <div id="winner-banner" class="${w ? "" : "hidden"}"></div>
          <ul id="completed-sets"></ul>
          <div class="row" style="margin-top: 14px;">
            <button id="reset-match">Reset match</button>
            <button id="reset-all" class="danger">Reset everything</button>
          </div>
        </section>
      `;

      renderSettings();
      renderPlayerList();
      renderBoard();
      renderStatus();
      wireEvents();

      if (w && w.id !== lastWinnerId) Scorely.fireConfetti();
      lastWinnerId = w ? w.id : null;
    }

    function renderSettings() {
      const row = container.querySelector("#settings-row");
      row.innerHTML = "";
      for (const [key, schema] of Object.entries(config.settings || {})) {
        const label = document.createElement("label");
        label.innerHTML = `<span>${Scorely.escapeHtml(schema.label)}</span>`;
        const input = document.createElement("input");
        input.type = schema.type || "text";
        if (schema.min !== undefined) input.min = String(schema.min);
        input.value = state.settings[key];
        input.addEventListener("change", (e) => updateSetting(key, e.target.value));
        label.appendChild(input);
        row.appendChild(label);
      }
    }

    function renderPlayerList() {
      const list = container.querySelector("#player-list");
      list.innerHTML = "";
      if (state.players.length === 0) {
        list.innerHTML = `<li class="empty">Add 2 players to begin.</li>`;
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

    function renderBoard() {
      const wrap = container.querySelector("#tennis-board");
      wrap.innerHTML = "";
      if (state.players.length < 2) {
        wrap.innerHTML = `<p class="empty">Add 2 players to start the match.</p>`;
        return;
      }
      const w = matchWinner();
      const grid = document.createElement("div");
      grid.className = "tennis-grid";
      const m = state.match;
      const pointsAreDeuce = m.points[0] >= 3 && m.points[1] >= 3 && m.points[0] === m.points[1];

      if (pointsAreDeuce) {
        const deuce = document.createElement("div");
        deuce.className = "tennis-deuce";
        deuce.textContent = "DEUCE";
        wrap.appendChild(deuce);
      }

      for (let i = 0; i < 2; i++) {
        const p = state.players[i];
        const card = document.createElement("div");
        card.className = "tennis-side" + (w && w.id === p.id ? " tennis-winner" : "");
        card.innerHTML = `
          <div class="tennis-name">${Scorely.escapeHtml(p.name)}</div>
          <div class="tennis-stats">
            <div class="tennis-stat"><span class="tennis-stat-label">Sets</span><span class="tennis-stat-value">${setsWonBy(i)}</span></div>
            <div class="tennis-stat"><span class="tennis-stat-label">Games</span><span class="tennis-stat-value">${m.games[i]}</span></div>
            <div class="tennis-stat tennis-stat-points"><span class="tennis-stat-label">Point</span><span class="tennis-stat-value">${pointLabel(i)}</span></div>
          </div>
          <button class="tennis-point-btn" data-tennis-point="${i}" ${w ? "disabled" : ""}>+ POINT</button>
        `;
        grid.appendChild(card);
      }
      wrap.appendChild(grid);
    }

    function renderStatus() {
      const w = matchWinner();
      const banner = container.querySelector("#winner-banner");
      if (w) {
        banner.classList.remove("hidden");
        const sets = setsWonBy(state.players.findIndex((p) => p.id === w.id));
        const target = setsTarget();
        banner.textContent = `🏆 ${w.name} wins the match ${sets}–${target * 2 - sets - 1}!`;
      } else {
        banner.classList.add("hidden");
      }

      const list = container.querySelector("#completed-sets");
      list.innerHTML = "";
      if (state.match.completedSets.length === 0) {
        list.innerHTML = '<li class="empty">No completed sets yet.</li>';
        return;
      }
      state.match.completedSets.forEach((s, idx) => {
        const li = document.createElement("li");
        const winner = state.players.find((p) => p.id === s.winnerId);
        const wName = winner ? winner.name : "—";
        const [a, b] = s.games;
        li.innerHTML = `<span>Set ${idx + 1} — ${Scorely.escapeHtml(wName)}</span><strong>${a}–${b}</strong>`;
        li.classList.add("leader");
        list.appendChild(li);
      });
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
      container.querySelector("#reset-match").onclick = resetMatch;
      container.querySelector("#reset-all").onclick = resetAll;
      container.querySelectorAll("[data-tennis-point]").forEach((btn) => {
        btn.addEventListener("click", () => addPoint(parseInt(btn.dataset.tennisPoint, 10)));
      });
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
