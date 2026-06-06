# Least Count Scoreboard

Static web app (HTML/CSS/JS, no build step) for tracking scores in the Least Count card game. Open `index.html` directly or visit the deployed site.

## Files
- `index.html` — markup and CDN script tags (jsPDF + autoTable for export)
- `styles.css` — dark-theme UI
- `app.js` — state, rendering, localStorage persistence, PDF export

State is held in a single `state` object (`limit`, `players[]`, `rounds[]`) and persisted to `localStorage` under the key `leastcounter:v1`.

## Deployment

Live at **https://saikiran9559.github.io/leastcounter/** — GitHub Pages serving `main` branch root.

### Deploy account
The repo lives under the **`saikiran9559`** GitHub account, not `saikiran-jetti9`. Both accounts are present in `gh auth status`. Before any deploy-related `gh` or `git push` operation, switch active account:

```bash
gh auth switch -u saikiran9559
```

Verify with `gh auth status` — the active account line should show `saikiran9559`.

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
