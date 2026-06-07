Scorely.defineGame({
  id: "chess-tournament",
  name: "Chess Tournament",
  icon: "♟️",
  accent: "linear-gradient(135deg, #2a3068 0%, #f0f3ff 100%)",
  tagline:
    "Per round, each player enters their result: 2 = win, 1 = draw, 0 = loss. (Doubled from the conventional 1/0.5/0 to stay in whole numbers; same ranking.) Buchholz/Sonneborn-Berger tiebreakers are not auto-computed.",
  scoring: { direction: "high" },
  roundInputs: [
    { key: "result", label: "Result (2=win, 1=draw, 0=loss)", type: "number", min: 0, max: 2 },
  ],
  labels: { round: "Round", addRound: "Add round", total: "Score ×2" },
});
