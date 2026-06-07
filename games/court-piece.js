Scorely.defineGame({
  id: "court-piece",
  name: "Court Piece",
  tagline:
    "Two teams. Each round, enter how many hands each team won. First to the target wins the game. (Kot bonus not auto-applied — track it manually.)",
  settings: {
    target: {
      label: "Hands to win",
      type: "number",
      default: 7,
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
