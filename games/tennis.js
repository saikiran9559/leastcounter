Scorely.defineGame({
  id: "tennis",
  name: "Tennis",
  icon: "🎾",
  accent: "linear-gradient(135deg, #4ade80 0%, #ffcc4a 100%)",
  tagline:
    "Best-of-3 sets. Tap +Point each rally. Deuce/advantage handled. At 6-6 plays advantage set (no tiebreak in this MVP).",
  shape: "tennis",
  settings: {
    setsToWin: { label: "Sets to win match", type: "number", default: 2, min: 1 },
    gamesToWinSet: { label: "Games per set", type: "number", default: 6, min: 1 },
  },
  defaultPlayers: ["Player 1", "Player 2"],
});
