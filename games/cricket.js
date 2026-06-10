Scorely.defineGame({
  id: "cricket",
  name: "Cricket (Match)",
  icon: "🏏",
  accent: "linear-gradient(135deg, #4ade80 0%, #ffcc4a 100%)",
  tagline:
    "Limited-overs or Test match. Per innings, enter runs and wickets. Highest total wins. Track multiple innings per team.",
  shape: "cricket",
  scoring: { direction: "high" },
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  settings: {
    format: {
      label: "Match Format",
      type: "select",
      options: [
        { value: "test", label: "Test (5 days)" },
        { value: "odi", label: "ODI (50 overs)" },
        { value: "t20", label: "T20 (20 overs)" },
        { value: "custom", label: "Custom" },
      ],
      default: "odi",
    },
  },
  labels: { 
    round: "Innings",
    addRound: "Record innings",
    total: "Total runs",
  },
});
