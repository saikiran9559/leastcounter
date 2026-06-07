Scorely.defineGame({
  id: "bridge",
  name: "Bridge",
  icon: "🌉",
  accent: "linear-gradient(135deg, #b46cff 0%, #4ee7ff 100%)",
  tagline:
    "Per deal, enter each side's score (contract trick value + overtricks + bonuses − undertrick penalties). User computes from the contract; engine just sums. First side to the target wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 1500, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  playerNoun: "Side",
  defaultPlayers: ["North–South", "East–West"],
  labels: { round: "Deal", addRound: "Add deal", total: "Total" },
});
