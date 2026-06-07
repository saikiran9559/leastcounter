(function () {
  const Scorely = (window.Scorely = window.Scorely || {});

  Scorely.games = [];
  Scorely.defineGame = function (config) {
    Scorely.games.push(config);
  };
  Scorely.getGame = function (id) {
    return Scorely.games.find((g) => g.id === id) || null;
  };

  Scorely.escapeHtml = function (s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  };

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

  function loadState(config) {
    try {
      const raw = localStorage.getItem(storageKey(config.id));
      if (raw) return JSON.parse(raw);
    } catch {}
    if (config.id === "least-count") {
      try {
        const legacy = localStorage.getItem("leastcounter:v1");
        if (legacy) {
          const parsed = JSON.parse(legacy);
          return {
            settings: { limit: parsed.limit ?? 250 },
            players: parsed.players || [],
            rounds: parsed.rounds || [],
          };
        }
      } catch {}
    }
    return {
      settings: defaultSettings(config),
      players: [],
      rounds: [],
    };
  }

  function saveState(config, state) {
    try {
      localStorage.setItem(storageKey(config.id), JSON.stringify(state));
    } catch {}
  }

  Scorely.createInstance = function (gameId) {
    const config = Scorely.getGame(gameId);
    if (!config) throw new Error(`Unknown game: ${gameId}`);

    const state = loadState(config);
    let prevSnapshot = emptySnapshot();
    let container = null;

    function persist() {
      saveState(config, state);
    }

    if (state.players.length === 0 && Array.isArray(config.defaultPlayers)) {
      state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
      persist();
    }

    function nounSingular() { return config.playerNoun || "Player"; }
    function nounLower() { return nounSingular().toLowerCase(); }
    function nounPlural() { return nounSingular() + "s"; }
    function nounPluralLower() { return nounPlural().toLowerCase(); }

    function getEntry(round, playerId) {
      if (round.entries) return round.entries[playerId] || {};
      if (round.scores) {
        const score = round.scores[playerId];
        return score === undefined ? {} : { score };
      }
      return {};
    }

    function roundInputs() {
      if (config.roundInputs) return config.roundInputs;
      return [{ key: "score", label: "Score", type: "number", min: 0, max: config.roundInputMax }];
    }

    function progressFor(playerId) {
      if (!config.scoring.progressKey) return 0;
      return state.rounds.reduce((count, r) => {
        return count + (getEntry(r, playerId)[config.scoring.progressKey] ? 1 : 0);
      }, 0);
    }

    function totalFor(playerId) {
      return state.rounds.reduce(
        (sum, r) => sum + (getEntry(r, playerId).score || 0),
        0
      );
    }

    function isOut(playerId) {
      if (config.scoring.endCondition !== "threshold-elim") return false;
      const threshold = state.settings[config.scoring.thresholdKey];
      return totalFor(playerId) >= threshold;
    }

    function activePlayers() {
      return state.players.filter((p) => !isOut(p.id));
    }

    function pickByDirection(candidates, getValue) {
      if (candidates.length === 0) return null;
      return candidates.reduce((best, p) => {
        const better =
          config.scoring.direction === "high"
            ? getValue(p) > getValue(best)
            : getValue(p) < getValue(best);
        return better ? p : best;
      });
    }

    function leader() {
      const candidates =
        config.scoring.endCondition === "threshold-elim"
          ? activePlayers()
          : state.players.slice();
      return pickByDirection(candidates, (p) => totalFor(p.id));
    }

    function winner() {
      if (state.rounds.length === 0) return null;
      if (state.players.length < 2) return null;

      if (config.scoring.endCondition === "threshold-elim") {
        const active = activePlayers();
        if (active.length === 1) return active[0];
        return null;
      }

      if (config.scoring.endCondition === "target-reach") {
        const target = state.settings[config.scoring.thresholdKey];
        const reached = state.players.filter((p) => totalFor(p.id) >= target);
        if (reached.length === 0) return null;
        return pickByDirection(reached, (p) => totalFor(p.id));
      }

      if (config.scoring.endCondition === "progress-reach") {
        const target = state.settings[config.scoring.thresholdKey];
        const reached = state.players.filter((p) => progressFor(p.id) >= target);
        if (reached.length === 0) return null;
        return pickByDirection(reached, (p) => totalFor(p.id));
      }

      if (config.scoring.endCondition === "threshold-end") {
        const threshold = state.settings[config.scoring.thresholdKey];
        const anyReached = state.players.some((p) => totalFor(p.id) >= threshold);
        if (!anyReached) return null;
        return pickByDirection(state.players, (p) => totalFor(p.id));
      }

      return null;
    }

    function emptySnapshot() {
      return {
        playerIds: new Set(),
        roundIds: new Set(),
        totals: {},
        outStatus: {},
      };
    }

    function snapshot() {
      const totals = {};
      const outStatus = {};
      for (const p of state.players) {
        totals[p.id] = totalFor(p.id);
        outStatus[p.id] = isOut(p.id);
      }
      return {
        playerIds: new Set(state.players.map((p) => p.id)),
        roundIds: new Set(state.rounds.map((r) => r.id)),
        totals,
        outStatus,
      };
    }

    function addPlayer(name) {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (
        state.players.some(
          (p) => p.name.toLowerCase() === trimmed.toLowerCase()
        )
      ) {
        alert("That name is already taken.");
        return;
      }
      state.players.push({ id: uid(), name: trimmed });
      persist();
      render();
    }

    function removePlayer(id) {
      if (state.rounds.length > 0) {
        if (!confirm(`Rounds already exist. Remove this ${nounLower()} and their scores?`)) return;
        state.rounds = state.rounds.map((r) => {
          if (r.entries) {
            const { [id]: _, ...rest } = r.entries;
            return { ...r, entries: rest };
          }
          if (r.scores) {
            const { [id]: _, ...rest } = r.scores;
            return { ...r, scores: rest };
          }
          return r;
        });
      }
      state.players = state.players.filter((p) => p.id !== id);
      persist();
      render();
    }

    function addRound(entries) {
      state.rounds.push({ id: uid(), entries });
      persist();
      render();
    }

    function removeRound(roundId) {
      if (!confirm("Delete this round?")) return;
      state.rounds = state.rounds.filter((r) => r.id !== roundId);
      persist();
      render();
    }

    function resetGame() {
      if (!confirm(`Reset everything — ${nounPluralLower()} and rounds?`)) return;
      state.players = [];
      state.rounds = [];
      state.settings = defaultSettings(config);
      seedDefaultPlayers();
      persist();
      render();
    }

    function seedDefaultPlayers() {
      if (state.players.length === 0 && Array.isArray(config.defaultPlayers)) {
        state.players = config.defaultPlayers.map((name) => ({ id: uid(), name }));
      }
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

    function labels() {
      return Object.assign(
        { round: "Round", addRound: "Add round", total: "Total" },
        config.labels || {}
      );
    }

    function render() {
      if (!container) return;
      const l = labels();
      const w = winner();

      container.innerHTML = `
        <section class="card game-header">
          <h2>${Scorely.escapeHtml(config.name)}</h2>
          ${config.tagline ? `<p class="tagline">${Scorely.escapeHtml(config.tagline)}</p>` : ""}
        </section>

        <section id="setup" class="card">
          <h2>Setup</h2>
          <div class="row" id="settings-row"></div>
          <div class="players">
            <h3>${Scorely.escapeHtml(nounPlural())}</h3>
            <ul id="player-list"></ul>
            <div class="row">
              <input type="text" id="new-player-name" placeholder="${Scorely.escapeHtml(nounSingular())} name" maxlength="20" />
              <button id="add-player">Add ${Scorely.escapeHtml(nounLower())}</button>
            </div>
          </div>
        </section>

        <section id="scoreboard" class="card">
          <h2>Scoreboard</h2>
          <div class="table-wrap">
            <table id="score-table">
              <thead><tr id="score-header"><th>${l.round}</th></tr></thead>
              <tbody id="score-body"></tbody>
              <tfoot><tr id="totals-row"><th>${l.total}</th></tr></tfoot>
            </table>
          </div>
        </section>

        <section id="add-round" class="card">
          <h2>${l.addRound}</h2>
          <form id="round-form">
            <div id="round-inputs" class="round-inputs"></div>
            <button type="submit">Save ${l.round.toLowerCase()}</button>
          </form>
        </section>

        <section id="status" class="card">
          <h2>Status</h2>
          <div id="winner-banner" class="${w ? "" : "hidden"}"></div>
          <ul id="status-list"></ul>
          <div class="row" style="margin-top: 14px;">
            <button id="download-pdf">Download PDF</button>
            <button id="reset-game" class="danger">Reset game</button>
          </div>
        </section>
      `;

      renderSettings();
      renderPlayers();
      renderTable();
      renderRoundForm();
      renderStatus();
      wireEvents();

      prevSnapshot = snapshot();
    }

    function renderSettings() {
      const row = container.querySelector("#settings-row");
      row.innerHTML = "";
      for (const [key, schema] of Object.entries(config.settings || {})) {
        const label = document.createElement("label");
        label.innerHTML = `<span>${Scorely.escapeHtml(schema.label)}</span>`;
        const input = document.createElement("input");
        input.type = schema.type || "text";
        if (schema.min !== undefined) input.min = schema.min;
        input.value = state.settings[key];
        input.dataset.settingKey = key;
        input.addEventListener("change", (e) => updateSetting(key, e.target.value));
        label.appendChild(input);
        row.appendChild(label);
      }
    }

    function renderPlayers() {
      const list = container.querySelector("#player-list");
      list.innerHTML = "";
      if (state.players.length === 0) {
        list.innerHTML = `<li class="empty">No ${Scorely.escapeHtml(nounPluralLower())} yet — add at least two to begin.</li>`;
        return;
      }
      for (const p of state.players) {
        const li = document.createElement("li");
        if (isOut(p.id)) li.classList.add("out");
        if (!prevSnapshot.playerIds.has(p.id)) li.classList.add("fresh");
        if (isOut(p.id) && prevSnapshot.outStatus[p.id] === false) li.classList.add("just-out");
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

    function renderTable() {
      const header = container.querySelector("#score-header");
      const body = container.querySelector("#score-body");
      const totals = container.querySelector("#totals-row");
      const leaderP = leader();

      for (const p of state.players) {
        const th = document.createElement("th");
        th.textContent = p.name;
        if (isOut(p.id)) th.classList.add("out");
        header.appendChild(th);

        const td = document.createElement("td");
        const total = totalFor(p.id);
        td.textContent = total;
        td.classList.add("player-cell");
        if (isOut(p.id)) td.classList.add("out");
        else if (leaderP && p.id === leaderP.id && state.rounds.length > 0) td.classList.add("leader");
        if (
          prevSnapshot.totals[p.id] !== undefined &&
          prevSnapshot.totals[p.id] !== total
        ) {
          td.classList.add("flash");
        }
        totals.appendChild(td);
      }

      if (state.rounds.length > 0) {
        header.appendChild(document.createElement("th"));
        totals.appendChild(document.createElement("td"));
      }

      if (state.rounds.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = state.players.length + 1 || 2;
        td.className = "empty";
        td.textContent = "No rounds yet.";
        tr.appendChild(td);
        body.appendChild(tr);
        return;
      }

      const l = labels();
      state.rounds.forEach((r, idx) => {
        const tr = document.createElement("tr");
        if (!prevSnapshot.roundIds.has(r.id)) tr.classList.add("fresh");
        const th = document.createElement("th");
        th.textContent = `${l.round.charAt(0)}${idx + 1}`;
        tr.appendChild(th);

        for (const p of state.players) {
          const td = document.createElement("td");
          const v = getEntry(r, p.id).score;
          td.textContent = v === undefined ? "—" : v;
          tr.appendChild(td);
        }

        const tdDel = document.createElement("td");
        const delBtn = document.createElement("button");
        delBtn.className = "icon";
        delBtn.textContent = "×";
        delBtn.title = "Delete round";
        delBtn.onclick = () => removeRound(r.id);
        tdDel.appendChild(delBtn);
        tr.appendChild(tdDel);

        body.appendChild(tr);
      });
    }

    function renderRoundForm() {
      const wrap = container.querySelector("#round-inputs");
      const form = container.querySelector("#round-form");
      wrap.innerHTML = "";

      const w = winner();
      if (state.players.length < 2 || w) {
        form.classList.add("hidden");
        return;
      }
      form.classList.remove("hidden");

      const fields = roundInputs();
      const showFieldLabels = fields.length > 1;

      for (const p of state.players) {
        const block = document.createElement("div");
        block.className = "player-block";
        if (isOut(p.id)) block.classList.add("out");
        block.dataset.playerId = p.id;

        const nameEl = document.createElement("div");
        nameEl.className = "player-name";
        nameEl.textContent = `${p.name}${isOut(p.id) ? " (out)" : ""}`;
        block.appendChild(nameEl);

        for (const field of fields) {
          const row = document.createElement("label");
          row.className = "input-row";
          const input = document.createElement("input");
          input.dataset.playerId = p.id;
          input.dataset.field = field.key;
          input.disabled = isOut(p.id);

          if (field.type === "checkbox") {
            input.type = "checkbox";
            const text = document.createElement("span");
            text.textContent = field.label;
            row.appendChild(input);
            row.appendChild(text);
          } else {
            input.type = field.type || "number";
            if (field.min !== undefined) input.min = String(field.min);
            if (field.max !== undefined) input.max = String(field.max);
            input.placeholder = isOut(p.id) ? "—" : "0";
            if (showFieldLabels) {
              const text = document.createElement("span");
              text.textContent = field.label;
              row.appendChild(text);
            }
            row.appendChild(input);
          }
          block.appendChild(row);
        }

        wrap.appendChild(block);
      }
    }

    function progressSuffix(playerId) {
      if (!config.scoring.progressKey) return "";
      const target = state.settings[config.scoring.thresholdKey];
      const progress = progressFor(playerId);
      const noun = config.progressNoun || "Stage";
      if (progress >= target) return " — Done";
      return ` — ${noun} ${progress + 1}`;
    }

    function renderStatus() {
      const banner = container.querySelector("#winner-banner");
      const list = container.querySelector("#status-list");

      const w = winner();
      if (w) {
        banner.classList.remove("hidden");
        const total = totalFor(w.id);
        const target = state.settings[config.scoring.thresholdKey];
        if (config.scoring.endCondition === "target-reach") {
          banner.textContent = `🏆 ${w.name} reached ${target} first with ${total} points!`;
        } else if (config.scoring.endCondition === "progress-reach") {
          const noun = config.progressNoun || "Stage";
          banner.textContent = `🏆 ${w.name} finished ${noun.toLowerCase()} ${target} first with ${total} points!`;
        } else {
          banner.textContent = `🏆 ${w.name} wins with ${total} points!`;
        }
      } else {
        banner.classList.add("hidden");
      }

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
      for (const p of sorted) {
        const li = document.createElement("li");
        const total = totalFor(p.id);
        const out = isOut(p.id);
        if (out) li.classList.add("out");
        else if (leaderP && p.id === leaderP.id && state.rounds.length > 0) li.classList.add("leader");
        li.innerHTML = `<span>${Scorely.escapeHtml(p.name)}${out ? " — OUT" : ""}${Scorely.escapeHtml(progressSuffix(p.id))}</span><strong>${total}</strong>`;
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
      container.querySelector("#download-pdf").onclick = () => Scorely.exportPdf(config, state, { totalFor, isOut, winner, getEntry });

      container.querySelector("#round-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const blocks = container.querySelectorAll("#round-inputs .player-block");
        const fields = roundInputs();
        const entries = {};
        for (const block of blocks) {
          const playerId = block.dataset.playerId;
          const inputs = block.querySelectorAll("input");
          if (Array.from(inputs).every((inp) => inp.disabled)) continue;
          const entry = {};
          for (const inp of inputs) {
            if (inp.disabled) continue;
            const field = fields.find((f) => f.key === inp.dataset.field);
            if (!field) continue;
            if (field.type === "checkbox") {
              entry[field.key] = inp.checked;
            } else {
              const v = inp.value === "" ? 0 : parseInt(inp.value, 10);
              if (!Number.isFinite(v) || v < 0) {
                alert(`${field.label} must be a non-negative number.`);
                return;
              }
              if (field.max !== undefined && v > field.max) {
                alert(`${field.label} must be at most ${field.max}.`);
                return;
              }
              entry[field.key] = v;
            }
          }
          entries[playerId] = entry;
        }
        if (Object.keys(entries).length === 0) return;
        addRound(entries);
      });
    }

    return {
      get state() { return state; },
      mount(el) {
        container = el;
        prevSnapshot = emptySnapshot();
        render();
      },
    };
  };

  Scorely.exportPdf = function (config, state, helpers) {
    if (state.players.length === 0) {
      alert("Add players before exporting.");
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF library failed to load. Check your internet connection and refresh.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const w = helpers.winner();
    const dateStr = new Date().toLocaleString();
    const threshold = state.settings[config.scoring.thresholdKey];

    doc.setFontSize(20);
    doc.text(`${config.name} — Scoreboard`, pageWidth / 2, 18, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(110);
    const thresholdLabel =
      config.scoring.endCondition === "threshold-elim" ? "Elimination limit" : "Target";
    doc.text(
      `Generated ${dateStr}  •  ${thresholdLabel}: ${threshold}`,
      pageWidth / 2,
      25,
      { align: "center" }
    );
    doc.setTextColor(0);

    if (w) {
      doc.setFontSize(14);
      doc.setTextColor(34, 139, 87);
      doc.text(`Winner: ${w.name} (${helpers.totalFor(w.id)} pts)`, pageWidth / 2, 35, { align: "center" });
      doc.setTextColor(0);
    }

    const head = [["Round", ...state.players.map((p) => p.name)]];
    const body = state.rounds.map((r, idx) => [
      `R${idx + 1}`,
      ...state.players.map((p) => {
        const v = helpers.getEntry(r, p.id).score;
        return v === undefined ? "—" : String(v);
      }),
    ]);
    const totalsRow = [
      "Total",
      ...state.players.map((p) => {
        const total = helpers.totalFor(p.id);
        return helpers.isOut(p.id) ? `${total} (OUT)` : String(total);
      }),
    ];

    doc.autoTable({
      head,
      body,
      foot: [totalsRow],
      startY: w ? 42 : 32,
      theme: "grid",
      headStyles: { fillColor: [60, 80, 160], halign: "center" },
      footStyles: { fillColor: [230, 230, 240], textColor: 20, fontStyle: "bold", halign: "center" },
      bodyStyles: { halign: "center" },
      columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
      didParseCell: (data) => {
        if (data.section === "foot" && data.column.index > 0) {
          const player = state.players[data.column.index - 1];
          if (player && helpers.isOut(player.id)) {
            data.cell.styles.textColor = [200, 50, 50];
          }
        }
      },
    });

    const slug = config.id;
    const filename = w
      ? `${slug}-${w.name.toLowerCase().replace(/\s+/g, "-")}-wins.pdf`
      : `${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };
})();
