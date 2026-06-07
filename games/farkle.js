Scorely.defineGame({
  id: "farkle",
  name: "Farkle",
  icon: "🎲",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #ff5d83 100%)",
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
