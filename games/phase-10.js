Scorely.defineGame({
  id: "phase-10",
  name: "Phase 10",
  tagline:
    "Complete 10 phases in order. First to finish phase 10 wins; lowest score breaks ties.",
  settings: {
    phaseTarget: {
      label: "Phases to complete",
      type: "number",
      default: 10,
      min: 1,
    },
  },
  scoring: {
    direction: "low",
    endCondition: "progress-reach",
    progressKey: "phaseComplete",
    thresholdKey: "phaseTarget",
  },
  roundInputs: [
    { key: "score", label: "Score", type: "number", min: 0 },
    { key: "phaseComplete", label: "Completed phase", type: "checkbox" },
  ],
  progressNoun: "Phase",
});
