# Cricket scoring

**Status:** Shipped as Phase 7.10 (Match-runs scoreboard only)

## Overview

Scorely's Cricket scoreboard is designed for **match-level run tracking** only — perfect for limited-overs cricket (ODIs, T20s) or Test matches where you want to track cumulative team runs across innings.

It is **deliberately out of scope** for:
- Ball-by-ball tracking (individual runs, boundaries, dots, wides, no-balls)
- Wicket tracking (batsmen in/out, dismissal modes, partnerships)
- Overs and run-rate (can't compute without ball-level data)
- Bowling figures (wickets, runs, economy)
- Detailed batting statistics

## Shape

**Two teams** competing across multiple **innings**. Per innings, each team enters their **total runs scored**.

The higher cumulative run total across innings wins.

## Game config

```js
{
  id: "cricket",
  name: "Cricket (Match)",
  icon: "🏏",
  accent: "linear-gradient(135deg, #4ade80 0%, #ffcc4a 100%)",
  tagline:
    "Limited-overs or Test match. Per innings, enter the team's total runs. Highest aggregate wins. Wickets, overs, batter/bowler figures, run-rate — all out of scope for the scoreboard; track on a separate scorecard.",
  scoring: { direction: "high" },
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Innings", addRound: "Add innings", total: "Total runs" },
}
```

### Key decisions
- **`playerNoun: "Team"`** — relabels the UI from "Players" to "Teams" throughout (settings header, player list, status list).
- **`defaultPlayers`** — pre-seeds two generic team names so a new match starts with Team 1 vs Team 2.
- **`labels.round: "Innings"`** — changes the round column header from "Round" to "Innings" to match cricket terminology.
- **`scoring.direction: "high"`** — a team winning more runs wins the match (highest total wins, per ADR 0008).

## Storage

Match state persists to `scorely:cricket:v1`:

```js
{
  settings: {},  // no per-match configuration (win/loss threshold not relevant)
  players: [
    { id: "abc123", name: "Team 1" },
    { id: "def456", name: "Team 2" },
  ],
  rounds: [
    { id: "r1", entries: { abc123: { score: 234 }, def456: { score: 198 } } },  // Innings 1
    { id: "r2", entries: { abc123: { score: 220 }, def456: { score: 215 } } },  // Innings 2
  ],
}
```

## Usage example

**Scenario:** Tracking an ODI (one-day international match)

1. **Home screen** → Click "Cricket (Match)" → Land on scoreboard
2. **Setup** → Teams pre-filled as "Team 1" and "Team 2"; rename to "India" and "Pakistan" (or team names of choice)
3. **First innings:**
   - India bats, scores 287 runs
   - Enter 287 in India's cell, leave Pakistan's blank
   - Click "Save Innings" → Row appears in the scoreboard
4. **Second innings:**
   - Pakistan bats, scores 265 runs
   - Enter 265 in Pakistan's cell
   - Click "Save Innings"
5. **Winner banner** → "🏆 India wins with 507 runs!" (287 + 220 if India batted twice, or 287 if Pakistan only bats once)

## Variant support

The same config works for:
- **Limited-overs:** ODI, T20, 50-over, 20-over, 10-over variants (just change the team names and enter runs)
- **Test matches:** 2 innings per team, but still just enter total runs per team per innings
- **Franchise cricket:** T20 leagues where one team bats once and the other once (first to 20 overs)
- **Multi-match tournaments:** Reset between matches (button in Status section)

## Limitations & what's out of scope

**Not tracked in Scorely:**
- Wickets lost (needed for drama / comeback tracking)
- Overs bowled (needed to compute run-rate)
- Individual batter / bowler performance
- Toss, choice to bat/field, venue
- Weather delays, rain rule (VJD/DLS)
- Umpire decisions, reviews (DRS)

**Workaround:** Use a separate scorecard (pen & paper, Excel, or a cricket-specific app like Cricbuzz) for detailed tracking. Scorely is the "big picture" dashboard for the match outcome.

## Future enhancements (out of scope for v1)

If a user asks for deeper integration, consider these follow-ups (post-MVP):
- **Per-team wickets** — second `roundInputs` field to track wickets lost alongside runs
- **Run-rate calculator** — a sidebar showing (runs ÷ overs) once overs are tracked
- **Partnership tracking** — log batter pairs and their contributions
- **Ball-level API** — if someone wants to feed Scorely ball-by-ball data from an external source (e.g., ESPN API)
- **Innings-level metadata** — toss choice, venue, weather notes (stored in round.metadata)

None of these are planned; they'd come only if a real user requests them and the request gains traction.

## See also

- **Engine:** Uses the standard `engine.js` (rounds-based, cumulative scoring).
- **ADR 0015:** Rationale for shipping "user does the math" games like Cricket.
- **Games catalog** (`docs/games.md`): Cricket listed under "Sports & physical games" as 🟡 (medium complexity for Domain knowledge), but Scorely ships it as 🟢 (one config) because we delegate domain logic to the user.
