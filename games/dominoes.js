Scorely.defineGame({
  id: "dominoes",
  name: "Dominoes",
  tagline:
    "Mexican Train style. Each round's leftover pips add to your tally. First to cross the limit is out; lowest score wins.",
  settings: {
    limit: {
      label: "Elimination at",
      type: "number",
      default: 150,
      min: 1,
    },
  },
  scoring: {
    direction: "low",
    endCondition: "threshold-elim",
    thresholdKey: "limit",
  },
});
