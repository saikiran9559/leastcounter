Scorely.defineGame({
  id: "500",
  name: "500",
  icon: "💯",
  accent: "linear-gradient(135deg, #ff5d83 0%, #ffcc4a 100%)",
  tagline:
    "Two teams. Per hand: bid value (40 = 6♠, 120 = 6NT, 140 = 7♠, …, 250 = misère, 500 = open misère) + tricks taken. Made bid → +bid value. Set → −bid value. Non-bidders → +10 × tricks. First team to 500 wins; first to −500 loses.",
  settings: {
    target: { label: "Target score", type: "number", default: 500, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  roundInputs: [
    { key: "bid", label: "Bid value (0 if not bidder)", type: "number", min: 0 },
    { key: "tricksTaken", label: "Tricks taken", type: "number", min: 0 },
  ],
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
  computeTotal(state, playerId) {
    let total = 0;
    for (const r of state.rounds) {
      const e = (r.entries && r.entries[playerId]) || {};
      const bid = Number(e.bid) || 0;
      const tricks = Number(e.tricksTaken) || 0;
      if (bid > 0) {
        let made;
        if (bid === 250 || bid === 500) made = tricks === 0;
        else made = tricks >= Math.floor((bid - 40) / 100) + 6;
        total += made ? bid : -bid;
      } else {
        total += tricks * 10;
      }
    }
    return total;
  },
  formatRoundCell(entry) {
    const bid = Number(entry.bid) || 0;
    const tricks = Number(entry.tricksTaken);
    if (bid === 0 && !Number.isFinite(tricks)) return "—";
    if (bid > 0) {
      return `bid ${bid} · ${Number.isFinite(tricks) ? tricks + "t" : "—"}`;
    }
    return Number.isFinite(tricks) ? `${tricks}t` : "—";
  },
});
