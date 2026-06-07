Scorely.defineGame({
  id: "rummikub",
  name: "Rummikub",
  icon: "🧩",
  accent: "linear-gradient(135deg, #4ee7ff 0%, #4ade80 100%)",
  tagline:
    "Per-round leftover-tile penalty. First to cross the limit is out; lowest cumulative score wins.",
  settings: {
    limit: {
      label: "Elimination at",
      type: "number",
      default: 200,
      min: 1,
    },
  },
  scoring: {
    direction: "low",
    endCondition: "threshold-elim",
    thresholdKey: "limit",
  },
});
