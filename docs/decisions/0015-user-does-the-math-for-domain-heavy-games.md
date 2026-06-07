# 0015 — User does the math for domain-heavy games

**Date:** 2026-06-07
**Status:** Accepted

## Context

The last five games to ship — Chess Tournament, Skat, Cricket, Bridge, Mahjong — share a structural trait that none of the previous 47 had: their **per-hand/per-deal/per-innings scoring is itself a multi-page rulebook**, with multiple coexisting regional variants and no agreement on canonical formulas.

- **Chess tournament:** Buchholz, Sonneborn-Berger, Median-Buchholz, Direct Encounter, FIDE-PGN... at least 5 distinct tiebreaker systems, and pairings (Swiss vs round-robin vs knockout) are themselves a domain.
- **Skat:** game value = base × multiplier ladder × bonuses, where each component has nuance (hand, schneider, schwarz, ouvert, matadors with/without; null contracts have fixed values that override the ladder). Common practice varies between Tournierskat and casual.
- **Cricket:** runs are summable, but the full scoresheet includes batter figures, bowler figures, wickets, overs, run-rate, partnerships, fall-of-wicket... a whole information ecosystem.
- **Bridge:** contract × vulnerability × doubled × redoubled, slam bonuses (small / grand), overtrick valuation that depends on doubling, undertrick penalties that depend on vulnerability + doubling, honors, rubber bonuses.
- **Mahjong:** Hong Kong faan, Chinese Classical fan tables, Japanese riichi yaku, American Mahjong card-of-the-year — completely different scoring systems with the same game name.

For all five: **shipping a "correct" scoring formula in Scorely would lock players into one variant, frustrating the other variants' players more than helping the chosen variant's players.**

## Decision

For each of these games, ship a **simple `rounds` engine config** with one numeric score field per round and (in most cases) no `computeTotal` callback. The tagline explicitly says "user computes; engine sums." This isn't a cop-out — it's the honest scope for games this variant-fractured.

Specifically:

| Game | Per-round input | Tagline note |
|---|---|---|
| Chess Tournament | result = 2/1/0 (doubled from 1/0.5/0 to stay integer) | Buchholz tiebreaker not auto-computed |
| Skat | declarer's net change | Multiplier ladder is the user's |
| Cricket | innings runs | Wickets/overs/figures on a separate scorecard |
| Bridge | side's deal score | Contract × vulnerability × bonuses user-computed |
| Mahjong | player's net change | Variant choice is the user's |

Werewolf (8.5) is marked **explicitly out of scope**, not deferred — it's a state tracker (alive/dead, role reveals, day/night phase), not a scorekeeper, and trying to make Scorely also track game state would muddy the project's identity.

## Alternatives considered

- **Build full domain models for each.** Rejected. Each would take 4–10 hours and serve a fraction of users — the ones who agree with the variant we chose. The opportunity cost (5 small simple-rounds shipments now vs 1 bespoke Bridge engine in a week) isn't close.
- **Skip these games entirely.** Rejected — Bridge, Cricket, and Chess tournaments are searched-for explicitly; a thin "user computes the formula" version is more useful than 404.
- **Pick a canonical variant per game and ship it.** Considered. Risk: get one wrong, alienate everyone who uses a different variant. The "Belote" config already lives at this risk; for Bridge it'd be worse because the variant divisions are deeper.

## Consequences

**Easier:**
- All 50-minus-Werewolf candidate games ship.
- Each new config is ~15 lines; total addition is ~75 lines for 5 games.
- Honest tagline tells users upfront what is and isn't computed.

**Harder:**
- These configs add little value beyond a persisted table for cumulative scores. Users could use any spreadsheet for this. The value-add is: same UI as the other 47 games, same animations, same look-and-feel, same persistence. Not nothing, but not "I love this scoring app" either.
- If a Bridge or Mahjong player asks for proper contract calculation, the answer is "build a dedicated config like Spades or Pinochle did" — a focused future ADR, not "we already shipped Bridge."

## Cross-references

- The pattern this generalizes: "rounds engine + direction + manual game-end" — Scrabble (Phase 7a) was the first user.
- Sibling-engine precedents: 6 in total ([0006](0006-grid-engine.md), [0007](0007-counter-engine.md), [0008](0008-ledger-engine-and-dispatch.md), [0011](0011-tennis-engine.md), [0013](0013-bowling-engine.md), [0014](0014-darts-cricket-engine.md)).
- Phase plan closing entries: 6.5 / 7.10 / 8.1 / 8.2 / 8.3 in [`../../status.yaml`](../../status.yaml).
