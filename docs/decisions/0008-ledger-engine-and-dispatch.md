# 0008 — Fourth sibling: engine-ledger.js + dispatch map

**Date:** 2026-06-07
**Status:** Accepted

## Context

Phase 6 in `status.yaml` covers session ledgers — Poker (cash), Teen Patti, Codenames (team wins), Chess tournament. Two distinct shapes are bundled under "session ledger":

1. **Money ledger** (Poker, Teen Patti) — players buy in (potentially multiple times), cash out once at session end; net P&L per player. No win condition during the session, no rounds.
2. **Counter-style "session wins"** (Codenames team wins) — track team wins across the night. This is *not* a financial ledger; it's a counter game with `playerNoun: "Team"`. The "session" framing in `status.yaml` was speculative.
3. **Chess tournament** (6.5) — round-robin or Swiss with wins/draws/losses + Buchholz / Sonneborn-Berger tiebreakers. This is a *matrix* shape — fundamentally different from any of the four engines.

Group 1 needs a real fourth engine. Group 2 is the existing counter engine. Group 3 is deferred.

Also: with a fourth engine, the dispatch in `app.js` had become a chain of `else if`s. [ADR 0007](0007-counter-engine.md) flagged this as the threshold to generalize.

## Decision

1. **Add `engine-ledger.js`** as the fourth sibling. State: `{ settings, players, ledger: { [pid]: { buyIns: [], cashOut } } }`. UI: per-player ledger card with quick-add buy-in buttons (default + custom), removable buy-in chips, single cash-out input, live-updated net P&L. House balance shown at top of standings (should be 0 when everyone has cashed out — quick sanity check).

2. **Reclassify Codenames** as a counter game (`shape: 'counter'`, `playerNoun: 'Team'`, `defaultPlayers: ['Team Red', 'Team Blue']`, `scoreNoun: 'games'`). No new code; same engine that ships racket sports.

3. **Generalize the shape dispatch** in `app.js` from an if/else chain to a map:
   ```js
   const factories = {
     rounds: Scorely.createInstance,
     grid:    Scorely.createGridInstance,
     counter: Scorely.createCounterInstance,
     ledger:  Scorely.createLedgerInstance,
   };
   ```
   Future shapes are one map entry.

4. **Defer Chess tournament (6.5)**. The matrix + tiebreaker logic is its own shape and worth its own engine when there's clearer demand.

## Alternatives considered

- **Generalize "scoring entities" across all four engines.** Tempting but premature — each engine has UI-level differences (round form vs scorecard vs +/- buttons vs ledger chips) that don't share much. Revisit if/when a 5th shape lands.
- **Bake Codenames into engine-ledger as "team wins" mode.** Rejected. Codenames isn't financial; coupling it to the ledger engine would confuse what the ledger engine is *for*.
- **Try to express poker as a counter (net P&L = score).** Rejected. Buy-in mechanics (incremental, multiple) and house-balance sanity check don't fit a flat counter.
- **Skip Chess tournament entirely from the roadmap.** Rejected — it's still a valid future game; just needs a different engine when prioritized.

## Consequences

**Easier:**
- Poker and Teen Patti ship as ~12-line configs sharing the ledger engine (only currency + default buy-in differ).
- Codenames is one config on the existing counter engine — no engine code for it.
- Adding a 5th shape (e.g., chess tournament matrix) is one map entry + one engine file.

**Harder:**
- Four engines in parallel. Maintenance load is real — bug fixes to e.g. `escapeHtml` apply everywhere but rendering changes have to be ported four ways. Acceptable for now; revisit if a 5th engine lands and the duplication becomes painful.
- The dispatch map assumes all factories share the same `(gameId) → instance` signature. If a future engine needs more context (e.g., async load), this breaks — but YAGNI for now.

## Cross-references

- Prior engine ADRs: [0003](0003-engine-api.md), [0004](0004-round-entries-and-progress.md), [0005](0005-phase-3a-light-team-and-threshold-end.md), [0006](0006-grid-engine.md), [0007](0007-counter-engine.md).
- Phase plan: Phase 6 in [`../../status.yaml`](../../status.yaml).
- Architecture overview: [`../architecture.md`](../architecture.md).
