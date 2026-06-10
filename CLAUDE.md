# Scorely

A scoring website for tabletop and sport games. Ships **49 built-in games** (Least Count, UNO, Hearts, Spades, Bridge, Tennis, Bowling, Yahtzee, Mahjong, …) plus a **Game Night Tournament** meta-tracker and an in-app **Create your own** builder for custom games. Live at **https://saikiran9559.github.io/scorely/**.

Repo was renamed from `leastcounter` → `scorely` on 2026-06-07 to reflect the broader multi-game scope. GitHub automatically redirects old URLs, but new links should use the new name.

Static web app (HTML/CSS/JS, no build step). Open `index.html` directly or visit the deployed site. Installable PWA — works offline once cached.

## Roadmap

- **Active plan:** [`status.yaml`](status.yaml) — phased task list. Phases 0–9 are shipped; remaining work is per-game scope follow-ups documented in individual ADRs (Tennis tiebreak, Bowling PDF, Bridge contract calc, Mahjong variant tables, etc.) and per-engine docs.
- **Full game catalog:** [`docs/games.md`](docs/games.md) — every candidate game with scoring shape, complexity tier, and the shared UI pattern it maps to.
- **Architecture overview:** [`docs/architecture.md`](docs/architecture.md) — engines, routes, GameConfig contract.
- **All ADRs:** [`docs/decisions/`](docs/decisions/) — 15 architectural decisions, each one numbered.

## Rules

Project-specific rules that govern how to work on this codebase live in `.claude/rules/`. Consult the relevant rule before making changes in its area; apply its check at the end of any task that triggers it.

- [`deploy-sync`](.claude/rules/deploy-sync.md) — keep `.claude/commands/deploy.md` and the **Deployment** section below in lockstep. Apply at the end of any task that changes deployment.
- [`documentation`](.claude/rules/documentation.md) — write docs in `docs/` for decisions, new games, conventions, and gotchas **without being asked**. The user will not remind you; this rule replaces those reminders. Apply at the end of any non-trivial task.


## Files
- `index.html` — shell + script load order. Includes PWA manifest, iOS meta tags, the global `<datalist id="player-names">`, and the `<button id="sound-toggle">`.
- `styles.css` — shared dark-theme styles + the `@media print` block.
- `manifest.json` + `icon.svg` + `sw.js` — PWA assets (installable + offline).
- `app.js` — bootstrap. Hash routes: `#/` (home), `#/<game-id>` (game), `#/stats`, `#/create-game`. Owns `GAME_CATEGORIES` map, search/chips/recent/favorites UI, rules modal, related-games card, sound-toggle wiring, custom-games hydration.
- **Seven sibling engines** (one per game shape):
  - `engine.js` — rounds (Least Count, UNO, Hearts, Cribbage, Pinochle, Spades, Pitch, 500, 28, Belote, …). Also hosts cross-cutting helpers (favorites, recent, player-names, sound, custom games).
  - `engine-grid.js` — fixed N category cells per player (Wingspan, 7 Wonders, Disc Golf, Yahtzee, Golf, Canasta, Archery).
  - `engine-counter.js` — big +/- buttons (Table Tennis, Pickleball, Badminton, Volleyball, Catan, Pool, Codenames, Whist rubber, Snooker, Tournament).
  - `engine-ledger.js` — buy-ins / cash-out / net P&L (Poker, Teen Patti).
  - `engine-tennis.js` — nested points/games/sets/match with deuce/AD.
  - `engine-bowling.js` — 10 frames with strike/spare carry-over.
  - `engine-darts-cricket.js` — marks matrix (15–20 + Bull).
- `games-rules.js` — central `Scorely.rules` map (3–5 bullets per game) consumed by the rules popover.
- `games/<slug>.js` — one file per game; each calls `Scorely.defineGame({...})` to register a config.

Full architecture and the GameConfig contract live in [`docs/architecture.md`](docs/architecture.md). Engine API rationale is captured in [ADR 0003](docs/decisions/0003-engine-api.md); subsequent engine ADRs explain each sibling.

## State and storage

Per-game state: `scorely:<game-id>:v1` (e.g., `scorely:least-count:v1`). The Least Count instance reads a one-time fallback from the legacy `leastcounter:v1` key.

Cross-cutting state (added during Phase 9):

| Key | Purpose |
|---|---|
| `scorely:player-names:v1` | Global player-name dictionary (autocomplete across games) |
| `scorely:recent:v1` | `{ gameId: lastOpenedAt }` for the home "Recent" row |
| `scorely:home-search:v1` | Last search query on the home grid |
| `scorely:home-categories:v1` | Active category chip filter |
| `scorely:favorites:v1` | Array of starred game ids (pinned to home "Favorites") |
| `scorely:sound:v1` | `"on"` / `"off"` for the sound-effects toggle (default off) |
| `scorely:custom-games:v1` | Array of user-built game configs (rehydrated on load) |

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
