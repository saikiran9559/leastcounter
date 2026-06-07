# Conventions

Project-wide conventions for code, design, and naming. If you change one of these, update this doc in the same commit.

## Visual design — gaming aesthetic, not productivity aesthetic

Scorely is a scoreboard for *games*. The UI should feel kinetic and a little playful, not enterprise-clean. Vibrancy + motion + bold type, balanced against legibility for the actual numbers.

### Palette

Defined in `:root` of `styles.css`. Use the variables — never hardcode hex.

| Token | Hex | Use |
|---|---|---|
| `--bg-0` | `#07091a` | Page background |
| `--card`, `--card-2` | `#161a3a`, `#1c2150` | Card surfaces (gradient between them) |
| `--text` | `#f0f3ff` | Primary text |
| `--text-dim` | `#c5cce8` | Secondary text |
| `--muted` | `#8590bb` | Labels, captions |
| `--accent` | `#7c8eff` | Primary brand accent |
| `--accent-2` | `#b46cff` | Secondary accent (gradients) |
| `--accent-3` | `#4ee7ff` | Tertiary accent (cyan, flash highlights) |
| `--hot` | `#ff5d83` | High-energy accent (UNO, celebrations) |
| `--good` | `#4ade80` | Leader / winner |
| `--gold` | `#ffcc4a` | Confetti, special highlights |
| `--danger` | `#ff5d6c` | Destructive (reset, OUT) |

Brand gradient (`--grad-brand`) — `#7c8eff → #b46cff → #ff5d83`. Used for the Scorely wordmark and primary button gradient.

### Typography

- **Display font:** Bricolage Grotesque (Google Fonts), weights 600–800. Used for headings, totals, banner text. Tighten letter-spacing slightly (`-0.01em` to `-0.02em`).
- **Body font:** Inter, weights 400–700.
- **Numerals:** every column of scores uses `font-variant-numeric: tabular-nums` so digits line up.

Totals row uses display font at `1.6rem 800` — scores should feel like the focal point of the page.

### Motion

Animations are reactive (trigger on real state changes), not decorative-on-load loops. The `prevSnapshot` diffing in `engine.js` already enforces this — preserve it.

The set we have today:
- `fade-slide-up` on card entrance
- `pop-in` on new player chip
- `slide-in-row` on new round
- `total-flash` when a total changes
- `winner-pop` + `winner-shimmer` for the banner
- `confetti-fall` (one-shot, fired by `Scorely.fireConfetti()` only when a winner first appears)
- `leader-pulse` on the leading player in status list (subtle continuous glow)
- `bg-drift` (background mesh, slow continuous)
- `shake-out` (one-shot, when a player crosses the threshold and becomes OUT)

`prefers-reduced-motion: reduce` disables everything via a global rule at the top of `styles.css`. Don't add animations that bypass that.

### Per-game identity

Every game config declares an `icon` (single emoji) and an `accent` (CSS background, usually a linear-gradient). These appear:

- On the home grid card (icon in a colored badge top-left).
- On the game page header (icon in a larger badge alongside the title).

Keep icons single-glyph and recognizable; avoid emoji combos that don't render consistently across platforms (e.g. don't combine with ZWJ unless tested).

Pick accents that pair well with the dark background — saturated mid-tones, two-stop gradients. Avoid pure white or near-black stops.

### What NOT to do

- Don't add a light theme. Dark is the brand.
- Don't introduce sound effects without an explicit user opt-in flag.
- Don't add fonts beyond Bricolage Grotesque + Inter without an ADR — each font is a CDN dependency and a paint cost.
- Don't move spacing tokens out of CSS variables; consolidate first if you need a new scale.
- Don't reach for animation libraries (GSAP, Motion One). CSS keyframes + the snapshot-diff trigger pattern is sufficient and keeps us build-step-free per [ADR 0001](decisions/0001-vanilla-no-build-step.md).

## Code conventions

### Files
- `engine.js` is the only file that mutates state. Game configs are pure data + minimal callbacks. Routers/views don't write state.
- New games: one file in `games/<slug>.js`, register via `Scorely.defineGame({...})`, add a `<script src>` tag in `index.html` *before* `app.js`.

### Storage keys
- Per-game state: `scorely:<game-id>:v1`. The `:v1` suffix is reserved for state-shape migration; bump to `:v2` and write a migrator if the shape changes incompatibly.
- Cross-cutting (Phase 9): `scorely:<purpose>:v1` where purpose is not a game id.
  - `scorely:player-names:v1` — global player name dictionary (autocomplete across games)
  - `scorely:recent:v1` — `{ gameId: lastOpenedAt }` map for the home "Recent" row
  - `scorely:home-search:v1` — last search query on the home grid
  - `scorely:home-categories:v1` — active category chip filter on the home grid
- The single legacy fallback `leastcounter:v1` is grandfathered. Don't add more legacy fallbacks.

### Naming
- Game IDs: kebab-case (`least-count`, `phase-10`, `court-piece`). Used in URL hash and storage key — never rename without a redirect.
- Settings keys: camelCase (`limit`, `phaseTarget`).
- Per-round entry keys: camelCase (`score`, `phaseComplete`).
