(function () {
  const S = window.Scorely;
  if (!S) return;

  S.rules = {
    "least-count": [
      "2–8 players, standard 52-card deck.",
      "Each hand, players try to be the first to empty their hand or call 'least count' at the lowest total.",
      "Penalty = value of cards left in hand. Wrong call doubles the penalty (or per house rules).",
      "Player whose cumulative total reaches the elimination limit is OUT.",
      "Last player remaining wins.",
    ],
    uno: [
      "2–10 players. Standard UNO deck.",
      "Hand winner scores points for cards left in opponents' hands.",
      "Number cards = face value; action cards = 20; wild = 50.",
      "First player to reach the target (default 500) wins the game.",
    ],
    rummy: [
      "Indian 13-card Rummy, 2–6 players.",
      "Each hand, build at least 2 sequences (one pure) plus sets/sequences from 13 cards.",
      "Penalty = value of unmelded cards, capped at 80. First-round drop = 20, middle drop = 40.",
      "Player reaching the elimination limit (101 or 201) is OUT. Lowest cumulative wins.",
    ],
    "crazy-eights": [
      "2–6 players. Standard 52-card deck.",
      "Discard cards matching the top of the pile by rank or suit. Eights are wild.",
      "Hand winner scores the value of cards left in opponents' hands.",
      "First to cross the limit (default 100) is OUT; lowest survives.",
    ],
    tonk: [
      "Knock-rummy variant, 2–4 players.",
      "Build sets/runs and either knock with a low count or empty your hand.",
      "Hand losers add their leftover card value to their cumulative total.",
      "First to cross the limit (default 100) is OUT.",
    ],
    dominoes: [
      "Mexican Train (2–8 players) with double-12 set.",
      "Play tiles to extend trains; first to empty their hand ends the round.",
      "Other players add pips left in hand to their tally.",
      "Cumulative low wins; player over the threshold (default 150) is OUT.",
    ],
    rummikub: [
      "2–4 players, 106 tiles (numbered 1–13 in 4 colors, 2 jokers).",
      "Make runs (3+ same color) or groups (3+ same number, different colors); rearrange the table.",
      "Hand loser totals: pip values of leftover tiles (jokers = 30).",
      "Cumulative low wins; first to cross the limit (default 200) is OUT.",
    ],
    farkle: [
      "2+ players. Roll 6 dice; set aside scoring dice, optionally re-roll the rest.",
      "Score singles 1s (100) and 5s (50); triples / straights / pairs per the score sheet.",
      "Rolling no scoring dice = 'Farkle' — lose the turn's banked points.",
      "First player to the target (default 10,000) wins.",
    ],
    "phase-10": [
      "2–6 players. Complete 10 phases in order across rounds.",
      "Each hand, lay down your phase's required melds, then unload the rest.",
      "Penalty = leftover-card value (1–9 = 5, 10–12 = 10, skip = 15, wild = 25).",
      "Check 'Completed phase?' to advance. First to finish phase 10 wins; lowest score breaks ties.",
    ],
    hearts: [
      "4 players, no teams. Standard deck minus the 2 of clubs lead-out variants.",
      "Avoid taking hearts (1 pt each) and the queen of spades (13 pts).",
      "Shoot the moon: take all 26 → 0 for you, 26 to each opponent (or −26 to self, house rules).",
      "Game ends when any player reaches 100; lowest cumulative wins.",
    ],
    mendikot: [
      "4 players, 2 teams. 52-card deck.",
      "Goal: capture the four 10s ('mendikot'). Winning all four in one hand = automatic hand win.",
      "Hands accumulate per the score sheet; first team to the hand-target wins the match.",
    ],
    "court-piece": [
      "4 players, 2 teams. 52-card deck.",
      "Bidder picks trump; goal is to win 7 of 13 hands (a 'court').",
      "Per round, enter hands won. First team to the target (default 7) wins the match.",
      "Kot bonus (7-0 sweep) tracked manually.",
    ],
    poker: [
      "Cash session ledger. Players buy in (multiple times allowed), then cash out at session end.",
      "Net per player = total cash-out − total buy-ins.",
      "House balance (total in − total out) should equal 0 once everyone has cashed out — sanity check.",
    ],
    "teen-patti": [
      "Indian 3-card poker. Players bet on the strength of their 3-card hand.",
      "Cash session — track per-player buy-ins and final cash-out.",
      "Net = cash-out − buy-ins. House balance should hit 0 at session end.",
    ],
    codenames: [
      "Two teams, one spymaster each. Players guess words on the grid from one-word clues.",
      "Track team-wins across a session — tap +1 when your team wins a game.",
      "First team to the target (default 5) wins the night.",
    ],
    cribbage: [
      "2 players (or 3, or 4 in pairs). 52-card deck + pegging board.",
      "Score during play ('peg') and after the show (pairs, 15s, runs, flushes, his nobs).",
      "Per hand, enter peg + show totals; engine sums.",
      "First to 121 wins.",
    ],
    pinochle: [
      "4 players in partnership (or 2). Special 48-card deck.",
      "Per hand, score meld (declared combinations) + tricks (10s, aces, last trick).",
      "Engine sums meld + tricks per hand.",
      "First team to 150 wins.",
    ],
    scrabble: [
      "2–4 players. 100 tiles, 15×15 board.",
      "Per turn, place tiles to form valid words. Apply double/triple letter/word multipliers; bingo (use all 7) = +50.",
      "Game ends when the bag is empty and one player goes out, or both players pass twice.",
      "Highest total wins; reset when the board is done.",
    ],
    yahtzee: [
      "1+ players, 5 dice, 3 rolls per turn.",
      "Fill 13 categories — upper section (1s–6s, +35 bonus if upper ≥ 63), lower section (3-/4-of-kind, full house, sm/lg straights, Yahtzee, chance).",
      "Add bonuses manually in the 'Bonuses' column: 35 for upper bonus, 100 per extra Yahtzee.",
      "Game ends when every player fills all 13 categories. Highest total wins.",
    ],
    "darts-501": [
      "2 players. Start at 501; subtract each turn's 3-dart total until you reach exactly 0.",
      "Must finish on a double. Bust (going below 0 or to 1) → enter 0 for that turn.",
      "Each cell shows remaining (= 501 − total scored).",
      "First to hit 0 with a double wins.",
    ],
    tennis: [
      "2 players. Best of 3 sets.",
      "Points: 0 → 15 → 30 → 40 → game. At 40-40 = deuce; advantage on next point; back to deuce if opponent scores.",
      "Set: first to 6 games with margin ≥ 2 (this MVP uses advantage set; no tiebreak at 6-6).",
      "Match: first to 2 sets wins.",
    ],
    spades: [
      "4 players, 2 teams. Standard deck, spades always trump.",
      "Per hand, each team bids the number of tricks they'll take.",
      "Made bid → +10 × bid + 1 per overtrick (bag). Set → −10 × bid. 10 bags accumulated → −100.",
      "First team to 500 wins.",
    ],
    euchre: [
      "4 players, 2 teams. 24-card deck (9–A).",
      "Per hand, maker tries to take 3+ of 5 tricks. Per-team points: 1 (3–4 tricks), 2 (march = 5 tricks), 4 (loner march), defenders +2 if maker fails.",
      "First team to 10 wins.",
    ],
    pitch: [
      "4 players, 2 teams (or 3 individuals).",
      "Per hand, four bonuses are up for grabs: High, Low, Jack (of trump), Game (most card points).",
      "Bidder team scores its bonuses if it makes its bid, loses the bid value otherwise. Non-bidder team always scores its bonuses.",
      "First team to 11 wins.",
    ],
    backgammon: [
      "2 players. Race to a match target (default 7 points).",
      "Per game: 1 point normal, 2 gammon, 3 backgammon. Cube doubles multiply (×2, ×4, ×8).",
      "Enter points won per game; cube state is tracked at the board.",
      "First to the match target wins.",
    ],
    bowling: [
      "1+ players, 10 frames each. Throw 2 balls per frame (3 in the 10th if you strike or spare).",
      "Strike (10 first throw) = 10 + next 2 throws. Spare (10 across 2 throws) = 10 + next 1 throw.",
      "Engine handles frame transitions on each tap; X / / / − notation shown automatically.",
      "Highest total at frame 10 wins.",
    ],
    "500": [
      "4 players, 2 teams. 43-card deck (4-A in 4 suits + joker).",
      "Per hand: highest bidder names contract. Bid value = base by suit × tricks bid (40 = 6♣, 120 = 6NT, 250 = misère, etc.).",
      "Made → +bid value. Set → −bid value. Non-bidders always score +10 × tricks taken.",
      "First team to 500 wins; first to −500 loses.",
    ],
    "28": [
      "4 players, 2 teams. Indian trick-taking with 32-card deck (28 card points total).",
      "Bidder names trump and must take ≥ bid card points.",
      "Made → +1 game-point to bidder team. Set → +1 to defenders.",
      "First team to the match target (default 5 game-points) wins.",
    ],
    belote: [
      "4 players, 2 teams. 32-card deck (162 card points incl. dix-de-der).",
      "Caller team must take ≥ 82 card points to make.",
      "Made → keep your card points + declarations. Set → opponents get all 162 + their declarations.",
      "Declarations (belote-rebelote, sequences, carré) are added manually to 'extras'.",
      "First team to 1001 wins.",
    ],
    "liars-dice": [
      "2+ players. Each player starts with 5 hidden dice.",
      "Bid on the count of a face across all dice (e.g., 'four 3s'). Successive bids must raise.",
      "Anyone can call 'liar'; loser of the challenge loses a die.",
      "Out at 0 dice. Last player standing wins.",
    ],
    president: [
      "3–8 players. Shedding-card game.",
      "Each round, the first player to empty their hand wins; last to finish is the 'Scum'.",
      "Enter each player's finishing position (1 = President, ..., N = Scum).",
      "Lowest cumulative position sum = most consistent winner. Manual game-end.",
    ],
    go: [
      "2 players (Black & White) on a 19×19 (or 13×13 / 9×9) board.",
      "Place stones alternately to surround territory and capture opponent stones.",
      "Game ends when both pass. Score = territory + captures. White adds komi (6.5 or 7.5).",
      "Highest total wins.",
    ],
    canasta: [
      "4 players, 2 teams. Two decks shuffled together.",
      "Each hand, score melded card points + bonuses (natural canasta 500, mixed 300, red 3s 100 each, going out 100/200).",
      "Subtract hand penalty (cards left in hand).",
      "First team to 5000 wins.",
    ],
    archery: [
      "1+ archers. Standard rounds: 6 arrows per 'end' (rounds in Scorely).",
      "Each arrow scores 0–10 (X = inner 10).",
      "Engine sums 6 arrow inputs into the end total, then sums ends.",
      "Highest cumulative score wins the round; reset when the round is over.",
    ],
    whist: [
      "4 players, 2 teams. 52-card deck. Rubber whist = best of N games.",
      "Within each 'game' the team takes odd tricks (over 6) to earn points up to 5.",
      "Scorely tracks the OUTER level: count games won by each team.",
      "First team to N games (default 2) wins the rubber.",
    ],
    snooker: [
      "2 players, 22 balls. Within a frame: 4–147 break scoring.",
      "Scorely tracks match-level only: first to N frames wins. The in-frame break calculator is not included.",
      "Tap +1 per frame won.",
    ],
    golf: [
      "1+ players, 18 holes (configurable). Stroke play.",
      "Record strokes per hole. Lowest cumulative wins.",
      "Stableford and match-play modes not included in this config.",
    ],
    "darts-cricket": [
      "2 players. Numbers in play: 15, 16, 17, 18, 19, 20, Bull.",
      "Close each number by hitting it 3 times (single = 1 mark, double = 2, triple = 3).",
      "Tap a cell to add a mark. Right-click / long-press to remove. Closed cell shows ⊗.",
      "First player to close all 7 wins. Points-mode (scoring extra hits while opponents haven't closed) not included.",
    ],
    "chess-tournament": [
      "Round-robin or Swiss tournament tracker.",
      "Per round, each player enters 2 = win, 1 = draw, 0 = loss (doubled from 1/0.5/0 for integer arithmetic; same ranking).",
      "Highest cumulative wins. Tiebreakers (Buchholz, Sonneborn-Berger) not auto-computed.",
    ],
    skat: [
      "3 players. Per hand, one player is the declarer playing against the other two.",
      "Game value = base × multiplier ladder (matadors × hand × schneider × schwarz × ouvert).",
      "Made → +game value. Lost → −2 × game value.",
      "Enter the per-hand net score change (you compute the multipliers).",
      "First player to the target wins.",
    ],
    cricket: [
      "11 vs 11 (or scaled-down). Limited-overs or Test match.",
      "Per innings, enter the team's total runs.",
      "Highest aggregate across innings wins. Wickets, overs, batter/bowler figures — track on a separate scorecard.",
    ],
    bridge: [
      "4 players, 2 partnerships (N-S vs E-W).",
      "Per deal, enter each side's computed score: contract trick value + overtricks + bonuses (slam, doubled, vulnerable) − undertrick penalties.",
      "User computes from the contract; engine sums.",
      "First side to the match target wins.",
    ],
    mahjong: [
      "4 players (East / South / West / North). Build a winning hand of 14 tiles.",
      "Variants disagree on fan/yaku/scoring (Hong Kong / Chinese Classical / Japanese riichi / American). You pick.",
      "Per hand, enter each player's net score change.",
      "Engine sums per session; manual game-end.",
    ],
    pool: [
      "2 players (or doubles). Match scoring — first to N racks wins the match.",
      "Tap +1 per rack won. Per-rack ball tracking not included.",
    ],
    catan: [
      "3–6 players. First to 10 victory points wins.",
      "Tap +1 per VP earned (settlements, cities, longest road, largest army, development cards).",
      "Largest army & longest road badges: when they change hands, tap −1 for the previous holder and +1 for the new.",
    ],
    wingspan: [
      "1–5 players. End-game scoring calculator for the bird-themed engine builder.",
      "Tally each category: birds, bonus cards, end-of-round goals, eggs, food cached on cards, tucked cards.",
      "Highest total wins.",
    ],
    "7-wonders": [
      "3–7 players. End-game scoring calculator.",
      "Score each color: red (military), yellow (commerce), blue (civilian), green (science: 1²+4²+9²+7 per set), purple (guilds), wonders, treasury (1 pt / 3 coins).",
      "Enter your computed science total — the formula is yours.",
      "Highest total wins.",
    ],
    "table-tennis": [
      "1v1 or 2v2. First to 11, win by 2.",
      "Tap +1 per rally. Server swaps every 2 points (at 10-10+ every point).",
      "Reset between sets — Scorely tracks one set at a time.",
    ],
    pickleball: [
      "1v1 or 2v2. First to 11, win by 2.",
      "Traditional rules: only the serving side scores. Rally scoring is a common variant.",
      "Tap +1 per point. Reset between games.",
    ],
    badminton: [
      "1v1 or 2v2. First to 21, win by 2.",
      "Rally scoring — every point counts.",
      "Tap +1 per rally. Reset between games.",
    ],
    volleyball: [
      "Per set: first to 25, win by 2 (15 in a deciding 5th set).",
      "Rally scoring. Tap +1 per rally.",
      "Reset between sets — track one set at a time.",
    ],
    "disc-golf": [
      "1+ players, configurable holes (default 18). Stroke play.",
      "Record strokes per hole. Lowest cumulative wins.",
    ],
    tournament: [
      "Meta-tracker for game-night leaderboards: multiple games, one running total.",
      "Add the same group of players. Each round = one game your group played.",
      "Per round, enter each player's points from that game — raw game score, finishing rank, or a formula (Formula 1: 25-18-15-12-10-8-6-4-2-1; Olympic: 3-2-1).",
      "Engine sums per player; highest cumulative wins the night.",
      "Auto-pulling results from other Scorely games isn't built in — type in the points yourself.",
    ],
  };

  S.rulesFor = function (gameId) {
    return S.rules[gameId] || null;
  };
})();
