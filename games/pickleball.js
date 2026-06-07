Scorely.defineGame({
  id: "pickleball",
  name: "Pickleball",
  icon: "🥒",
  accent: "linear-gradient(135deg, #4ade80 0%, #ffcc4a 100%)",
  tagline: "First to 11, win by 2. Only the serving side scores in traditional rules.",
  shape: "counter",
  settings: {
    target: { label: "Target score", type: "number", default: 11, min: 1 },
  },
  winBy: 2,
  scoring: { direction: "high" },
});
