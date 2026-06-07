Scorely.defineGame({
  id: "euchre",
  name: "Euchre",
  icon: "♣️",
  accent: "linear-gradient(135deg, #2a3068 0%, #4ade80 100%)",
  tagline:
    "Two teams, 5-trick hands. Maker gets 1 for 3–4 tricks, 2 for a march (5 tricks), 4 for a loner march. Defenders euchre a failed maker for +2. First team to 10 wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 10, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
});
