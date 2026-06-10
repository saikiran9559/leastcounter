# Gotchas

Surprising bugs, browser quirks, and non-obvious constraints discovered during development.

---

## Cricket engine: online coin flip for toss (2026-06-09, revised)

**Feature:** `engine-cricket.js` → `renderTossPhase`

The toss phase is a **3-step, in-memory flow** driven by a local `toss` object. Nothing is written to `state` until the player confirms.

### Three steps

| Step | What happens |
|---|---|
| **1 — Calling** | Player picks which team is calling. That team secretly taps "Heads" or "Tails". The call is stored in `toss.call` but never shown on screen again. |
| **2 — Flipping** | A badge says "Call is locked in — nobody is telling!". Player taps "Flip Coin". The coin spins 1800° in CSS 3D for 1.8 s, then `toss.face` is set to `"heads"` or `"tails"` randomly. After a 400 ms pause (land bounce), step 3 renders. |
| **3 — Result** | Coin face AND caller's call are both revealed side-by-side. Winner is whoever has `toss.call === toss.face`. Winner is highlighted green. Winner picks Bat/Field. "Confirm & Pick XI →" writes to `state` and advances. |

### "Flip Again" / "Start Over"
- On step 2 there is a **"↩ Start Over"** ghost button that resets all local toss fields back to step 1.
- On step 3 there is a **"🔄 Flip Again"** ghost button that does the same.
- This means the toss can be re-done as many times as needed before proceeding.

### Implementation notes
- `toss` is a plain object created fresh each time `renderTossPhase` is called. `buildTossCard()` is a closure inside that function that re-renders the card in-place without touching `state`.
- `prefers-reduced-motion` suppresses CSS animations globally — the `setTimeout` still fires at 1800 ms + 400 ms so the result still appears even with animations off.
- The 3D coin uses `perspective: 600px` on the wrapper, `transform-style: preserve-3d` on the coin, and `backface-visibility: hidden` on each face.

---

## Cricket engine: consecutive bowler was allowed

**Discovered:** 2026-06-09
**File:** `engine-cricket.js` → `renderNewBowlerForm`

**Symptom:** At the end of an over, the "Select next bowler" dropdown listed every player on the bowling team, including the bowler who had just completed the over. This let the same bowler bowl back-to-back overs, which is illegal in cricket.

**Root cause:** The dropdown was built from `bowlingTeam.players` with no filtering. `inn.bowling.currentBowlerId` holds the ID of the bowler who finished the last over, but it was never used to restrict the list.

**Fix:** Filter `bowlingTeam.players` to exclude `inn.bowling.currentBowlerId` before rendering the `<select>` options. Added a graceful fallback message if the bowling team has only one player (edge case in informal games).

```js
// engine-cricket.js — renderNewBowlerForm
const lastOverBowlerId = inn.bowling.currentBowlerId;
const eligiblePlayers = (bowlingTeam?.players || []).filter(
  p => p.id !== lastOverBowlerId
);
```

**Rule:** In cricket, the same bowler cannot bowl consecutive overs. Enforce this at the selection UI level, not just via documentation.
