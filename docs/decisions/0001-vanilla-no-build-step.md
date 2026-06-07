# 0001 — Use vanilla HTML/CSS/JS with no build step

**Date:** 2026-06-06
**Status:** Accepted

## Context

Scorely started as a single-page scoreboard for the Least Count card game. The app is small, the audience is friends/family on phones, and the deployment target is GitHub Pages serving static files from the `main` branch root. The repo has no team gate, no design system to inherit, and no need to interop with anything external. Future scope (per [`docs/games.md`](../games.md)) is more scoring tools, all small and largely independent.

The decision was between three classes of stack:

1. **Vanilla HTML/CSS/JS** — single `index.html` + `styles.css` + `app.js`, opened directly or served as static files.
2. **React + Vite** — JSX components, a bundler, a dev server.
3. **Next.js or similar framework** — routing, SSG, ecosystem batteries.

## Decision

Use **vanilla HTML/CSS/JS with no build step.** All source files are directly servable; `index.html` works opened from the filesystem.

State is held in a single `state` object in `app.js`, rendered to the DOM by manually-written functions, and persisted to `localStorage`. CDN script tags are used for third-party libraries (currently jsPDF + jspdf-autotable for export).

## Alternatives considered

- **React + Vite** — rejected for now. Would add a build step, a `package.json`, a `node_modules`, and a deployment pipeline change (build artifacts → `gh-pages` branch or `dist/`). The app is small enough that JSX wouldn't materially reduce code, and the friction of "must run `npm install` to contribute" raises the floor for casual edits.
- **Next.js / SvelteKit / similar** — rejected. Routing, SSR, and the ecosystem are dead weight for a static scoreboard.
- **Web Components / Lit** — considered briefly. Lit would compose well across multiple games. Deferred — revisit if/when extracting the shared scoring engine, since that's the point at which component reuse starts to pay off.

## Consequences

**Easier:**
- Zero-friction edits: any contributor can open `index.html` in a browser and start hacking.
- Deploy is `git push` — Pages serves the source files directly. No build artifacts to track.
- Inspection is direct: no source maps needed; view-source matches the running code.

**Harder:**
- No type safety, no JSX, no component model. Every render rebuilds DOM by hand.
- Multi-game support will eventually need *some* abstraction (likely a shared `engine.js`). When we add the second game, we'll have to decide whether to stay vanilla (probable) or introduce light tooling.
- Third-party libs come from CDNs, which means the app needs internet on first load. If we want offline support later, we'll need to vendor them locally — see `index.html`'s `<script>` tags.

**Implications for contributors:**
- Don't add a build step casually. If you find yourself reaching for one, write a new ADR superseding this one with the justification.
- Storage keys are namespaced as `scorely:<game>:v1` for future games (the current `leastcounter:v1` key is grandfathered).
- New games should be added as self-contained sections of `app.js` or a separate file loaded via `<script>` tag, not as ES modules requiring a bundler.
