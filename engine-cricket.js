/**
 * engine-cricket.js — Cricket (Match) engine for Scorely
 *
 * Shape: "cricket"  (registered in games/cricket.js)
 * Factory: Scorely.createCricketInstance(gameId)
 *
 * Full ball-by-ball live scorer.
 *
 * State shape (persisted to localStorage as scorely:<gameId>:v1):
 * {
 *   settings: { format: "t20"|"odi"|"test"|"custom", customOvers: 20 }
 *   phase: "setup" | "toss" | "batting" | "complete"
 *   teams: [
 *     { id, name, players: [{ id, name }] }
 *   ]
 *   toss: { winnerId: string, elected: "bat"|"field" } | null
 *   innings: [
 *     {
 *       id, battingTeamId, bowlingTeamId,
 *       balls: [{ id, over, ballInOver, batterId, bowlerId,
 *                 runs, extras:{wide,noBall,bye,legBye},
 *                 wicket: null | { type, batterId, fielderId, bowlerCredit },
 *                 legal }],
 *       batting: { onStrikeId, nonStrikeId, nextIdx },
 *       bowling: { currentBowlerId },
 *       closed: bool,
 *       closeReason: "all-out"|"overs-complete"|"target-chased"|"declared"|null,
 *     }
 *   ]
 *   currentInningsIdx: number | null
 *   winner: null | { type:"team"|"tie"|"draw", teamId?:string, byRuns?:number, byWickets?:number }
 * }
 */
(function () {
  "use strict";

  const Scorely = window.Scorely;
  if (!Scorely) return;

  /* ── tiny helpers ──────────────────────────────────────────── */

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function storageKey(id) { return `scorely:${id}:v1`; }

  /* ── format metadata ───────────────────────────────────────── */

  const FORMAT_OVERS = { test: null, odi: 50, t20: 20, custom: null };
  const FORMAT_LABELS = { test: "Test", odi: "ODI · 50 ov", t20: "T20 · 20 ov", custom: "Custom" };

  function oversLimit(settings) {
    const fmt = settings.format || "odi";
    if (fmt === "custom") return Number(settings.customOvers) || 20;
    return FORMAT_OVERS[fmt] ?? 50;
  }
  function maxInningsPerTeam(settings) {
    return settings.format === "test" ? 2 : 1;
  }
  function oversFromBalls(balls) {
    const ov = Math.floor(balls / 6);
    const b = balls % 6;
    return b === 0 ? `${ov}` : `${ov}.${b}`;
  }

  /* ── dismissal types ───────────────────────────────────────── */

  const DISMISSAL_TYPES = [
    "Bowled", "Caught", "LBW", "Run Out", "Stumped",
    "Hit Wicket", "Handled Ball", "Obstructed", "Retired Hurt",
  ];
  const BOWLER_CREDITED = new Set(["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"]);

  /* ── state load / save ─────────────────────────────────────── */

  function freshState(config) {
    const fmt = (config.settings && config.settings.format && config.settings.format.default) || "odi";
    return {
      settings: { format: fmt, customOvers: 20 },
      phase: "setup",
      teams: [
        { id: uid(), name: "Team 1", players: [] },
        { id: uid(), name: "Team 2", players: [] },
      ],
      toss: null,
      innings: [],
      currentInningsIdx: null,
      winner: null,
    };
  }

  function loadState(config) {
    try {
      const raw = localStorage.getItem(storageKey(config.id));
      if (raw) {
        const p = JSON.parse(raw);
        if (!p.phase)                p.phase = "setup";
        if (!Array.isArray(p.teams)) p.teams = freshState(config).teams;
        if (!Array.isArray(p.innings)) p.innings = [];
        if (!p.settings)             p.settings = { format: "odi", customOvers: 20 };
        if (!("customOvers" in p.settings)) p.settings.customOvers = 20;
        // back-compat: upgrade old simplified state
        for (const t of p.teams) {
          if (!Array.isArray(t.players)) t.players = [];
        }
        for (const inn of p.innings) {
          if (!Array.isArray(inn.balls)) inn.balls = [];
          if (!inn.batting) inn.batting = { onStrikeId: null, nonStrikeId: null, nextIdx: 2 };
          if (!inn.bowling) inn.bowling = { currentBowlerId: null };
          if (!("bowlerConfirmedAtOver" in inn.bowling)) inn.bowling.bowlerConfirmedAtOver = -1;
        }
        return p;
      }
    } catch { /* ignore */ }
    return freshState(config);
  }

  function saveState(config, state) {
    try { localStorage.setItem(storageKey(config.id), JSON.stringify(state)); } catch {}
  }

  /* ══════════════════════════════════════════════════════════════
   *  DERIVED STATS  (all computed from innings.balls[], never stored)
   * ══════════════════════════════════════════════════════════════ */

  /** Count legal balls in an array of ball objects. */
  function legalBalls(balls) {
    return balls.filter(b => b.legal).length;
  }

  /** Runs scored off the bat (excluding extras) in an array of balls. */
  function runsBat(balls) {
    return balls.reduce((s, b) => s + (b.runs || 0), 0);
  }

  /** All runs (bat + extras) in an array of balls. */
  function totalRuns(balls) {
    return balls.reduce((s, b) => {
      const ext = b.extras ? (b.extras.wide + b.extras.noBall + b.extras.bye + b.extras.legBye) : 0;
      return s + (b.runs || 0) + ext;
    }, 0);
  }

  /** Wickets in an array of balls. */
  function wicketCount(balls) {
    return balls.filter(b => b.wicket).length;
  }

  /**
   * Returns innings-level summary derived from the balls array.
   * { runs, wickets, legalBalls, overs }
   */
  function inningsSummary(inn) {
    const balls = inn.balls || [];
    return {
      runs: totalRuns(balls),
      wickets: wicketCount(balls),
      legalBalls: legalBalls(balls),
      overs: oversFromBalls(legalBalls(balls)),
    };
  }

  /** Format innings summary as "R/W (OV ov)". */
  function inningsSummaryText(inn, closed) {
    const s = inningsSummary(inn);
    if (closed) {
      const suffix = s.wickets >= 10 ? "" : ` (${s.overs} ov)`;
      return `${s.runs}/${s.wickets}${suffix}`;
    }
    return `${s.runs}/${s.wickets} (${s.overs} ov)`;
  }

  /**
   * Batter stats derived from balls[].
   * Returns map: batterId → { runs, balls, fours, sixes, sr, dismissed, dismissalText }
   */
  function batterStats(innBalls) {
    const map = {};
    for (const b of innBalls) {
      const bid = b.batterId;
      if (!bid) continue;
      if (!map[bid]) map[bid] = { runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false, dismissalText: "" };
      const s = map[bid];
      if (b.legal) s.balls++;
      s.runs += b.runs || 0;
      if (b.runs === 4) s.fours++;
      if (b.runs === 6) s.sixes++;
      if (b.wicket && b.wicket.batterId === bid) {
        s.dismissed = true;
        s.dismissalText = b.wicket.type || "Out";
      }
    }
    // compute SR
    for (const s of Object.values(map)) {
      s.sr = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : "—";
    }
    return map;
  }

  /**
   * Bowler stats derived from balls[].
   * Returns map: bowlerId → { overs, maidens, runs, wickets, economy }
   */
  function bowlerStats(innBalls) {
    const map = {};
    // group by bowler
    for (const b of innBalls) {
      const bid = b.bowlerId;
      if (!bid) continue;
      if (!map[bid]) map[bid] = { legalBalls: 0, runs: 0, wickets: 0, _overRuns: [] };
      const s = map[bid];
      if (b.legal) s.legalBalls++;
      const ext = b.extras ? (b.extras.wide + b.extras.noBall + b.extras.bye + b.extras.legBye) : 0;
      s.runs += (b.runs || 0) + (b.extras ? (b.extras.wide + b.extras.noBall) : 0); // byes/lb don't count
      if (b.wicket && BOWLER_CREDITED.has(b.wicket.type)) s.wickets++;
    }
    // compute derived
    for (const s of Object.values(map)) {
      const fullOvers = Math.floor(s.legalBalls / 6);
      const partBalls = s.legalBalls % 6;
      s.overs = partBalls > 0 ? `${fullOvers}.${partBalls}` : `${fullOvers}`;
      s.economy = s.legalBalls > 0
        ? ((s.runs / s.legalBalls) * 6).toFixed(2)
        : "—";
      // maiden overs: count overs with 0 bat-runs and 0 extras
      let maidens = 0;
      // (simplified: count completed overs with 0 total runs)
      delete s._overRuns;
      s.maidens = maidens;
    }
    return map;
  }

  /**
   * Fall of wickets derived from balls[].
   * Returns array of { wicketNum, score, batterId, over }
   */
  function fallOfWickets(balls) {
    const fow = [];
    let runsSoFar = 0;
    let legalSoFar = 0;
    for (const b of balls) {
      const ext = b.extras ? (b.extras.wide + b.extras.noBall + b.extras.bye + b.extras.legBye) : 0;
      runsSoFar += (b.runs || 0) + ext;
      if (b.legal) legalSoFar++;
      if (b.wicket) {
        fow.push({
          wicketNum: fow.length + 1,
          score: runsSoFar,
          batterId: b.wicket.batterId,
          over: oversFromBalls(legalSoFar),
        });
      }
    }
    return fow;
  }

  /**
   * Over-by-over analysis derived from balls[].
   * Returns array of { overNum(1-based), bowlerId, runs, wickets, dots }
   */
  function overByOver(balls) {
    const overs = {};
    for (const b of balls) {
      const ov = b.over ?? 0;
      if (!overs[ov]) overs[ov] = { overNum: ov + 1, bowlerId: b.bowlerId, runs: 0, wickets: 0, dots: 0 };
      const o = overs[ov];
      const ext = b.extras ? (b.extras.wide + b.extras.noBall + b.extras.bye + b.extras.legBye) : 0;
      o.runs += (b.runs || 0) + ext;
      if (b.wicket) o.wickets++;
      if (b.legal && (b.runs || 0) === 0 && ext === 0 && !b.wicket) o.dots++;
    }
    return Object.values(overs).sort((a, b) => a.overNum - b.overNum);
  }

  /**
   * Current over ball symbols for display.
   * Returns array of strings: "·" "1" "2" "4" "6" "W" "wd" "nb" "b" "lb"
   */
  function currentOverSymbols(balls) {
    if (!balls.length) return [];
    const lastLegal = balls.reduce((mx, b, i) => b.legal ? i : mx, -1);
    const currentOverNum = lastLegal >= 0 ? (balls[lastLegal].over || 0) : (balls[balls.length - 1].over || 0);
    return balls
      .filter(b => (b.over || 0) === currentOverNum)
      .map(b => {
        if (b.wicket) return "W";
        const ext = b.extras || {};
        if (ext.wide > 0) return "wd";
        if (ext.noBall > 0) return "nb";
        if (ext.bye > 0) return `b${b.runs > 0 ? b.runs : ""}`;
        if (ext.legBye > 0) return `lb${b.runs > 0 ? b.runs : ""}`;
        if (b.runs === 0) return "·";
        if (b.runs === 4) return "4";
        if (b.runs === 6) return "6";
        return String(b.runs);
      });
  }

  /* ══════════════════════════════════════════════════════════════
   *  createCricketInstance
   * ══════════════════════════════════════════════════════════════ */

  Scorely.createCricketInstance = function (gameId) {
    const config = Scorely.getGame(gameId);
    if (!config) throw new Error(`Unknown game: ${gameId}`);

    /* per-innings redo stacks: { [inningsId]: ball[] } */
    const redoStacks = {};

    const state = loadState(config);
    let container = null;
    let lastWinnerId = null;

    /* ── persistence ─────────────────────────────────────── */
    function persist() { saveState(config, state); }

    /* ── team helpers ────────────────────────────────────── */
    function teamById(id) { return state.teams.find(t => t.id === id); }
    function playerById(id) {
      for (const t of state.teams) {
        const p = t.players.find(p => p.id === id);
        if (p) return p;
      }
      return null;
    }
    function playerName(id) { const p = playerById(id); return p ? p.name : "—"; }
    function teamName(id) { const t = teamById(id); return t ? t.name : "—"; }

    /* ── innings helpers ─────────────────────────────────── */
    function currentInnings() {
      if (state.currentInningsIdx === null) return null;
      return state.innings[state.currentInningsIdx] || null;
    }

    function currentFormat() { return state.settings.format || "odi"; }
    function currentOversLimit() { return oversLimit(state.settings); }

    /** Runs scored by a team across all innings. */
    function totalRunsFor(teamId) {
      return state.innings
        .filter(i => i.battingTeamId === teamId)
        .reduce((s, i) => s + inningsSummary(i).runs, 0);
    }

    /** Innings played by a team. */
    function inningsFor(teamId) {
      return state.innings.filter(i => i.battingTeamId === teamId);
    }

    /* ── winner detection ────────────────────────────────── */
    function computeWinner() {
      if (state.teams.length < 2) return null;
      const [t0, t1] = state.teams;
      const maxI = maxInningsPerTeam(state.settings);

      // All innings must be closed
      if (state.innings.some(i => !i.closed)) return null;

      const i0 = inningsFor(t0.id);
      const i1 = inningsFor(t1.id);

      if (maxI === 1) {
        // limited overs: both need exactly 1 innings
        if (i0.length < 1 || i1.length < 1) return null;
        const r0 = inningsSummary(i0[0]).runs;
        const r1 = inningsSummary(i1[0]).runs;
        if (r0 === r1) return { type: "tie" };
        const winner = r0 > r1 ? t0 : t1;
        const loser = r0 > r1 ? t1 : t0;
        const margin = Math.abs(r0 - r1);
        // Determine if it's "by wickets" (chasing team won) or "by runs"
        const chasingInn = i1[0]; // second-batting innings
        if (winner.id === chasingInn.battingTeamId) {
          // chasing team won — margin = 10 - wickets lost
          const wktsLost = inningsSummary(chasingInn).wickets;
          return { type: "team", teamId: winner.id, byWickets: 10 - wktsLost };
        }
        return { type: "team", teamId: winner.id, byRuns: margin };
      }

      // Test: aggregate
      const total0 = i0.reduce((s, i) => s + inningsSummary(i).runs, 0);
      const total1 = i1.reduce((s, i) => s + inningsSummary(i).runs, 0);
      if (i0.length < 1 || i1.length < 1) return null;
      if (total0 === total1) return { type: "draw" };
      const winner = total0 > total1 ? t0 : t1;
      return { type: "team", teamId: winner.id, byRuns: Math.abs(total0 - total1) };
    }

    /* ── start a new innings ─────────────────────────────── */
    function startInnings(battingTeamId, openingPair, firstBowlerId) {
      const bowlingTeamId = state.teams.find(t => t.id !== battingTeamId)?.id;
      const inn = {
        id: uid(),
        battingTeamId,
        bowlingTeamId,
        balls: [],
        batting: {
          onStrikeId: openingPair[0] || null,
          nonStrikeId: openingPair[1] || null,
          nextIdx: 2,
        },
        bowling: { currentBowlerId: firstBowlerId || null },
        closed: false,
        closeReason: null,
      };
      state.innings.push(inn);
      state.currentInningsIdx = state.innings.length - 1;
      state.phase = "batting";
      Scorely.playTap();
      persist();
      render();
    }

    /* ── close innings ───────────────────────────────────── */
    function closeInnings(reason) {
      const inn = currentInnings();
      if (!inn) return;
      inn.closed = true;
      inn.closeReason = reason;
      state.currentInningsIdx = null;

      // Check winner
      const w = computeWinner();
      if (w) {
        state.winner = w;
        state.phase = "complete";
        if (w.teamId !== lastWinnerId) {
          Scorely.fireConfetti();
          lastWinnerId = w.teamId;
        }
      } else {
        // More innings to play? Move to setup for next innings if we're not in setup
        // For limited overs: prompt to start second innings
        // For test: may need to re-enter batting-order
        state.phase = "inningsDone";
      }
      persist();
      render();
    }

    /* ── record a ball ───────────────────────────────────── */
    function recordBall(ballSpec) {
      const inn = currentInnings();
      if (!inn) return;

      const legal = !ballSpec.wide && !ballSpec.noBall;
      const prevLegalBalls = legalBalls(inn.balls);
      const overNum = Math.floor(prevLegalBalls / 6);
      const ballInOver = prevLegalBalls % 6;

      const ball = {
        id: uid(),
        over: overNum,
        ballInOver,
        batterId: inn.batting.onStrikeId,
        bowlerId: inn.bowling.currentBowlerId,
        runs: ballSpec.runs || 0,
        extras: {
          wide: ballSpec.wide || 0,
          noBall: ballSpec.noBall || 0,
          bye: ballSpec.bye || 0,
          legBye: ballSpec.legBye || 0,
        },
        wicket: ballSpec.wicket || null,
        legal,
      };

      inn.balls.push(ball);
      // Any new ball invalidates the redo history for this innings.
      redoStacks[inn.id] = [];
      Scorely.playTap();

      // Rotate strike on odd runs (bat runs only, not extras)
      const batRuns = ball.runs || 0;
      if (batRuns % 2 === 1) {
        const tmp = inn.batting.onStrikeId;
        inn.batting.onStrikeId = inn.batting.nonStrikeId;
        inn.batting.nonStrikeId = tmp;
      }

      // Wicket: update batting
      if (ball.wicket) {
        const dismissedId = ball.wicket.batterId || inn.batting.onStrikeId;
        if (dismissedId === inn.batting.onStrikeId) {
          inn.batting.onStrikeId = ball.wicket.nextBatterId || null;
        } else {
          inn.batting.nonStrikeId = ball.wicket.nextBatterId || null;
        }
      }

      // End of over (legal delivery completes 6th ball of over)
      const newLegalBalls = legalBalls(inn.balls);
      const isEndOfOver = legal && newLegalBalls > 0 && newLegalBalls % 6 === 0;
      if (isEndOfOver) {
        // Swap strike at end of over
        const tmp = inn.batting.onStrikeId;
        inn.batting.onStrikeId = inn.batting.nonStrikeId;
        inn.batting.nonStrikeId = tmp;
        // Clear the confirmation flag so the new-bowler prompt shows for this over-break
        inn.bowling.bowlerConfirmedAtOver = -1;
      }

      // Check auto-close conditions
      const summary = inningsSummary(inn);
      const limit = currentOversLimit();
      const allOut = summary.wickets >= 10;
      const oversUp = limit !== null && summary.legalBalls >= limit * 6;

      // Check target chased (2nd innings, 1-innings-per-team formats)
      const maxI = maxInningsPerTeam(state.settings);
      let targetChased = false;
      if (maxI === 1 && state.innings.length === 2) {
        const firstInns = state.innings[0];
        const target = inningsSummary(firstInns).runs + 1;
        if (summary.runs >= target) targetChased = true;
      }

      if (targetChased) {
        closeInnings("target-chased");
        return;
      }
      if (allOut) {
        closeInnings("all-out");
        return;
      }
      if (oversUp) {
        closeInnings("overs-complete");
        return;
      }

      persist();
      render();
    }

    /* ── undo last ball ──────────────────────────────────── */
    function undoLastBall() {
      const inn = currentInnings();
      if (!inn || !inn.balls.length) return;
      const removed = inn.balls.pop();
      // Push onto redo stack so it can be re-applied.
      if (!redoStacks[inn.id]) redoStacks[inn.id] = [];
      redoStacks[inn.id].push(removed);
      persist();
      render();
    }

    /* ── redo last ball ──────────────────────────────────── */
    function redoLastBall() {
      const inn = currentInnings();
      if (!inn) return;
      const stack = redoStacks[inn.id];
      if (!stack || !stack.length) return;
      const ball = stack.pop();
      inn.balls.push(ball);
      persist();
      render();
    }

    /* ── settings helpers ────────────────────────────────── */
    function setFormat(fmt) {
      if (state.innings.length > 0) {
        if (!confirm("Changing format resets all innings. Continue?")) return;
        resetInnings();
      }
      state.settings.format = fmt;
      persist();
      render();
    }

    function setCustomOvers(val) {
      const v = parseInt(val, 10);
      if (!Number.isFinite(v) || v < 1) return;
      if (state.innings.length > 0) {
        if (!confirm("Changing overs resets all innings. Continue?")) return;
        resetInnings();
      }
      state.settings.customOvers = v;
      persist();
      render();
    }

    function resetInnings() {
      state.innings = [];
      state.currentInningsIdx = null;
      state.toss = null;
      state.winner = null;
      state.phase = "setup";
    }

    /* ── reset helpers ───────────────────────────────────── */
    function resetMatch() {
      if (!confirm("Reset match (keep teams)?")) return;
      resetInnings();
      persist();
      render();
    }

    function resetAll() {
      if (!confirm("Reset everything — teams and match?")) return;
      const fresh = freshState(config);
      Object.assign(state, fresh);
      persist();
      render();
    }

    /* ════════════════════════════════════════════════════════
     *  RENDER
     * ════════════════════════════════════════════════════════ */

    function render() {
      if (!container) return;

      const iconStyle = config.accent ? ` style="background: ${config.accent};"` : "";
      const iconBadge = config.icon
        ? `<div class="game-icon"${iconStyle}>${config.icon}</div>` : "";

      container.innerHTML = `
        <section class="card game-header">
          ${iconBadge}
          <div>
            <h2>${Scorely.escapeHtml(config.name)}</h2>
            ${config.tagline ? `<p class="tagline">${Scorely.escapeHtml(config.tagline)}</p>` : ""}
          </div>
        </section>
        <div id="cricket-root"></div>
      `;

      const root = container.querySelector("#cricket-root");

      if (state.phase === "setup" || state.phase === "inningsDone") {
        renderSetupPhase(root);
      } else if (state.phase === "toss") {
        renderTossPhase(root);
      } else if (state.phase === "batting") {
        renderBattingPhase(root);
      } else if (state.phase === "complete") {
        renderCompletePhase(root);
      } else {
        renderSetupPhase(root);
      }
    }

    /* ────────────────────────────────────────────────────────
     *  SETUP PHASE
     * ──────────────────────────────────────────────────────── */

    function renderSetupPhase(root) {
      const isInningsDone = state.phase === "inningsDone";
      const nextBattingTeam = computeNextBattingTeam();

      root.innerHTML = `
        <section class="card" id="setup-card">
          <h2>${isInningsDone ? "Next Innings" : "Match Setup"}</h2>

          ${!isInningsDone ? `
          <!-- Format chips -->
          <div class="cricket-format-row">
            <div class="cricket-format-chips" id="format-chips"></div>
            <div id="custom-overs-row" class="${currentFormat() === "custom" ? "" : "hidden"}">
              <label class="cricket-custom-label">
                Overs
                <input type="number" id="custom-overs-input" min="1" max="999"
                  value="${Scorely.escapeHtml(String(state.settings.customOvers || 20))}" />
              </label>
            </div>
          </div>` : ""}

          <!-- Teams -->
          <div id="teams-setup"></div>

          ${isInningsDone && nextBattingTeam ? `
          <div class="cricket-innings-prompt">
            <p>Start <strong>${Scorely.escapeHtml(nextBattingTeam.name)}</strong>'s innings?</p>
            <div id="innings-start-form"></div>
          </div>` : ""}

          ${!isInningsDone ? `
          <div class="cricket-setup-actions">
            <button id="proceed-to-toss" ${canProceedToToss() ? "" : "disabled"}>
              Proceed to Toss →
            </button>
          </div>` : ""}
        </section>

        ${renderMiniScoreboard()}
      `;

      if (!isInningsDone) {
        renderFormatChips(root.querySelector("#format-chips"));
        const customInput = root.querySelector("#custom-overs-input");
        if (customInput) customInput.addEventListener("change", e => setCustomOvers(e.target.value));
      }
      renderTeamsSetup(root.querySelector("#teams-setup"), !isInningsDone);

      if (isInningsDone && nextBattingTeam) {
        renderInningsStartForm(root.querySelector("#innings-start-form"), nextBattingTeam);
      }

      if (!isInningsDone) {
        const proceedBtn = root.querySelector("#proceed-to-toss");
        if (proceedBtn) {
          proceedBtn.addEventListener("click", () => {
            state.phase = "toss";
            persist();
            render();
          });
        }
      }

      // Reset controls
      appendResetControls(root);
    }

    function canProceedToToss() {
      return state.teams.length === 2 &&
        state.teams.every(t => t.name.trim().length > 0 && t.players.length >= 2);
    }

    function computeNextBattingTeam() {
      if (state.teams.length < 2) return null;
      const maxI = maxInningsPerTeam(state.settings);

      // If no innings played yet, respect toss or default to first team
      if (state.innings.length === 0) {
        if (state._firstBattingTeamId) {
          return teamById(state._firstBattingTeamId) || state.teams[0];
        }
        return state.teams[0];
      }

      // Determine which team should bat next by alternating from last batting team
      const closedInnings = state.innings.filter(i => i.closed);
      if (!closedInnings.length) return null;

      const lastBattingId = closedInnings[closedInnings.length - 1].battingTeamId;
      const nextTeam = state.teams.find(t => t.id !== lastBattingId);

      if (!nextTeam) return null;
      if (inningsFor(nextTeam.id).length >= maxI) {
        // The other team may need a follow-on innings (Test)
        const otherTeam = teamById(lastBattingId);
        if (otherTeam && inningsFor(otherTeam.id).length < maxI) return otherTeam;
        // Both exhausted — declare winner
        const w = computeWinner();
        if (w) {
          state.winner = w;
          state.phase = "complete";
        }
        return null;
      }

      return nextTeam;
    }

    function renderFormatChips(el) {
      if (!el) return;
      el.innerHTML = "";
      for (const fmt of ["t20", "odi", "test", "custom"]) {
        const btn = document.createElement("button");
        btn.className = "cricket-format-chip" + (currentFormat() === fmt ? " cricket-format-active" : "");
        btn.textContent = FORMAT_LABELS[fmt] || fmt;
        btn.addEventListener("click", () => setFormat(fmt));
        el.appendChild(btn);
      }
    }

    function renderTeamsSetup(el, allowEdit) {
      if (!el) return;
      el.innerHTML = "";
      for (const team of state.teams) {
        const card = document.createElement("div");
        card.className = "cricket-team-setup";

        const nameRow = document.createElement("div");
        nameRow.className = "cricket-team-name-row";
        if (allowEdit) {
          nameRow.innerHTML = `
            <input type="text" class="cricket-team-name-input" value="${Scorely.escapeHtml(team.name)}"
              placeholder="Team name" maxlength="24" data-team="${team.id}" />
          `;
          const inp = nameRow.querySelector("input");
          inp.addEventListener("input", e => {
            team.name = e.target.value.trim() || team.name;
            persist();
          });
        } else {
          nameRow.innerHTML = `<h3>${Scorely.escapeHtml(team.name)}</h3>`;
        }
        card.appendChild(nameRow);

        // Player list
        const playerList = document.createElement("ul");
        playerList.className = "cricket-player-list";
        if (team.players.length === 0) {
          playerList.innerHTML = `<li class="empty">No players yet${allowEdit ? " — add at least 2" : ""}.</li>`;
        } else {
          for (const p of team.players) {
            const li = document.createElement("li");
            li.innerHTML = `<span>${Scorely.escapeHtml(p.name)}</span>`;
            if (allowEdit) {
              const rmBtn = document.createElement("button");
              rmBtn.className = "icon";
              rmBtn.textContent = "×";
              rmBtn.addEventListener("click", () => {
                team.players = team.players.filter(x => x.id !== p.id);
                persist();
                render();
              });
              li.appendChild(rmBtn);
            }
            playerList.appendChild(li);
          }
        }
        card.appendChild(playerList);

        if (allowEdit) {
          const addRow = document.createElement("div");
          addRow.className = "row";
          addRow.innerHTML = `
            <input type="text" class="cricket-add-player-input" placeholder="Player name"
              maxlength="24" list="player-names" data-team="${team.id}" />
            <button class="cricket-add-player-btn" data-team="${team.id}">Add</button>
          `;
          const inp = addRow.querySelector(".cricket-add-player-input");
          const btn = addRow.querySelector(".cricket-add-player-btn");
          const doAdd = () => {
            const name = inp.value.trim();
            if (!name) return;
            if (team.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
              alert("Player already in this team.");
              return;
            }
            team.players.push({ id: uid(), name });
            Scorely.recordPlayerName(name);
            inp.value = "";
            persist();
            render();
          };
          btn.addEventListener("click", doAdd);
          inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); doAdd(); } });
          card.appendChild(addRow);
        }

        el.appendChild(card);
      }
    }

    function renderInningsStartForm(el, battingTeam) {
      if (!el) return;
      el.innerHTML = "";
      const bowlingTeam = state.teams.find(t => t.id !== battingTeam.id);

      const form = document.createElement("div");
      form.className = "cricket-innings-start-form";
      form.innerHTML = `
        <div class="cricket-form-row">
          <label>Opening batters (${Scorely.escapeHtml(battingTeam.name)})
            <select id="batter-1" class="cricket-select">
              ${battingTeam.players.map(p => `<option value="${p.id}">${Scorely.escapeHtml(p.name)}</option>`).join("")}
            </select>
            <select id="batter-2" class="cricket-select">
              ${battingTeam.players.map((p, i) => `<option value="${p.id}" ${i === 1 ? "selected" : ""}>${Scorely.escapeHtml(p.name)}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="cricket-form-row">
          <label>Opening bowler (${bowlingTeam ? Scorely.escapeHtml(bowlingTeam.name) : "—"})
            <select id="bowler-1" class="cricket-select">
              ${bowlingTeam ? bowlingTeam.players.map(p => `<option value="${p.id}">${Scorely.escapeHtml(p.name)}</option>`).join("") : ""}
            </select>
          </label>
        </div>
        <button id="start-innings-btn" class="cricket-start-btn">▶ Start Innings</button>
      `;
      el.appendChild(form);

      el.querySelector("#start-innings-btn").addEventListener("click", () => {
        const b1 = el.querySelector("#batter-1").value;
        const b2 = el.querySelector("#batter-2").value;
        const bwl = el.querySelector("#bowler-1")?.value;
        if (b1 === b2) { alert("Opening batters must be different players."); return; }
        startInnings(battingTeam.id, [b1, b2], bwl);
      });
    }

    /* ────────────────────────────────────────────────────────
     *  TOSS PHASE  — three-step: call → flip → result
     *
     *  Step 1 (calling): one team secretly picks Heads/Tails.
     *                    Their choice is hidden once confirmed.
     *  Step 2 (flipping): coin animates, face revealed.
     *  Step 3 (result):   winner announced based on call vs face.
     *                     Winner picks Bat/Field, then Confirm.
     *  "Flip Again" resets back to step 1 at any point.
     * ──────────────────────────────────────────────────────── */

    function renderTossPhase(root) {
      /* Local toss state — lives only for the duration of this
         render cycle; nothing is written to `state` until Confirm. */
      const toss = {
        callingTeamId: state.teams[0].id,  // which team is calling
        call: null,        // "heads" | "tails"
        face: null,        // "heads" | "tails"  (coin result)
        winnerId: null,    // resolved after flip
        step: "calling",   // "calling" | "flipping" | "result"
      };

      function buildTossCard() {
        const [t0, t1] = state.teams;
        const callingTeam = teamById(toss.callingTeamId);

        /* ── Step 1: Calling ──────────────────────────────── */
        if (toss.step === "calling") {
          root.innerHTML = `
            <section class="card" id="toss-card">
              <h2>🪙 Toss — Call It!</h2>

              <div class="cricket-toss-arena">
                <div class="cricket-toss-teams">
                  <span class="cricket-toss-team-label" id="toss-label-t0">${Scorely.escapeHtml(t0.name)}</span>
                  <span class="cricket-toss-vs">vs</span>
                  <span class="cricket-toss-team-label" id="toss-label-t1">${Scorely.escapeHtml(t1.name)}</span>
                </div>

                <div class="cricket-coin-wrap">
                  <div class="cricket-coin">
                    <div class="cricket-coin-face cricket-coin-heads">🏏</div>
                    <div class="cricket-coin-face cricket-coin-tails">⚾</div>
                  </div>
                </div>
              </div>

              <div class="cricket-toss-call-section">
                <div class="cricket-form-row">
                  <label>Who is calling?
                    <select id="calling-team-sel" class="cricket-select">
                      ${state.teams.map(t =>
                        `<option value="${t.id}" ${t.id === toss.callingTeamId ? "selected" : ""}>${Scorely.escapeHtml(t.name)}</option>`
                      ).join("")}
                    </select>
                  </label>
                </div>

                <p class="cricket-toss-hint">
                  📵 Hand the phone to <strong>${Scorely.escapeHtml(callingTeam.name)}</strong> — they will secretly make their call.
                </p>

                <div class="cricket-toss-call-btns">
                  <button class="cricket-call-btn" id="call-heads">
                    <span class="cricket-call-icon">🏏</span>
                    <span>Heads</span>
                  </button>
                  <button class="cricket-call-btn" id="call-tails">
                    <span class="cricket-call-icon">⚾</span>
                    <span>Tails</span>
                  </button>
                </div>
              </div>
            </section>
          `;

          root.querySelector("#calling-team-sel").addEventListener("change", e => {
            toss.callingTeamId = e.target.value;
            buildTossCard();
          });

          root.querySelector("#call-heads").addEventListener("click", () => {
            toss.call = "heads";
            toss.step = "flipping";
            buildTossCard();
          });
          root.querySelector("#call-tails").addEventListener("click", () => {
            toss.call = "tails";
            toss.step = "flipping";
            buildTossCard();
          });
          return;
        }

        /* ── Step 2: Flipping ─────────────────────────────── */
        if (toss.step === "flipping") {
          root.innerHTML = `
            <section class="card" id="toss-card">
              <h2>🪙 Toss — Flip!</h2>

              <div class="cricket-toss-arena">
                <div class="cricket-toss-teams">
                  <span class="cricket-toss-team-label" id="toss-label-t0">${Scorely.escapeHtml(t0.name)}</span>
                  <span class="cricket-toss-vs">vs</span>
                  <span class="cricket-toss-team-label" id="toss-label-t1">${Scorely.escapeHtml(t1.name)}</span>
                </div>

                <div class="cricket-toss-called-badge">
                  🤫 Call is locked in — nobody is telling!
                </div>

                <div class="cricket-coin-wrap" id="coin-wrap">
                  <div class="cricket-coin" id="coin">
                    <div class="cricket-coin-face cricket-coin-heads">🏏</div>
                    <div class="cricket-coin-face cricket-coin-tails">⚾</div>
                  </div>
                </div>

                <button id="flip-coin-btn" class="cricket-start-btn" style="max-width:220px;margin:0 auto;">
                  🪙 Flip Coin
                </button>
              </div>

              <div class="cricket-toss-secondary-row">
                <button id="toss-restart-btn" class="cricket-toss-restart-btn">↩ Start Over</button>
              </div>
            </section>
          `;

          root.querySelector("#toss-restart-btn").addEventListener("click", () => {
            toss.call = null;
            toss.face = null;
            toss.winnerId = null;
            toss.step = "calling";
            buildTossCard();
          });

          const flipBtn = root.querySelector("#flip-coin-btn");
          const coin    = root.querySelector("#coin");

          flipBtn.addEventListener("click", () => {
            if (flipBtn.disabled) return;
            flipBtn.disabled = true;
            flipBtn.textContent = "Flipping…";

            // Randomly determine the coin face
            toss.face = Math.random() < 0.5 ? "heads" : "tails";
            toss.winnerId = toss.face === toss.call
              ? toss.callingTeamId
              : state.teams.find(t => t.id !== toss.callingTeamId).id;

            coin.classList.add("cricket-coin-spinning");

            setTimeout(() => {
              coin.classList.remove("cricket-coin-spinning");
              coin.classList.add("cricket-coin-landed");
              Scorely.playTap();
              // Brief pause so they can see the coin landed, then show result
              setTimeout(() => {
                toss.step = "result";
                buildTossCard();
              }, 400);
            }, 1800);
          });
          return;
        }

        /* ── Step 3: Result ───────────────────────────────── */
        if (toss.step === "result") {
          const winner    = teamById(toss.winnerId);
          const callerTeam = teamById(toss.callingTeamId);
          const callerWon  = toss.winnerId === toss.callingTeamId;
          const faceLabel  = toss.face === "heads" ? "Heads 🏏" : "Tails ⚾";
          const callLabel  = toss.call === "heads" ? "Heads 🏏" : "Tails ⚾";

          root.innerHTML = `
            <section class="card" id="toss-card">
              <h2>🪙 Toss — Result</h2>

              <div class="cricket-toss-arena">
                <div class="cricket-toss-teams">
                  <span class="cricket-toss-team-label ${toss.winnerId === t0.id ? "toss-winner-hl" : ""}">${Scorely.escapeHtml(t0.name)}</span>
                  <span class="cricket-toss-vs">vs</span>
                  <span class="cricket-toss-team-label ${toss.winnerId === t1.id ? "toss-winner-hl" : ""}">${Scorely.escapeHtml(t1.name)}</span>
                </div>

                <div class="cricket-coin-wrap">
                  <div class="cricket-coin cricket-coin-landed">
                    <div class="cricket-coin-face cricket-coin-heads">🏏</div>
                    <div class="cricket-coin-face cricket-coin-tails">⚾</div>
                  </div>
                </div>

                <div class="cricket-toss-reveal-row">
                  <div class="cricket-toss-reveal-item">
                    <span class="cricket-toss-reveal-label">Coin landed</span>
                    <span class="cricket-toss-reveal-value">${faceLabel}</span>
                  </div>
                  <div class="cricket-toss-reveal-item">
                    <span class="cricket-toss-reveal-label">${Scorely.escapeHtml(callerTeam.name)} called</span>
                    <span class="cricket-toss-reveal-value">${callLabel}</span>
                  </div>
                </div>
              </div>

              <div class="cricket-toss-result-banner cricket-toss-panel-appear">
                🎉 ${Scorely.escapeHtml(winner.name)} wins the toss!
              </div>

              <div class="cricket-toss-form" style="margin-top:18px;">
                <div class="cricket-form-row">
                  <label>${Scorely.escapeHtml(winner.name)} elects to…
                    <div class="cricket-radio-row">
                      <label class="cricket-radio-opt">
                        <input type="radio" name="elected" value="bat" checked /> 🏏 Bat
                      </label>
                      <label class="cricket-radio-opt">
                        <input type="radio" name="elected" value="field" /> 🎳 Field
                      </label>
                    </div>
                  </label>
                </div>

                <div class="cricket-toss-action-row">
                  <button id="toss-restart-btn" class="cricket-toss-restart-btn">🔄 Flip Again</button>
                  <button id="confirm-toss-btn" class="cricket-start-btn" style="flex:1;">
                    Confirm & Pick XI →
                  </button>
                </div>
              </div>
            </section>
          `;

          root.querySelector("#toss-restart-btn").addEventListener("click", () => {
            toss.call = null;
            toss.face = null;
            toss.winnerId = null;
            toss.step = "calling";
            buildTossCard();
          });

          root.querySelector("#confirm-toss-btn").addEventListener("click", () => {
            const elected = root.querySelector("input[name='elected']:checked").value;
            state.toss    = { winnerId: toss.winnerId, elected };

            const otherTeam = state.teams.find(t => t.id !== toss.winnerId);
            const battingTeamId = elected === "bat" ? toss.winnerId : otherTeam.id;

            state.phase = "inningsDone";
            state._firstBattingTeamId = battingTeamId;
            persist();
            render();
          });
        }
      }

      buildTossCard();
    }

    /* ────────────────────────────────────────────────────────
     *  BATTING PHASE  (the main live-scoring view)
     * ──────────────────────────────────────────────────────── */

    function renderBattingPhase(root) {
      const inn = currentInnings();
      if (!inn) { renderSetupPhase(root); return; }

      const battingTeam = teamById(inn.battingTeamId);
      const bowlingTeam = teamById(inn.bowlingTeamId);
      const summary = inningsSummary(inn);
      const limit = currentOversLimit();
      const inningsIdx = state.innings.indexOf(inn);
      const inningsLabel = inningsIdx === 0 ? "1st Innings" : "2nd Innings";

      // Target info (2nd innings)
      let targetLine = "";
      if (inningsIdx > 0 && state.innings.length >= 1) {
        const firstInns = state.innings[0];
        const target = inningsSummary(firstInns).runs + 1;
        const needed = target - summary.runs;
        const ballsLeft = limit !== null ? (limit * 6 - summary.legalBalls) : null;
        const oversLeft = ballsLeft !== null ? oversFromBalls(ballsLeft) : "∞";
        const rrr = ballsLeft !== null && ballsLeft > 0
          ? ((needed / ballsLeft) * 6).toFixed(2) : "—";
        targetLine = `
          <div class="cricket-target-bar">
            <span>Target <strong>${target}</strong></span>
            <span>Need <strong>${Math.max(0, needed)}</strong> off ${oversLeft} ov</span>
            <span>RRR <strong>${rrr}</strong></span>
          </div>
        `;
      }

      // New bowler needed?
      // Show the prompt when legal balls are at an over boundary AND the
      // bowler for this new over hasn't been confirmed yet.
      const completedOvers = Math.floor(summary.legalBalls / 6);
      const isEndOfOver = summary.legalBalls > 0 && summary.legalBalls % 6 === 0;
      const bowlerAlreadyConfirmed = (inn.bowling.bowlerConfirmedAtOver ?? -1) >= completedOvers;
      const newBowlerNeeded = isEndOfOver && inn.balls.length > 0 && !bowlerAlreadyConfirmed;

      // Determine if a new batter is needed (on-strike is null after wicket)
      const newBatterNeeded = inn.batting.onStrikeId === null || inn.batting.nonStrikeId === null;

      root.innerHTML = `
        <section class="card cricket-live-header">
          <div class="cricket-live-teams">
            <div class="cricket-live-team-name">${Scorely.escapeHtml(battingTeam?.name || "—")}</div>
            <div class="cricket-live-score">
              <span class="cricket-live-runs">${summary.runs}</span>/<span class="cricket-live-wickets">${summary.wickets}</span>
            </div>
            <div class="cricket-live-overs">
              ${summary.overs} ov${limit ? " / " + limit : ""}
            </div>
          </div>
          ${targetLine}
          <div class="cricket-live-over-symbols" id="over-symbols"></div>
          <div class="cricket-live-badge">${Scorely.escapeHtml(inningsLabel)}</div>
        </section>

        <div class="cricket-batting-grid">
          <!-- Batting card -->
          <section class="card cricket-batting-card">
            <h2>🏏 Batting</h2>
            <div id="batting-card-content"></div>
          </section>

          <!-- Bowling card -->
          <section class="card cricket-bowling-card">
            <h2>🎳 Bowling</h2>
            <div id="bowling-card-content"></div>
          </section>
        </div>

        <!-- Scoring pad -->
        <section class="card" id="scoring-pad-section">
          <h2>Score Ball</h2>
          <div id="scoring-pad"></div>
        </section>

        <!-- Fall of wickets -->
        <section class="card" id="fow-section">
          <h2>Fall of Wickets</h2>
          <div id="fow-content"></div>
        </section>

        <!-- Over-by-over -->
        <section class="card" id="ov-section">
          <h2>Over Analysis</h2>
          <div id="ov-content"></div>
        </section>

        ${renderMiniScoreboard()}
      `;

      // Over symbols
      renderOverSymbols(root.querySelector("#over-symbols"), inn);

      // Batting & bowling cards
      renderBattingCard(root.querySelector("#batting-card-content"), inn, battingTeam);
      renderBowlingCard(root.querySelector("#bowling-card-content"), inn, bowlingTeam);

      // Scoring pad (or new bowler / new batter prompt)
      const padEl = root.querySelector("#scoring-pad");
      if (newBowlerNeeded) {
        renderNewBowlerForm(padEl, inn, bowlingTeam);
      } else if (newBatterNeeded) {
        renderNewBatterForm(padEl, inn, battingTeam);
      } else {
        renderScoringPad(padEl, inn);
      }

      // Fall of wickets
      renderFallOfWickets(root.querySelector("#fow-content"), inn, battingTeam);

      // Over-by-over
      renderOverByOver(root.querySelector("#ov-content"), inn, bowlingTeam);

      // Reset / end-innings controls
      const ctrlDiv = document.createElement("section");
      ctrlDiv.className = "card";
      ctrlDiv.innerHTML = `
        <h2>Controls</h2>
        <div class="row" style="flex-wrap:wrap;gap:10px;">
          <button id="end-innings-btn" class="cricket-declare-btn">
            ${currentFormat() === "test" ? "📋 Declare" : "End Innings"}
          </button>
          <button id="reset-match-btn">Reset Match</button>
          <button id="reset-all-btn" class="danger">Reset All</button>
        </div>
      `;
      root.appendChild(ctrlDiv);

      root.querySelector("#end-innings-btn").addEventListener("click", () => {
        const inn2 = currentInnings();
        if (!inn2) return;
        const s = inningsSummary(inn2);
        const isDeclare = currentFormat() === "test";
        const msg = isDeclare
          ? `Declare at ${s.runs}/${s.wickets}?`
          : `End innings at ${s.runs}/${s.wickets}?`;
        if (!confirm(msg)) return;
        closeInnings(isDeclare ? "declared" : "manual");
      });
      root.querySelector("#reset-match-btn").addEventListener("click", resetMatch);
      root.querySelector("#reset-all-btn").addEventListener("click", resetAll);
    }

    function renderOverSymbols(el, inn) {
      if (!el) return;
      const symbols = currentOverSymbols(inn.balls);
      if (!symbols.length) { el.innerHTML = `<span class="cricket-symbol-empty">No balls yet this over</span>`; return; }
      el.innerHTML = symbols.map(s => {
        const cls = s === "W" ? "cricket-sym-wicket"
          : (s === "4" || s === "6") ? "cricket-sym-boundary"
          : s === "·" ? "cricket-sym-dot"
          : s.startsWith("wd") || s.startsWith("nb") || s.startsWith("b") || s.startsWith("lb") ? "cricket-sym-extra"
          : "cricket-sym-run";
        return `<span class="cricket-ball-symbol ${cls}">${s}</span>`;
      }).join("");
    }

    function renderBattingCard(el, inn, battingTeam) {
      if (!el || !battingTeam) return;
      const stats = batterStats(inn.balls);
      const activeBatters = [inn.batting.onStrikeId, inn.batting.nonStrikeId].filter(Boolean);

      const rows = battingTeam.players
        .filter(p => {
          // Show batters who have faced at least one ball, or are currently batting
          return stats[p.id] || activeBatters.includes(p.id);
        })
        .map(p => {
          const s = stats[p.id] || { runs: 0, balls: 0, fours: 0, sixes: 0, sr: "—", dismissed: false };
          const isOnStrike = p.id === inn.batting.onStrikeId;
          const isNonStrike = p.id === inn.batting.nonStrikeId;
          const statusMark = isOnStrike ? " ●" : isNonStrike ? " ○" : "";
          const dismissedText = s.dismissed ? `<span class="cricket-dismissed-text">${Scorely.escapeHtml(s.dismissalText)}</span>` : "";
          return `
            <tr class="${s.dismissed ? "cricket-dismissed-row" : isOnStrike ? "cricket-on-strike" : ""}">
              <td class="cricket-player-name-cell">${Scorely.escapeHtml(p.name)}${statusMark}${dismissedText}</td>
              <td>${s.runs}</td>
              <td>${s.balls}</td>
              <td>${s.fours}</td>
              <td>${s.sixes}</td>
              <td>${s.sr}</td>
            </tr>
          `;
        }).join("");

      // Partnership
      const partBalls = inn.balls.filter(b => {
        const pairSet = new Set([inn.batting.onStrikeId, inn.batting.nonStrikeId]);
        return pairSet.has(b.batterId);
      });
      const partRuns = totalRuns(partBalls);

      el.innerHTML = `
        <div class="cricket-partnership-bar">Partnership: <strong>${partRuns}</strong> runs</div>
        <div class="table-wrap">
          <table class="cricket-stat-table">
            <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" class="empty">Innings not started</td></tr>'}</tbody>
          </table>
        </div>
      `;
    }

    function renderBowlingCard(el, inn, bowlingTeam) {
      if (!el || !bowlingTeam) return;
      const stats = bowlerStats(inn.balls);
      const currentBowlerId = inn.bowling.currentBowlerId;

      const rows = bowlingTeam.players
        .filter(p => stats[p.id])
        .map(p => {
          const s = stats[p.id];
          const isCurrent = p.id === currentBowlerId;
          return `
            <tr class="${isCurrent ? "cricket-current-bowler" : ""}">
              <td class="cricket-player-name-cell">${Scorely.escapeHtml(p.name)}${isCurrent ? " ●" : ""}</td>
              <td>${s.overs}</td>
              <td>${s.maidens}</td>
              <td>${s.runs}</td>
              <td>${s.wickets}</td>
              <td>${s.economy}</td>
            </tr>
          `;
        }).join("");

      el.innerHTML = `
        <div class="table-wrap">
          <table class="cricket-stat-table">
            <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" class="empty">No overs bowled</td></tr>'}</tbody>
          </table>
        </div>
      `;
    }

    /* ── scoring pad ─────────────────────────────────────── */

    function renderScoringPad(el, inn) {
      el.innerHTML = "";

      // Run buttons
      const runs = [
        { runs: 0, label: "·", cls: "cricket-btn-dot" },
        { runs: 1, label: "1", cls: "" },
        { runs: 2, label: "2", cls: "" },
        { runs: 3, label: "3", cls: "" },
        { runs: 4, label: "4", cls: "cricket-btn-boundary" },
        { runs: 6, label: "6", cls: "cricket-btn-six" },
      ];
      const runGrid = document.createElement("div");
      runGrid.className = "cricket-run-grid";
      for (const r of runs) {
        const btn = document.createElement("button");
        btn.className = `cricket-run-btn ${r.cls}`.trim();
        btn.textContent = r.label;
        btn.addEventListener("click", () => recordBall({ runs: r.runs }));
        runGrid.appendChild(btn);
      }
      el.appendChild(runGrid);

      // Extras row
      const extras = [
        { label: "WD", title: "Wide (+1, no ball count)", spec: { wide: 1, runs: 0 } },
        { label: "NB", title: "No Ball (+1, no ball count)", spec: { noBall: 1, runs: 0 } },
        { label: "B",  title: "Bye (1 run, ball counts)",   spec: { bye: 1,    runs: 0 } },
        { label: "LB", title: "Leg Bye (1 run, ball counts)", spec: { legBye: 1, runs: 0 } },
      ];
      const extraRow = document.createElement("div");
      extraRow.className = "cricket-extra-row";
      for (const x of extras) {
        const btn = document.createElement("button");
        btn.className = "cricket-extra-btn";
        btn.textContent = x.label;
        btn.title = x.title;
        btn.addEventListener("click", () => recordBall(x.spec));
        extraRow.appendChild(btn);
      }
      el.appendChild(extraRow);

      // Wicket button
      const wicketBtn = document.createElement("button");
      wicketBtn.className = "cricket-wicket-btn";
      const wkts = inningsSummary(inn).wickets;
      wicketBtn.textContent = `🎯 Wicket (${wkts}/10)`;
      wicketBtn.disabled = wkts >= 10;
      wicketBtn.addEventListener("click", () => openWicketDialog(inn));
      el.appendChild(wicketBtn);

      // Undo / Redo row
      const hasUndo = inn.balls.length > 0;
      const hasRedo = (redoStacks[inn.id] || []).length > 0;
      if (hasUndo || hasRedo) {
        const undoRedoRow = document.createElement("div");
        undoRedoRow.className = "cricket-undo-redo-row";

        if (hasUndo) {
          const undoBtn = document.createElement("button");
          undoBtn.className = "bowling-undo";
          undoBtn.textContent = "↩ Undo";
          undoBtn.addEventListener("click", undoLastBall);
          undoRedoRow.appendChild(undoBtn);
        }

        if (hasRedo) {
          const redoBtn = document.createElement("button");
          redoBtn.className = "bowling-undo cricket-redo-btn";
          redoBtn.textContent = "↪ Redo";
          redoBtn.addEventListener("click", redoLastBall);
          undoRedoRow.appendChild(redoBtn);
        }

        el.appendChild(undoRedoRow);
      }
    }

    /* ── wicket dialog ───────────────────────────────────── */

    function openWicketDialog(inn) {
      const battingTeam = teamById(inn.battingTeamId);
      const bowlingTeam = teamById(inn.bowlingTeamId);
      const stats = batterStats(inn.balls);

      // Remaining batters (not dismissed, not currently batting)
      const dismissed = new Set(
        inn.balls.filter(b => b.wicket).map(b => b.wicket.batterId)
      );
      const currentBatters = new Set([inn.batting.onStrikeId, inn.batting.nonStrikeId].filter(Boolean));
      const remaining = (battingTeam?.players || []).filter(p => !dismissed.has(p.id) && !currentBatters.has(p.id));

      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.innerHTML = `
        <div class="modal cricket-wicket-modal">
          <button class="modal-close" id="wk-close">×</button>
          <h2>🎯 Wicket</h2>

          <div class="cricket-form-row">
            <label>Batter dismissed
              <select id="wk-batter" class="cricket-select">
                ${[inn.batting.onStrikeId, inn.batting.nonStrikeId].filter(Boolean).map(id => {
                  const p = playerById(id);
                  return `<option value="${id}">${Scorely.escapeHtml(p?.name || id)}</option>`;
                }).join("")}
              </select>
            </label>
          </div>

          <div class="cricket-form-row">
            <label>Dismissal type
              <select id="wk-type" class="cricket-select">
                ${DISMISSAL_TYPES.map(t => `<option value="${t}">${t}</option>`).join("")}
              </select>
            </label>
          </div>

          <div class="cricket-form-row">
            <label>Fielder (optional)
              <select id="wk-fielder" class="cricket-select">
                <option value="">— None —</option>
                ${(bowlingTeam?.players || []).map(p => `<option value="${p.id}">${Scorely.escapeHtml(p.name)}</option>`).join("")}
              </select>
            </label>
          </div>

          <div class="cricket-form-row">
            <label>Runs on this delivery
              <select id="wk-runs" class="cricket-select">
                ${[0, 1, 2, 3, 4, 5, 6].map(r => `<option value="${r}">${r}</option>`).join("")}
              </select>
            </label>
          </div>

          <div class="cricket-form-row">
            <label>Next batter
              <select id="wk-next-batter" class="cricket-select">
                <option value="">— (all out) —</option>
                ${remaining.map(p => `<option value="${p.id}">${Scorely.escapeHtml(p.name)}</option>`).join("")}
              </select>
            </label>
          </div>

          <button id="wk-confirm" class="cricket-start-btn" style="margin-top:12px;width:100%">Confirm Wicket</button>
        </div>
      `;

      document.body.appendChild(backdrop);
      requestAnimationFrame(() => backdrop.classList.add("open"));

      const close = () => {
        backdrop.classList.remove("open");
        setTimeout(() => backdrop.remove(), 200);
      };

      backdrop.querySelector("#wk-close").addEventListener("click", close);
      backdrop.addEventListener("click", e => { if (e.target === backdrop) close(); });

      backdrop.querySelector("#wk-confirm").addEventListener("click", () => {
        const batterId = backdrop.querySelector("#wk-batter").value;
        const type = backdrop.querySelector("#wk-type").value;
        const fielderId = backdrop.querySelector("#wk-fielder").value || null;
        const runs = parseInt(backdrop.querySelector("#wk-runs").value, 10) || 0;
        const nextBatterId = backdrop.querySelector("#wk-next-batter").value || null;

        recordBall({
          runs,
          wicket: {
            type,
            batterId,
            fielderId,
            bowlerCredit: BOWLER_CREDITED.has(type),
            nextBatterId,
          },
        });
        close();
      });
    }

    /* ── new bowler form ─────────────────────────────────── */

    function renderNewBowlerForm(el, inn, bowlingTeam) {
      el.innerHTML = "";
      const header = document.createElement("p");
      header.className = "cricket-prompt-label";
      header.textContent = "End of over — select the next bowler:";
      el.appendChild(header);

      // Find the bowler who just completed the last over — they cannot bowl
      // consecutive overs (standard cricket rule).
      const lastOverBowlerId = inn.bowling.currentBowlerId;

      const eligiblePlayers = (bowlingTeam?.players || []).filter(
        p => p.id !== lastOverBowlerId
      );

      if (!eligiblePlayers.length) {
        // Edge case: only 1 bowler in the team (shouldn't happen in a real match
        // but handle gracefully to avoid a completely broken UI).
        const note = document.createElement("p");
        note.className = "cricket-prompt-label";
        note.style.color = "var(--danger, #f87171)";
        note.textContent = "⚠ Only one bowler available — add more players to the bowling team.";
        el.appendChild(note);
        return;
      }

      const sel = document.createElement("select");
      sel.className = "cricket-select";
      sel.innerHTML = `<option value="">— Select bowler —</option>` +
        eligiblePlayers.map(p =>
          `<option value="${p.id}">${Scorely.escapeHtml(p.name)}</option>`
        ).join("");
      el.appendChild(sel);

      const btn = document.createElement("button");
      btn.className = "cricket-start-btn";
      btn.textContent = "Continue";
      btn.style.marginTop = "10px";
      btn.addEventListener("click", () => {
        const id = sel.value;
        if (!id) { alert("Select a bowler."); return; }
        inn.bowling.currentBowlerId = id;
        // Mark that the new bowler for this over-break has been confirmed.
        // We record the completed-over count so the prompt won't re-appear
        // until another over ends.
        const completedOvers = Math.floor(legalBalls(inn.balls) / 6);
        inn.bowling.bowlerConfirmedAtOver = completedOvers;
        persist();
        render();
      });
      el.appendChild(btn);
    }

    /* ── new batter form ─────────────────────────────────── */

    function renderNewBatterForm(el, inn, battingTeam) {
      el.innerHTML = "";
      const header = document.createElement("p");
      header.className = "cricket-prompt-label";
      header.textContent = "Select the incoming batter:";
      el.appendChild(header);

      const dismissed = new Set(
        inn.balls.filter(b => b.wicket).map(b => b.wicket.batterId)
      );
      const activeBatters = new Set([inn.batting.onStrikeId, inn.batting.nonStrikeId].filter(Boolean));
      const remaining = (battingTeam?.players || []).filter(p => !dismissed.has(p.id) && !activeBatters.has(p.id));

      if (!remaining.length) {
        el.innerHTML += `<p class="empty">No batters remaining — innings is over.</p>`;
        return;
      }

      const sel = document.createElement("select");
      sel.className = "cricket-select";
      sel.innerHTML = `<option value="">— Select batter —</option>` +
        remaining.map(p => `<option value="${p.id}">${Scorely.escapeHtml(p.name)}</option>`).join("");
      el.appendChild(sel);

      const btn = document.createElement("button");
      btn.className = "cricket-start-btn";
      btn.textContent = "Continue";
      btn.style.marginTop = "10px";
      btn.addEventListener("click", () => {
        const id = sel.value;
        if (!id) { alert("Select a batter."); return; }
        if (!inn.batting.onStrikeId) inn.batting.onStrikeId = id;
        else inn.batting.nonStrikeId = id;
        persist();
        render();
      });
      el.appendChild(btn);
    }

    /* ── fall of wickets ─────────────────────────────────── */

    function renderFallOfWickets(el, inn, battingTeam) {
      if (!el) return;
      const fow = fallOfWickets(inn.balls);
      if (!fow.length) {
        el.innerHTML = `<p class="empty">No wickets yet.</p>`;
        return;
      }
      el.innerHTML = `
        <div class="table-wrap">
          <table class="cricket-stat-table">
            <thead><tr><th>#</th><th>Batter</th><th>Score</th><th>Over</th></tr></thead>
            <tbody>
              ${fow.map(f => {
                const name = playerName(f.batterId);
                return `<tr>
                  <td>${f.wicketNum}</td>
                  <td>${Scorely.escapeHtml(name)}</td>
                  <td>${f.score}</td>
                  <td>${Scorely.escapeHtml(f.over)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    /* ── over-by-over ────────────────────────────────────── */

    function renderOverByOver(el, inn, bowlingTeam) {
      if (!el) return;
      const overs = overByOver(inn.balls);
      if (!overs.length) {
        el.innerHTML = `<p class="empty">No completed overs yet.</p>`;
        return;
      }
      el.innerHTML = `
        <div class="table-wrap">
          <table class="cricket-stat-table">
            <thead><tr><th>Ov</th><th>Bowler</th><th>R</th><th>W</th><th>Dots</th></tr></thead>
            <tbody>
              ${overs.map(o => {
                const bowlerP = playerById(o.bowlerId);
                const name = bowlerP ? bowlerP.name : "—";
                return `<tr>
                  <td>${o.overNum}</td>
                  <td>${Scorely.escapeHtml(name)}</td>
                  <td>${o.runs}</td>
                  <td>${o.wickets}</td>
                  <td>${o.dots}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    /* ────────────────────────────────────────────────────────
     *  COMPLETE PHASE
     * ──────────────────────────────────────────────────────── */

    function renderCompletePhase(root) {
      const w = state.winner;
      let winnerText = "Match complete.";
      if (w) {
        if (w.type === "tie") winnerText = "🤝 Match tied!";
        else if (w.type === "draw") winnerText = "🤝 Match drawn!";
        else if (w.byWickets !== undefined) {
          winnerText = `🏆 ${teamName(w.teamId)} won by ${w.byWickets} wicket${w.byWickets !== 1 ? "s" : ""}!`;
        } else if (w.byRuns !== undefined) {
          winnerText = `🏆 ${teamName(w.teamId)} won by ${w.byRuns} run${w.byRuns !== 1 ? "s" : ""}!`;
        } else {
          winnerText = `🏆 ${teamName(w.teamId)} won!`;
        }
      }

      root.innerHTML = `
        <div id="winner-banner">${Scorely.escapeHtml(winnerText)}</div>

        ${renderMiniScoreboard()}

        ${renderFullScorecards()}

        <section class="card">
          <h2>Match Summary</h2>
          <div id="match-summary"></div>
        </section>

        <section class="card">
          <div class="row" style="flex-wrap:wrap;gap:10px;">
            <button id="reset-match-btn">New Match</button>
            <button id="reset-all-btn" class="danger">Reset All</button>
          </div>
        </section>
      `;

      renderMatchSummary(root.querySelector("#match-summary"));
      root.querySelector("#reset-match-btn").addEventListener("click", resetMatch);
      root.querySelector("#reset-all-btn").addEventListener("click", resetAll);
    }

    function renderFullScorecards() {
      let html = "";
      state.innings.forEach((inn, idx) => {
        const battingTeam = teamById(inn.battingTeamId);
        const bowlingTeam = teamById(inn.bowlingTeamId);
        const s = inningsSummary(inn);
        const label = `${battingTeam?.name || "—"} — Innings ${idx + 1}: ${s.runs}/${s.wickets} (${s.overs} ov)`;
        const bStats = batterStats(inn.balls);
        const blStats = bowlerStats(inn.balls);
        const fow = fallOfWickets(inn.balls);

        const batterRows = (battingTeam?.players || [])
          .filter(p => bStats[p.id])
          .map(p => {
            const st = bStats[p.id];
            const howOut = st.dismissed ? st.dismissalText : "not out";
            return `<tr>
              <td>${Scorely.escapeHtml(p.name)}</td>
              <td class="cricket-how-out">${Scorely.escapeHtml(howOut)}</td>
              <td>${st.runs}</td>
              <td>${st.balls}</td>
              <td>${st.fours}</td>
              <td>${st.sixes}</td>
              <td>${st.sr}</td>
            </tr>`;
          }).join("");

        const bowlerRows = (bowlingTeam?.players || [])
          .filter(p => blStats[p.id])
          .map(p => {
            const st = blStats[p.id];
            return `<tr>
              <td>${Scorely.escapeHtml(p.name)}</td>
              <td>${st.overs}</td>
              <td>${st.maidens}</td>
              <td>${st.runs}</td>
              <td>${st.wickets}</td>
              <td>${st.economy}</td>
            </tr>`;
          }).join("");

        const fowText = fow.map(f =>
          `${f.wicketNum}-${f.score} (${Scorely.escapeHtml(playerName(f.batterId))}, ${f.over} ov)`
        ).join(" · ");

        html += `
          <section class="card cricket-scorecard-section">
            <h2>${Scorely.escapeHtml(label)}</h2>
            <div class="table-wrap">
              <table class="cricket-stat-table">
                <thead><tr><th>Batter</th><th>How Out</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
                <tbody>${batterRows || '<tr><td colspan="7" class="empty">No data</td></tr>'}</tbody>
              </table>
            </div>
            <div class="table-wrap" style="margin-top:14px;">
              <table class="cricket-stat-table">
                <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
                <tbody>${bowlerRows || '<tr><td colspan="6" class="empty">No data</td></tr>'}</tbody>
              </table>
            </div>
            ${fow.length ? `<p class="cricket-fow-text"><strong>FOW:</strong> ${Scorely.escapeHtml(fowText)}</p>` : ""}
          </section>
        `;
      });
      return html;
    }

    function renderMatchSummary(el) {
      if (!el) return;
      // Top scorer and best bowler across all innings
      const allBatterStats = {};
      const allBowlerStats = {};
      for (const inn of state.innings) {
        const bs = batterStats(inn.balls);
        for (const [id, s] of Object.entries(bs)) {
          if (!allBatterStats[id]) allBatterStats[id] = { runs: 0, balls: 0 };
          allBatterStats[id].runs += s.runs;
          allBatterStats[id].balls += s.balls;
        }
        const bls = bowlerStats(inn.balls);
        for (const [id, s] of Object.entries(bls)) {
          if (!allBowlerStats[id]) allBowlerStats[id] = { wickets: 0, runs: 0 };
          allBowlerStats[id].wickets += s.wickets;
          allBowlerStats[id].runs += s.runs;
        }
      }
      const topBatter = Object.entries(allBatterStats).sort((a, b) => b[1].runs - a[1].runs)[0];
      const bestBowler = Object.entries(allBowlerStats).sort((a, b) => b[1].wickets - a[1].wickets)[0];

      let html = `<ul class="cricket-summary-list">`;
      if (topBatter) {
        html += `<li>🏆 <strong>Top scorer:</strong> ${Scorely.escapeHtml(playerName(topBatter[0]))} — ${topBatter[1].runs} runs</li>`;
      }
      if (bestBowler) {
        html += `<li>🎳 <strong>Best bowler:</strong> ${Scorely.escapeHtml(playerName(bestBowler[0]))} — ${bestBowler[1].wickets} wickets / ${bestBowler[1].runs} runs</li>`;
      }
      for (const [idx, inn] of state.innings.entries()) {
        const s = inningsSummary(inn);
        const bt = teamById(inn.battingTeamId);
        html += `<li>Innings ${idx + 1}: ${Scorely.escapeHtml(bt?.name || "—")} ${s.runs}/${s.wickets} (${s.overs} ov)</li>`;
      }
      html += `</ul>`;
      el.innerHTML = html;
    }

    /* ────────────────────────────────────────────────────────
     *  MINI SCOREBOARD  (shown in all phases)
     * ──────────────────────────────────────────────────────── */

    function renderMiniScoreboard() {
      if (state.innings.length === 0) return "";
      const rows = state.innings.map((inn, idx) => {
        const bt = teamById(inn.battingTeamId);
        const s = inningsSummary(inn);
        const isLive = !inn.closed;
        return `<tr>
          <td>${Scorely.escapeHtml(bt?.name || "—")}</td>
          <td>Inns ${idx + 1}</td>
          <td><strong>${s.runs}/${s.wickets}</strong>${isLive ? " <span class='cricket-live-dot'>●</span>" : ""}</td>
          <td>${s.overs} ov</td>
          <td>${inn.closed ? Scorely.escapeHtml(inn.closeReason || "closed") : "live"}</td>
        </tr>`;
      }).join("");

      return `
        <section class="card">
          <h2>Match Scorecard</h2>
          <div class="table-wrap">
            <table class="cricket-score-table">
              <thead><tr><th>Team</th><th>Innings</th><th>Score</th><th>Overs</th><th>Status</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
      `;
    }

    /* ────────────────────────────────────────────────────────
     *  SHARED HELPERS
     * ──────────────────────────────────────────────────────── */

    function appendResetControls(root) {
      const el = document.createElement("section");
      el.className = "card";
      el.innerHTML = `
        <div class="row" style="flex-wrap:wrap;gap:10px;margin-top:0;">
          <button id="reset-match-btn">Reset Match</button>
          <button id="reset-all-btn" class="danger">Reset All</button>
        </div>
      `;
      el.querySelector("#reset-match-btn").addEventListener("click", resetMatch);
      el.querySelector("#reset-all-btn").addEventListener("click", resetAll);
      root.appendChild(el);
    }

    /* ── public API ──────────────────────────────────────── */

    return {
      get state() { return state; },

      mount(el) {
        container = el;

        // Back-compat: if old simplified state has players[] (not teams[].players), migrate
        if (Array.isArray(state.players) && state.players.length > 0 && state.teams) {
          // old state had flat players, skip migration — use fresh
          if (!state.teams[0].players || state.teams[0].players.length === 0) {
            // can't auto-migrate; just show fresh setup
          }
        }

        render();
      },

      // Externally callable (used by some test/integration paths)
      addRun(n) {
        recordBall({ runs: n });
      },
      addWicket() {
        const inn = currentInnings();
        if (!inn) return;
        openWicketDialog(inn);
      },
      endInnings(isDeclared) {
        closeInnings(isDeclared ? "declared" : "manual");
      },
    };
  };

})();
