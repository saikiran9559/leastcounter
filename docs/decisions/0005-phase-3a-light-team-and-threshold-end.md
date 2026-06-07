# 0005 — Phase 3a: light "team" support and `threshold-end`

**Date:** 2026-06-07
**Status:** Accepted

## Context

Phase 3 in [`status.yaml`](../../status.yaml) bundles 8 partnership and trick-taking games (Spades, Hearts, 28/29/56, Court Piece, Mendikot, Euchre, Pitch, Whist). Looking at them honestly, they split into three groups:

1. **Hearts** — 4 individuals, no teams; just needs a new endCondition because the game ends as soon as *anyone* crosses 100 and the lowest cumulative wins (not "last one standing").
2. **Mendikot, Court Piece** — 2 teams that record one number per team per round (hands won). No per-round formula; standard target-reach scoring.
3. **Spades, 28/29/56, Euchre, Pitch, Whist** — partnership games whose per-round score is *computed* from per-round inputs (bid + made → score-via-formula, or named bonuses like high/low/jack/game). Whist rubber further needs nested counters (5 points = a game, 2 games = a rubber).

A faithful "2 teams of 2 with named players inside each" engine would help group 3 but doesn't pay off for groups 1 or 2. And group 3 needs *score formulas* anyway, which is a much bigger engine extension.

## Decision

Split Phase 3 into **3a (this batch)** and **3b (later)**:

- **3a**: ship groups 1 and 2 with two small engine additions:
  - `config.playerNoun` — relabel UI strings ("Players" → "Teams", "Add player" → "Add team", etc.). Default: "Player". A "team game" in 3a is just a game whose `players` array holds team objects, not partnership memberships.
  - `config.defaultPlayers: [...]` — pre-fill names on a fresh instance. Mendikot and Court Piece use `["Team 1", "Team 2"]` so the user doesn't have to type them.
  - `scoring.endCondition: "threshold-end"` — game ends when any player crosses threshold; winner = best of *all* players by `direction` (not the last one standing).
- **3b**: deferred until a future phase. The shape they need (per-round scoring *formulas*, partnership membership, nested counters) is bigger than what Phase 3 was scoped for. Each Phase 3b game has a note in `status.yaml` explaining what's still missing.

## Alternatives considered

- **Full team-layout engine refactor (state.teams + per-team players)** — rejected for Phase 3a. The five 3b games still wouldn't ship without score formulas; the membership detail (which players sit on which team) doesn't change scoring; and we'd be paying refactor cost for a feature only partly used. Revisit when 3b lands or when an actual user wants per-team player rosters.
- **Special-case each 3b game** — rejected. Would create five bespoke implementations bypassing the engine, exactly the pattern [ADR 0003](0003-engine-api.md) and [ADR 0004](0004-round-entries-and-progress.md) reject.
- **Model Hearts with the existing `threshold-elim`** — rejected. With `threshold-elim` the game continues until one player remains; Hearts ends as soon as anyone hits 100. Functional-but-wrong scoring would mislead users.

## Consequences

**Easier:**
- Three games shipped: Hearts, Mendikot, Court Piece (~15-line configs each).
- The `threshold-end` endCondition is reusable — any "race to losing threshold, lowest cumulative wins" game can adopt it.
- `playerNoun`/`defaultPlayers` are reusable for any game where the natural unit is "team", "side", "house", etc. — including game-show-style trackers.

**Harder:**
- Phase 3b's score-formula engine extension is a real piece of work. Likely shape: `config.computeRoundScore(entries, settings) → { [playerId]: number }`. That reintroduces a callback (which [ADR 0003](0003-engine-api.md) discourages) — when we get to 3b, weigh the cost of adding the callback against widening the config matrix with score-formula primitives (`bidVsMade`, `namedBonuses`, etc.). Don't write that ADR yet — decide when 3b's first game forces the call.
- `playerNoun: "Team"` games don't track individual player names; only team names. Acceptable for scoring; if a future feature wants "MVP per game", the engine will need real teams.

## Cross-references

- The engine API this extends: [ADR 0003](0003-engine-api.md), [ADR 0004](0004-round-entries-and-progress.md).
- The phase plan this reshapes: Phase 3 in [`../../status.yaml`](../../status.yaml).
