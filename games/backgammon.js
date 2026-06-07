Scorely.defineGame({
  id: "backgammon",
  name: "Backgammon (Match)",
  icon: "⚂",
  accent: "linear-gradient(135deg, #b46cff 0%, #2a3068 100%)",
  tagline:
    "Match play. Per game, enter the points won (1 normal, 2 gammon, 3 backgammon; ×2/×4/×8 with cube doubles). First to the match length wins. Cube state is yours to track.",
  settings: {
    target: { label: "Match length (points)", type: "number", default: 7, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  defaultPlayers: ["Player 1", "Player 2"],
  labels: { round: "Game", addRound: "Add game", total: "Total" },
});
