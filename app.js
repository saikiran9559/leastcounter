(function () {
  const appEl = document.getElementById("app");
  const backNav = document.getElementById("back-nav");
  const subtitle = document.getElementById("brand-subtitle");

  const SEARCH_KEY = "scorely:home-search:v1";
  const CATEGORIES_KEY = "scorely:home-categories:v1";

  const GAME_CATEGORIES = {
    "least-count": ["card"],
    uno: ["card"],
    rummy: ["card"],
    "crazy-eights": ["card"],
    tonk: ["card"],
    dominoes: ["tile"],
    rummikub: ["tile"],
    farkle: ["dice"],
    "phase-10": ["card"],
    hearts: ["card"],
    mendikot: ["card", "partnership"],
    "court-piece": ["card", "partnership"],
    wingspan: ["board"],
    "7-wonders": ["board"],
    "disc-golf": ["sport"],
    "table-tennis": ["sport"],
    pickleball: ["sport"],
    badminton: ["sport"],
    volleyball: ["sport"],
    catan: ["board"],
    pool: ["sport"],
    poker: ["card"],
    "teen-patti": ["card"],
    codenames: ["party", "partnership"],
    cribbage: ["card"],
    pinochle: ["card", "partnership"],
    scrabble: ["board"],
    yahtzee: ["dice"],
    "darts-501": ["sport"],
    tennis: ["sport"],
    spades: ["card", "partnership"],
    euchre: ["card", "partnership"],
    pitch: ["card", "partnership"],
    backgammon: ["board"],
    bowling: ["sport"],
    "500": ["card", "partnership"],
    "28": ["card", "partnership"],
    belote: ["card", "partnership"],
    "liars-dice": ["dice", "party"],
    president: ["card", "party"],
    go: ["board"],
    canasta: ["card", "partnership"],
    archery: ["sport"],
    whist: ["card", "partnership"],
    snooker: ["sport"],
    golf: ["sport"],
    "darts-cricket": ["sport"],
    "chess-tournament": ["board"],
    skat: ["card"],
    cricket: ["sport"],
    bridge: ["card", "partnership"],
    mahjong: ["tile"],
    tournament: ["party"],
  };

  const ALL_CATEGORIES = [
    { key: "card", label: "Cards" },
    { key: "dice", label: "Dice" },
    { key: "tile", label: "Tile" },
    { key: "sport", label: "Sports" },
    { key: "board", label: "Board" },
    { key: "party", label: "Party" },
    { key: "partnership", label: "Partner" },
  ];

  function categoriesFor(game) {
    return GAME_CATEGORIES[game.id] || [];
  }

  function loadSearchQuery() {
    try { return localStorage.getItem(SEARCH_KEY) || ""; } catch { return ""; }
  }

  function saveSearchQuery(q) {
    try { localStorage.setItem(SEARCH_KEY, q); } catch {}
  }

  function loadActiveCategories() {
    try {
      const raw = localStorage.getItem(CATEGORIES_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  }

  function saveActiveCategories(set) {
    try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify([...set])); } catch {}
  }

  let searchQuery = loadSearchQuery();
  let activeCategories = loadActiveCategories();

  // Register any user-built games before the first render so they show up
  // alongside the built-ins.
  if (typeof Scorely.hydrateCustomGames === "function") {
    Scorely.hydrateCustomGames();
  }

  function refreshPlayerDatalist() {
    const list = document.getElementById("player-names");
    if (!list) return;
    list.innerHTML = "";
    for (const name of Scorely.getKnownPlayerNames()) {
      const opt = document.createElement("option");
      opt.value = name;
      list.appendChild(opt);
    }
  }
  Scorely.refreshPlayerDatalist = refreshPlayerDatalist;

  function parseRoute() {
    const hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash) return { name: "home" };
    if (hash === "stats") return { name: "stats" };
    if (hash === "create-game") return { name: "create" };
    return { name: "game", gameId: hash };
  }

  function render() {
    const route = parseRoute();
    appEl.innerHTML = "";

    if (route.name === "home") {
      backNav.classList.add("hidden");
      subtitle.textContent = "Scoreboard for your games";
      renderHome();
      return;
    }

    if (route.name === "stats") {
      backNav.classList.remove("hidden");
      subtitle.textContent = "Cross-game stats & hall of fame";
      document.title = "Scorely · Stats";
      renderStats();
      return;
    }

    if (route.name === "create") {
      backNav.classList.remove("hidden");
      subtitle.textContent = "Design your own scoreboard";
      document.title = "Scorely · Create";
      renderCreateGame();
      return;
    }

    const config = Scorely.getGame(route.gameId);
    if (!config) {
      backNav.classList.remove("hidden");
      subtitle.textContent = "Game not found";
      appEl.innerHTML = `
        <section class="card">
          <h2>Unknown game</h2>
          <p class="empty">No game registered with id <code>${Scorely.escapeHtml(route.gameId)}</code>.</p>
        </section>
      `;
      return;
    }

    backNav.classList.remove("hidden");
    subtitle.textContent = config.tagline || "";
    document.title = `Scorely · ${config.name}`;
    Scorely.touchGame(config.id);
    const factories = {
      rounds: Scorely.createInstance,
      grid: Scorely.createGridInstance,
      counter: Scorely.createCounterInstance,
      ledger: Scorely.createLedgerInstance,
      tennis: Scorely.createTennisInstance,
      bowling: Scorely.createBowlingInstance,
      "darts-cricket": Scorely.createDartsCricketInstance,
    };
    const factory = factories[config.shape] || factories.rounds;
    const instance = factory(config.id);
    instance.mount(appEl);

    const relatedSection = buildRelatedSection(config);
    if (relatedSection) appEl.appendChild(relatedSection);
  }

  function buildRelatedSection(config) {
    const myCats = new Set(categoriesFor(config));
    if (myCats.size === 0) return null;
    const scored = Scorely.games
      .filter((g) => g.id !== config.id)
      .map((g) => {
        const cats = categoriesFor(g);
        const overlap = cats.filter((c) => myCats.has(c)).length;
        return { game: g, overlap };
      })
      .filter(({ overlap }) => overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
      .map(({ game }) => game);
    if (scored.length === 0) return null;

    const card = document.createElement("section");
    card.className = "card related-card";
    card.innerHTML = `<h2>If you like ${Scorely.escapeHtml(config.name)}, try…</h2>`;
    const grid = document.createElement("div");
    grid.className = "game-grid";
    for (const g of scored) grid.appendChild(buildGameCard(g));
    card.appendChild(grid);
    return card;
  }

  function matchesFilters(game) {
    if (activeCategories.size > 0) {
      const cats = categoriesFor(game);
      const hit = cats.some((c) => activeCategories.has(c));
      if (!hit) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = `${game.name} ${game.tagline || ""} ${categoriesFor(game).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function buildGameCard(g) {
    const card = document.createElement("a");
    card.className = "game-card";
    card.href = `#/${g.id}`;
    const accent = g.accent ? ` style="--game-accent: ${g.accent};"` : "";
    const icon = g.icon ? `<div class="game-card-icon"${accent}>${g.icon}</div>` : "";
    const fav = Scorely.isFavorite(g.id);
    const hasRules = !!(Scorely.rulesFor && Scorely.rulesFor(g.id));
    card.innerHTML = `
      <div class="game-card-actions">
        ${hasRules ? `<button class="game-card-rules" aria-label="How to play" title="How to play">?</button>` : ""}
        <button class="game-card-star${fav ? " favorited" : ""}" aria-label="${fav ? "Remove from favorites" : "Add to favorites"}" title="${fav ? "Unfavorite" : "Favorite"}">${fav ? "★" : "☆"}</button>
      </div>
      ${icon}
      <h3>${Scorely.escapeHtml(g.name)}</h3>
      ${g.tagline ? `<p>${Scorely.escapeHtml(g.tagline)}</p>` : ""}
    `;
    card.querySelector(".game-card-star").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      Scorely.toggleFavorite(g.id);
      render();
    });
    const rulesBtn = card.querySelector(".game-card-rules");
    if (rulesBtn) {
      rulesBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openRulesModal(g);
      });
    }
    return card;
  }

  function openRulesModal(game) {
    const rules = (Scorely.rulesFor && Scorely.rulesFor(game.id)) || [];
    const accent = game.accent ? ` style="background: ${game.accent};"` : "";
    const icon = game.icon ? `<div class="game-icon"${accent}>${game.icon}</div>` : "";
    const bullets = rules.map((r) => `<li>${Scorely.escapeHtml(r)}</li>`).join("");

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" aria-label="Close">×</button>
        <div class="modal-head">
          ${icon}
          <div>
            <h2 id="modal-title">${Scorely.escapeHtml(game.name)}</h2>
            ${game.tagline ? `<p class="tagline">${Scorely.escapeHtml(game.tagline)}</p>` : ""}
          </div>
        </div>
        <h3 class="modal-section-head">How to play</h3>
        <ul class="modal-rules">${bullets}</ul>
        <div class="modal-actions">
          <a class="modal-cta" href="#/${game.id}">Play ${Scorely.escapeHtml(game.name)} →</a>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add("open"));

    const close = () => {
      backdrop.classList.remove("open");
      setTimeout(() => backdrop.remove(), 180);
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    backdrop.querySelector(".modal-close").addEventListener("click", close);
    backdrop.querySelector(".modal-cta").addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
  }

  function renderHome() {
    document.title = "Scorely";
    const totalCount = Scorely.games.length;

    const hero = document.createElement("section");
    hero.className = "card home-hero";
    hero.innerHTML = `
      <h2>Pick your game</h2>
      <p>${totalCount} scoreboards ready to play.</p>
    `;
    appEl.appendChild(hero);

    // Favorites
    const favorites = [...Scorely.getFavorites()]
      .map((id) => Scorely.getGame(id))
      .filter(Boolean);
    if (favorites.length > 0) {
      const favCard = document.createElement("section");
      favCard.className = "card";
      favCard.innerHTML = `<h2><span class="section-icon">★</span> Favorites</h2>`;
      const favGrid = document.createElement("div");
      favGrid.className = "game-grid";
      for (const g of favorites) favGrid.appendChild(buildGameCard(g));
      favCard.appendChild(favGrid);
      appEl.appendChild(favCard);
    }

    // Recent
    const recentIds = Scorely.getRecentGames(5);
    const recentGames = recentIds
      .map((id) => Scorely.getGame(id))
      .filter(Boolean);
    if (recentGames.length > 0) {
      const recentCard = document.createElement("section");
      recentCard.className = "card";
      recentCard.innerHTML = `<h2><span class="section-icon">🕒</span> Recent</h2>`;
      const recentGrid = document.createElement("div");
      recentGrid.className = "game-grid";
      for (const g of recentGames) recentGrid.appendChild(buildGameCard(g));
      recentCard.appendChild(recentGrid);
      appEl.appendChild(recentCard);
    }

    // Search + chips + grid
    const browseCard = document.createElement("section");
    browseCard.className = "card";
    browseCard.innerHTML = `
      <div class="browse-head">
        <h2>All games</h2>
        <div class="browse-count" id="browse-count"></div>
      </div>
      <div class="browse-controls">
        <div class="game-search-wrap">
          <span class="game-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            id="game-search"
            class="game-search"
            placeholder="Search games (name, tagline, or category)…"
            value="${Scorely.escapeHtml(searchQuery)}"
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <div class="category-chips" id="category-chips"></div>
      </div>
      <div class="game-grid" id="browse-grid"></div>
    `;
    appEl.appendChild(browseCard);

    renderChips();
    renderBrowseGrid();
    wireBrowseEvents();

    const footer = document.createElement("section");
    footer.className = "card home-footer";
    footer.innerHTML = `
      <p class="muted">
        <a href="#/create-game">🎨 Create your own</a>
        &nbsp;·&nbsp;
        <a href="#/stats">📊 Stats &amp; hall of fame</a>
        &nbsp;·&nbsp;
        <a href="https://github.com/saikiran9559/scorely/blob/main/status.yaml">Roadmap</a>
      </p>
    `;
    appEl.appendChild(footer);

    refreshPlayerDatalist();
  }

  function renderChips() {
    const wrap = document.getElementById("category-chips");
    if (!wrap) return;
    wrap.innerHTML = "";
    const allChip = document.createElement("button");
    allChip.className = "category-chip" + (activeCategories.size === 0 ? " active" : "");
    allChip.textContent = "All";
    allChip.onclick = () => {
      activeCategories.clear();
      saveActiveCategories(activeCategories);
      renderChips();
      renderBrowseGrid();
    };
    wrap.appendChild(allChip);
    for (const cat of ALL_CATEGORIES) {
      const chip = document.createElement("button");
      chip.className = "category-chip" + (activeCategories.has(cat.key) ? " active" : "");
      chip.textContent = cat.label;
      chip.onclick = () => {
        if (activeCategories.has(cat.key)) activeCategories.delete(cat.key);
        else activeCategories.add(cat.key);
        saveActiveCategories(activeCategories);
        renderChips();
        renderBrowseGrid();
      };
      wrap.appendChild(chip);
    }
  }

  function renderBrowseGrid() {
    const grid = document.getElementById("browse-grid");
    const count = document.getElementById("browse-count");
    if (!grid) return;
    grid.innerHTML = "";
    const filtered = Scorely.games.filter(matchesFilters);
    for (const g of filtered) grid.appendChild(buildGameCard(g));
    if (filtered.length === 0) {
      grid.innerHTML = `<p class="empty">No games match this filter — clear search or chips to see all ${Scorely.games.length}.</p>`;
    }
    if (count) {
      count.textContent = `${filtered.length} of ${Scorely.games.length}`;
    }
  }

  function wireBrowseEvents() {
    const search = document.getElementById("game-search");
    if (search) {
      search.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        saveSearchQuery(searchQuery);
        renderBrowseGrid();
      });
    }
  }

  function collectStats() {
    const perGame = [];
    const playerAppearances = new Map(); // normalized name -> { display, count, games: Set }
    const recentMap = (() => {
      try { return JSON.parse(localStorage.getItem("scorely:recent:v1") || "{}"); }
      catch { return {}; }
    })();

    for (const game of Scorely.games) {
      const raw = localStorage.getItem(`scorely:${game.id}:v1`);
      if (!raw) continue;
      let state;
      try { state = JSON.parse(raw); } catch { continue; }
      const players = Array.isArray(state.players) ? state.players : [];
      if (players.length === 0) continue;

      perGame.push({
        game,
        players: players.map((p) => p.name),
        lastOpened: recentMap[game.id] || null,
      });

      for (const p of players) {
        const key = (p.name || "").trim().toLowerCase();
        if (!key) continue;
        const existing = playerAppearances.get(key);
        if (existing) {
          existing.count += 1;
          existing.games.add(game.id);
        } else {
          playerAppearances.set(key, {
            display: p.name.trim(),
            count: 1,
            games: new Set([game.id]),
          });
        }
      }
    }

    const topPlayers = [...playerAppearances.values()]
      .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display));

    perGame.sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));

    return {
      gamesTracked: perGame.length,
      uniquePlayers: playerAppearances.size,
      topPlayers,
      perGame,
    };
  }

  function renderStats() {
    const s = collectStats();

    const hero = document.createElement("section");
    hero.className = "card stats-hero";
    hero.innerHTML = `
      <h2>📊 Hall of Fame</h2>
      <div class="stats-grid">
        <div class="stat-tile"><div class="stat-value">${s.gamesTracked}</div><div class="stat-label">games tracked</div></div>
        <div class="stat-tile"><div class="stat-value">${s.uniquePlayers}</div><div class="stat-label">unique players</div></div>
        <div class="stat-tile"><div class="stat-value">${Scorely.games.length}</div><div class="stat-label">total games</div></div>
      </div>
    `;
    appEl.appendChild(hero);

    if (s.gamesTracked === 0) {
      const empty = document.createElement("section");
      empty.className = "card";
      empty.innerHTML = `
        <p class="empty">No saved games yet. Open any game, add some players, score a round — your stats will start appearing here.</p>
      `;
      appEl.appendChild(empty);
      return;
    }

    // Top players
    const playersCard = document.createElement("section");
    playersCard.className = "card";
    playersCard.innerHTML = `<h2>Top players</h2>`;
    const playersList = document.createElement("ul");
    playersList.className = "stats-players";
    for (const p of s.topPlayers.slice(0, 12)) {
      const li = document.createElement("li");
      const medal = p === s.topPlayers[0] ? "🥇 " : p === s.topPlayers[1] ? "🥈 " : p === s.topPlayers[2] ? "🥉 " : "";
      li.innerHTML = `
        <span class="stats-player-name">${medal}${Scorely.escapeHtml(p.display)}</span>
        <span class="stats-player-meta">${p.count} game${p.count === 1 ? "" : "s"} · ${p.games.size} different</span>
      `;
      playersList.appendChild(li);
    }
    if (s.topPlayers.length === 0) {
      playersList.innerHTML = '<li class="empty">No players recorded yet.</li>';
    }
    playersCard.appendChild(playersList);
    appEl.appendChild(playersCard);

    // Per-game breakdown
    const gamesCard = document.createElement("section");
    gamesCard.className = "card";
    gamesCard.innerHTML = `<h2>Per-game breakdown</h2>`;
    const gamesList = document.createElement("ul");
    gamesList.className = "stats-games";
    for (const entry of s.perGame) {
      const li = document.createElement("li");
      const accent = entry.game.accent ? ` style="background: ${entry.game.accent};"` : "";
      const icon = entry.game.icon ? `<span class="stats-game-icon"${accent}>${entry.game.icon}</span>` : "";
      const when = entry.lastOpened
        ? new Date(entry.lastOpened).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : "—";
      li.innerHTML = `
        <a class="stats-game-link" href="#/${entry.game.id}">
          ${icon}
          <div class="stats-game-info">
            <div class="stats-game-name">${Scorely.escapeHtml(entry.game.name)}</div>
            <div class="stats-game-players">${entry.players.map((n) => Scorely.escapeHtml(n)).join(" · ")}</div>
          </div>
          <div class="stats-game-when">${when}</div>
        </a>
      `;
      gamesList.appendChild(li);
    }
    gamesCard.appendChild(gamesList);
    appEl.appendChild(gamesCard);
  }

  function slugify(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "game";
  }

  function uniqueCustomId(base) {
    let id = `${base}-custom`;
    let i = 2;
    while (Scorely.getGame(id)) id = `${base}-custom-${i++}`;
    return id;
  }

  function renderCreateGame() {
    const form = document.createElement("section");
    form.className = "card";
    form.innerHTML = `
      <h2>🎨 Create your own game</h2>
      <p class="muted" style="margin-top: -6px; margin-bottom: 18px;">
        Build a rounds-based scoreboard from scratch — name it, pick a win condition, and it's on your home grid.
      </p>
      <form id="create-form" class="create-form">
        <label class="create-label">
          <span>Name</span>
          <input type="text" name="name" required maxlength="40" placeholder="My Game Night" />
        </label>
        <div class="create-row">
          <label class="create-label">
            <span>Icon (emoji)</span>
            <input type="text" name="icon" maxlength="4" placeholder="🎮" />
          </label>
          <label class="create-label create-label-grow">
            <span>Tagline (optional)</span>
            <input type="text" name="tagline" maxlength="200" placeholder="Per round, enter each player's points…" />
          </label>
        </div>

        <div class="create-section">
          <span class="create-section-label">Win condition</span>
          <label class="create-radio">
            <input type="radio" name="condition" value="target" checked />
            <span><strong>Race to a target</strong> — highest cumulative wins (e.g. first to 500)</span>
          </label>
          <label class="create-radio">
            <input type="radio" name="condition" value="elim" />
            <span><strong>Out at threshold</strong> — lowest survives (e.g. Least Count)</span>
          </label>
          <label class="create-radio">
            <input type="radio" name="condition" value="manual" />
            <span><strong>No auto-winner</strong> — leader pulses, you decide when to stop</span>
          </label>
        </div>

        <label class="create-label" id="create-target-wrap">
          <span id="create-target-label">Target score</span>
          <input type="number" name="target" min="1" value="100" />
        </label>

        <div class="create-actions">
          <button type="submit">Create game</button>
          <a href="#/" class="create-cancel">Cancel</a>
        </div>
      </form>
    `;
    appEl.appendChild(form);

    const formEl = form.querySelector("#create-form");
    const targetWrap = form.querySelector("#create-target-wrap");
    const targetLabel = form.querySelector("#create-target-label");

    formEl.addEventListener("change", () => {
      const cond = formEl.condition.value;
      targetWrap.style.display = cond === "manual" ? "none" : "";
      targetLabel.textContent = cond === "elim" ? "Elimination threshold" : "Target score";
    });

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = formEl.name.value.trim();
      if (!name) return;
      const icon = formEl.icon.value.trim() || "🎮";
      const tagline = formEl.tagline.value.trim();
      const condition = formEl.condition.value;
      const target = parseInt(formEl.target.value, 10);

      const baseSlug = slugify(name);
      const id = uniqueCustomId(baseSlug);

      const config = {
        id,
        name,
        icon,
        accent: "linear-gradient(135deg, #7c8eff 0%, #b46cff 100%)",
        tagline,
        custom: true,
        labels: { round: "Round", addRound: "Add round", total: "Total" },
      };

      if (condition === "target") {
        config.scoring = { direction: "high", endCondition: "target-reach", thresholdKey: "target" };
        config.settings = { target: { label: "Target score", type: "number", default: target, min: 1 } };
      } else if (condition === "elim") {
        config.scoring = { direction: "low", endCondition: "threshold-elim", thresholdKey: "target" };
        config.settings = { target: { label: "Elimination threshold", type: "number", default: target, min: 1 } };
      } else {
        config.scoring = { direction: "high" };
      }

      Scorely.defineGame(config);
      Scorely.saveCustomGame(config);
      window.location.hash = `#/${id}`;
    });

    // List of existing custom games with delete
    const customs = Scorely.getCustomGames();
    if (customs.length > 0) {
      const manageCard = document.createElement("section");
      manageCard.className = "card";
      manageCard.innerHTML = `<h2>Your custom games</h2>`;
      const list = document.createElement("ul");
      list.className = "custom-list";
      for (const c of customs) {
        const li = document.createElement("li");
        li.innerHTML = `
          <span class="custom-icon">${c.icon || "🎮"}</span>
          <div class="custom-info">
            <a href="#/${c.id}" class="custom-name">${Scorely.escapeHtml(c.name)}</a>
            ${c.tagline ? `<div class="custom-tagline">${Scorely.escapeHtml(c.tagline)}</div>` : ""}
          </div>
          <button class="custom-delete" data-delete="${c.id}" title="Delete">×</button>
        `;
        list.appendChild(li);
      }
      manageCard.appendChild(list);
      appEl.appendChild(manageCard);

      manageCard.querySelectorAll("[data-delete]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.delete;
          const c = Scorely.getGame(id);
          if (!confirm(`Delete "${c?.name || id}" and its saved games?`)) return;
          Scorely.deleteCustomGame(id);
          render();
        });
      });
    }
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  function syncSoundToggle() {
    const btn = document.getElementById("sound-toggle");
    if (!btn) return;
    const on = Scorely.isSoundEnabled();
    btn.textContent = on ? "🔊" : "🔇";
    btn.classList.toggle("sound-on", on);
    btn.setAttribute("aria-label", on ? "Mute sound" : "Enable sound");
    btn.title = on ? "Mute sound" : "Enable sound";
  }

  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("sound-toggle");
    if (!btn) return;
    syncSoundToggle();
    btn.addEventListener("click", () => {
      Scorely.toggleSound();
      syncSoundToggle();
    });
  });
})();
