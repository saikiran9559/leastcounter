# 0007 — Third sibling engine: engine-counter.js

**Date:** 2026-06-07
**Status:** Accepted

## Context

Phase 5 in `status.yaml` covers counter-only games — Tennis, Table Tennis, Pickleball, Badminton, Volleyball, Pool, Settlers of Catan, Backgammon. Their shape:

- No rounds. No categories. Just a number per player that goes up.
- Win = first to target (with optional "win by 2" margin).
- The UI is dominated by **big, tappable +1 buttons** — these get used during play, not paused-between-rounds like Least Count.

Trying to express this as rounds (one round per point scored) would make the round table balloon to 25+ rows for a single volleyball set, and the UX (Save-round form between each tap) is wrong. Trying to express it as grid (one category per point) is even worse.

This is a third shape that warrants a third engine, by the same logic that justified the grid engine in [ADR 0006](0006-grid-engine.md).

## Decision

Add `engine-counter.js` as a third sibling. Game configs opt in via `shape: 'counter'`. `app.js` dispatches in the router:

```js
if (config.shape === 'grid')    instance = Scorely.createGridInstance(id);
else if (config.shape === 'counter') instance = Scorely.createCounterInstance(id);
else                            instance = Scorely.createInstance(id);
```

Specific to the counter engine:
- `scoring.direction` is always `'high'` (counter games are always highest-wins).
- `config.winBy` (default 1) — how much margin the leader needs to win. Set to 2 for racket sports' deuce rule.
- `config.scoreNoun` (default `'points'`) — banner reads `wins 11–9 points` or `wins 5–3 racks`.
- State: `{ settings, players, scores: { [pid]: number } }`. No rounds, no history (yet — could add undo later).
- Increment with `+1` / `−1` buttons. Live update (no full re-render on each tap) preserves DOM stability for fast-tap UX.

This batch (Phase 5a) ships six games — table tennis, pickleball, badminton, volleyball, Settlers of Catan, Pool — all the same shape with different targets and `winBy`/`scoreNoun` config.

## Alternatives considered

- **Generalize rounds engine to handle "rounds of size 1"** — rejected. The UI difference is profound (big tap buttons vs Save-round form); the data model could be coerced but the rendering can't.
- **Defer counter games until rounds engine grows a "counter mode"** — rejected. The grow-rounds-engine approach pulls in the round table and add-round form for games that don't need them. Cleaner to keep each engine focused.
- **Bundle the racket sports into one config (with `mode: 'tableTennis' | 'badminton' | ...`)** — rejected. The home grid wants each as its own card with its own icon and target.

## Phase 5a vs 5b split

| Task | Game | 5a / 5b | Why |
|---|---|---|---|
| 5.1 | Counter engine | 5a (done) | foundation |
| 5.2 | Table tennis / Pickleball / Badminton / Volleyball | 5a (done) | four configs, same engine |
| 5.3 | Tennis (nested counter) | 5b (deferred) | points → games → sets → match is a NESTED counter — different shape from a flat target-reach |
| 5.4 | Pool / 8-ball | 5a (done) | modeled as rack-counter (first to N racks); per-rack ball tracking not included |
| 5.5 | Backgammon match play | 5b (deferred) | doubling cube state + gammon/backgammon multipliers — needs per-game multipliers |
| 5.6 | Settlers of Catan | 5a (done) | trivial counter with VP noun |

Phase 5b (Tennis + Backgammon) waits until the nested-counter shape is more clearly justified.

## Consequences

**Easier:**
- Six counter games shipped as ~12-line configs.
- The big-button UX is identical for racket sports and Catan — bug fixes apply across.
- Future counter games (Cornhole, Bocce, etc.) ship as one-file configs.

**Harder:**
- Three engines in parallel now (`engine.js`, `engine-grid.js`, `engine-counter.js`). If a fourth shape lands (likely: session ledger for poker), generalize the dispatch before it becomes a chain of `else if`s.
- Each engine duplicates ~30% of the others (player management, settings, status wiring). Acceptable cost; revisit if maintenance burden becomes real.
- Tennis is the most-requested counter game but is deferred because the nested point-game-set-match shape doesn't fit the flat target-reach model.

## Cross-references

- Architecture overview: [`../architecture.md`](../architecture.md).
- Prior engine ADRs: [0003](0003-engine-api.md), [0004](0004-round-entries-and-progress.md), [0005](0005-phase-3a-light-team-and-threshold-end.md), [0006](0006-grid-engine.md).
- Phase plan: Phase 5 in [`../../status.yaml`](../../status.yaml).
