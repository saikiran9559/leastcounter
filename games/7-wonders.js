Scorely.defineGame({
  id: "7-wonders",
  name: "7 Wonders",
  icon: "🏛️",
  accent: "linear-gradient(135deg, #ffcc4a 0%, #ff5d83 100%)",
  tagline:
    "End-game scoring calculator. Tally each of the seven categories — science scoring (1+4+9+...+7 per set) is left to you.",
  shape: "grid",
  categories: [
    { key: "military",  label: "Military (red)" },
    { key: "treasury",  label: "Treasury (coins/3)" },
    { key: "wonders",   label: "Wonders" },
    { key: "civilian",  label: "Civilian (blue)" },
    { key: "science",   label: "Science (green, computed)" },
    { key: "commerce",  label: "Commerce (yellow)" },
    { key: "guilds",    label: "Guilds (purple)" },
  ],
  scoring: { direction: "high" },
});
