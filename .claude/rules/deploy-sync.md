# Rule: deploy-sync

Keep the `/deploy` slash command (`.claude/commands/deploy.md`) and the **Deployment** section of `CLAUDE.md` in lockstep. They describe the same workflow from two angles — the command is what gets executed, the docs are what humans read — and they must never disagree.

## When this rule applies

Run the check at the **end of any task that touches deployment**. A task counts as touching deployment if it changes any of the following:

- The hosting target (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.)
- The GitHub account, repo name, or remote URL
- The branch or path GitHub Pages serves from
- The git commit identity convention for this repo
- Build, bundling, or vendoring steps (e.g., moving CDN scripts to local files)
- Pre-deploy checks (lint, tests, smoke tests added before push)
- Newly discovered deploy gotchas worth documenting
- The contents of `.claude/commands/deploy.md` or the **Deployment** section of `CLAUDE.md`

Also run the check whenever the user explicitly asks for a deploy-related change ("change the deploy account", "add a build step", "switch to Netlify", etc.).

## The check

For the change that just happened, walk through each of these and answer yes/no:

1. **Account / credentials:** Does `/deploy` still reference the correct GitHub account and the `gh auth switch` + `gh auth setup-git` sequence that matches reality? Does `CLAUDE.md` describe the same account?
2. **Commands sequence:** Are the actual shell commands in `/deploy` identical (modulo prose) to what `CLAUDE.md` describes under **Deployment**?
3. **Live URL:** Do both files reference the same live URL?
4. **Branch + path:** Do both files agree on which branch and path GitHub Pages (or replacement host) serves from?
5. **Gotchas:** If a new failure mode was discovered, is it documented in both files (or at minimum in `CLAUDE.md` with a pointer from `/deploy`)?
6. **Build step:** If anything happens between `git push` and the site being live (a build, a bundling step, a CI workflow), is it documented in both files?

If the answer to any question is "no", the change is **incomplete** — update the missing file in the same response (and commit) as the original change. Do not report the task as done until both files agree.

## Failure mode this rule prevents

Without this rule, it is easy to update `CLAUDE.md` (because the user asked you to "update the docs") while leaving `/deploy` doing the old thing, or to fix `/deploy` (because it broke) without updating the human-readable docs. Either drift means the next deploy follows stale instructions and silently does the wrong thing.

## Cross-references

- The command this rule guards: `.claude/commands/deploy.md`
- The docs this rule guards: the **Deployment** section of `CLAUDE.md`
- Related project memory: `deploy-account` (which account the project deploys to)
