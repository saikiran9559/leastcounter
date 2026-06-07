Scorely.defineGame({
  id: "disc-golf",
  name: "Disc Golf",
  icon: "🥏",
  accent: "linear-gradient(135deg, #4ade80 0%, #7c8eff 100%)",
  tagline: "Record strokes per hole. Lowest total wins.",
  shape: "grid",
  settings: {
    holes: {
      label: "Number of holes",
      type: "number",
      default: 18,
      min: 1,
    },
  },
  categories: (settings) =>
    Array.from({ length: settings.holes }, (_, i) => ({
      key: `h${i + 1}`,
      label: `Hole ${i + 1}`,
    })),
  scoring: { direction: "low" },
});
