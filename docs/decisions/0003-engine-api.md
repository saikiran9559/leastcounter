# 0003 — Engine API: configs over callbacks

**Date:** 2026-06-07
**Status:** Accepted; partially superseded by [0012](0012-formula-callbacks-for-bid-vs-made-games.md) (the "callback-heavy" rejection is narrowed to win-condition flags; per-game score *formulas* now accept an opt-in `computeTotal` callback)

## Context

Phase 1 of `status.yaml` extracts the Least Count code into a reusable engine. The engine API is the contract every future game speaks. Picking the right shape now matters because the contract is hard to change once 10+ games depend on it.

The Least Count code shipped pre-engine had four concerns mixed together: state shape, mutation actions, rendering, and game-specific rules (`limit`, "lowest survives", elimination on reaching limit). The refactor pulls the first three into `engine.js` and asks: how does a game declare the fourth?

Three candidate API shapes:

1. **Pure config object** — game declares facts (`scoring.direction: 'low'`, `endCondition: 'threshold-elim'`). Engine interprets.
2. **Callback-heavy** — game provides `isOut(state, playerId)`, `winner(state)`, `leader(state)` as functions. Engine just calls them.
3. **Class inheritance** — `class UnoGame extends BaseGame`, override methods.

## Decision

**Pure config object.** A game is a JavaScript object literal passed to `Scorely.defineGame(...)` with fields like `id`, `name`, `tagline`, `settings`, and `scoring: { direction, endCondition, thresholdKey }`. No functions, no classes. The engine reads these flags and runs the shared logic accordingly.

The config shape is documented in [`docs/architecture.md`](../architecture.md#gameconfig-shape).

## Alternatives considered

- **Callback-heavy** — rejected. Every game would re-implement `isOut`/`winner`/`leader` with subtle variations, the engine would offer no shared logic for these, and code review of new games becomes "did you implement the helpers correctly" instead of "is the config right". For the cumulative-scoring family the rules are mechanical enough to factor into flags.
- **Class inheritance** — rejected. Adds ceremony (constructor, `super()`, file-per-class) without expressivity gain. Also harder to introspect (`Scorely.games` is plain data, not class instances) which matters for the home screen and any future tooling.
- **Hybrid (config with optional callbacks)** — explicitly deferred. The current four-combination scoring matrix covers Phase 2 and most of Phase 3. If a game can't be expressed by flags alone, the right move is to widen the flag vocabulary, not to add escape hatches. Escape hatches turn into the rule; the matrix stays orderly only if we resist them.

## Consequences

**Easier:**
- Each new game in Phase 2 is ~15 lines of declarative config. See `games/uno.js` for the minimum example.
- Bug fixes in `engine.js` apply to every game automatically.
- The home screen just iterates `Scorely.games` and reads name/tagline — no per-game special cases.
- Listing what each game does is trivial: read its config file.

**Harder:**
- Games whose rules don't fit the current flag set require widening the engine, not patching the game. Phase 10's per-player phase column, Spades' bid-vs-tricks, and Hearts' shoot-the-moon will each require a small engine extension (likely a `roundInputs: [...]` schema, then a `teamLayout` flag, then a per-round modifier).
- The `direction × endCondition` matrix has four combinations and we only use two today. Documented in architecture.md so future contributors know the empty cells are intentional, not gaps.

## Migration follow-ups

- `localStorage` key migrated from `leastcounter:v1` → `scorely:least-count:v1` with a read-fallback (handled in `engine.js`'s `loadState`). This was task 1.5 from `status.yaml`.
- Future state-shape changes bump the version suffix (`:v2`) and add a migrator. Don't change `:v1` in place.

## Cross-references

- The phase that produced this decision: Phase 1 in [`../../status.yaml`](../../status.yaml).
- The architecture this decision shaped: [`../architecture.md`](../architecture.md).
- The engine-first phasing this implements: [`0002-engine-first-before-more-games.md`](0002-engine-first-before-more-games.md).
