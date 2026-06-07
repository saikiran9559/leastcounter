Scorely.defineGame({
  id: "cricket",
  name: "Cricket (Match)",
  icon: "🏏",
  accent: "linear-gradient(135deg, #4ade80 0%, #ffcc4a 100%)",
  tagline:
    "Limited-overs or Test match. Per innings, enter the team's total runs. Highest aggregate wins. Wickets, overs, batter/bowler figures, run-rate — all out of scope for the scoreboard; track on a separate scorecard.",
  scoring: { direction: "high" },
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Innings", addRound: "Add innings", total: "Total runs" },
});
