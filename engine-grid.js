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
      for (const p of state.players) state.scores[p.id] = {};
    }
  }

  function loadGridState(config) {
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

  Scorely.createGridInstance = function (gameId) {
    const config = Scorely.getGame(gameId);
    if (!config) throw new Error(`Unknown game: ${gameId}`);

    const state = loadGridState(config);
    let container = null;
    let lastWinnerId = null;

    function persist() {
      saveState(config, state);
    }

    function categories() {
      if (typeof config.categories === "function") {
        return config.categories(state.settings);
      }
      return config.categories || [];
    }

    function nounSingular() { return config.playerNoun || "Player"; }
    function nounLower() { return nounSingular().toLowerCase(); }
    function nounPlural() { return nounSingular() + "s"; }
    function nounPluralLower() { return nounPlural().toLowerCase(); }

    function totalFor(playerId) {
      const scores = state.scores[playerId] || {};
      return categories().reduce((sum, cat) => {
        const v = scores[cat.key];
        return sum + (Number.isFinite(Number(v)) ? Number(v) : 0);
      }, 0);
    }

    function filledCount(playerId) {
      const scores = state.scores[playerId] || {};
      return categories().filter((cat) => {
        const v = scores[cat.key];
        return v !== undefined && v !== null && v !== "";
      }).length;
    }

    function isComplete(playerId) {
      return filledCount(playerId) === categories().length;
    }

    function pickByDirection(candidates, getValue) {
      if (candidates.length === 0) return null;
      return candidates.reduce((best, p) => {
        const better = config.scoring.direction === "high"
          ? getValue(p) > getValue(best)
          : getValue(p) < getValue(best);
        return better ? p : best;
      });
    }

    function leader() {
      if (state.players.length === 0) return null;
      return pickByDirection(state.players, (p) => totalFor(p.id));
    }

    function winner() {
      if (state.players.length < 2) return null;
      if (!state.players.every((p) => isComplete(p.id))) return null;
      return pickByDirection(state.players, (p) => totalFor(p.id));
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
      state.scores[id] = {};
      Scorely.recordPlayerName(trimmed);
      persist();
      render();
    }

    function removePlayer(id) {
      if (!confirm(`Remove this ${nounLower()} and their scores?`)) return;
      state.players = state.players.filter((p) => p.id !== id);
      delete state.scores[id];
      persist();
      render();
    }

    function setScore(playerId, categoryKey, raw) {
      if (!state.scores[playerId]) state.scores[playerId] = {};
      if (raw === "" || raw === null || raw === undefined) {
        delete state.scores[playerId][categoryKey];
      } else {
        const v = parseInt(raw, 10);
        if (!Number.isFinite(v)) return;
        state.scores[playerId][categoryKey] = v;
      }
      persist();
      updateTotalsOnly();
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

    function updateTotalsOnly() {
      const leaderP = leader();
      const w = winner();
      for (const p of state.players) {
        const totalEl = container.querySelector(`[data-total-for="${p.id}"]`);
        if (!totalEl) continue;
        const newTotal = totalFor(p.id);
        const prev = Number(totalEl.dataset.value) || 0;
        totalEl.textContent = newTotal;
        totalEl.dataset.value = String(newTotal);
        totalEl.classList.toggle("leader", !!(leaderP && leaderP.id === p.id));
        if (prev !== newTotal) {
          totalEl.classList.remove("flash");
          void totalEl.offsetWidth;
          totalEl.classList.add("flash");
        }
        const progressEl = container.querySelector(`[data-progress-for="${p.id}"]`);
        if (progressEl) {
          progressEl.textContent = `${filledCount(p.id)} / ${categories().length}`;
        }
      }
      const banner = container.querySelector("#winner-banner");
      if (banner) {
        if (w) {
          banner.classList.remove("hidden");
          banner.textContent = `🏆 ${w.name} wins with ${totalFor(w.id)} points!`;
        } else {
          banner.classList.add("hidden");
        }
      }
      renderStatusList();
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

        <section class="card">
          <h2>Scorecards</h2>
          <div id="scorecards" class="scorecard-grid"></div>
        </section>

        <section id="status" class="card">
          <h2>Status</h2>
          <div id="winner-banner" class="hidden"></div>
          <ul id="status-list"></ul>
          <div class="row" style="margin-top: 14px;">
            <button id="reset-game" class="danger">Reset game</button>
          </div>
        </section>
      `;

      renderSettings();
      renderPlayerList();
      renderScorecards();
      renderStatusList();
      wireEvents();

      const w = winner();
      if (w) {
        const banner = container.querySelector("#winner-banner");
        if (banner) {
          banner.classList.remove("hidden");
          banner.textContent = `🏆 ${w.name} wins with ${totalFor(w.id)} points!`;
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

    function renderScorecards() {
      const wrap = container.querySelector("#scorecards");
      wrap.innerHTML = "";
      const cats = categories();
      if (state.players.length === 0) {
        wrap.innerHTML = `<p class="empty">Add ${Scorely.escapeHtml(nounPluralLower())} to start scoring.</p>`;
        return;
      }
      for (const p of state.players) {
        const card = document.createElement("div");
        card.className = "scorecard";
        const total = totalFor(p.id);
        card.innerHTML = `
          <div class="scorecard-head">
            <div class="scorecard-name">${Scorely.escapeHtml(p.name)}</div>
            <div class="scorecard-total" data-total-for="${p.id}" data-value="${total}">${total}</div>
          </div>
          <div class="scorecard-progress">
            <span data-progress-for="${p.id}">${filledCount(p.id)} / ${cats.length}</span>
            filled
          </div>
        `;
        const rows = document.createElement("div");
        rows.className = "scorecard-rows";
        for (const cat of cats) {
          const row = document.createElement("label");
          row.className = "scorecard-row";
          const labelEl = document.createElement("span");
          labelEl.textContent = cat.label;
          const input = document.createElement("input");
          input.type = "number";
          input.value = state.scores[p.id]?.[cat.key] ?? "";
          input.placeholder = "0";
          input.dataset.playerId = p.id;
          input.dataset.categoryKey = cat.key;
          input.addEventListener("input", (e) => setScore(p.id, cat.key, e.target.value));
          row.appendChild(labelEl);
          row.appendChild(input);
          rows.appendChild(row);
        }
        card.appendChild(rows);
        wrap.appendChild(card);
      }
    }

    function renderStatusList() {
      const list = container.querySelector("#status-list");
      if (!list) return;
      list.innerHTML = "";
      if (state.players.length === 0) {
        list.innerHTML = '<li class="empty">Add players to see status.</li>';
        return;
      }
      const leaderP = leader();
      const sorted = [...state.players].sort((a, b) => {
        const diff = totalFor(a.id) - totalFor(b.id);
        return config.scoring.direction === "high" ? -diff : diff;
      });
      const cats = categories();
      for (const p of sorted) {
        const li = document.createElement("li");
        const total = totalFor(p.id);
        if (leaderP && p.id === leaderP.id && cats.length > 0 && filledCount(p.id) > 0) {
          li.classList.add("leader");
        }
        li.innerHTML = `<span>${Scorely.escapeHtml(p.name)} — ${filledCount(p.id)} / ${cats.length}</span><strong>${total}</strong>`;
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
      container.querySelector("#reset-game").onclick = resetGame;
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
