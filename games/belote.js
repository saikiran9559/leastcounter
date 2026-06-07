Scorely.defineGame({
  id: "belote",
  name: "Belote",
  icon: "🇫🇷",
  accent: "linear-gradient(135deg, #6a82ff 0%, #ff5d83 100%)",
  tagline:
    "French partnership trick-taking. Each hand has 162 card points (incl. dix-de-der). Caller team must take ≥82 to make. Made → keep your points; set → opponents get all 162. Declarations (belote, sequences, carré) added manually. First team to the target wins.",
  settings: {
    target: { label: "Target score", type: "number", default: 1001, min: 1 },
  },
  scoring: {
    direction: "high",
    endCondition: "target-reach",
    thresholdKey: "target",
  },
  roundInputs: [
    { key: "declared", label: "Declared trump", type: "checkbox" },
    { key: "points", label: "Card points won (0–162)", type: "number", min: 0, max: 162 },
    { key: "extras", label: "Declarations / belote bonus", type: "number", min: 0 },
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
      const iDecl = !!me.declared;
      const tDecl = !!them.declared;
      const myPoints = Number(me.points) || 0;
      const theirPoints = Number(them.points) || 0;
      const myExtras = Number(me.extras) || 0;
      const theirExtras = Number(them.extras) || 0;

      if (iDecl) {
        total += myPoints >= 82 ? myPoints + myExtras : 0 + myExtras;
      } else if (tDecl) {
        total += theirPoints >= 82 ? myPoints + myExtras : 162 + myExtras;
      } else {
        total += myPoints + myExtras;
      }
    }
    return total;
  },
  formatRoundCell(entry) {
    const points = Number(entry.points);
    const extras = Number(entry.extras) || 0;
    const declared = !!entry.declared;
    if (!Number.isFinite(points) && !declared && extras === 0) return "—";
    const marker = declared ? "★ " : "";
    const extrasStr = extras ? ` (+${extras})` : "";
    return `${marker}${Number.isFinite(points) ? points : 0}${extrasStr}`;
  },
});
