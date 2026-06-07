Scorely.defineGame({
  id: "go",
  name: "Go",
  icon: "⚫",
  accent: "linear-gradient(135deg, #2a3068 0%, #ffcc4a 100%)",
  tagline:
    "Territory scoring. Each player enters territory + captures per game. Add komi (typically 6.5 or 7.5) to White's captures manually. Highest wins.",
  scoring: { direction: "high" },
  roundInputs: [
    { key: "territory", label: "Territory", type: "number", min: 0 },
    { key: "captures", label: "Captures (+ komi for White)", type: "number", min: 0 },
  ],
  defaultPlayers: ["Black", "White"],
  labels: { round: "Game", addRound: "Add game", total: "Total" },
});
