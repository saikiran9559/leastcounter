Scorely.defineGame({
  id: "cribbage",
  name: "Cribbage",
  icon: "✂️",
  accent: "linear-gradient(135deg, #6a82ff 0%, #b46cff 100%)",
  tagline:
    "Per hand: peg points (from play) + show points (counted hand + crib). First to 121 wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 121, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  roundInputs: [
    { key: "peg", label: "Peg", type: "number", min: 0 },
    { key: "show", label: "Show", type: "number", min: 0 },
  ],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
});
