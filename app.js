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
    card.innerHTML = `
      ${icon}
      <h3>${Scorely.escapeHtml(g.name)}</h3>
      ${g.tagline ? `<p>${Scorely.escapeHtml(g.tagline)}</p>` : ""}
    `;
    return card;
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

    // Recent
    const recentIds = Scorely.getRecentGames(5);
    const recentGames = recentIds
      .map((id) => Scorely.getGame(id))
      .filter(Boolean);
    if (recentGames.length > 0) {
      const recentCard = document.createElement("section");
      recentCard.className = "card";
      recentCard.innerHTML = `<h2>Recent</h2>`;
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
        <input
          type="search"
          id="game-search"
          class="game-search"
          placeholder="Search by name or tagline…"
          value="${Scorely.escapeHtml(searchQuery)}"
        />
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
        More games coming — see the
        <a href="https://github.com/saikiran9559/scorely/blob/main/status.yaml">roadmap</a>.
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

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);
})();
