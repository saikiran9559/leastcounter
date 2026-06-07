Scorely.defineGame({
  id: "scrabble",
  name: "Scrabble",
  icon: "🅰️",
  accent: "linear-gradient(135deg, #4ade80 0%, #ffcc4a 100%)",
  tagline:
    "Per turn, enter the turn's score (apply multipliers + 50-pt bingo bonus yourself). Highest cumulative wins; reset when the board is finished.",
  scoring: { direction: "high" },
  labels: { round: "Turn", addRound: "Add turn", total: "Total" },
});
