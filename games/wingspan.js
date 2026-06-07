Scorely.defineGame({
  id: "wingspan",
  name: "Wingspan",
  icon: "🦅",
  accent: "linear-gradient(135deg, #4ade80 0%, #4ee7ff 100%)",
  tagline:
    "End-game scoring calculator. Sum your birds, bonus cards, end-of-round goals, eggs, food, and tucked cards.",
  shape: "grid",
  categories: [
    { key: "birds",  label: "Birds" },
    { key: "bonus",  label: "Bonus cards" },
    { key: "eor",    label: "End-of-round goals" },
    { key: "eggs",   label: "Eggs" },
    { key: "food",   label: "Food on cards" },
    { key: "tucked", label: "Tucked cards" },
  ],
  scoring: { direction: "high" },
});
