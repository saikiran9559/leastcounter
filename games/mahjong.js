Scorely.defineGame({
  id: "mahjong",
  name: "Mahjong",
  icon: "🀄",
  accent: "linear-gradient(135deg, #ff5d83 0%, #4ade80 100%)",
  tagline:
    "Per hand, enter each player's net score change. Regional fan / yaku / hand-value calculation is yours — Hong Kong, Chinese Classical, Japanese riichi, American — Scorely doesn't pick a variant. Engine sums per session.",
  scoring: { direction: "high" },
  defaultPlayers: ["East", "South", "West", "North"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
});
