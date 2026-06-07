Scorely.defineGame({
  id: "snooker",
  name: "Snooker (Match)",
  icon: "🔴",
  accent: "linear-gradient(135deg, #ff5d6c 0%, #2a3068 100%)",
  tagline:
    "Match scoring — first player to N frames wins. Tap +1 per frame won. In-frame break tracking (the 4–147 calculator) is not included.",
  shape: "counter",
  settings: {
    target: { label: "Frames to win match", type: "number", default: 6, min: 1 },
  },
  winBy: 1,
  scoring: { direction: "high" },
  scoreNoun: "frames",
  defaultPlayers: ["Player 1", "Player 2"],
});
