Scorely.defineGame({
  id: "rummy",
  name: "Rummy",
  icon: "🎴",
  accent: "linear-gradient(135deg, #b46cff 0%, #ff5d83 100%)",
  tagline:
    "Indian 13-card Rummy. Lowest score wins. First-round drop = 20, middle drop = 40, full count capped at 80.",
  settings: {
    limit: {
      label: "Elimination at",
      type: "number",
      default: 101,
      min: 1,
    },
  },
  scoring: {
    direction: "low",
    endCondition: "threshold-elim",
    thresholdKey: "limit",
  },
  roundInputMax: 80,
});
