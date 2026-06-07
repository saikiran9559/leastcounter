# Hosting and cost

Scorely runs entirely free, and the [`status.yaml`](../status.yaml) roadmap is designed to keep it that way. This doc captures what makes the free path work, where the free path would end, and what to migrate to if usage ever outgrows GitHub Pages.

## Current setup — all free

| Component | Provider | Cost | Limit | Where we sit |
|---|---|---|---|---|
| Hosting | GitHub Pages | $0 | 100 GB/month bandwidth (soft), 1 GB site size, 10 builds/hour | Single-digit MB site, single-digit deploys/day |
| Source code | GitHub | $0 | Unlimited public repos | One repo |
| Static assets | GitHub Pages | $0 | Same as hosting | — |
| PDF library | cdnjs (jsPDF + autoTable) | $0 | Public CDN, no enforced rate limit for normal browser use | One request per page load |
| Persistence | Browser localStorage | $0 | ~5–10 MB per origin | Bytes per saved game |
| Build pipeline | None | $0 | — | We commit source files directly |
| PWA (manifest + service worker) | First-party | $0 | localStorage caps as above | Cache version `scorely-v1` (bump in `sw.js`) |

The 49-game Scorely is a few MB of HTML/CSS/JS plus two CDN script tags (jsPDF + autoTable, optional — only loaded for PDF export). GitHub Pages serves millions of monthly visits at this size without nearing any cap.

Since Phase 9.7, Scorely is also an installable PWA: a service worker caches every same-origin GET so the app keeps working at the lane/court when wifi is sketchy. iOS/Android users can "Add to Home Screen" and run it like a native app. See [conventions.md → PWA](conventions.md#pwa-since-phase-97) for the cache-version workflow.

## Why staying free is a design constraint, not an accident

The free path requires:

1. **Static-only hosting** — no server-side runtime, no scheduled jobs. Everything renders in the browser.
2. **Client-side state** — `localStorage` per origin. No database, no per-user records held by us.
3. **No accounts / no cross-device sync** — each device tracks its own games.
4. **No real-time multiplayer** — games are scored by a single device, passed around physically.

ADRs [`0001-vanilla-no-build-step`](decisions/0001-vanilla-no-build-step.md) and [`0002-engine-first-before-more-games`](decisions/0002-engine-first-before-more-games.md) both reinforce this — vanilla JS keeps the deploy artifact a folder of files, and the shared engine keeps the bundle small per game added.

**When proposing a new feature, ask: does it need a server?** If yes, see the next section before committing to it.

## Where the free path would end

The features below would require leaving pure-static hosting. None are in `status.yaml` today. If a future contributor proposes one, this section is the trigger to revisit hosting strategy:

### Features that need a backend

| Feature | Why it breaks "free" | Cheapest path that stays free at low scale |
|---|---|---|
| Real-time multiplayer (score together across phones) | Needs WebSocket or pub/sub | Firebase Realtime Database / Firestore (Spark plan free until 50k reads / 20k writes per day) |
| User accounts and login | Needs auth server + per-user storage | Firebase Auth / Supabase Auth / Clerk dev tier |
| Cross-device sync of saved games | Needs per-user persisted state | Same as above (Firestore / Supabase) |
| Public leaderboards across users | Needs shared database | Same as above |
| Server-rendered share images | Needs runtime | Cloudflare Workers (100k requests/day free), Vercel Edge Functions free tier |
| Email / push notifications | Needs delivery service | Resend / Postmark free tiers; web push is server-light |

Each of these has a free tier that easily covers single-digit-thousands of daily active users. Past that, paid tiers start at ~$5–25/month per service. **None of this is committed cost** — only triggered if the feature ships.

### Things that cost real money even at small scale

- **Custom domain** (e.g., `scorely.app`) — $10–15/year for the domain, but GitHub Pages serves the domain free. No hosting markup.
- **Email-from-domain** (e.g., `hi@scorely.app`) — $5–10/month for a basic mailbox (Fastmail, ProtonMail) if we ever want a contact email.

### Things that scale free indefinitely

- Bandwidth on GitHub Pages — soft 100 GB/month cap is enforced very gently. Million-visit sites have stayed on it for years.
- localStorage — per-device, no aggregate cost to us.
- Public CDNs (cdnjs, jsdelivr, unpkg) — no usage charge for browser fetches. We can vendor libs locally if a CDN goes away.

## Migration target if GitHub Pages becomes a constraint

If traffic ever pushes GitHub Pages limits (it won't, but for completeness):

**Cloudflare Pages** is the no-cost migration target.

- Same static-deploy model: connect the GitHub repo, builds on push.
- Free tier: unlimited bandwidth, unlimited requests, 500 builds/month, 100 custom domains.
- Same DNS-and-go pattern: point the domain at Cloudflare instead of GitHub Pages.
- Lets us add Cloudflare Workers later if a server-side need emerges without changing hosts.

**Vercel** and **Netlify** are also options but have stricter free-tier limits than Cloudflare Pages.

Migration is a few hours of work: connect the repo, set the deploy target to `/`, change the [`/deploy`](../.claude/commands/deploy.md) command and the [Deployment section of CLAUDE.md](../CLAUDE.md#deployment) to match (per the [`deploy-sync`](../.claude/rules/deploy-sync.md) rule), and DNS swap.

## Summary for contributors

If your change keeps Scorely a static site with client-side state, no cost analysis needed — ship it.

If your change requires a server, accounts, real-time sync, or anything else that breaks the "open a folder of HTML files" model, raise it as an ADR first. The bar is not "is it possible to do for free" (almost always yes via a free tier) but "is the ongoing operational complexity worth what this feature adds."
