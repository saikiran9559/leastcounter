# 0002 — Extract a reusable engine before adding the second game

**Date:** 2026-06-07
**Status:** Accepted

## Context

After Least Count shipped, the catalog in `docs/games.md` identified ~50 candidate games. Roughly 60% of them share one of seven UI patterns; the first two patterns (cumulative-with-threshold and cumulative-with-target) are exactly what `app.js` already does.

Two paths forward:

1. **Add the second game first, extract the engine when patterns emerge.** Copy `app.js` to `uno.js`, tweak win condition, ship. Refactor "later".
2. **Extract the engine first, ship games as configs.** Define a small game-agnostic API in Phase 1 of `status.yaml`; every game from Phase 2 onward is a thin config.

## Decision

**Engine first.** Phase 1 of `status.yaml` is dedicated to extracting the engine; no new games ship until Phase 1 completes.

## Alternatives considered

- **"Add UNO first, refactor later."** Rejected. In single-developer side projects "later" usually means never, and the second game's bespoke code becomes a template for the third and fourth. By the time the refactor looks worthwhile, three games' worth of divergence have to be reconciled.
- **Skip the engine entirely — accept N copies of `app.js`.** Rejected. Bug fixes (e.g., the total-flash animation, PDF export) would have to be re-applied per game. localStorage keys, router, home screen all become per-game one-offs.
- **Engine first, but design it from one game's experience.** This is what we *are* doing — Least Count is the proof-of-concept consumer that validates the engine before any second game uses it.

## Consequences

**Easier:**
- Phase 2 (8 games) ships fast once the engine lands — each game is a config, not a rewrite.
- Bug fixes and UX improvements (animations, PDF export, persistence) live in one place.
- The hash router and home screen are designed once, not retrofitted.

**Harder:**
- Phase 1 has no visible user-facing output, which can feel slow. Mitigate by keeping Phase 1 small and shipping the Least Count refactor + one new game (UNO) as a single "engine works" milestone.
- The engine's API will be wrong on the first try. We accept that and reshape it during Phase 2 as more games stress it. This is what ADR follow-ups are for — write an `0003` if the engine API gets substantially redesigned.

## Cross-references

- The phase structure that encodes this decision: [`../../status.yaml`](../../status.yaml).
- The pattern taxonomy that the engine is designed against: [`../games.md`](../games.md), bottom section.
