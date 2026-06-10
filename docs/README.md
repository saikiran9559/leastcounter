# docs/

Documentation for Scorely — design decisions, architecture notes, game-specific rules, and conventions.

Contributors (human or Claude) should treat this folder as the project's long-term memory. If you discover a decision, constraint, or gotcha that isn't captured here, **add it** in the same change as your code. See the [`documentation`](../.claude/rules/documentation.md) rule for the full policy.

The phased implementation plan lives at [`../status.yaml`](../status.yaml) at the repo root (it changes too often to belong in this stable-reference folder).

## Layout

| Path | Purpose |
|---|---|
| [`architecture.md`](architecture.md) | High-level structure, 7 engines, GameConfig shape, routes, Scorely.* helpers |
| [`games.md`](games.md) | Catalog of every game with family + complexity + UI pattern |
| [`conventions.md`](conventions.md) | Palette, typography, motion, PWA, storage keys, code conventions |
| [`hosting.md`](hosting.md) | Cost model — what makes Scorely free and where that would end |
| [`decisions/`](decisions/) | Architectural decision records (ADRs), numbered |
| [`games/cricket.md`](games/cricket.md) | Cricket scoreboard design notes |
| [`games/kabaddi.md`](games/kabaddi.md) | Kabaddi rules, scoring shape, counter-engine mapping |
| `gotchas.md` | Browser quirks, CDN behaviors, deploy traps (when warranted — none today) |

Files marked "(when warranted)" don't exist until there's something worth saying. Don't create empty placeholders.

## Currently-recorded decisions

- [`0001-vanilla-no-build-step.md`](decisions/0001-vanilla-no-build-step.md) — use plain HTML/CSS/JS, no bundler or framework
- [`0002-engine-first-before-more-games.md`](decisions/0002-engine-first-before-more-games.md) — extract a reusable scoring engine before adding the second game
- [`0003-engine-api.md`](decisions/0003-engine-api.md) — engine API is config-driven, not callbacks or classes
- [`0004-round-entries-and-progress.md`](decisions/0004-round-entries-and-progress.md) — multi-field per-round inputs + `progress-reach` endCondition (Phase 10)
- [`0005-phase-3a-light-team-and-threshold-end.md`](decisions/0005-phase-3a-light-team-and-threshold-end.md) — Phase 3a engine additions (playerNoun, defaultPlayers, threshold-end) and rationale for splitting partnership games into 3b
- [`0006-grid-engine.md`](decisions/0006-grid-engine.md) — sibling engine-grid.js for category-grid games (Wingspan, 7 Wonders, Disc Golf), and the Phase 4a/4b split
- [`0007-counter-engine.md`](decisions/0007-counter-engine.md) — third sibling engine-counter.js for big-button counter games (Table Tennis, Catan, Pool, ...), Phase 5a/5b split
- [`0008-ledger-engine-and-dispatch.md`](decisions/0008-ledger-engine-and-dispatch.md) — fourth sibling engine-ledger.js (Poker, Teen Patti) + generalize app.js dispatch into a shape→factory map
- [`0009-sum-all-numeric-round-fields.md`](decisions/0009-sum-all-numeric-round-fields.md) — engine sums *all* numeric round-input fields, not just `score` (unlocks Cribbage peg+show, Pinochle meld+tricks)
- [`0010-cherry-pick-b-phases-and-displaymode.md`](decisions/0010-cherry-pick-b-phases-and-displaymode.md) — break strict phase order to ship Yahtzee + Darts 501; add `scoring.displayMode: 'remaining'`; defer Phase 8 wholesale
- [`0011-tennis-engine.md`](decisions/0011-tennis-engine.md) — fifth sibling engine-tennis.js for nested points/games/sets/match scoring; scope limits (no tiebreak, no service indicator)
- [`0012-formula-callbacks-for-bid-vs-made-games.md`](decisions/0012-formula-callbacks-for-bid-vs-made-games.md) — partially supersedes 0003: per-game `computeTotal` callback for formula games (Spades, future Euchre/Pitch/500/Bridge)
- [`0013-bowling-engine.md`](decisions/0013-bowling-engine.md) — sixth sibling engine-bowling.js for 10-frame strike/spare carry-over scoring
- [`0014-darts-cricket-engine.md`](decisions/0014-darts-cricket-engine.md) — seventh sibling engine-darts-cricket.js for the closing-marks matrix shape
- [`0015-user-does-the-math-for-domain-heavy-games.md`](decisions/0015-user-does-the-math-for-domain-heavy-games.md) — Chess/Skat/Cricket/Bridge/Mahjong ship as simple rounds configs (user computes per-hand formula); Werewolf explicitly out of scope
- [`0016-cricket-live-scorer.md`](decisions/0016-cricket-live-scorer.md) — eighth sibling engine-cricket.js for ball-by-ball cricket scoring; full state shape, derived-stats contract, v1 scope limits
