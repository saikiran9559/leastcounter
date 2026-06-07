Scorely.defineGame({
  id: "president",
  name: "President",
  icon: "👔",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #ff5d6c 100%)",
  tagline:
    "Shedding-card game. Each round, every player enters their finishing position (1 = President, 2 = VP, … N = Scum). Lowest cumulative rank wins the night.",
  scoring: { direction: "low" },
  labels: { round: "Round", addRound: "Add round", total: "Total rank" },
});
