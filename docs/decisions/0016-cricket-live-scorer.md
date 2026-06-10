# 0016 — Cricket Live Scorer: Full Ball-by-Ball Engine

**Date:** 2026-06-09
**Status:** Accepted

## Context

The original `games/cricket.js` was a trivial 2-team rounds config (enter final innings total, engine sums). Users can't track individual balls, player stats, shot zones, or bowling analysis — the entire live-scoring domain was explicitly out of scope under ADR 0015 ("user does the math").

A new request: build a **real** ball-by-ball cricket scorer with:
- Individual batter and bowler stats
- Shot type and wagon wheel zone
- Wicket types (caught, bowled, LBW, run-out, stumped, …)
- Over-by-over economy and strike rates
- Match summary and fall of wickets

## Research: What existing scoreboard apps track

**ESPNcricinfo / CricInfo** (reference standard)
- Every ball: runs / wide / no-ball / bye / leg-bye / wicket
- Batter: runs, balls faced, 4s, 6s, strike rate, how dismissed
- Bowler: overs, maidens, runs, wickets, economy, best spell
- Over summary: dot / single / boundary / wicket per ball
- Fall of wickets: score-at-wicket and over-at-wicket
- Wagon wheel: batter's hits mapped to 8 ground zones
- Shot type: drives, cuts, pulls, flicks, sweeps, glances, leaves, defensive
- Running: completed runs, misfield extras, overthrows

**CricHeroes** (amateur league app, closest to Scorely's use case)
- Team rosters setup before toss
- Ball-by-ball entry screen: W / 0 / 1 / 2 / 3 / 4 / 6 / WD / NB / B / LB
- Auto-advances batter on over end or wicket
- Dismissal dialog: type, fielder(s), bowler
- Shot & zone picker (optional)
- Real-time scorecard per team

**Cricclubs / CricbuzzApp**
- Similar to CricHeroes with richer wagons and heat maps

**Key insight from research**: The ball-entry action + dismissal dialog pattern is universal. The wagon wheel and shot type are _optional_ enrichment layers (users often skip them at grassroots level). The dismissal type (how a wicket fell) is _always_ tracked.

## Decision

Build `engine-cricket.js` — an eighth sibling engine, purpose-built for cricket.

### What's in scope for v1

1. **Match setup**: two teams, rosters (names), match type (T20/ODI/Test/custom), overs limit
2. **Toss & batting order**: who bats first
3. **Ball-by-ball entry panel**: W · 0 · 1 · 2 · 3 · 4 · 6 · WD · NB · B · LB · Pen (penalty)
4. **Wicket dialog**: dismissal type (Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket, Ret Hurt, Obstructed) + fielder name(s) + next batter selection
5. **Shot type** (per ball, optional): Drive, Cut, Pull, Hook, Flick, Glance, Sweep, Slog, Defensive, Leave, Other
6. **Wagon wheel zone** (per ball, optional): 8 zones (cover, mid-off, mid-on, mid-wicket, square leg, fine leg, third man, point)
7. **Live scorecard**: batting card + bowling card, current partnership, current over
8. **Fall of wickets**: ordered list of (wicket#, score, batter, over)
9. **Over-by-over analysis**: runs / wickets / dots per over
10. **Innings switch**: auto-prompt when first innings ends; target shown in second innings
11. **Match result**: winner declared when target chased or second innings complete

### What's out of scope (v1)

- DRS / reviews
- Powerplay zone enforcement
- LBW prediction
- Live ball-tracking (hawk-eye)
- Fielding positions diagram (may add as future enhancement — svg field map with zone taps)
- Scorecard PDF export (deferred — complex table layout)

### State shape

```js
{
  settings: {
    matchType: 'T20',     // 'T20' | 'ODI' | 'Test' | 'Custom'
    overs: 20,
    followOn: false,      // Test only
  },
  teams: [
    {
      id: 'team-a',
      name: 'Team A',
      players: [{ id, name }]   // roster
    },
    {
      id: 'team-b',
      name: 'Team B',
      players: [{ id, name }]
    }
  ],
  toss: {
    winner: 'team-a',           // team id
    elected: 'bat'              // 'bat' | 'field'
  },
  innings: [
    {
      id: 'inn-1',
      battingTeam: 'team-a',
      bowlingTeam: 'team-b',
      balls: [
        {
          id: 'b1',
          over: 0,              // 0-indexed over number
          ballInOver: 0,        // 0-indexed position in over (legal balls only don't advance)
          batter: 'player-id',
          bowler: 'player-id',
          runs: 1,              // runs from bat (0 if extra-only)
          extras: { wide: 0, noBall: 0, bye: 0, legBye: 0, penalty: 0 },
          wicket: null | {
            type: 'Caught',     // 'Bowled'|'Caught'|'LBW'|'Run Out'|'Stumped'|'Hit Wicket'|...
            batter: 'pid',
            fielder: 'pid',     // optional
            fielder2: 'pid',    // optional (run-out throw)
            bowlerCredit: true, // bowler gets wicket credit
          },
          shot: null | 'Drive', // optional shot type
          zone: null | 'cover', // optional wagon wheel zone
        }
      ],
      batting: {
        // current batting state
        onStrike: 'pid',
        nonStrike: 'pid',
        nextBatterIdx: 2,       // which roster index comes in next
      },
      bowling: {
        currentBowler: 'pid',
      },
      status: 'active' | 'complete',
      result: null | 'all-out' | 'overs-complete' | 'target-chased' | 'declared',
    }
  ],
  currentInnings: 0,            // index into innings[]
  phase: 'setup' | 'toss' | 'batting' | 'complete',
  winner: null | 'team-a' | 'team-b' | 'draw' | 'tie',
}
```

### Derived stats (computed from balls[])

Never stored in state. Always re-derived:

- Batter: runs, balls, 4s, 6s, SR, dismissal
- Bowler: overs, maidens, runs, wkts, economy
- Partnership: current pair's runs + balls
- Over summary: array of ball symbols (W / · / 1 / 2 / 4 / 6 / wd / nb / b / lb)
- Team total: sum of runs + extras

## Alternatives considered

1. **Keep current trivial config** — can't track any ball or player data; doesn't meet the requirement
2. **Extend rounds engine** — rounds engine is fundamentally per-player per-round. Cricket's ball-by-ball state is too different; it would be a massive hack
3. **Use engine-counter for each team's runs** — loses all individual data; same problem as today
4. **Build inside a game config file** (~1000 lines in a `games/` file) — violates the pattern; engines belong in `engine-*.js`

## Consequences

- **New file:** `engine-cricket.js` (~900 lines)
- **Updated:** `games/cricket.js` → `shape: 'cricket'`; more detailed tagline
- **Updated:** `app.js` dispatch map adds `cricket: Scorely.createCricketInstance`
- **Updated:** `index.html` adds `<script src="engine-cricket.js">` before `app.js`
- **Updated:** `games-rules.js` cricket entry enriched
- **Updated:** `styles.css` cricket-specific UI classes
- **Documented:** this ADR; `docs/games/cricket.md`

### What this makes easy
- Any real cricket match can be scored live
- Stats are automatically accurate — no mental arithmetic at the table
- Shot zones provide match insights after the game

### What this makes harder
- Engine is complex (~900 LOC) — most of the domain lives in derived-stats functions
- localStorage payload grows fast for long matches (Test cricket = ~2700 balls × 5 innings)

### Follow-up work
- Wagon wheel SVG field diagram with interactive zone taps
- PDF scorecard export
- Strikerate / economy sparklines
- Share-as-link (encode state in URL hash)
