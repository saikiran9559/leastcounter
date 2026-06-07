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

  function ensurePlayerLedger(state, playerId) {
    if (!state.ledger[playerId]) {
      state.ledger[playerId] = { buyIns: [], cashOut: null };
    }
  }

  function seedDefaults(state, config) {
    if (state.players.length === 0 && Array.isArray(config.defaultPlayers)) {
      state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
      for (const p of state.players) ensurePlayerLedger(state, p.id);
    }
  }

  function loadLedgerState(config) {
    try {
      const raw = localStorage.getItem(storageKey(config.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.ledger) parsed.ledger = {};
        return parsed;
      }
    } catch {}
    const state = {
      settings: defaultSettings(config),
      players: [],
      ledger: {},
    };
    seedDefaults(state, config);
    return state;
  }

  function saveState(config, state) {
    try {
      localStorage.setItem(storageKey(config.id), JSON.stringify(state));
    } catch {}
  }

  Scorely.createLedgerInstance = function (gameId) {
    const config = Scorely.getGame(gameId);
    if (!config) throw new Error(`Unknown game: ${gameId}`);

    const state = loadLedgerState(config);
    let container = null;

    function persist() { saveState(config, state); }

    function currency() { return state.settings.currency || config.currency || "$"; }
    function defaultBuyIn() { return state.settings.defaultBuyIn ?? config.defaultBuyIn ?? 20; }

    function formatMoney(n) {
      const sign = n < 0 ? "-" : "";
      return `${sign}${currency()}${Math.abs(n)}`;
    }

    function formatSigned(n) {
      if (n > 0) return `+${currency()}${n}`;
      if (n < 0) return `-${currency()}${Math.abs(n)}`;
      return `${currency()}0`;
    }

    function totalBuyIn(playerId) {
      const l = state.ledger[playerId];
      if (!l) return 0;
      return l.buyIns.reduce((s, x) => s + (Number(x) || 0), 0);
    }

    function cashOutOf(playerId) {
      const l = state.ledger[playerId];
      return l && Number.isFinite(Number(l.cashOut)) ? Number(l.cashOut) : null;
    }

    function netFor(playerId) {
      const co = cashOutOf(playerId);
      if (co === null) return null;
      return co - totalBuyIn(playerId);
    }

    function houseBalance() {
      let totalIn = 0;
      let totalOut = 0;
      for (const p of state.players) {
        totalIn += totalBuyIn(p.id);
        const co = cashOutOf(p.id);
        if (co !== null) totalOut += co;
      }
      return totalIn - totalOut;
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
      ensurePlayerLedger(state, id);
      persist();
      render();
    }

    function removePlayer(id) {
      if (!confirm(`Remove this player and their ledger?`)) return;
      state.players = state.players.filter((p) => p.id !== id);
      delete state.ledger[id];
      persist();
      render();
    }

    function addBuyIn(playerId, amount) {
      if (!Number.isFinite(amount) || amount <= 0) return;
      ensurePlayerLedger(state, playerId);
      state.ledger[playerId].buyIns.push(amount);
      persist();
      render();
    }

    function removeBuyIn(playerId, index) {
      const l = state.ledger[playerId];
      if (!l || !l.buyIns[index]) return;
      l.buyIns.splice(index, 1);
      persist();
      render();
    }

    function setCashOut(playerId, raw) {
      ensurePlayerLedger(state, playerId);
      if (raw === "" || raw === null || raw === undefined) {
        state.ledger[playerId].cashOut = null;
      } else {
        const v = parseInt(raw, 10);
        if (!Number.isFinite(v) || v < 0) return;
        state.ledger[playerId].cashOut = v;
      }
      persist();
      updateNetsOnly();
    }

    function resetGame() {
      if (!confirm("Reset everything — players and ledger?")) return;
      state.players = [];
      state.ledger = {};
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

    function updateNetsOnly() {
      for (const p of state.players) {
        const netEl = container.querySelector(`[data-net-for="${p.id}"]`);
        if (netEl) {
          const net = netFor(p.id);
          if (net === null) {
            netEl.textContent = "—";
            netEl.classList.remove("net-positive", "net-negative", "net-zero");
          } else {
            netEl.textContent = formatSigned(net);
            netEl.classList.remove("net-positive", "net-negative", "net-zero");
            netEl.classList.add(net > 0 ? "net-positive" : net < 0 ? "net-negative" : "net-zero");
          }
        }
      }
      const houseEl = container.querySelector("#house-balance");
      if (houseEl) {
        const hb = houseBalance();
        houseEl.textContent = formatSigned(hb);
        houseEl.classList.toggle("net-zero", hb === 0);
        houseEl.classList.toggle("net-positive", hb > 0);
        houseEl.classList.toggle("net-negative", hb < 0);
      }
      renderStandings();
    }

    function render() {
      if (!container) return;
      const iconStyle = config.accent ? ` style="background: ${config.accent};"` : "";
      const iconBadge = config.icon ? `<div class="game-icon"${iconStyle}>${config.icon}</div>` : "";

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
          <h2>Ledger</h2>
          <div id="ledger-cards" class="ledger-grid"></div>
        </section>

        <section id="status" class="card">
          <h2>Standings</h2>
          <div class="house-balance-row">
            <span class="muted">House balance (should be 0 when everyone has cashed out):</span>
            <strong id="house-balance"></strong>
          </div>
          <ul id="standings"></ul>
          <div class="row" style="margin-top: 14px;">
            <button id="reset-game" class="danger">Reset game</button>
          </div>
        </section>
      `;

      renderSettings();
      renderPlayerList();
      renderLedgers();
      renderStandings();
      updateHouseBalance();
      wireEvents();
    }

    function updateHouseBalance() {
      const houseEl = container.querySelector("#house-balance");
      if (!houseEl) return;
      const hb = houseBalance();
      houseEl.textContent = formatSigned(hb);
      houseEl.classList.toggle("net-zero", hb === 0);
      houseEl.classList.toggle("net-positive", hb > 0);
      houseEl.classList.toggle("net-negative", hb < 0);
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
        list.innerHTML = `<li class="empty">No players yet — add at least one to begin.</li>`;
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

    function renderLedgers() {
      const wrap = container.querySelector("#ledger-cards");
      wrap.innerHTML = "";
      if (state.players.length === 0) {
        wrap.innerHTML = `<p class="empty">Add players to start a ledger.</p>`;
        return;
      }
      const defAmt = defaultBuyIn();
      for (const p of state.players) {
        const l = state.ledger[p.id] || { buyIns: [], cashOut: null };
        const totalIn = totalBuyIn(p.id);
        const co = cashOutOf(p.id);
        const net = netFor(p.id);
        const netClass = net === null ? "" : net > 0 ? "net-positive" : net < 0 ? "net-negative" : "net-zero";

        const card = document.createElement("div");
        card.className = "ledger-card";
        card.innerHTML = `
          <div class="ledger-head">
            <div class="ledger-name">${Scorely.escapeHtml(p.name)}</div>
            <div class="ledger-net ${netClass}" data-net-for="${p.id}">${net === null ? "—" : formatSigned(net)}</div>
          </div>
          <div class="ledger-section">
            <div class="ledger-section-head">
              <span>Buy-ins</span>
              <strong>${formatMoney(totalIn)}</strong>
            </div>
            <div class="buyin-chips" data-buyin-chips="${p.id}"></div>
            <div class="row">
              <button class="ledger-add-buyin" data-add-default="${p.id}">+ ${formatMoney(defAmt)}</button>
              <button class="ledger-add-buyin secondary" data-add-custom="${p.id}">+ Custom</button>
            </div>
          </div>
          <div class="ledger-section">
            <label class="ledger-cashout">
              <span>Cash-out</span>
              <input type="number" min="0" placeholder="0" data-cashout-for="${p.id}" value="${co ?? ""}" />
            </label>
          </div>
        `;
        wrap.appendChild(card);

        const chipsWrap = card.querySelector(`[data-buyin-chips="${p.id}"]`);
        l.buyIns.forEach((amount, idx) => {
          const chip = document.createElement("span");
          chip.className = "buyin-chip";
          chip.innerHTML = `${formatMoney(amount)} <button class="icon" title="Remove">×</button>`;
          chip.querySelector("button").onclick = () => removeBuyIn(p.id, idx);
          chipsWrap.appendChild(chip);
        });
      }
    }

    function renderStandings() {
      const list = container.querySelector("#standings");
      if (!list) return;
      list.innerHTML = "";
      if (state.players.length === 0) {
        list.innerHTML = '<li class="empty">Add players to see standings.</li>';
        return;
      }
      const sorted = [...state.players].sort((a, b) => {
        const na = netFor(a.id);
        const nb = netFor(b.id);
        if (na === null && nb === null) return 0;
        if (na === null) return 1;
        if (nb === null) return -1;
        return nb - na;
      });
      for (const p of sorted) {
        const net = netFor(p.id);
        const li = document.createElement("li");
        const cls = net === null ? "" : net > 0 ? "leader" : net < 0 ? "out" : "";
        if (cls) li.classList.add(cls);
        const netText = net === null ? "—" : formatSigned(net);
        li.innerHTML = `<span>${Scorely.escapeHtml(p.name)}</span><strong>${netText}</strong>`;
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

      container.querySelectorAll("[data-add-default]").forEach((btn) => {
        btn.onclick = () => addBuyIn(btn.dataset.addDefault, defaultBuyIn());
      });
      container.querySelectorAll("[data-add-custom]").forEach((btn) => {
        btn.onclick = () => {
          const raw = prompt(`Buy-in amount in ${currency()}:`, String(defaultBuyIn()));
          if (raw === null) return;
          const v = parseInt(raw, 10);
          if (!Number.isFinite(v) || v <= 0) return;
          addBuyIn(btn.dataset.addCustom, v);
        };
      });
      container.querySelectorAll("[data-cashout-for]").forEach((inp) => {
        inp.addEventListener("input", (e) => setCashOut(inp.dataset.cashoutFor, e.target.value));
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
