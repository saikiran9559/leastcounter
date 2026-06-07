Scorely.defineGame({
  id: "28",
  name: "28 / 29 / 56",
  icon: "🎋",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #4ade80 100%)",
  tagline:
    "Indian partnership trick-taking. Per hand: bid (14–28 for 28; 15–29 for 29; 28–56 for 56) and card points won. Bidder team scores ±1 game-point per hand; defenders score +1 when they set the bidder. First team to the target wins.",
  settings: {
    target: { label: "Game-points to win match", type: "number", default: 5, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  roundInputs: [
    { key: "bid", label: "Bid (0 if not bidder)", type: "number", min: 0 },
    { key: "points", label: "Card points won", type: "number", min: 0 },
  ],
  playerNoun: "Team",
  defaultPlayers: ["Team 1", "Team 2"],
  labels: { round: "Hand", addRound: "Add hand", total: "Total" },
  computeTotal(state, playerId) {
    const otherTeam = state.players.find((p) => p.id !== playerId);
    if (!otherTeam) return 0;
    let total = 0;
    for (const r of state.rounds) {
      const me = (r.entries && r.entries[playerId]) || {};
      const them = (r.entries && r.entries[otherTeam.id]) || {};
      const myBid = Number(me.bid) || 0;
      const theirBid = Number(them.bid) || 0;
      if (myBid > 0) {
        const myPoints = Number(me.points) || 0;
        total += myPoints >= myBid ? 1 : -1;
      } else if (theirBid > 0) {
        const theirPoints = Number(them.points) || 0;
        if (theirPoints < theirBid) total += 1;
      }
    }
    return total;
  },
  formatRoundCell(entry) {
    const bid = Number(entry.bid) || 0;
    const points = Number(entry.points);
    if (bid > 0) return `bid ${bid} · ${Number.isFinite(points) ? points : "—"}`;
    if (Number.isFinite(points)) return String(points);
    return "—";
  },
});
