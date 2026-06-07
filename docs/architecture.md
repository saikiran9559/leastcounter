# Architecture

Scorely is a multi-game scoring website. The user opens the home page, picks a game from a grid, and lands on that game's scoreboard. State per game persists in `localStorage` so refreshing or coming back later resumes where they left off.

The codebase is intentionally small and dependency-free. No build step, no framework, no module bundler. Per [ADR 0001](decisions/0001-vanilla-no-build-step.md), every source file is directly servable and `index.html` opens from `file://`.

## File layout

```
index.html              Shell with header, #app container, script tags
styles.css              All styling — shared across home and games
app.js                  Bootstrap: hash router + home screen + shape dispatch
engine.js               Rounds engine — players + dynamic rounds (Least Count, UNO, Hearts, ...)
engine-grid.js          Grid engine — players + fixed N category slots (Wingspan, 7 Wonders, Disc Golf)
engine-counter.js       Counter engine — big +/- buttons, first to target (Table tennis, Catan, Pool, ...)
engine-ledger.js        Ledger engine — buy-ins, cash-out, net P&L (Poker, Teen Patti)
engine-tennis.js        Tennis engine — nested points/games/sets/match with deuce logic (Tennis)
games/
  least-count.js        Game config (config object passed to Scorely.defineGame)
  uno.js                Game config
  wingspan.js           Grid game config (config.shape = 'grid')
  ...                   One file per game, ~10–40 lines each
```

Game configs declare their shape via `config.shape: 'rounds' | 'grid' | 'counter' | 'ledger' | 'tennis'` (default `'rounds'`). `app.js` dispatches via a `shape → factory` map — adding a new shape is one map entry plus an engine file. Five engines live in parallel — see ADRs [0006](decisions/0006-grid-engine.md), [0007](decisions/0007-counter-engine.md), [0008](decisions/0008-ledger-engine-and-dispatch.md), and [0011](decisions/0011-tennis-engine.md) for the rationale.

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

  roundInputMax: 80,            // optional — caps the per-player per-round score input
                                // (used by Rummy's 80-point full-count cap)
                                // Equivalent to roundInputs: [{ key:'score', max: 80 }]

  roundInputs: [                // optional — multi-field per-player per round
    { key: 'score',         label: 'Score',           type: 'number',   min: 0 },
    { key: 'phaseComplete', label: 'Completed phase', type: 'checkbox' },
  ],

  progressNoun: 'Phase',        // optional — when scoring.progressKey is set, the status list
                                // shows "<noun> N" per player. Default: "Stage".

  playerNoun: 'Team',           // optional — relabel UI strings ("Players" → "Teams" etc.).
                                // Default: "Player". Used by Mendikot/Court Piece so the
                                // game's "players" are teams.
  defaultPlayers: ['Team 1', 'Team 2'],  // optional — pre-fill these names on first load.
}
```

### Round data shape

Rounds support two formats; the engine reads both, writes the new one:

```js
// New format (current writes):
{ id: 'r1', entries: { abc123: { score: 14, phaseComplete: true }, def456: { score: 0 } } }

// Legacy format (still read for pre-extension saves):
{ id: 'r1', scores: { abc123: 14, def456: 0 } }
```

The internal `getEntry(round, playerId)` helper normalizes to `{ score, ...extraFields }`. Existing saved games keep working through this read-fallback; new rounds added after the extension always use the new format.

**Multi-field totals.** Since [ADR 0009](decisions/0009-sum-all-numeric-round-fields.md), the engine sums *every* numeric field declared in `roundInputs` into the running total (not just `score`). Checkboxes and other non-numeric fields are ignored for scoring. This unlocks Cribbage (`peg + show`) and Pinochle (`meld + tricks`) as plain configs. Backwards-compatible — every prior game declared only `score`, so the sum equals the old per-cell value.

**Display mode.** Since [ADR 0010](decisions/0010-cherry-pick-b-phases-and-displaymode.md), `scoring.displayMode: 'remaining'` (optional) flips the totals row and status list to show `target - total` instead of `total`. State and win logic are unchanged. Used by Darts 501 for the countdown look.

**Formula games.** Since [ADR 0012](decisions/0012-formula-callbacks-for-bid-vs-made-games.md), the rounds engine accepts two opt-in callbacks for genuinely formula-driven games (Spades, future Euchre/Pitch/500/Bridge):

- `config.computeTotal(state, playerId, config) → number` — replaces the default field-sum total. Game does the full computation including cumulative effects (e.g. Spades' bag overflow penalty).
- `config.formatRoundCell(entry) → string` — replaces the default per-round table cell display. Useful when the raw `bid/tricks` pair is more informative than their arithmetic sum.

Most games don't declare either; they use the engine's defaults.

The `direction × endCondition` matrix the engine supports today:

| direction | endCondition | Example | Behavior |
|---|---|---|---|
| `low`  | `threshold-elim` | Least Count, Rummy, Crazy Eights, Tonk, Dominoes, Rummikub | Players are OUT when total ≥ threshold; last active player wins |
| `high` | `target-reach`   | UNO, Farkle | First player to reach target wins; no eliminations |
| `low`  | `target-reach`   | (unusual) | First to reach target wins, lowest among reachers (rare) |
| `high` | `threshold-elim` | (theoretical) | Players are eliminated for crossing — not currently used |
| `low`  | `progress-reach` | Phase 10 | First player whose per-round "completed" count reaches target wins; lowest score breaks ties |
| `low`  | `threshold-end`  | Hearts | As soon as any player crosses threshold, game ends; lowest cumulative across all players wins |

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
    // New format (used for all writes after the multi-field schema landed):
    { id: 'r1', entries: { abc1234: { score: 14 }, def5678: { score: 23 } } },
    // Legacy format (still read transparently if saved before the extension):
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

## Grid engine (engine-grid.js)

Sibling to the rounds engine for games with fixed N named categories per player. Currently used by Wingspan, 7 Wonders, Disc Golf.

GameConfig fields specific to grid games:

```js
{
  shape: 'grid',                // tells app.js to use Scorely.createGridInstance
  categories: [                 // array OR function(settings) → array
    { key: 'birds',  label: 'Birds' },
    { key: 'bonus',  label: 'Bonus cards' },
  ],
  scoring: { direction: 'high' }, // 'low' or 'high' — no endCondition (game ends when all
                                  // players fill all categories)
}
```

State shape for grid games:

```js
{
  settings: { holes: 18 },
  players: [{ id, name }],
  scores: {
    [playerId]: { [categoryKey]: number },
  },
}
```

Score editing is direct (no Save-round button) — each cell edits in place, totals update live without re-rendering inputs (preserves focus). A winner is declared only when every player has filled every category; before that, the status list shows a leader and per-player progress (e.g. `12 / 18 filled`).

## Counter engine (engine-counter.js)

Sibling to the rounds + grid engines for games whose entire UI is "big +1 buttons, first to target wins." Currently used by Table Tennis, Pickleball, Badminton, Volleyball, Catan, Pool.

GameConfig fields specific to counter games:

```js
{
  shape: 'counter',
  settings: {
    target: { label: 'Target score', type: 'number', default: 11, min: 1 },
  },
  winBy: 2,                  // optional, default 1. Margin needed to win (table tennis: 2).
  scoring: { direction: 'high' },  // counter games are always highest-wins
  scoreNoun: 'points',       // optional, default 'points'. Banner: "wins 5–3 racks" / "wins 11–9 points".
}
```

State shape:

```js
{
  settings: { target: 11 },
  players: [{ id, name }],
  scores: { [playerId]: number },
}
```

Increment via per-player `+1` / `−1` buttons. Score updates are partial (no full re-render on each tap) — keeps the UI responsive for fast scoring. Winner = top score ≥ target *and* (top − second) ≥ winBy.

## Ledger engine (engine-ledger.js)

Sibling for money-tracking session games (Poker, Teen Patti). No win condition; just running net P&L per player.

GameConfig fields specific to ledger games:

```js
{
  shape: 'ledger',
  settings: {
    defaultBuyIn: { label: 'Default buy-in', type: 'number', default: 20, min: 1 },
  },
  currency: '$',          // optional, default '$'. Used in money formatting.
}
```

State shape:

```js
{
  settings: { defaultBuyIn: 20 },
  players: [{ id, name }],
  ledger: {
    [playerId]: { buyIns: [20, 20, 40], cashOut: 120 | null },
  },
}
```

Per-player UI: quick-add buy-in chip (default amount), custom buy-in via prompt, removable chips, single cash-out input. Net = `cashOut - sum(buyIns)`; positive net renders green, negative red. The standings card shows a *house balance* (total buy-ins − total cash-outs) — should be 0 once everyone has cashed out; non-zero is a sanity-check signal that someone forgot to enter a cash-out.

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
