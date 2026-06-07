# 0011 — Fifth sibling engine: engine-tennis.js

**Date:** 2026-06-07
**Status:** Accepted

## Context

Tennis (Phase 5.3) was deferred from Phase 5a because it doesn't fit the flat counter engine — Tennis has nested scoring:

- **Points** per game: 0 → 15 → 30 → 40 → game won (with deuce/advantage)
- **Games** per set: first to 6 with margin ≥ 2 wins the set
- **Sets** per match: best of N (default 3 = first to 2 sets)

You can't model this as `score >= target` with a flat counter — the state has three levels of state, and each level resets the level below on completion.

This is also the highest-demand deferred game (tennis is the most-played individual sport globally), so it earned its own engine.

## Decision

Add `engine-tennis.js` as the **fifth sibling**. State shape:

```js
{
  settings: { setsToWin: 2, gamesToWinSet: 6 },
  players: [{id, name}, {id, name}],   // exactly 2
  match: {
    completedSets: [{ games: [a, b], winnerId }],
    games:  [0, 0],   // games won in current set, by player index
    points: [0, 0],   // points in current game (raw count: 0, 1, 2, 3, 4, ...)
  }
}
```

UI: per-player card with Sets / Games / Point columns and a big `+ POINT` button. A `DEUCE` banner above the cards when both points are tied at ≥3.

Logic on each `+POINT`:
1. Increment that player's points.
2. If game won (≥4 points with margin ≥2) → bump their games, reset points.
3. If set won (≥6 games with margin ≥2) → push to `completedSets`, reset games.
4. If match won (sets ≥ `setsToWin`) → declare winner, disable buttons, fire confetti.

The dispatch map in `app.js` gains a `tennis` entry (5th shape).

## Alternatives considered

- **Generalize a "nested counter" engine** for Tennis + future games like Backgammon (5b) or a chess-tournament shape. Rejected for now — speculative generalization with one consumer. Revisit if a second nested-counter game ships.
- **Special-case Tennis inside the counter engine** with `nested: true`. Rejected — pulls Tennis-specific deuce/advantage/set/match logic into the otherwise-clean counter engine.
- **Skip Tennis entirely.** Rejected — high demand, the deferral note has been outstanding for several phases. Cherry-pick philosophy ([ADR 0010](0010-cherry-pick-b-phases-and-displaymode.md)) says ship by demand.
- **Implement full tiebreak rules at 6-6.** Deferred — the tiebreak adds 50+ lines of state-machine code (tiebreak-points encoding, serve alternation every-other-pair) and the user can interpret an "advantage set" (first to win by 2 games) as a tiebreak conceptually. Note the limitation in the game's tagline.
- **Track service/receiver and alternate by game.** Deferred — useful UX polish but not required for correct scoring.

## Scope limitations (intentional)

- **No tiebreak at 6-6.** Advantage set instead (first to win by 2). Documented in the tagline.
- **No service indicator.** Players track service themselves; the engine doesn't care.
- **Exactly 2 players** enforced (`addPlayer` rejects a third).
- **No undo.** A misclicked +POINT is corrected by Reset Match. Could add undo later.

These are flagged as a "v1 Tennis" — a v2 would add tiebreak + service indication + undo. Each is one small ADR away.

## Consequences

**Easier:**
- Tennis ships as a real, faithful scoreboard with deuce/advantage/set/match nesting.
- Big +POINT buttons give the right pub-game feel.
- Confetti fires when the match is won.

**Harder:**
- Five engines now live in parallel. The dispatch map is still readable (5 entries) but if a 6th shape comes, consider extracting a `EngineRegistry` interface.
- Tennis state shape is distinct from the other engines — `state.match` instead of `state.scores` or `state.rounds`. PDF export doesn't currently render Tennis matches; the engine omits the Download PDF button on the Tennis screen. Could be added later.
- Tiebreak omission means a real Tennis match could theoretically take 16-14 to decide a set, which is correct under "advantage set" rules but not what most TV viewers expect. The tagline calls this out; if it bites a user, ship the tiebreak.

## Cross-references

- Engine API: [ADR 0003](0003-engine-api.md).
- Sibling-engine pattern precedents: [0006](0006-grid-engine.md), [0007](0007-counter-engine.md), [0008](0008-ledger-engine-and-dispatch.md).
- Cherry-pick philosophy: [ADR 0010](0010-cherry-pick-b-phases-and-displaymode.md).
- Phase plan: 5.3 in [`../../status.yaml`](../../status.yaml).
