# Least Count Scoreboard

Static web app (HTML/CSS/JS, no build step) for tracking scores in the Least Count card game. Open `index.html` directly or visit the deployed site.

## Files
- `index.html` — markup and CDN script tags (jsPDF + autoTable for export)
- `styles.css` — dark-theme UI
- `app.js` — state, rendering, localStorage persistence, PDF export

State is held in a single `state` object (`limit`, `players[]`, `rounds[]`) and persisted to `localStorage` under the key `leastcounter:v1`.

## Deployment

Live at **https://saikiran9559.github.io/leastcounter/** — GitHub Pages serving `main` branch root.

**To deploy, run the `/deploy` slash command in Claude Code.** It is defined at `.claude/commands/deploy.md` and automates the account switch + credential setup + push + build verification. The sections below document the same steps for reference.

> If you change anything about deployment (account, host, build step, etc.), update **both** this section and `.claude/commands/deploy.md` so they don't drift.

### Deploy account
The repo lives under the **`saikiran9559`** GitHub account, not `saikiran-jetti9`. Both accounts are present in `gh auth status`. Before any deploy-related `gh` or `git push` operation:

```bash
gh auth switch -u saikiran9559
gh auth setup-git --hostname github.com   # re-points git credential helper at active token
gh auth status                            # verify active = saikiran9559
```

**Why both commands:** `gh auth switch` flips the active gh user, but the git credential helper continues to send the previously-cached token until `gh auth setup-git` is re-run. Skipping step 2 results in `Permission to saikiran9559/leastcounter.git denied to saikiran-jetti9` on push.

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
git commit -m "Initial Least Count scoreboard"
git branch -M main

# 2. Ensure correct gh account is active
gh auth switch -u saikiran9559

# 3. Create public repo and push
gh repo create leastcounter --public --source=. --remote=origin \
  --description "Least Count card game scoreboard" --push

# 4. Enable GitHub Pages from main branch root
gh api -X POST repos/saikiran9559/leastcounter/pages \
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

Build status: `gh api repos/saikiran9559/leastcounter/pages/builds/latest`

## PDF export
Uses jsPDF + jspdf-autotable from cdnjs. Requires internet on first load (browser caches afterward). If offline use is needed, vendor the libs locally and update the `<script>` src in `index.html`.
