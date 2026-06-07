Scorely.defineGame({
  id: "badminton",
  name: "Badminton",
  icon: "🏸",
  accent: "linear-gradient(135deg, #b46cff 0%, #4ee7ff 100%)",
  tagline: "First to 21, win by 2. Rally scoring — every point counts.",
  shape: "counter",
  settings: {
    target: { label: "Target score", type: "number", default: 21, min: 1 },
  },
  winBy: 2,
  scoring: { direction: "high" },
});
