Scorely.defineGame({
  id: "pool",
  name: "Pool",
  icon: "🎱",
  accent: "linear-gradient(135deg, #2a3068 0%, #ff5d83 100%)",
  tagline: "Track racks won. First to the target wins the match.",
  shape: "counter",
  settings: {
    target: { label: "Racks to win match", type: "number", default: 5, min: 1 },
  },
  winBy: 1,
  scoring: { direction: "high" },
  scoreNoun: "racks",
});
