# Architecture

Scorely is a multi-game scoring website. The user opens the home page, picks a game from a grid, and lands on that game's scoreboard. State per game persists in `localStorage` so refreshing or coming back later resumes where they left off.

The codebase is intentionally small and dependency-free. No build step, no framework, no module bundler. Per [ADR 0001](decisions/0001-vanilla-no-build-step.md), every source file is directly servable and `index.html` opens from `file://`.

## File layout

```
index.html              Shell with header, #app container, script tags
styles.css              All styling — shared across home and games
app.js                  Bootstrap: hash router + home screen
engine.js               Generic scoring engine (state, actions, rendering, persistence, PDF export)
games/
  least-count.js        Game config (config object passed to Scorely.defineGame)
  uno.js                Game config
  ...                   One file per game, ~10–40 lines each
```

Load order (in `index.html`):

1. jsPDF + autoTable CDN scripts (for PDF export)
2. `engine.js` — defines `window.Scorely` namespace
3. `games/*.js` — each calls `Scorely.defineGame(config)` to register
4. `app.js` — router; runs on `DOMContentLoaded`

## Runtime model

```
                     ┌──────────────────────────────┐
                     │     window.Scorely           │
                     │  ┌────────────────────────┐  │
                     │  │ games: GameConfig[]    │  │
                     │  │ defineGame(config)     │  │
                     │  │ getGame(id)            │  │
                     │  │ createInstance(id)     │  │
                     │  │ exportPdf(...)         │  │
                     │  └────────────────────────┘  │
                     └──────────────────────────────┘
                                  ▲
                                  │ populates
                                  │
            ┌──────┬──────┬───────┴──────┬───────────┐
            │      │      │              │           │
         games/least-count.js  games/uno.js    ... future games

                                  ▲
                                  │ reads
                                  │
                              ┌───┴────┐
                              │ app.js │  ← hash router, home screen
                              └────────┘
```

When the route is `#/<game-id>`, `app.js` calls `Scorely.createInstance(gameId)` to get a runtime object, then `instance.mount(container)` to render into `#app`. The instance owns its state, persists on every mutation, and re-renders the whole container after each change.

## GameConfig shape

What a game declares to the engine:

```js
{
  id: 'least-count',            // unique slug, used in URL + localStorage key
  name: 'Least Count',          // display name
  tagline: '...',               // short description shown on home card and game header

  settings: {
    limit: {                    // setting key — shows up in state.settings.limit
      label: 'Elimination limit',
      type: 'number',
      default: 250,
      min: 1,
    },
  },

  scoring: {
    direction: 'low',           // 'low' or 'high' — which way is "winning"
    endCondition: 'threshold-elim',  // 'threshold-elim' or 'target-reach'
    thresholdKey: 'limit',      // which entry in `settings` holds the threshold
  },

  // optional
  labels: {                     // override default UI strings
    round: 'Round',             // table column header
    addRound: 'Add round',      // section title
    total: 'Total',             // totals row label
  },
}
```

The four combinations of `direction × endCondition` the engine supports today:

| direction | endCondition | Example | Behavior |
|---|---|---|---|
| `low`  | `threshold-elim` | Least Count, Rummy | Players are OUT when total ≥ threshold; last active player wins |
| `high` | `target-reach`   | UNO, Farkle | First player to reach target wins; no eliminations |
| `low`  | `target-reach`   | (unusual) | First to reach target wins, lowest among reachers (rare) |
| `high` | `threshold-elim` | (theoretical) | Players are eliminated for crossing — not currently used |

## Instance state shape

Held in memory and persisted to `localStorage`:

```js
{
  settings: { limit: 250 },           // or { target: 500 } for UNO
  players: [
    { id: 'abc1234', name: 'Snehith' },
    { id: 'def5678', name: 'Rony' },
  ],
  rounds: [
    { id: 'r1', scores: { abc1234: 14, def5678: 23 } },
    { id: 'r2', scores: { abc1234: 23, def5678: 13 } },
  ],
}
```

## Persistence

- **Key:** `scorely:<gameId>:v1` (e.g., `scorely:least-count:v1`, `scorely:uno:v1`)
- **Migration:** when loading `least-count`, if the namespaced key is absent the engine falls back once to the legacy `leastcounter:v1` key (used pre-rename). The next write goes to the new key, so the legacy key fades naturally.
- **Versioning:** the trailing `:v1` lets us migrate state shape in the future without colliding. Bump to `:v2` and write a migrator if the state shape changes incompatibly.

## Routing

`app.js` parses `window.location.hash`:

- `#/` (or empty) → home screen with a grid of registered games
- `#/<game-id>` → that game's scoreboard, mounted via `engine.js`
- `#/<unknown>` → "unknown game" fallback card

`hashchange` listener re-renders on navigation. Browser back/forward works.

## Rendering and animations

The engine's `render()` rebuilds the container's innerHTML on every state change. Before rebuilding, it captures a `snapshot` (player IDs, round IDs, totals, out-status). The next render compares the snapshot to the new state and applies `.fresh` / `.just-out` / `.flash` classes to elements that genuinely changed.

This means CSS animations fire only on real state changes — not on incidental re-renders (e.g., navigating away and back). See `styles.css` for the keyframes.

`prefers-reduced-motion` disables all animations via media query.

## What the engine does NOT do

To stay small, the engine deliberately omits:

- **Per-round itemized scoring** (e.g., Phase 10's phase column, Spades' bid+tricks). Future engine extension — likely a `roundInputs: [...]` schema field that replaces the single-number-per-player default.
- **Team layouts** (e.g., Spades, Bridge — 2 teams of 2). Phase 3 extension.
- **Category-grid scoring** (Yahtzee, Bowling). Different shape entirely — likely a sibling engine in Phase 4, not an extension of this one.
- **Counter-only games** (Tennis, Pool — no rounds). Likely a separate `engine-counter.js` in Phase 5.
- **Session ledgers** (Poker buy-ins/cash-outs). Separate engine in Phase 6.

See [`../status.yaml`](../status.yaml) for the full phased plan and [`games.md`](games.md) for which games map to which pattern.

## Adding a new game (when it fits the current engine)

For any game in Phase 2 (cumulative scoring, threshold-elim or target-reach):

1. Create `games/<slug>.js` calling `Scorely.defineGame({...})` with the config shape above.
2. Add a `<script src="games/<slug>.js"></script>` line in `index.html` before `app.js`.
3. Done. The game appears on the home screen and is routable at `#/<slug>`.

No engine changes needed. If the game doesn't fit the current engine, file an ADR describing what extension is needed before adding it.
