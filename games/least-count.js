Scorely.defineGame({
  id: "least-count",
  name: "Least Count",
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
