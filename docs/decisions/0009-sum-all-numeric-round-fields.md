# 0009 — `totalFor` sums all numeric round-input fields

**Date:** 2026-06-07
**Status:** Accepted

## Context

Cribbage and Pinochle want **two numeric inputs per player per round** that both contribute to the running total:

- Cribbage: `peg` (pegging during play) + `show` (counted hand & crib at end of hand)
- Pinochle: `meld` (declared melds) + `tricks` (trick points)

Both are standard rounds-engine shape *except* the round total isn't a single field — it's the sum of two fields.

The existing engine read `getEntry(r, playerId).score` exclusively for round-table cells and `totalFor` cumulative. Other fields (added by [ADR 0004](0004-round-entries-and-progress.md) for Phase 10's `phaseComplete` checkbox) were ignored by the scoring logic.

Two options:

1. **Hardcode `score` as the sole scoring field; tell games to do their own addition in the form** — push the burden onto users (mental math each round) and onto each game config (a synthetic "score" field computed before storing). Both ugly.
2. **Sum all numeric round-input fields in `totalFor`.** Checkboxes and other non-numeric fields are skipped. The previously-special `score` key becomes a convention, not a contract.

## Decision

Change `totalFor` (and the round table's per-cell display) to sum all numeric `roundInputs` fields, skipping `type: 'checkbox'`. Backwards-compatible — every existing game declared only `score` (numeric), so the sum equals what `getEntry(r, p).score` returned before.

Game configs gain expressive power: declare any number of numeric fields per round, all of them contribute to the running total.

Cribbage and Pinochle ship with two-field configs. A factored `roundTotal(entry)` helper is shared between `totalFor`, the round-table cell, and the PDF export so all three views agree.

## Alternatives considered

- **Per-game `computeScore(entry) → number` callback.** Rejected, same reason as [ADR 0003](0003-engine-api.md) — pushes scoring logic into game configs as code, defeating the declarative principle.
- **An explicit `field.contributesToTotal: true` flag** instead of "all numeric fields by default." Rejected for verbosity. The convention "numeric fields count, checkboxes are state" is intuitive; the rare game that wants a numeric field that *doesn't* count (e.g., a notes field) can use `type: 'text'`, which would also be skipped.
- **Bump the engine to handle non-additive scoring formulas (bid × made, etc.).** Deferred — that's Phase 7b territory and warrants its own ADR when the first such game (Spades, 500, etc.) ships.

## Phase 7a vs 7b split

| Task | Game | 7a / 7b | Why |
|---|---|---|---|
| 7.1 | Cribbage | 7a (done) | sum-of-fields |
| 7.2 | Pinochle | 7a (done) | sum-of-fields |
| 7.3 | Canasta | 7b (deferred) | many bonus categories (red threes, canastas clean/dirty, going-out) — likely a Yahtzee-style grid card per hand, not a simple sum |
| 7.4 | 500 | 7b (deferred) | bid-value lookup table; needs computed score |
| 7.5 | Belote | 7b (deferred) | declarations + per-deal value formulas |
| 7.6 | Darts 501 | 7b (deferred) | reverse-direction display (remaining = 501 − scored) with bust rule; doable but warrants its own ADR for the display-vs-state distinction |
| 7.7 | Darts Cricket | 7b (deferred) | marks-per-number matrix (15–20 + bull) — different shape |
| 7.8 | Snooker | 7b (deferred) | break calculator inside a frame + frame-of-match counter (nested) |
| 7.9 | Scrabble | 7a (done) | single field, no endCondition |
| 7.10 | Cricket | 7b (deferred) | its own domain — runs, wickets, overs, batting/bowling figures |

7b games need real engine extensions (computed scores, multi-modal displays, matrix shapes). Worth designing a more general "computed score" extension when the first 7b game is prioritized.

## Consequences

**Easier:**
- Cribbage, Pinochle, Scrabble ship as small configs.
- Future games with N numeric fields per round (e.g., a "wins + bonus" tally) ship without engine changes.
- The round table and PDF show meaningful per-round sums for multi-field games.

**Harder:**
- The round table loses granularity — Cribbage shows `peg + show = 18` in the cell, not `5 + 13`. Acceptable; the input form remembers the breakdown. If users want to see the breakdown post-entry, that's a future "round detail" UX, not a blocker.
- Scrabble has no `endCondition` and no `thresholdKey`, so the PDF header doesn't show a target line. Handled gracefully (single conditional in the PDF helper).
- Future games that want a numeric field that does NOT count toward the total (e.g., a per-round timer in seconds) will have to declare it as `type: 'text'` or wait for the explicit-flag escape hatch.

## Cross-references

- Engine API: [ADR 0003](0003-engine-api.md).
- Multi-field round inputs: [ADR 0004](0004-round-entries-and-progress.md).
- Phase plan: Phase 7 in [`../../status.yaml`](../../status.yaml).
