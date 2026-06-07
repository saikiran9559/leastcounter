Scorely.defineGame({
  id: "pitch",
  name: "Pitch (Setback)",
  icon: "🪃",
  accent: "linear-gradient(135deg, #b46cff 0%, #ffcc4a 100%)",
  tagline:
    "Two teams, 4 bonuses (High, Low, Jack, Game) up for grabs each hand. Bidder must score ≥ bid or loses the bid. Non-bidders always get their bonus points. First team to 11 wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 11, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  roundInputs: [
    { key: "bid", label: "Bid (0 if not bidder)", type: "number", min: 0 },
    { key: "points", label: "Bonuses won", type: "number", min: 0 },
  ],
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
  computeTotal(state, playerId) {
    let total = 0;
    for (const r of state.rounds) {
      const e = (r.entries && r.entries[playerId]) || {};
      const bid = Number(e.bid);
      const points = Number(e.points);
      if (!Number.isFinite(points)) continue;
      if (Number.isFinite(bid) && bid > 0) {
        total += points >= bid ? points : -bid;
      } else {
        total += points;
      }
    }
    return total;
  },
  formatRoundCell(entry) {
    const bid = entry.bid;
    const points = entry.points;
    if (bid === undefined && points === undefined) return "—";
    if (Number.isFinite(Number(bid)) && Number(bid) > 0) {
      return `bid ${bid} · ${points ?? 0}`;
    }
    return String(points ?? 0);
  },
});
