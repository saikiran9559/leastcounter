Scorely.defineGame({
  id: "uno",
  name: "UNO",
  tagline:
    "Round winner takes opponents' card values. Face cards = pip, action = 20, wild = 50. First to the target wins.",
  settings: {
    target: {
      label: "Target score",
      type: "number",
      default: 500,
      min: 1,
    },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
});
