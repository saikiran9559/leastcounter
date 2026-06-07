Scorely.defineGame({
  id: "spades",
  name: "Spades",
  icon: "♠️",
  accent: "linear-gradient(135deg, #2a3068 0%, #4ee7ff 100%)",
  tagline:
    "Two teams. Each hand: bid + tricks taken. Made bid = +10/bid + 1/bag. Set = -10/bid. 10 bags = -100. First team to 500 wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 500, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  roundInputs: [
    { key: "bid", label: "Bid", type: "number", min: 0 },
    { key: "tricks", label: "Tricks", type: "number", min: 0 },
  ],
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
  computeTotal(state, playerId) {
    let total = 0;
    let bags = 0;
    for (const r of state.rounds) {
      const e = (r.entries && r.entries[playerId]) || {};
      const bid = Number(e.bid);
      const tricks = Number(e.tricks);
      if (!Number.isFinite(bid) || !Number.isFinite(tricks)) continue;
      if (tricks >= bid) {
        const over = tricks - bid;
        total += bid * 10 + over;
        bags += over;
        while (bags >= 10) {
          total -= 100;
          bags -= 10;
        }
      } else {
        total -= bid * 10;
      }
    }
    return total;
  },
  formatRoundCell(entry) {
    const bid = entry.bid;
    const tricks = entry.tricks;
    if (bid === undefined && tricks === undefined) return "—";
    return `${bid ?? "—"}/${tricks ?? "—"}`;
  },
});
