Scorely.defineGame({
  id: "mendikot",
  name: "Mendikot",
  icon: "👑",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #b46cff 100%)",
  tagline:
    "Two teams capture tens across hands. Each round, enter how many hands each team won. First team to the target wins.",
  settings: {
    target: {
      label: "Hands to win",
      type: "number",
      default: 5,
      min: 1,
    },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Round", addRound: "Add round", total: "Hands won" },
});
