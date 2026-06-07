(function () {
  const appEl = document.getElementById("app");
  const backNav = document.getElementById("back-nav");
  const subtitle = document.getElementById("brand-subtitle");

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
    const factories = {
      rounds: Scorely.createInstance,
      grid: Scorely.createGridInstance,
      counter: Scorely.createCounterInstance,
      ledger: Scorely.createLedgerInstance,
      tennis: Scorely.createTennisInstance,
      bowling: Scorely.createBowlingInstance,
    };
    const factory = factories[config.shape] || factories.rounds;
    const instance = factory(config.id);
    instance.mount(appEl);
  }

  function renderHome() {
    document.title = "Scorely";
    const count = Scorely.games.length;

    const hero = document.createElement("section");
    hero.className = "card home-hero";
    hero.innerHTML = `
      <h2>Pick your game</h2>
      <p>${count} scoreboard${count === 1 ? "" : "s"} ready to play, more on the way.</p>
    `;
    appEl.appendChild(hero);

    const wrap = document.createElement("section");
    wrap.className = "card";

    const grid = document.createElement("div");
    grid.className = "game-grid";

    for (const g of Scorely.games) {
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
      grid.appendChild(card);
    }

    if (count === 0) {
      grid.innerHTML = '<p class="empty">No games registered yet.</p>';
    }

    wrap.appendChild(grid);
    appEl.appendChild(wrap);

    const footer = document.createElement("section");
    footer.className = "card home-footer";
    footer.innerHTML = `
      <p class="muted">
        More games coming — see the
        <a href="https://github.com/saikiran9559/scorely/blob/main/status.yaml">roadmap</a>.
      </p>
    `;
    appEl.appendChild(footer);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", render);
})();
