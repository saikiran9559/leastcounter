# Games catalog

A reference catalog of games whose scoring is built into Scorely. Organized by family. For each game we capture: typical players, what gets tracked per round, the win/lose condition, and notes on UI complexity.

**Current state: 49 of 50 candidate games shipped**, plus a **Game Night Tournament** meta-tracker and **user-built custom games** via the in-app builder (`#/create-game`). The only candidate not shipped is **Werewolf**, which is a state-tracker rather than a scoreboard and is explicit out-of-scope ([ADR 0015](decisions/0015-user-does-the-math-for-domain-heavy-games.md)).

> Phased build plan with task IDs and current status: see [`../status.yaml`](../status.yaml). This file is the reference catalog; `status.yaml` is the execution plan.

Legend:
- ✅ Built (49 + Tournament)
- ⛔ Out of scope (Werewolf — state tracker, not scoring)
- 🟢 Easy (same shape as Least Count)
- 🟡 Medium (extra columns, multipliers, or per-trick tracking)
- 🔴 Hard (complex rules, bidding phases, or non-linear scoring)

---

## Card games

### ✅ Least Count
- **Players:** 2–8
- **Track:** per-round point total per player
- **Win:** lowest score; player out at threshold (default 250)
- **Status:** built

### 🟢 Rummy (Indian 13-card)
- **Players:** 2–6
- **Track:** per-round penalty points per player; first round drop = 20, middle drop = 40, full count = 80 (cap)
- **Win:** lowest cumulative; player out at threshold (e.g., 101 or 201)
- **Notes:** very similar engine to Least Count — different threshold + per-round cap rules. Add "drop" buttons that auto-fill 20/40.

### 🟢 UNO
- **Players:** 2–10
- **Track:** round winner takes points equal to opponents' card values; cards have fixed values (numbers face, action = 20, wild = 50)
- **Win:** first to 500 wins (highest total wins, opposite of Least Count)
- **Notes:** reuse engine, flip win condition.

### 🟢 Phase 10
- **Players:** 2–6
- **Track:** per-round leftover-card points AND current phase (1–10) per player
- **Win:** first player to finish phase 10 with lowest score
- **Notes:** need a second column ("phase") per player alongside totals.

### 🟢 Tonk
- **Players:** 2–4
- **Track:** per-round penalty points; double-payout on "tonk" (instant win on deal)
- **Win:** typically a money-per-point game; track running totals
- **Notes:** like Least Count with optional pot/stake multipliers.

### 🟡 Hearts
- **Players:** 4 (typically)
- **Track:** per-hand penalty points (hearts = 1, queen of spades = 13); "shooting the moon" = 26 to opponents OR -26 to self
- **Win:** lowest total when someone hits 100; lowest wins
- **Notes:** needs a "shoot the moon" toggle per hand that re-distributes points.

### 🟡 Spades
- **Players:** 4 (2 teams of 2)
- **Track:** per-hand: bid, tricks taken, made/set, "bags" overflow penalty
- **Win:** team to 500 first; goes negative on consistent overbids
- **Notes:** team layout (not individual). Bid + tricks → derived score with bag tracking is the interesting bit.

### 🟡 Bridge
- **Players:** 4 (2 teams)
- **Track:** contract level, suit, doubled/redoubled, tricks made, vulnerability, slam bonuses, above/below the line
- **Win:** "rubber" = first team to two games (100 points below the line)
- **Notes:** 🔴 if duplicate bridge. Rubber bridge is 🟡 with the right form. A bidding-and-result calculator alone would be valuable.

### 🟡 500
- **Players:** 4 (2 teams) or 3
- **Track:** bids, tricks taken, success/failure with fixed bid-score table (e.g., 6 spades = 40, 7 hearts = 160, misère)
- **Win:** first team to 500; lose at –500
- **Notes:** lookup table for bid value.

### 🟡 Euchre
- **Players:** 4 (2 teams of 2)
- **Track:** per-hand: maker, tricks, "march" (5 tricks), "loner" bonuses
- **Win:** first team to 10
- **Notes:** simple but with conditional scoring.

### 🟡 Pinochle
- **Players:** 4 (partners) or 2
- **Track:** meld points + trick points per hand
- **Win:** 150 or 1500 depending on variant
- **Notes:** meld is itemized (runs, marriages, pinochles) — could be a meld calculator.

### 🟡 Canasta
- **Players:** 4 (2 partners)
- **Track:** per-hand melds, canastas (clean/dirty), red threes, going-out bonus, hand penalty
- **Win:** first to 5000
- **Notes:** lots of bonus categories; itemized entry helps avoid math errors.

### 🟡 28 / 29 / 56 (Indian trick-taking)
- **Players:** 4 (2 partners) typically
- **Track:** bid, trump, tricks-and-card-points per round, double/redouble
- **Win:** match-style — first team to N games
- **Notes:** popular in India; sibling of 500.

### 🟡 Court Piece / Rang / Hokm
- **Players:** 4 (2 partners)
- **Track:** hands won per round; "court" / "kot" bonuses
- **Win:** first team to 7 hands wins the game; first to N games wins the match
- **Notes:** running tally; simple but with kot detection.

### 🟡 Mendikot
- **Players:** 4 (2 partners)
- **Track:** tens captured per hand; mendikot (all four tens) bonus
- **Win:** majority of tens + tricks
- **Notes:** scoring per round + match.

### 🟡 Cribbage
- **Players:** 2 (or 3, or 4 as partners)
- **Track:** pegging points + show points (pairs, runs, 15s, flushes, his nobs)
- **Win:** first to 121 (or 61 for short game)
- **Notes:** scoring is itemized; a "Show" calculator (given hand + cut → points) would be popular standalone.

### 🟡 Belote / Coinche
- **Players:** 4 (2 partners)
- **Track:** contract, points won, declarations (belote, sequences)
- **Win:** first team to 1000 or 1500
- **Notes:** French/Indian regional.

### 🔴 Skat
- **Players:** 3
- **Track:** declarer game, multipliers (matadors, hand, schneider, schwarz, ouvert), failed contracts
- **Win:** highest score after agreed deals; tournament Seger system
- **Notes:** scoring is famously intricate.

### 🟢 Crazy Eights / Switch
- **Players:** 2–6
- **Track:** end-of-round leftover-card points per player
- **Win:** first to a target (often 100), lowest wins
- **Notes:** Least Count clone.

### 🟡 President / Asshole (Daihinmin)
- **Players:** 4–8
- **Track:** finishing order per round; ranks (President, VP, …, Asshole)
- **Win:** session-based, no fixed end
- **Notes:** track positions and ladder over rounds; no point math.

### 🟡 Pitch (Setback)
- **Players:** 4 (partners) or 2–3
- **Track:** bid, tricks won, "high/low/jack/game" points
- **Win:** first to 11 or 21
- **Notes:** named-bonus scoring.

### 🟡 Whist
- **Players:** 4 (partners)
- **Track:** odd tricks per hand
- **Win:** first to 5 in rubber whist
- **Notes:** simple, but variants differ.

---

## Poker / chip games

### 🔴 Texas Hold'em (cash + tournament)
- **Players:** 2–10
- **Track:** stack sizes, blinds, hand history, pot odds (optional)
- **Win:** last player with chips (tournament) or session profit
- **Notes:** "scoring" here is bankroll tracking. A simple session ledger (buy-ins, cash-outs per player) is the 🟢 version.

### 🟡 Teen Patti
- **Players:** 3–6
- **Track:** pot per round, side-show outcomes, stack per player
- **Win:** session-based bankroll
- **Notes:** Indian poker variant; bankroll tracker is the practical ask.

### 🟢 Generic poker session ledger
- **Players:** N
- **Track:** buy-ins, rebuys, cash-outs per session
- **Win:** profit/loss per player
- **Notes:** reusable across all chip games.

---

## Dice games

### 🟡 Yahtzee
- **Players:** 1–N
- **Track:** 13 named categories per player per game (upper section + lower section with bonuses + Yahtzee bonus)
- **Win:** highest total after 13 rounds
- **Notes:** the canonical "named-category grid" UI.

### 🟢 Farkle / Zilch / Ten Thousand
- **Players:** 2–N
- **Track:** running total; per-roll point banks
- **Win:** first to 10,000 (varies)
- **Notes:** very Least Count-shaped, win-condition flipped (highest wins).

### 🟡 Liar's Dice (Perudo)
- **Players:** 2–8
- **Track:** dice remaining per player; rounds
- **Win:** last with dice
- **Notes:** elimination tracker more than scoring.

### 🟢 Bunco
- **Players:** 12 (3 tables of 4) typically
- **Track:** per-round wins/losses; buncos
- **Win:** highest score; tables rotate winners
- **Notes:** tracking is bookkeeping-heavy at parties.

---

## Tile games

### 🔴 Mahjong (Chinese / Japanese / Hong Kong / American)
- **Players:** 4
- **Track:** hand value (fan / yaku), east-wind rotation, riichi sticks, dora, doubles
- **Win:** session highest or all-others-broke
- **Notes:** rules vary radically by region. Hand-value calculator alone is a great standalone tool.

### 🟡 Rummikub
- **Players:** 2–4
- **Track:** per-round leftover-tile penalty
- **Win:** lowest cumulative
- **Notes:** Least Count engine reuse.

### 🟢 Dominoes (Mexican Train, Block, Draw)
- **Players:** 2–8
- **Track:** per-round leftover-pip penalty
- **Win:** lowest cumulative when target reached
- **Notes:** Least Count clone with double-zero special cases.

---

## Board games

### 🟡 Scrabble
- **Players:** 2–4
- **Track:** per-turn score (with double/triple word, 50-point bingo bonus), challenged/missed turns
- **Win:** highest at end (board full or both pass twice)
- **Notes:** word-by-word entry; a multiplier calculator helps.

### 🟢 Settlers of Catan
- **Players:** 3–6
- **Track:** victory points per player; largest army & longest road badges
- **Win:** first to 10
- **Notes:** tap-to-increment UI, badge ownership.

### 🟡 Carcassonne
- **Players:** 2–6
- **Track:** running score per player; end-of-game farm scoring
- **Win:** highest at end
- **Notes:** running totals + finalization pass.

### 🟡 Ticket to Ride
- **Players:** 2–5
- **Track:** route claims, longest route bonus, ticket completion (positive) / failure (negative) at end
- **Win:** highest
- **Notes:** in-game tap counter + endgame reveal.

### 🔴 7 Wonders / Wonders Duel
- **Players:** 2–7
- **Track:** military, treasury, wonders, civilian, commerce, guilds, science (quadratic)
- **Win:** highest
- **Notes:** category-grid like Yahtzee; science is a quadratic formula.

### 🔴 Wingspan
- **Players:** 1–5
- **Track:** end-game categories (birds, bonus cards, end-of-round goals, eggs, cached food, tucked cards)
- **Win:** highest
- **Notes:** end-game calculator.

### 🟡 Backgammon (match play)
- **Players:** 2
- **Track:** per-game points (normal, gammon, backgammon × cube)
- **Win:** first to match length
- **Notes:** doubling cube state matters.

### 🟡 Chess (tournaments / Swiss / round-robin)
- **Players:** N
- **Track:** wins/draws/losses; tiebreaks (Buchholz, Sonneborn-Berger)
- **Win:** highest after all rounds
- **Notes:** team/individual support.

### 🔴 Go
- **Players:** 2
- **Track:** territory + captures + komi
- **Win:** higher count
- **Notes:** scoring assumes board state; counter is fine, computing from board is hard.

---

## Sports & physical games

### 🟡 Bowling
- **Players:** 1–N per lane
- **Track:** 10 frames per player; strikes/spares affect next-frame scoring
- **Win:** highest at frame 10
- **Notes:** frame-by-frame UI with strike/spare carry-over logic.

### 🟡 Darts (501 / 301 / 701)
- **Players:** 2–N
- **Track:** per-throw subtract from starting total; doubles to finish
- **Win:** first to exactly 0, finishing on a double
- **Notes:** running countdown per player with checkout suggestions (nice-to-have).

### 🟡 Darts (Cricket / Around-the-Clock)
- **Players:** 2–N
- **Track:** marks per number (15–20 + bullseye); points-mode optional
- **Win:** close all numbers with most points (or first to close all)
- **Notes:** matrix UI.

### 🟡 Pool / 8-ball / 9-ball
- **Players:** 2 (or doubles)
- **Track:** balls pocketed, fouls, racks won
- **Win:** match — first to N racks
- **Notes:** mostly a rack counter.

### 🟡 Snooker
- **Players:** 2
- **Track:** frame breaks (running ball values), frame totals, match frames
- **Win:** more frames at match end
- **Notes:** break calculator + frame totals.

### 🟢 Kabaddi
- **Players:** 2 teams of 7
- **Track:** running team points (raid tags, tackles, all-out bonuses, bonus-line points)
- **Win:** highest score after two 20-minute halves
- **Notes:** counter engine; all bonus points (super tackle +2, all-out +2, bonus line +1) are tapped manually by the scorer. No raid-by-raid log. See [`docs/games/kabaddi.md`](games/kabaddi.md).

### 🟢 Table tennis / Pickleball / Badminton / Volleyball
- **Players:** 1v1, 2v2, 6v6
- **Track:** running point total, side-out / rally scoring variants
- **Win:** first to 11/21/25 with 2-up
- **Notes:** large-button counter + serve indicator.

### 🟢 Tennis
- **Players:** 1v1, 2v2
- **Track:** points (love/15/30/40/deuce) → games → sets → match
- **Win:** best of 3 or 5 sets
- **Notes:** nested counter; advantage/deuce logic.

### 🟡 Cricket
- **Players:** 11v11
- **Track:** runs, wickets, overs, individual batting/bowling figures
- **Win:** higher score (limited overs) or more runs (Test)
- **Notes:** rich domain — could be its own app.

### 🟡 Golf
- **Players:** 1–N
- **Track:** strokes per hole (18); stableford points; match play hole wins
- **Win:** lowest strokes (stroke), highest stableford, most holes (match)
- **Notes:** card has 18 fixed columns; multiple scoring modes.

### 🟢 Disc golf
- **Players:** 1–N
- **Track:** strokes per hole (often 18)
- **Win:** lowest
- **Notes:** identical shape to golf without the multiple modes.

### 🟡 Archery
- **Players:** 1–N
- **Track:** arrows per end, 10/9/8/X scoring, ends per round
- **Win:** highest cumulative
- **Notes:** category grid.

---

## Party / pub games

### 🟢 Trivia / Pub quiz
- **Players or teams:** N
- **Track:** per-round points; bonus categories
- **Win:** highest at end
- **Notes:** generic round-based engine.

### 🟢 Pictionary / Charades / Taboo
- **Teams:** 2+
- **Track:** team scores per round
- **Win:** first to target
- **Notes:** simple counter with team support.

### 🟢 Codenames (Duet)
- **Teams:** 2 (Codenames) or co-op (Duet)
- **Track:** wins per session
- **Notes:** session ledger.

### 🟡 Werewolf / Mafia
- **Players:** 5–20
- **Track:** day/night cycle, alive/dead, role reveals, faction wins
- **Notes:** state tracker more than scorekeeper.

---

## Engine reuse — common shapes

Most of these collapse into a small number of UI patterns. If the existing Least Count code is extracted into a generic engine, ~60% of the games above can ship as thin configs:

1. **"Cumulative + threshold elimination, lowest wins"** — Least Count, Rummy, Crazy Eights, Tonk, Hearts, Rummikub, Dominoes
2. **"Cumulative, first to target, highest wins"** — UNO, Farkle, 500, Euchre, Pinochle, Canasta, Settlers, Backgammon match, Tennis match-of-sets
3. **"Fixed-category grid"** — Yahtzee, Bowling, Golf, Archery, 7 Wonders, Wingspan
4. **"Team / partnership variant"** — Spades, Bridge, 28/29, Court Piece, Mendikot, Pitch, Whist
5. **"Session ledger"** — poker chips, Codenames, generic chip games
6. **"Counter only"** — table tennis, pickleball, badminton, volleyball, pool/8-ball, ping-pong
7. **"State tracker, not scorer"** — Werewolf, Liar's Dice, President

The roadmap should probably go: extract engine → ship the easiest 5–6 games (UNO, Rummy, Phase 10, Yahtzee, Dominoes, Farkle) → then tackle category-grid games → then the heavy ones (Bridge, Mahjong) last.
