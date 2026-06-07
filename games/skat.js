Scorely.defineGame({
  id: "skat",
  name: "Skat",
  icon: "🍻",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #2a3068 100%)",
  tagline:
    "3-player German trick-taking. Per hand, enter the declarer's net score change (base × multiplier ladder if won; −2 × game value if lost). Engine sums; user computes the multipliers. First to an agreed target wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 500, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  defaultPlayers: ["Player 1", "Player 2", "Player 3"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
});
