Scorely.defineGame({
  id: "least-count",
  name: "Least Count",
  icon: "🃏",
  accent: "linear-gradient(135deg, #6a82ff 0%, #4ee7ff 100%)",
  tagline: "Lowest score survives. First to cross the limit is out.",
  settings: {
    limit: {
      label: "Elimination limit",
      type: "number",
      default: 250,
      min: 1,
    },
  },
  scoring: {
    direction: "low",
    endCondition: "threshold-elim",
    thresholdKey: "limit",
  },
});
