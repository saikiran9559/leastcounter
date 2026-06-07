Scorely.defineGame({
  id: "liars-dice",
  name: "Liar's Dice",
  icon: "⚄",
  accent: "linear-gradient(135deg, #ff5d6c 0%, #b46cff 100%)",
  tagline:
    "Bid-and-bluff dice elimination. Each round, the loser of the challenge enters 1 (their lost die); everyone else leaves blank. Out at 0 dice; last standing wins.",
  settings: {
    startingDice: { label: "Starting dice per player", type: "number", default: 5, min: 1 },
  },
  scoring: {
    direction: "low",
    endCondition: "threshold-elim",
    thresholdKey: "startingDice",
    displayMode: "remaining",
  },
  labels: { round: "Round", addRound: "Record die loss", total: "Dice left" },
  winnerBanner({ winner, remaining }) {
    return `🏆 ${winner.name} is the last standing — ${remaining} dice left!`;
  },
});
