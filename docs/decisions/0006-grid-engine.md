# 0006 — Sibling grid engine for category-grid games

**Date:** 2026-06-07
**Status:** Accepted

## Context

Phase 4 in `status.yaml` covers category-grid games — Yahtzee, Bowling, Golf, Disc Golf, Archery, 7 Wonders, Wingspan. Their shape is fundamentally different from rounds-based games:

- **Rounds-based** (engine.js): players are fixed, *rounds* are dynamic. Each round, every player enters one (or few) inputs. Totals = sum across rounds.
- **Grid-based** (this engine): players are fixed, *categories* are fixed. Each player has N named slots they fill in any order. Totals = sum across categories.

The UI implications:
- Rounds engine renders an Add-round form below a scoreboard table.
- Grid engine renders per-player scorecards with all category slots visible at once.

Trying to express grid games as rounds (e.g., one row per category) would invert the data model and force every grid game to live as a single "always-being-edited round," with the engine's round-form abstraction working against the UI.

## Decision

Add `engine-grid.js` as a **sibling** to `engine.js`. Game configs opt in via `shape: 'grid'`; `app.js` dispatches in the router (default is `'rounds'`).

The grid engine shares:
- `Scorely.defineGame` registry
- `Scorely.escapeHtml`, `Scorely.fireConfetti`
- localStorage convention (`scorely:<id>:v1`)
- `direction` (low/high) for win determination
- `playerNoun` / `defaultPlayers` semantics
- Animation idioms (`total-flash`, `leader-pulse`, confetti)

Grid-specific:
- `config.categories` — array of `{ key, label }`, or `(settings) → array` for parameterized counts (Disc Golf with 9 vs 18 holes).
- State shape: `{ settings, players: [{id, name}], scores: { [pid]: { [catKey]: number } } }`.
- "Winner" requires *every player to have filled every category* — partial games show only a leader.
- Score input is *direct edit* (focus-preserving partial updates), not Save-round-form.

This batch (Phase 4a) ships three games: **Wingspan**, **7 Wonders**, **Disc Golf** — all pure sum-of-categories.

## Alternatives considered

- **Extend the rounds engine to support a grid shape.** Rejected. The two render pipelines would diverge enough that the engine becomes a switch statement, and the rounds engine's `addRound`/`removeRound` actions don't map cleanly to "edit cell N." Cleaner to keep each engine focused.
- **One engine per game.** Rejected for the same reasons cited in [ADR 0003](0003-engine-api.md) and [ADR 0004](0004-round-entries-and-progress.md) — bug fixes and animations multiply per game.
- **A more abstract "scoring entity" layer above both engines.** Rejected for now. Two engines is small enough to live with; abstraction can come if we add a third shape (counter-only, session-ledger).

## Phase 4a vs 4b split

Phase 4a (this commit) ships the three simplest grid games — pure sum-of-categories. Phase 4b games need engine extensions:

| Task | Game | Why deferred |
|---|---|---|
| 4.2 | Yahtzee | Upper-section bonus (+35 if ≥63 in upper), Yahtzee bonus (+100 per extra), per-category constraints (e.g. Yahtzee = 50 exact). Needs *derived* categories. |
| 4.3 | Bowling | Strike (next 2 throws bonus) / spare (next 1 throw bonus) carry-over. Cells depend on adjacent cells. |
| 4.4 | Golf | Three scoring modes (stroke / stableford / match-play). Needs a `mode` setting + per-mode computation. |
| 4.6 | Archery | Per-end "arrow sums". Multi-input per category (6 arrows × N ends). Needs nested grid. |

Each gets a note in `status.yaml` with the specific gap. Ship in Phase 4b once the gap pattern is clearer.

## Consequences

**Easier:**
- Three games shipped as ~15-line configs (sum of named cells covers Wingspan/7W; auto-generated cells cover Disc Golf).
- Bug fixes in the grid engine apply to all grid games at once.
- Future "end-game calculators" (board-game-scoring helpers) reuse the shape.

**Harder:**
- Two engines live in parallel. The dispatch in `app.js` must stay simple — one switch on `config.shape`. If we ever add a third shape (counter, ledger), generalize the dispatch then, not now.
- The grid engine duplicates ~30% of the rounds engine (player management, settings, status list, confetti hookup). Acceptable cost — premature extraction would force a shared layer before we know what's truly shared.
- Phase 4b games still need work; not a regression but a known gap.

## Cross-references

- The architecture this extends: [`../architecture.md`](../architecture.md).
- Prior engine ADRs: [0003](0003-engine-api.md), [0004](0004-round-entries-and-progress.md), [0005](0005-phase-3a-light-team-and-threshold-end.md).
- The phase plan this reshapes: Phase 4 in [`../../status.yaml`](../../status.yaml).
