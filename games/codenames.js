Scorely.defineGame({
  id: "codenames",
  name: "Codenames",
  icon: "🕵️",
  accent: "linear-gradient(135deg, #ff5d6c 0%, #4ee7ff 100%)",
  tagline: "Team-wins tally across a session. First side to the target wins the night.",
  shape: "counter",
  settings: {
    target: { label: "Games to win the night", type: "number", default: 5, min: 1 },
  },
  winBy: 1,
  scoring: { direction: "high" },
  scoreNoun: "games",
  playerNoun: "Team",
  defaultPlayers: ["Team Red", "Team Blue"],
});
