Scorely.defineGame({
  id: "uno",
  name: "UNO",
  icon: "🌈",
  accent: "linear-gradient(135deg, #ff5d6c 0%, #ffcc4a 50%, #4ee7ff 100%)",
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
