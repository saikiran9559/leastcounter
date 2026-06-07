(function () {
  const Scorely = window.Scorely;
  if (!Scorely) return;

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function storageKey(gameId) {
    return `scorely:${gameId}:v1`;
  }

  function defaultSettings(config) {
    const s = {};
    for (const [key, schema] of Object.entries(config.settings || {})) {
      s[key] = schema.default;
    }
    return s;
  }

  function seedDefaults(state, config) {
    if (state.players.length === 0 && Array.isArray(config.defaultPlayers)) {
      state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
      for (const p of state.players) state.scores[p.id] = 0;
    }
  }

  function loadCounterState(config) {
    try {
      const raw = localStorage.getItem(storageKey(config.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.scores) parsed.scores = {};
        return parsed;
      }
    } catch {}
    const state = {
      settings: defaultSettings(config),
      players: [],
      scores: {},
    };
    seedDefaults(state, config);
    return state;
  }

  function saveState(config, state) {
    try {
      localStorage.setItem(storageKey(config.id), JSON.stringify(state));
    } catch {}
  }

  Scorely.createCounterInstance = function (gameId) {
    const config = Scorely.getGame(gameId);
    if (!config) throw new Error(`Unknown game: ${gameId}`);

    const state = loadCounterState(config);
    let container = null;
    let lastWinnerId = null;
    let lastScores = {};

    function persist() { saveState(config, state); }

    function nounSingular() { return config.playerNoun || "Player"; }
    function nounLower() { return nounSingular().toLowerCase(); }
    function nounPlural() { return nounSingular() + "s"; }
    function nounPluralLower() { return nounPlural().toLowerCase(); }

    function totalFor(playerId) {
      return state.scores[playerId] || 0;
    }

    function rankings() {
      return state.players
        .map((p) => ({ ...p, score: totalFor(p.id) }))
        .sort((a, b) => b.score - a.score);
    }

    function winner() {
      if (state.players.length < 2) return null;
      const ranked = rankings();
      const top = ranked[0];
      const second = ranked[1];
      const target = state.settings.target;
      const winBy = config.winBy || 1;
      if (top.score >= target && top.score - second.score >= winBy) {
        return top;
      }
      return null;
    }

    function leader() {
      if (state.players.length === 0) return null;
      const ranked = rankings();
      return ranked[0];
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
      state.scores[id] = 0;
      Scorely.recordPlayerName(trimmed);
      persist();
      render();
    }

    function removePlayer(id) {
      if (!confirm(`Remove this ${nounLower()}?`)) return;
      state.players = state.players.filter((p) => p.id !== id);
      delete state.scores[id];
      persist();
      render();
    }

    function increment(playerId, delta) {
      const next = (state.scores[playerId] || 0) + delta;
      if (next < 0) return;
      state.scores[playerId] = next;
      persist();
      updateScoresOnly();
    }

    function resetScores() {
      if (!confirm("Reset all scores to 0?")) return;
      for (const p of state.players) state.scores[p.id] = 0;
      persist();
      render();
    }

    function resetGame() {
      if (!confirm(`Reset everything — ${nounPluralLower()} and scores?`)) return;
      state.players = [];
      state.scores = {};
      state.settings = defaultSettings(config);
      seedDefaults(state, config);
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

    function updateScoresOnly() {
      const ranked = rankings();
      const topScore = ranked[0]?.score ?? 0;
      const w = winner();
      for (const p of state.players) {
        const scoreEl = container.querySelector(`[data-counter-score="${p.id}"]`);
        if (!scoreEl) continue;
        const newScore = totalFor(p.id);
        const prev = lastScores[p.id] ?? newScore;
        scoreEl.textContent = newScore;
        scoreEl.classList.toggle("leader", newScore === topScore && newScore > 0);
        if (prev !== newScore) {
          scoreEl.classList.remove("flash");
          void scoreEl.offsetWidth;
          scoreEl.classList.add("flash");
        }
        lastScores[p.id] = newScore;
      }
      const banner = container.querySelector("#winner-banner");
      if (banner) {
        if (w) {
          banner.classList.remove("hidden");
          const scoreNoun = config.scoreNoun || "points";
          banner.textContent = `🏆 ${w.name} wins ${totalFor(w.id)}–${rankings()[1]?.score ?? 0} ${scoreNoun}!`;
        } else {
          banner.classList.add("hidden");
        }
      }
      if (w && w.id !== lastWinnerId) Scorely.fireConfetti();
      lastWinnerId = w ? w.id : null;
    }

    function render() {
      if (!container) return;
      const iconStyle = config.accent ? ` style="background: ${config.accent};"` : "";
      const iconBadge = config.icon
        ? `<div class="game-icon"${iconStyle}>${config.icon}</div>`
        : "";

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
            <h3>${Scorely.escapeHtml(nounPlural())}</h3>
            <ul id="player-list"></ul>
            <div class="row">
              <input type="text" id="new-player-name" placeholder="${Scorely.escapeHtml(nounSingular())} name" maxlength="20" list="player-names" />
              <button id="add-player">Add ${Scorely.escapeHtml(nounLower())}</button>
            </div>
          </div>
        </section>

        <section class="card counter-card-wrap">
          <h2>Score</h2>
          <div id="counters" class="counter-grid"></div>
        </section>

        <section id="status" class="card">
          <h2>Status</h2>
          <div id="winner-banner" class="hidden"></div>
          <div class="row" style="margin-top: 14px;">
            <button id="reset-scores">Reset scores</button>
            <button id="reset-game" class="danger">Reset game</button>
          </div>
        </section>
      `;

      renderSettings();
      renderPlayerList();
      renderCounters();
      wireEvents();

      lastScores = {};
      for (const p of state.players) lastScores[p.id] = totalFor(p.id);

      const w = winner();
      if (w) {
        const banner = container.querySelector("#winner-banner");
        if (banner) {
          banner.classList.remove("hidden");
          const scoreNoun = config.scoreNoun || "points";
          banner.textContent = `🏆 ${w.name} wins ${totalFor(w.id)}–${rankings()[1]?.score ?? 0} ${scoreNoun}!`;
        }
        if (w.id !== lastWinnerId) Scorely.fireConfetti();
        lastWinnerId = w.id;
      } else {
        lastWinnerId = null;
      }
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
        list.innerHTML = `<li class="empty">No ${Scorely.escapeHtml(nounPluralLower())} yet — add at least two to begin.</li>`;
        return;
      }
      for (const p of state.players) {
        const li = document.createElement("li");
        li.innerHTML = `<span>${Scorely.escapeHtml(p.name)}</span>`;
        const btn = document.createElement("button");
        btn.className = "icon";
        btn.textContent = "×";
        btn.title = `Remove ${nounLower()}`;
        btn.onclick = () => removePlayer(p.id);
        li.appendChild(btn);
        list.appendChild(li);
      }
    }

    function renderCounters() {
      const wrap = container.querySelector("#counters");
      wrap.innerHTML = "";
      if (state.players.length === 0) {
        wrap.innerHTML = `<p class="empty">Add ${Scorely.escapeHtml(nounPluralLower())} to start scoring.</p>`;
        return;
      }
      const ranked = rankings();
      const topScore = ranked[0]?.score ?? 0;
      for (const p of state.players) {
        const score = totalFor(p.id);
        const isLead = score === topScore && score > 0;
        const card = document.createElement("div");
        card.className = "counter-card" + (isLead ? " leading" : "");
        card.innerHTML = `
          <div class="counter-name">${Scorely.escapeHtml(p.name)}</div>
          <div class="counter-score${isLead ? " leader" : ""}" data-counter-score="${p.id}">${score}</div>
          <button class="counter-plus" data-counter-plus="${p.id}">+1</button>
          <button class="counter-minus" data-counter-minus="${p.id}">−1</button>
        `;
        wrap.appendChild(card);
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
      container.querySelector("#reset-scores").onclick = resetScores;
      container.querySelector("#reset-game").onclick = resetGame;

      container.querySelectorAll("[data-counter-plus]").forEach((btn) => {
        btn.addEventListener("click", () => increment(btn.dataset.counterPlus, +1));
      });
      container.querySelectorAll("[data-counter-minus]").forEach((btn) => {
        btn.addEventListener("click", () => increment(btn.dataset.counterMinus, -1));
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
