Scorely.defineGame({
  id: "poker",
  name: "Poker Session",
  icon: "🂠",
  accent: "linear-gradient(135deg, #2a3068 0%, #b46cff 100%)",
  tagline:
    "Cash game ledger. Track buy-ins, rebuys, and cash-outs per player. Net = cash-out − total buy-in.",
  shape: "ledger",
  settings: {
    defaultBuyIn: { label: "Default buy-in", type: "number", default: 20, min: 1 },
  },
  currency: "$",
});
