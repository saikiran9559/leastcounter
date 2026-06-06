---
description: Deploy the Least Count scoreboard to GitHub Pages (saikiran9559/leastcounter)
---

Deploy the current working tree to GitHub Pages. Live URL: https://saikiran9559.github.io/leastcounter/

Follow these steps in order. Stop and report to the user if any step fails.

## 1. Verify and switch GitHub account

The repo is under the `saikiran9559` account, not `saikiran-jetti9`. Run both commands — the second one is required even if `saikiran9559` is already active, because the git credential helper caches the previously-used token.

```bash
gh auth switch -u saikiran9559
gh auth setup-git --hostname github.com
gh auth status
```

Confirm the `active: true` line shows `saikiran9559`. If it doesn't, stop and tell the user.

## 2. Check working tree state

```bash
git status --short
git log origin/main..HEAD --oneline 2>/dev/null || echo "(no unpushed commits)"
```

- If there are no uncommitted changes AND no unpushed commits, tell the user there's nothing to deploy and stop.
- If there are uncommitted changes, ask the user for a commit message (or propose one based on the diff). Then stage explicit files (NOT `git add -A`) and commit.
- If there are only unpushed commits, skip to step 3.

Local git config is pinned to `saikiran9559 <saikiran9559@users.noreply.github.com>` for this repo — don't override with `-c` flags. Confirm with `git config --local --get user.name` if uncertain.

## 3. Push to main

```bash
git push
```

GitHub Pages rebuilds automatically on push to `main`. Builds take 30–90 seconds.

## 4. Wait for the rebuild and confirm

```bash
gh api repos/saikiran9559/leastcounter/pages/builds/latest --jq '.status, .commit, .error.message'
```

Poll until `status` is `built`. Then verify the site responds:

```bash
curl -sf -o /dev/null -w "%{http_code}\n" https://saikiran9559.github.io/leastcounter/
```

Expect `200`. Report the live URL to the user.

## Notes

- The full deploy rationale (why two-step gh switch, why this account) lives in `CLAUDE.md` at the repo root.
- If the deploy process changes — different account, different host, build step added, etc. — apply the [`deploy-sync`](../rules/deploy-sync.md) rule: update **this file** alongside the **Deployment** section of `CLAUDE.md` in the same change.
