Scorely.defineGame({
  id: "crazy-eights",
  name: "Crazy Eights",
  tagline:
    "Each round, the winner counts opponents' leftover-card values. First to cross the limit is out; lowest survives.",
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
