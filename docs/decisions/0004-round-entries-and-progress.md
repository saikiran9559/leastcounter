# 0004 — Round `entries` schema and `progress-reach` endCondition

**Date:** 2026-06-07
**Status:** Accepted

## Context

The first eight games shipped (Least Count, UNO, Rummy, Crazy Eights, Tonk, Dominoes, Rummikub, Farkle) all fit the same per-round shape: each player contributes one number. Phase 10 breaks this — each player needs to report two things per round:

1. Their leftover-card score (a number).
2. Whether they completed their current phase this round (a boolean).

The win condition is also new: not "lowest cumulative", not "first to target", but "first player whose count of completed-phase rounds reaches 10, tie-broken by lowest score."

Two paths forward:

1. **Special-case Phase 10** — hardcode the extra checkbox in a `games/phase-10.js` that does its own rendering and win check, bypassing the engine.
2. **Widen the engine vocabulary** — add a per-round multi-field schema and a third endCondition (`progress-reach`). Phase 10 becomes a config like every other game.

## Decision

**Widen the engine vocabulary.** Per [ADR 0003](0003-engine-api.md): when a game doesn't fit the current flags, the answer is to add flags, not escape hatches. Two additions:

1. **`config.roundInputs`** — optional array of `{ key, label, type, min?, max? }` field schemas. The default `[{ key: 'score', type: 'number', min: 0 }]` keeps existing games unchanged. Phase 10 sets `[{ key: 'score' }, { key: 'phaseComplete', type: 'checkbox' }]`.
2. **`scoring.endCondition: 'progress-reach'`** — game ends when any player's per-round "completed" count (counted via `scoring.progressKey`) reaches `state.settings[scoring.thresholdKey]`. Tie-breaker uses `scoring.direction`.

The round-data shape also changes: `r.scores: { playerId: number }` → `r.entries: { playerId: { score, ...extraFields } }`. A `getEntry(round, playerId)` helper inside the engine reads both formats so pre-extension saves keep working. New writes always use `r.entries`.

## Alternatives considered

- **Special-case Phase 10** — rejected. The Phase 10 file would duplicate ~80% of the engine's render and submit logic with one checkbox change. Future games that fit similar shapes (multi-input rounds, progression-based wins) would each be another special case. Two games in this category and the engine wins on consolidation; we're already at two (Phase 10 today; engine-extension-friendly games in later phases).
- **Callback-style winner function** — rejected for the same reason as in [ADR 0003](0003-engine-api.md). The matrix grows by one row, not by an escape hatch.
- **Bump localStorage key from `v1` → `v2`** with a migrator — considered, rejected. The read-fallback in `getEntry` is enough: existing saves still load correctly without forcing every user through a migration that changes their data shape on first read. The shape diverges only when a new round is added, which would have rewritten the file anyway.

## Consequences

**Easier:**
- Phase 10 ships as ~20 lines of declarative config.
- Future games with per-round booleans (Pinochle melds, Spades made/set) or extra numeric fields (Cribbage show vs peg) reuse `roundInputs`.
- Future games with stage-progression (Phase 10 variants, Race to 10, etc.) reuse `progress-reach`.

**Harder:**
- The score-table column still shows one number per cell (the `score` field). Extra fields don't appear in the table — they only inform the status list and win condition. Adequate for Phase 10 (the per-phase progress shows in the status list). If a future game wants per-cell visibility of multiple fields, that's another engine extension.
- Two-format round storage will live forever in the codebase, but the cost is one `getEntry` helper. Worth it to avoid forcing pre-extension users through a migration on first open.

## Cross-references

- The engine API this extends: [ADR 0003](0003-engine-api.md).
- The architectural overview updated for this change: [`../architecture.md`](../architecture.md).
- The phase that produced this decision: Phase 2 task 2.5 in [`../../status.yaml`](../../status.yaml).
