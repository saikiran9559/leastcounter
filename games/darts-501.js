Scorely.defineGame({
  id: "darts-501",
  name: "Darts 501",
  icon: "🎯",
  accent: "linear-gradient(135deg, #ff5d6c 0%, #4ade80 100%)",
  tagline:
    "Countdown from 501 to exactly 0 (finish on a double). Each turn = sum of your three darts. Bust turns score 0.",
  settings: {
    target: { label: "Starting score", type: "number", default: 501, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
    displayMode: "remaining",
  },
  labels: { round: "Turn", addRound: "Add turn", total: "Remaining" },
});
