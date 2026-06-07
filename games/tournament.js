Scorely.defineGame({
  id: "tournament",
  name: "Game Night Tournament",
  icon: "🏆",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #b46cff 100%)",
  tagline:
    "Multiple games, one leaderboard. Each round = one game your group played; enter each player's points. Use raw game scores, finishing rank, or a points formula (Formula 1: 25-18-15-12-10-8-6-4-2-1). Highest cumulative wins the night.",
  scoring: { direction: "high" },
  labels: { round: "Game", addRound: "Add game", total: "Total" },
});
