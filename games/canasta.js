Scorely.defineGame({
  id: "canasta",
  name: "Canasta",
  icon: "🌿",
  accent: "linear-gradient(135deg, #4ade80 0%, #ffcc4a 100%)",
  tagline:
    "Two partners. Per hand, enter melded card points + bonuses (natural canasta 500, mixed 300, each red 3 100, going out 100/200) and subtract any hand-left penalty. First team to 5000 wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 5000, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  roundInputs: [
    { key: "melded", label: "Melded card points", type: "number", min: 0 },
    { key: "naturalBonus", label: "Natural canasta bonus (×500 each)", type: "number", min: 0 },
    { key: "mixedBonus", label: "Mixed canasta bonus (×300 each)", type: "number", min: 0 },
    { key: "redThrees", label: "Red 3s bonus (×100 each)", type: "number", min: 0 },
    { key: "goingOut", label: "Going-out bonus (100 or 200)", type: "number", min: 0 },
    { key: "handPenalty", label: "Hand-left penalty (subtracted)", type: "number", min: 0 },
  ],
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
  computeTotal(state, playerId) {
    let total = 0;
    for (const r of state.rounds) {
      const e = (r.entries && r.entries[playerId]) || {};
      total +=
        (Number(e.melded) || 0) +
        (Number(e.naturalBonus) || 0) +
        (Number(e.mixedBonus) || 0) +
        (Number(e.redThrees) || 0) +
        (Number(e.goingOut) || 0) -
        (Number(e.handPenalty) || 0);
    }
    return total;
  },
  formatRoundCell(entry) {
    if (Object.keys(entry).length === 0) return "—";
    const net =
      (Number(entry.melded) || 0) +
      (Number(entry.naturalBonus) || 0) +
      (Number(entry.mixedBonus) || 0) +
      (Number(entry.redThrees) || 0) +
      (Number(entry.goingOut) || 0) -
      (Number(entry.handPenalty) || 0);
    return String(net);
  },
});
