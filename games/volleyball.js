Scorely.defineGame({
  id: "volleyball",
  name: "Volleyball",
  icon: "🏐",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #ff5d83 100%)",
  tagline: "First to 25, win by 2. Track a single set — restart for the next.",
  shape: "counter",
  settings: {
    target: { label: "Target score", type: "number", default: 25, min: 1 },
  },
  winBy: 2,
  scoring: { direction: "high" },
});
