Scorely.defineGame({
  id: "farkle",
  name: "Farkle",
  tagline:
    "Push-your-luck dice. Each round you bank points (or bust). First player to the target wins.",
  settings: {
    target: {
      label: "Target score",
      type: "number",
      default: 10000,
      min: 1,
    },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
});
