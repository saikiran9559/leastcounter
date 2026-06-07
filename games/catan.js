Scorely.defineGame({
  id: "catan",
  name: "Settlers of Catan",
  icon: "🏝️",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #4ade80 100%)",
  tagline:
    "First to 10 victory points wins. Tap +1 per VP. Largest army & longest road badges are tracked manually.",
  shape: "counter",
  settings: {
    target: { label: "Victory points to win", type: "number", default: 10, min: 1 },
  },
  winBy: 1,
  scoring: { direction: "high" },
  scoreNoun: "VP",
});
