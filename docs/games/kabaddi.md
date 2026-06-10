# Kabaddi scoring

**Status:** Rules documented — candidate for engine-counter implementation

## Overview

Kabaddi is a contact team sport popular across South Asia (India, Bangladesh, Pakistan, Nepal) and increasingly played internationally. Two teams of 7 players face off on a rectangular court divided by a mid-line. The game is built around two alternating actions: **raids** and **tackles**.

Scorely's Kabaddi scoreboard tracks **match-level points** using the counter engine — each successful raid or tackle earns 1 point, bonus points are added per the rules below, and the team with the highest score at the final whistle wins.

## Rules summary

### Objective
Score more points than the opponent across two halves of play.

### Setup
- **Teams:** 2 teams of 7 active players + substitutes (up to 5 in Pro Kabaddi rules).
- **Court:** 13 m × 10 m (men) / 12 m × 8 m (women), divided by a mid-line and bounded by a baulk line and bonus line on each half.
- **Duration:** 2 halves of 20 minutes each (Pro Kabaddi); shorter in school/amateur variants.
- **Coin toss** decides which team raids first.

### Raiding
- One player (the **raider**) crosses the mid-line into the opponent's half while continuously chanting "kabaddi kabaddi…" on a single breath.
- The raider attempts to **touch** one or more defenders and return to their own half before taking another breath.
- **Raid point:** +1 point for every defender tagged who is then declared out.
- **Empty raid:** A raider who crosses the baulk line but fails to touch any defender and returns safely — no point scored. A second consecutive empty raid is a violation (see penalties).
- **Out-of-bounds / caught:** If the raider is tackled and held, or steps out without tagging anyone, the raider is declared **out** and the defending team scores +1.

### Tackling
- Defenders try to **stop** the raider from returning to their half.
- **Tackle point:** +1 for the defending team when the raider is successfully held and unable to return before running out of breath.
- **Super tackle:** A tackle completed with only 3 or fewer defenders on court → +2 points (Pro Kabaddi rule).

### Bonus line
- If the raider crosses the **bonus line** with at least 6 defenders on court, they earn **+1 bonus point** even if they don't touch anyone — but must still return safely.
- The bonus point and a touch-point can both be scored in the same raid.

### Outs and revivals
- A player sent **out** sits off-court.
- For each point scored by a team, **one of their out-players is revived** (returns to court), in the order they were sent out.
- **All-out:** If all 7 players on one team are sent out simultaneously → the opposing team scores **+2 bonus points** (all-out bonus) and all 7 revive.

### Do-or-die raid
- If a team has had **2 consecutive empty raids**, the third raid is declared a **do-or-die raid**.
- The raider must cross the baulk line and touch at least one defender, or be declared out automatically.

### Score entry in Scorely
Scorely uses a **manual counter** — tap +1 per point earned in real time. Bulk-add on a completed action or at the end of each half. The app does not enforce raid/tackle turn logic or breath duration; it is the scoreboard, not the referee.

### Winning
- Highest total score at the end of both halves wins.
- **Tie-breaker:** In tournament play a Golden Raid (sudden-death extra raid) or a full extra period is played — per tournament rules. Scorely tracks the same counter into extra time; the referee signals end.

## Engine mapping

**Shape:** `counter` (`engine-counter.js`)

- Two teams, tap +1 per point.
- `winBy: 1` (no margin requirement; highest at time-up wins).
- `scoring.direction: "high"`.
- `playerNoun: "Team"`, `defaultPlayers: ["Team A", "Team B"]`.
- `scoreNoun: "pts"`.
- No auto-computed bonuses (all-out +2, super tackle +2, bonus line +1) — the scorer taps the correct number of times; the engine just accumulates.

## Game config (reference)

```js
Scorely.defineGame({
  id: "kabaddi",
  name: "Kabaddi",
  icon: "🤼",
  accent: "linear-gradient(135deg, #ff5d83 0%, #ffcc4a 100%)",
  tagline:
    "Raid, tag, and return. +1 per defender tagged or raider caught. All-out = +2 bonus. Highest score after two halves wins.",
  shape: "counter",
  scoring: { direction: "high" },
  winBy: 1,
  scoreNoun: "pts",
  playerNoun: "Team",
  defaultPlayers: ["Team A", "Team B"],
  settings: {
    halves: { label: "Half duration (min)", type: "number", default: 20, min: 5 },
  },
});
```

## Rules bullets (for in-app popover)

These map directly to the `S.rules["kabaddi"]` entry in `games-rules.js`:

1. 2 teams of 7. Raider crosses to the opponent's half, chanting "kabaddi", tags defenders, and returns — all on one breath.
2. +1 per defender tagged by the raider. Raider caught before returning → defending team scores +1.
3. Bonus line crossed with 6+ defenders on court → raider earns +1 bonus point (even with no tag).
4. Super tackle (≤ 3 defenders) → +2 for defenders instead of +1.
5. All-out (all 7 opponents sent off) → +2 bonus; all 7 revive. Each point scored revives one of your out-players.
6. Highest score after two halves wins.

## Storage key

`scorely:kabaddi:v1`

## Scope & limitations

**Tracked by Scorely:**
- Running point total per team
- Match winner

**Not tracked (out of scope):**
- Individual raider / defender statistics
- Raid-by-raid log (who raided, who was tagged, outcome)
- Breath-duration timing (this is the referee's job)
- Auto-detection of do-or-die raids (no sequential empty-raid counter)
- Super-tackle auto-detection (scorer manually taps +2)
- Substitution tracking

## Variants covered by same config

| Variant | Difference | Scorely handling |
|---|---|---|
| Pro Kabaddi League | 20-min halves, super tackle, bonus line | Full rule set documented above |
| Circle Kabaddi (Punjabi) | Circular court, no boundary, 5 players | Same counter; different physical rules |
| Beach Kabaddi | Sand court, smaller team | Same counter |
| Amateur / school | Shorter halves, simplified rules | Adjust half duration in settings |

## See also

- **Engine:** `engine-counter.js` — same engine as Table Tennis, Volleyball, Catan.
- **Games catalog:** `docs/games.md` — add Kabaddi under "Sports & physical games".
- **ADR 0007:** Rationale for the counter engine shape.
