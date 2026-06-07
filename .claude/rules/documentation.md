# Rule: documentation

Write documentation in `docs/` **without being asked**. The user will not remind you. This repo is built collaboratively with Claude across multiple contributors' machines — anything that lives only in conversation context is lost the moment that session ends. Decisions, architecture, and non-obvious behavior must land in `docs/` for future Claude sessions and human contributors to find.

## When this rule applies (self-triggering)

At the **end of any non-trivial task**, before declaring the task done, ask yourself: *"did this task involve a decision, an architectural choice, a new file/feature, or a non-obvious constraint that a future contributor (or future Claude) would need to know?"* If the answer is yes, write the doc in the same change as the code.

Specific triggers — write/update docs whenever you:

1. **Make an architectural decision** — choosing a library, choosing between approaches the user offered, picking a data shape, naming a key concept, deciding on a file layout. → write an ADR in `docs/decisions/`.
2. **Add a new game** (or a new top-level feature) — explain its scoring rules, the win condition, what state it tracks, and which engine/pattern from `docs/games.md` it uses. → add a file in `docs/games/<game-name>.md` and link from `docs/games.md`.
3. **Extract or refactor a shared module** (e.g., the round-tracking engine) — document its API, the assumptions it makes, and which games consume it. → update or create `docs/architecture.md`.
4. **Introduce a non-obvious constraint or convention** — storage-key naming, animation policy, browser support targets, accessibility requirements, build/deploy gotchas. → add to `docs/conventions.md` or the relevant existing doc.
5. **Discover something surprising while debugging** — a browser quirk, a CDN behavior, a localStorage limit, a Pages-build gotcha. → add to `docs/gotchas.md`.
6. **Roadmap or scope change** — new games added/removed from the plan, prioritization changes. → update `docs/games.md`.
7. **Change anything that contradicts an existing doc** — find the doc, update it. Stale docs are worse than missing docs.

If a task touches deployment, the [`deploy-sync`](deploy-sync.md) rule also applies. Both rules can fire on the same task.

## Where to write

```
docs/
├── README.md              — index of what's in this folder; keep it short
├── games.md               — catalog of games (current + planned)
├── games/                 — per-game design notes (one file per game)
├── architecture.md        — high-level structure, modules, data flow
├── conventions.md         — naming, storage keys, animation policy, etc.
├── gotchas.md             — surprises, browser quirks, deploy traps
└── decisions/             — ADRs, one file per decision
    └── NNNN-slug.md       — zero-padded sequence, kebab-case slug
```

Don't create a sub-file until you actually have content for it. `architecture.md` only needs to exist once there's architecture worth describing. But once it's needed, write it — don't keep it in your head.

## Decision record format (ADRs)

Lightweight. One markdown file per decision in `docs/decisions/`. Sequence number, slug, and these sections:

```markdown
# NNNN — Title of the decision

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded by NNNN | Reversed

## Context
What was the situation? What forced a choice?

## Decision
What did we decide? State it as a fact, not a maybe.

## Alternatives considered
What else was on the table, and why was it rejected?

## Consequences
What does this make easy? What does it make harder? What follow-up work does it imply?
```

If a decision is later reversed or superseded, don't delete the file — update its `Status:` line and add a forward reference. The history is itself useful documentation.

## What NOT to write

- Don't restate what the code already says. If a function is named `addPlayer` and adds a player, no doc needed.
- Don't write tutorials for things that aren't yet built.
- Don't create empty placeholder files "for future use".
- Don't paste large code snippets — link to the file/line instead.
- Don't write docs that will be wrong in a week (e.g., "the current bug" — that's a commit message, not a doc).

## How to enforce yourself

Before reporting any non-trivial task as done, run this mental checklist:

1. Did I make a decision that wasn't obvious from the code alone? → ADR.
2. Did I add a feature, file, or pattern? → update/create the relevant `docs/*.md`.
3. Did I contradict something already in `docs/`? → update the existing doc.
4. Could a contributor opening this repo cold understand *why* the code is shaped this way? If no, write the missing context.

If you skipped documentation for a task that warranted it, the task is **incomplete**. Treat it the same as code that compiles but doesn't work — go back and finish it before handing off to the user.

The user has explicitly stated: *they will not remind you*. This rule replaces those reminders.

## Cross-references

- The index of all documentation lives at [`docs/README.md`](../../docs/README.md).
- The related sync rule for deployment-specific docs: [`deploy-sync`](deploy-sync.md).
