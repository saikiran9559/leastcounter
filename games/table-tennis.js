Scorely.defineGame({
  id: "table-tennis",
  name: "Table Tennis",
  icon: "🏓",
  accent: "linear-gradient(135deg, #ff5d83 0%, #ffcc4a 100%)",
  tagline: "First to 11, win by 2. Tap +1 each rally.",
  shape: "counter",
  settings: {
    target: { label: "Target score", type: "number", default: 11, min: 1 },
  },
  winBy: 2,
  scoring: { direction: "high" },
});
