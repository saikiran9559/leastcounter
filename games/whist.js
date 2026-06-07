Scorely.defineGame({
  id: "whist",
  name: "Whist (Rubber)",
  icon: "🎩",
  accent: "linear-gradient(135deg, #2a3068 0%, #ffcc4a 100%)",
  tagline:
    "Two teams. Rubber = best of N games. Tap +1 when your team wins a game. The inner 5-point per-game tally (odd tricks) is tracked at the table — this tab counts rubbers.",
  shape: "counter",
  settings: {
    target: { label: "Games to win rubber", type: "number", default: 2, min: 1 },
  },
  winBy: 1,
  scoring: { direction: "high" },
  scoreNoun: "games",
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
});
