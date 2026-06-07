# 0012 — Per-game `computeTotal` callback for formula-driven games

**Date:** 2026-06-07
**Status:** Accepted; partially supersedes [0003](0003-engine-api.md)

## Context

[ADR 0003](0003-engine-api.md) committed to a config-driven engine API, explicitly rejecting "callback-heavy" and "class-inheritance" alternatives:

> If a game can't be expressed by flags alone, the right move is to widen the flag vocabulary, not to add escape hatches.

We followed this through Phases 2–7: every new requirement (target-reach, threshold-end, progress-reach, multi-field rounds, displayMode) became a new declarative flag. That worked.

It stops working at the partnership / bid-vs-made tier of card games. Each has an idiosyncratic per-round score formula with no useful shared structure:

| Game | Formula |
|---|---|
| Spades | `made → +10×bid + bags; set → −10×bid; 10 bags accumulated → −100` |
| Euchre | `march (5/5) → 2; loner march → 4; 3-4 of 5 → 1; opponents take → 2 against` |
| Pitch | bid + named bonuses (high/low/jack/game) won that hand, each ±1 |
| 500 | bid-value lookup table (e.g. 6 spades = 40, 7 hearts = 160) |
| Bridge | contract level × suit × doubled/redoubled × vulnerability + slam bonuses |

A "spadesMode", "euchreMode", "pitchMode", "500Mode" flag zoo would be callbacks-in-disguise — same structural cost, less direct. The honest move is to accept callbacks where the formula genuinely is the game.

## Decision

The rounds engine gains two optional callbacks on game configs:

1. **`config.computeTotal(state, playerId, config) → number`** — replaces the default "sum all numeric round-input fields" total. Game does the full computation, including cumulative effects (bag overflow, etc.).
2. **`config.formatRoundCell(entry) → string`** — replaces the default per-round table cell display. Useful when the raw bid/tricks pair (`"3/4"`) is more informative than their sum.

Both default to the existing field-sum behavior when omitted. **All 27 prior games continue to work unchanged** — none declare these callbacks.

Spades is the first consumer. Future Euchre/Pitch/500/Bridge would each ship as similar configs.

## Walks back what, exactly?

ADR 0003 rejected callbacks for the general case. This ADR scopes that rejection to "scoring direction + win condition" — flags suffice there. Per-round score formulas are a different problem, and they earn an escape hatch.

What still stands from ADR 0003:
- `scoring.direction`, `scoring.endCondition`, `scoring.thresholdKey` remain flags.
- The engine doesn't gain a `class GameBase` hierarchy or a callback for every concern.
- Most games remain pure data, no callbacks. The escape hatch is for the ~5 games whose scoring genuinely is a formula.

## Alternatives considered

- **Declarative formula primitives** — `scoreFormula: { type: 'bid-vs-made', bidMultiplier: 10, bagPenaltyAt: 10, ... }`. Considered for Spades. Rejected because Euchre's march/loner doesn't fit the same primitives, Pitch's named bonuses don't fit, and the resulting "rule engine" would be a slow reinvention of JavaScript. One callback per game is more honest.
- **Sixth sibling engine `engine-trick.js`** specifically for trick-taking-with-formula games. Rejected — would copy ~80% of `engine.js`'s render+state machinery and only differ in the score function. The rounds engine + callbacks is the right factoring.
- **Compute per-round score, sum elsewhere** — `config.computeRoundScore(entry, history) → number` with engine summing. Considered, but Spades' bag carryover doesn't fit cleanly into per-round-pure scoring (a round's score depends on accumulated bags). Whole-state `computeTotal` is simpler and more honest.

## Consequences

**Easier:**
- Spades ships with its real scoring rules (bid×10 + bags + 10-bag penalty + set penalty).
- Future Euchre, Pitch, 500, Bridge each become one config file with a focused `computeTotal`.
- The escape hatch is explicit — readers of `engine.js` see "if config.computeTotal is defined, defer to it" and know where to look.

**Harder:**
- Game configs that opt into `computeTotal` are no longer pure data. They contain code, and that code can have bugs the engine can't catch. Mitigate by keeping these callbacks small and well-tested by manual play.
- A future generalization toward declarative formulas remains possible, but with at most a handful of games using callbacks, the pressure is low.
- Loosens the ADR 0003 contract — explicit so future Claude sessions don't try to "fix" the callbacks back into flags.

## Cross-references

- ADR being partially superseded: [0003](0003-engine-api.md).
- Multi-field rounds (uses these for input UX but not for scoring formula): [0004](0004-round-entries-and-progress.md).
- Sum-all-fields default (still the default when computeTotal is absent): [0009](0009-sum-all-numeric-round-fields.md).
- Phase plan: 3.2 in [`../../status.yaml`](../../status.yaml).
