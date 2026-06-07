# 0014 — Seventh sibling engine: engine-darts-cricket.js

**Date:** 2026-06-07
**Status:** Accepted

## Context

Darts Cricket has a structurally distinct shape: a 2D matrix of `players × {15, 16, 17, 18, 19, 20, Bull}`, where each cell holds 0–3 marks ("closed" at 3). Winning is "first player to close all 7" — a race, not a score sum.

This doesn't fit any of the six existing engines cleanly:
- **Rounds engine** would treat each dart-throw as a round with sparse columns; the matrix view is what matters.
- **Grid engine** assumes fill-all-cells-then-pick-by-direction; Cricket is race-based (first to close all 7).
- **Counter engine** is one number per player, not 7.
- **Ledger / Tennis / Bowling** all have different scoring fundamentals.

## Decision

Add `engine-darts-cricket.js` as the seventh sibling. The dispatch map gains a `darts-cricket` entry.

State shape:

```js
{
  players: [{id, name}],
  marks: { [playerId]: { '15': 0, '16': 0, ..., '20': 0, 'bull': 0 } }
}
```

UI: a grid (player rows × number columns + 1 label column). Each cell is a button:
- 0 marks: empty
- 1 mark: `/`
- 2 marks: `X`
- 3 marks: `⊗` (closed; cell highlighted green)

Tap to add a mark; right-click / long-press to remove. Cells lock when a winner is declared.

Win: first player whose marks are all `≥ 3` across `{15, 16, 17, 18, 19, 20, Bull}`.

## Scope limits (intentional, v1)

- **No points mode.** Standard Cricket gives accumulating points for hits on numbers the *hitter* has closed but the *opponent* hasn't. That's a real implementation but it doubles the state shape (`marks` + `points` per number per player) and the rules around when points stop accruing are variant-dependent. v1 ships the closing race; points-mode follows when someone asks.
- **No darts-per-turn limit.** Tap freely; a real game has 3 darts per turn, but the engine doesn't enforce.
- **No turn indicator.** Players self-organize at the board.

## Alternatives considered

- **Shoehorn into grid engine.** Rejected — grid expects fill-all-cells-then-pick, Cricket is a race.
- **Hardcode points mode in v1.** Rejected — adds 2× state and 3× rule complexity. Ship the closing race first; points becomes a flag if someone wants it.
- **Track marks as 0–3 rounds in the rounds engine.** Rejected — the matrix display is the user-facing artifact, not a row of rounds.

## Consequences

**Easier:**
- Darts Cricket ships with the iconic /-X-⊗ notation and the matrix that matches a physical scoresheet.
- Right-click / long-press undo handles miscounted marks without an explicit undo button.

**Harder:**
- Seven engines in parallel. The dispatch map entry is one line; the engine file is its own ~250 lines.
- Points-mode is a real omission. If someone wants Cricket-points, that's a future extension (one flag + a points lookup per number per player per hit).
- No undo button (right-click is platform-dependent on touch — long-press should work on iOS/Android but isn't tested).

## Cross-references

- Sibling-engine precedents: [0006](0006-grid-engine.md), [0007](0007-counter-engine.md), [0008](0008-ledger-engine-and-dispatch.md), [0011](0011-tennis-engine.md), [0013](0013-bowling-engine.md).
- Phase plan: 7.7 in [`../../status.yaml`](../../status.yaml).
