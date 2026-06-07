Scorely.defineGame({
  id: "teen-patti",
  name: "Teen Patti",
  icon: "🪙",
  accent: "linear-gradient(135deg, #ff5d83 0%, #ffcc4a 100%)",
  tagline:
    "Indian poker variant. Bankroll ledger — track each player's buy-ins and cash-out at session end.",
  shape: "ledger",
  settings: {
    defaultBuyIn: { label: "Default buy-in (₹)", type: "number", default: 100, min: 1 },
  },
  currency: "₹",
});
