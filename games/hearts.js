Scorely.defineGame({
  id: "hearts",
  name: "Hearts",
  icon: "♥️",
  accent: "linear-gradient(135deg, #ff5d6c 0%, #b46cff 100%)",
  tagline:
    "4 players. Each round, hearts = 1 pt and queen of spades = 13 pts of penalty. Game ends when anyone reaches 100; lowest score wins. Shoot the moon: enter 0 for the shooter and 26 for everyone else.",
  settings: {
    limit: {
      label: "End-game threshold",
      type: "number",
      default: 100,
      min: 1,
    },
  },
  scoring: {
    direction: "low",
    endCondition: "threshold-end",
    thresholdKey: "limit",
  },
});
