Scorely.defineGame({
  id: "pinochle",
  name: "Pinochle",
  icon: "♠️",
  accent: "linear-gradient(135deg, #b46cff 0%, #7c8eff 100%)",
  tagline:
    "Partnership trick-taking. Per hand: meld points + trick points. First team to 150 wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 150, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  roundInputs: [
    { key: "meld", label: "Meld", type: "number", min: 0 },
    { key: "tricks", label: "Tricks", type: "number", min: 0 },
  ],
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
});
