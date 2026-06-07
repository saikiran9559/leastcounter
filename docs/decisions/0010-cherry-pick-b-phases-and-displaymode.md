# 0010 — Cherry-pick deferred B-phase games + `displayMode: 'remaining'`

**Date:** 2026-06-07
**Status:** Accepted

## Context

After Phase 7a, the build sequence stood at: 5 phases all split into A (done) and B (deferred), plus Phase 8 (heavy/specialty) ahead. The natural next step would be Phase 8, but two things were true:

1. Phase 8 games (Bridge, Mahjong, Skat, Go, Werewolf, Liar's Dice, President) are *labeled* lowest value-per-effort in `status.yaml` from the start. Each needs bespoke domain code — Bridge contract calculators, Mahjong fan tables, etc.
2. Several deferred B-phase games are *high-demand and small-engine-extension* — Yahtzee (4b) is the canonical dice game; Darts 501 (7b) is one of the most-played pub games on Earth.

Strict phase-by-phase progress would ship 0 high-demand games for the cost of several Phase 8 attempts. The honest move was to break sequence and cherry-pick.

## Decision

Two things:

### 1. Cherry-pick strategy

Continue building Scorely by **demand × engine-fit** rather than strict phase order. Specifically this batch ships:

- **Yahtzee** (Phase 4b) — fits the grid engine directly. Bonuses (+35 upper, +100 per extra Yahtzee) handled as a user-managed "Bonuses" category rather than auto-computed. Honest about what the engine does for you and what it doesn't.
- **Darts 501** (Phase 7b) — fits the rounds engine plus one small new flag (see below). Countdown from 501 to exactly 0; bust turns score 0; final dart must be a double (manual, not enforced).

Both ship in this commit. The other Phase 4b and 7b games — Bowling (frame carry-over), Golf modes (multi-mode formulas), Archery (nested grids), Canasta (itemized hand bonuses), 500 (bid lookup), Belote (declarations), Darts Cricket (matrix), Snooker (nested), Cricket (own domain) — remain deferred with per-game notes.

### 2. `scoring.displayMode: 'remaining'`

The rounds engine gains an optional config flag that flips how totals are *displayed*:

- `displayMode: 'cumulative'` (default) — totals row shows `total` (what every existing game does).
- `displayMode: 'remaining'` — totals row shows `target - total` (the iconic darts countdown: "501", "478", "455", ...).

State is unchanged — `state.rounds` still holds per-turn scores. Only the rendered totals and the status list values are flipped. The underlying scoring logic (`winner` declares when `total >= target`) is untouched.

Winner banner gets a special case: when `displayMode === 'remaining'`, the banner reads `🏆 X hit zero first from 501!` instead of the generic `reached 501 first`.

## Alternatives considered

- **Force-fit Yahtzee bonuses as derived categories** with a `derived: { type: 'threshold-bonus', sumKeys, threshold, bonus }` flag. Rejected for *this* slice — adds vocabulary for one game's quirks. If a second game wants threshold-bonuses, write the ADR then. Until then a manual "Bonuses" category is honest and unambiguous.
- **Build the Tennis (5b) nested counter and ship it here.** Rejected — Tennis is genuinely more work than Yahtzee + Darts 501 combined. Worth its own focused batch when prioritized.
- **Inverse `direction: 'down'` on the counter engine for Darts 501.** Rejected — Darts 501 isn't tap-counter UX; users want to enter per-turn 3-dart sums, which is the rounds engine's shape. The only adjustment needed is *display*, hence the cosmetic `displayMode` flag rather than a structural change.
- **Defer Phase 8 wholesale.** ✅ Accepted as part of this decision — see below.

## Phase 8 wholesale defer

All Phase 8 games (8.1–8.7) are now marked `deferred` with per-game notes. The roadmap rationale ("only ship when a real player asks") still stands; no engine work toward Phase 8 is planned until that demand materializes.

| Task | Game | Why deferred |
|---|---|---|
| 8.1 | Bridge | Contract × vulnerability × slam bonuses; rubber tracking. Own engine. |
| 8.2 | Mahjong | Hand-value (fan/yaku) is its own subdomain; regional variants. Own engine. |
| 8.3 | Skat | Multiplier ladder + failed contracts. Own engine. |
| 8.4 | Go | Territory + captures + komi calculator. Own engine. |
| 8.5 | Werewolf | Not really scoring — day/night state tracker. Different category entirely. |
| 8.6 | Liar's Dice | Elimination tracker (dice remaining), not scoring. |
| 8.7 | President | Finishing-order ladder. Closer to game-show tracker than scorekeeper. |

## Consequences

**Easier:**
- Two high-demand games shipped (Yahtzee, Darts 501) in one batch with minimal engine work.
- The `displayMode: 'remaining'` flag is small (5 lines added to the rounds engine) and immediately reusable for any countdown game (Darts 301, Darts 701, killer pool, etc.).
- Clarifies the build strategy going forward — pick games by demand × fit, not by phase order.

**Harder:**
- Yahtzee's user-managed bonus is a UX wart. Engine-side auto-computation of the upper bonus would be a one-paragraph extension when prioritized.
- Phase numbering now diverges from actual ship order. `current_phase` in `status.yaml` becomes advisory rather than literal; the table of done/deferred per task is the truth.
- The cherry-pick philosophy means some B-phase games may never ship. Acceptable — each was deferred for honest engine reasons, and the deferral notes spell out what would be needed if/when prioritized.

## Cross-references

- Engine API: [ADR 0003](0003-engine-api.md).
- Multi-field rounds: [ADR 0004](0004-round-entries-and-progress.md).
- Grid engine: [ADR 0006](0006-grid-engine.md).
- Multi-field sum: [ADR 0009](0009-sum-all-numeric-round-fields.md).
- Phase plan: [`../../status.yaml`](../../status.yaml).
