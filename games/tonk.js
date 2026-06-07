Scorely.defineGame({
  id: "tonk",
  name: "Tonk",
  icon: "💥",
  accent: "linear-gradient(135deg, #ff5d83 0%, #ffcc4a 100%)",
  tagline:
    "Knock-rummy variant. Each round's leftover-card count adds to your tally. First to cross the limit is out.",
  settings: {
    limit: {
      label: "Elimination at",
      type: "number",
      default: 100,
      min: 1,
    },
  },
  scoring: {
    direction: "low",
    endCondition: "threshold-elim",
    thresholdKey: "limit",
  },
});
