# Scorely

A scoring website for tabletop and sport games. Currently ships **Least Count**; planned games are catalogued in [`docs/games.md`](docs/games.md).

Repo was renamed from `leastcounter` → `scorely` on 2026-06-07 to reflect the broader multi-game scope. GitHub automatically redirects old URLs, but new links should use the new name.

Static web app (HTML/CSS/JS, no build step). Open `index.html` directly or visit the deployed site.

## Roadmap

The long-term vision is a scoring website for many tabletop/sport games, not just Least Count.

- **Active plan:** [`status.yaml`](status.yaml) — phased task list (current phase, next-up task, dependencies). Update this whenever a phase or task changes status.
- **Full game catalog:** [`docs/games.md`](docs/games.md) — every candidate game with scoring shape, complexity tier, and the shared UI pattern it maps to.

## Rules

Project-specific rules that govern how to work on this codebase live in `.claude/rules/`. Consult the relevant rule before making changes in its area; apply its check at the end of any task that triggers it.

- [`deploy-sync`](.claude/rules/deploy-sync.md) — keep `.claude/commands/deploy.md` and the **Deployment** section below in lockstep. Apply at the end of any task that changes deployment.
- [`documentation`](.claude/rules/documentation.md) — write docs in `docs/` for decisions, new games, conventions, and gotchas **without being asked**. The user will not remind you; this rule replaces those reminders. Apply at the end of any non-trivial task.

## Files
- `index.html` — shell (header, #app container, script tags)
- `styles.css` — shared styles (home + all games)
- `app.js` — bootstrap: hash router (`#/`, `#/<game-id>`) + home screen
- `engine.js` — generic scoring engine (state, actions, rendering, persistence, animations, PDF export)
- `games/<slug>.js` — one file per game; each calls `Scorely.defineGame({...})` to register a config

Full architecture and the engine API contract live in [`docs/architecture.md`](docs/architecture.md). Engine API rationale is captured in [ADR 0003](docs/decisions/0003-engine-api.md).

Per-game state is persisted to `localStorage` under `scorely:<game-id>:v1` (e.g., `scorely:least-count:v1`). The Least Count instance reads a one-time fallback from the legacy `leastcounter:v1` key if its namespaced key is missing.

## Deployment

Live at **https://saikiran9559.github.io/scorely/** — GitHub Pages serving `main` branch root.

**To deploy, run the `/deploy` slash command in Claude Code.** It is defined at `.claude/commands/deploy.md` and automates the account switch + credential setup + push + build verification. The sections below document the same steps for reference.

> Any change to deployment must satisfy the [`deploy-sync`](.claude/rules/deploy-sync.md) rule — update **both** this section and `.claude/commands/deploy.md` in the same change.

### Deploy account
The repo lives under the **`saikiran9559`** GitHub account, not `saikiran-jetti9`. Both accounts are present in `gh auth status`. Before any deploy-related `gh` or `git push` operation:

```bash
gh auth switch -u saikiran9559
gh auth setup-git --hostname github.com   # re-points git credential helper at active token
gh auth status                            # verify active = saikiran9559
```

**Why both commands:** `gh auth switch` flips the active gh user, but the git credential helper continues to send the previously-cached token until `gh auth setup-git` is re-run. Skipping step 2 results in `Permission to saikiran9559/scorely.git denied to saikiran-jetti9` on push.

### Git commit identity
This repo is pinned locally to:
- `user.name = saikiran9559`
- `user.email = saikiran9559@users.noreply.github.com`

Run `git config --local --get user.name` to confirm. Do not commit under the work identity (`saikiran@techatcore.com`).

### Initial deploy (already done)
For reference, the steps that created the live site:

```bash
# 1. Initialize repo and commit
git init
git add index.html styles.css app.js
git commit -m "Initial scoreboard"
git branch -M main

# 2. Ensure correct gh account is active
gh auth switch -u saikiran9559

# 3. Create public repo and push
gh repo create scorely --public --source=. --remote=origin \
  --description "Scoring website for tabletop and sport games" --push

# 4. Enable GitHub Pages from main branch root
gh api -X POST repos/saikiran9559/scorely/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

First build takes 30–90 seconds. Poll the URL until it returns 200.

### Subsequent deploys
Pages rebuilds automatically on push to `main`:

```bash
gh auth switch -u saikiran9559   # if not already active
git add <files>
git commit -m "..."
git push
```

Build status: `gh api repos/saikiran9559/scorely/pages/builds/latest`

## PDF export
Uses jsPDF + jspdf-autotable from cdnjs. Requires internet on first load (browser caches afterward). If offline use is needed, vendor the libs locally and update the `<script>` src in `index.html`.
