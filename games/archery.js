Scorely.defineGame({
  id: "archery",
  name: "Archery",
  icon: "🏹",
  accent: "linear-gradient(135deg, #4ade80 0%, #ffcc4a 100%)",
  tagline:
    "Standard 6-arrow ends. Enter each arrow (0–10, X = 10). Engine sums each end and accumulates per archer. Add an end per shot session; reset when the round is over.",
  scoring: { direction: "high" },
  roundInputs: [
    { key: "a1", label: "Arrow 1", type: "number", min: 0, max: 10 },
    { key: "a2", label: "Arrow 2", type: "number", min: 0, max: 10 },
    { key: "a3", label: "Arrow 3", type: "number", min: 0, max: 10 },
    { key: "a4", label: "Arrow 4", type: "number", min: 0, max: 10 },
    { key: "a5", label: "Arrow 5", type: "number", min: 0, max: 10 },
    { key: "a6", label: "Arrow 6", type: "number", min: 0, max: 10 },
  ],
  labels: { round: "End", addRound: "Add end", total: "Total" },
});
