# 0013 — Sixth sibling engine: engine-bowling.js

**Date:** 2026-06-07
**Status:** Accepted

## Context

Bowling (Phase 4.3) has three structural traits no existing engine handles cleanly:

1. **10 fixed "frames" per player**, but each frame has *variable arity*: 1 throw if strike, 2 throws if open or spare, up to 3 throws in the 10th frame.
2. **Strike/spare carry-over** — frame N's display score depends on the next 1–2 throws (which live in frame N+1 or even N+2). Cells aren't independent.
3. **Standard X/`/`/`−` notation** for strikes, spares, and zeros — not generic numeric display.

The grid engine assumes one input per category and a sum-of-categories total. Bowling violates both. Modeling Bowling as a rounds engine with 10 rounds also fails because of the inter-cell dependency.

This is the same structural argument that produced the Tennis engine ([ADR 0011](0011-tennis-engine.md)) — sport-specific shapes warrant sport-specific engines when no class generalization is in sight.

## Decision

Add `engine-bowling.js` as the **sixth sibling**. The dispatch map in `app.js` gains a `bowling` entry.

State shape:

```js
{
  settings: {},
  players: [{ id, name }],
  frames: {
    [playerId]: [
      { throws: [10] },              // strike
      { throws: [7, 2] },             // open
      { throws: [5, 5] },             // spare
      ...
      { throws: [10, 10, 10] },       // 10th frame triple
    ]
  }
}
```

UI per player:
- Header with name + running total.
- Strip of 10 frames; each shows the throws in standard notation and the cumulative score under that frame. The 10th frame gets a 3rd slot.
- Pin pad: 11 buttons (0–10), disabled for impossible values (e.g. can't throw 7 then 8 in one frame). 10 displayed as `X`.
- Undo last throw.

Engine handles frame transitions automatically — user just taps pins. Strike closes the current frame; the 10th frame's bonus throws are awarded on strike or spare.

Scoring logic walks the player's frames once per total computation:
- Strike: `10 + next 2 throws`
- Spare: `10 + next 1 throw`
- Open: `t1 + t2`
- 10th frame: just sum the throws (bonus throws are already in the array)

If a strike/spare's required next throws aren't recorded yet, that frame's running cumulative is left blank (the standard "?" behavior on a physical scoresheet).

## Alternatives considered

- **Extend the grid engine with per-cell composite inputs + a per-cell display callback.** Rejected — would graft Bowling-specific concepts (strike-spare-carry-over, 10th-frame extras) onto an engine whose other consumers (Wingspan, 7 Wonders) have a simple sum-of-cells model. The grid engine stays focused; Bowling stays focused.
- **Rounds engine with 10 rounds + custom `computeTotal`.** The total would be computable from a flat throw list, but the *per-frame running cumulative* display (which is what users actually look at) needs the engine to walk frames with strike-spare semantics — exactly what an engine-bowling.js does, just disguised as a rounds-engine callback.
- **Compose 10 small Tennis-like nested state machines.** Hilarious.
- **Skip Bowling.** Was the prior position. Reversed because Bowling is the most-recognized sport-game remaining and the engine cost (one focused file) is bounded.

## Scope limitations (intentional)

- **No "lane" or "ball" tracking.** Just throws and pins.
- **No challenges / unsubmit per frame** — undo undoes the last *throw*, frame-level edits chain through it.
- **Pin pad is the only input mechanism.** No keyboard shortcut for X / `/` yet. The strike button (10) and pin counts cover all cases.
- **No PDF export** — like Tennis, Bowling skips PDF for now. Could add by walking frames into a per-player table.

## Consequences

**Easier:**
- Bowling ships with faithful X/`/`/`−` notation and accurate cumulative scoring including strike-carry across 1–2 future frames.
- Big-button pin pad is mobile-first; works on phones at the lane.
- Disabled-button logic prevents impossible throws (e.g. throwing 7 then 8).

**Harder:**
- Six engines in parallel now. The dispatch is still a simple six-entry map but if a seventh game-specific engine arrives, extract `EngineRegistry`.
- Adding PDF export to Bowling means walking frames into a per-player row — code that doesn't exist yet. Out of scope for this batch.
- `state.frames` per player is denser than other engines' state. Saved games are larger than other shapes, but still well under any localStorage cap.

## Cross-references

- Sibling-engine precedents: [0006](0006-grid-engine.md), [0007](0007-counter-engine.md), [0008](0008-ledger-engine-and-dispatch.md), [0011](0011-tennis-engine.md).
- Cherry-pick philosophy: [ADR 0010](0010-cherry-pick-b-phases-and-displaymode.md).
- Phase plan: 4.3 in [`../../status.yaml`](../../status.yaml).
