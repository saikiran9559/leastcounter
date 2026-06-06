const STORAGE_KEY = "leastcounter:v1";

const state = load() || {
  limit: 250,
  players: [],
  rounds: [],
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function totalFor(playerId) {
  return state.rounds.reduce((sum, r) => sum + (r.scores[playerId] || 0), 0);
}

function isOut(playerId) {
  return totalFor(playerId) >= state.limit;
}

function activePlayers() {
  return state.players.filter((p) => !isOut(p.id));
}

function winner() {
  const active = activePlayers();
  if (state.players.length >= 2 && active.length === 1 && state.rounds.length > 0) {
    return active[0];
  }
  return null;
}

function leaderId() {
  const active = activePlayers();
  if (active.length === 0) return null;
  return active.reduce((best, p) =>
    totalFor(p.id) < totalFor(best.id) ? p : best
  ).id;
}

function addPlayer(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (state.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
    alert("That name is already taken.");
    return;
  }
  state.players.push({ id: uid(), name: trimmed });
  save();
  render();
}

function removePlayer(id) {
  if (state.rounds.length > 0) {
    if (!confirm("Rounds already exist. Remove this player and their scores?")) return;
    state.rounds = state.rounds.map((r) => {
      const { [id]: _, ...rest } = r.scores;
      return { ...r, scores: rest };
    });
  }
  state.players = state.players.filter((p) => p.id !== id);
  save();
  render();
}

function addRound(scores) {
  state.rounds.push({ id: uid(), scores });
  save();
  render();
}

function removeRound(roundId) {
  if (!confirm("Delete this round?")) return;
  state.rounds = state.rounds.filter((r) => r.id !== roundId);
  save();
  render();
}

function resetGame() {
  if (!confirm("Reset everything — players and rounds?")) return;
  state.players = [];
  state.rounds = [];
  save();
  render();
}

function setLimit(v) {
  const n = parseInt(v, 10);
  if (Number.isFinite(n) && n > 0) {
    state.limit = n;
    save();
    render();
  }
}

function renderPlayers() {
  const list = document.getElementById("player-list");
  list.innerHTML = "";
  if (state.players.length === 0) {
    list.innerHTML = '<li class="empty">No players yet — add at least two to begin.</li>';
    return;
  }
  for (const p of state.players) {
    const li = document.createElement("li");
    if (isOut(p.id)) li.classList.add("out");
    li.innerHTML = `<span>${escapeHtml(p.name)}</span>`;
    const btn = document.createElement("button");
    btn.className = "icon";
    btn.textContent = "×";
    btn.title = "Remove player";
    btn.onclick = () => removePlayer(p.id);
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function renderTable() {
  const header = document.getElementById("score-header");
  const body = document.getElementById("score-body");
  const totals = document.getElementById("totals-row");

  header.innerHTML = "<th>Round</th>";
  totals.innerHTML = "<th>Total</th>";
  body.innerHTML = "";

  const leader = leaderId();

  for (const p of state.players) {
    const th = document.createElement("th");
    th.textContent = p.name;
    if (isOut(p.id)) th.classList.add("out");
    header.appendChild(th);

    const td = document.createElement("td");
    const total = totalFor(p.id);
    td.textContent = total;
    td.classList.add("player-cell");
    if (isOut(p.id)) td.classList.add("out");
    else if (p.id === leader && state.rounds.length > 0) td.classList.add("leader");
    totals.appendChild(td);
  }

  // delete column header
  if (state.rounds.length > 0) {
    const blank = document.createElement("th");
    header.appendChild(blank);
    const blankTotal = document.createElement("td");
    totals.appendChild(blankTotal);
  }

  if (state.rounds.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = state.players.length + 1 || 2;
    td.className = "empty";
    td.textContent = "No rounds yet.";
    tr.appendChild(td);
    body.appendChild(tr);
    return;
  }

  state.rounds.forEach((r, idx) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = `R${idx + 1}`;
    tr.appendChild(th);

    for (const p of state.players) {
      const td = document.createElement("td");
      const v = r.scores[p.id];
      td.textContent = v === undefined ? "—" : v;
      tr.appendChild(td);
    }

    const tdDel = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "icon";
    delBtn.textContent = "×";
    delBtn.title = "Delete round";
    delBtn.onclick = () => removeRound(r.id);
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    body.appendChild(tr);
  });
}

function renderRoundForm() {
  const wrap = document.getElementById("round-inputs");
  const form = document.getElementById("round-form");
  wrap.innerHTML = "";

  const w = winner();
  if (state.players.length < 2 || w) {
    form.classList.add("hidden");
    return;
  }
  form.classList.remove("hidden");

  for (const p of state.players) {
    const label = document.createElement("label");
    if (isOut(p.id)) label.classList.add("out");
    label.innerHTML = `<span>${escapeHtml(p.name)}${isOut(p.id) ? " (out)" : ""}</span>`;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.placeholder = isOut(p.id) ? "—" : "0";
    input.dataset.playerId = p.id;
    input.disabled = isOut(p.id);
    label.appendChild(input);
    wrap.appendChild(label);
  }
}

function renderStatus() {
  const banner = document.getElementById("winner-banner");
  const list = document.getElementById("status-list");

  const w = winner();
  if (w) {
    banner.classList.remove("hidden");
    banner.textContent = `🏆 ${w.name} wins with ${totalFor(w.id)} points!`;
  } else {
    banner.classList.add("hidden");
  }

  list.innerHTML = "";
  if (state.players.length === 0) {
    list.innerHTML = '<li class="empty">Add players to see status.</li>';
    return;
  }
  const leader = leaderId();
  const sorted = [...state.players].sort((a, b) => totalFor(a.id) - totalFor(b.id));
  for (const p of sorted) {
    const li = document.createElement("li");
    const total = totalFor(p.id);
    const out = isOut(p.id);
    if (out) li.classList.add("out");
    else if (p.id === leader && state.rounds.length > 0) li.classList.add("leader");
    li.innerHTML = `<span>${escapeHtml(p.name)}${out ? " — OUT" : ""}</span><strong>${total}</strong>`;
    list.appendChild(li);
  }
}

function render() {
  document.getElementById("limit-input").value = state.limit;
  renderPlayers();
  renderTable();
  renderRoundForm();
  renderStatus();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

// Event wiring
document.getElementById("add-player").onclick = () => {
  const input = document.getElementById("new-player-name");
  addPlayer(input.value);
  input.value = "";
  input.focus();
};

document.getElementById("new-player-name").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("add-player").click();
  }
});

document.getElementById("limit-input").addEventListener("change", (e) => {
  setLimit(e.target.value);
});

document.getElementById("reset-game").onclick = resetGame;

document.getElementById("download-pdf").onclick = downloadPdf;

function downloadPdf() {
  if (state.players.length === 0) {
    alert("Add players before exporting.");
    return;
  }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library failed to load. Check your internet connection and refresh.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const w = winner();
  const dateStr = new Date().toLocaleString();

  doc.setFontSize(20);
  doc.text("Least Count — Scoreboard", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Generated ${dateStr}  •  Elimination limit: ${state.limit}`, pageWidth / 2, 25, { align: "center" });
  doc.setTextColor(0);

  if (w) {
    doc.setFontSize(14);
    doc.setTextColor(34, 139, 87);
    doc.text(`Winner: ${w.name} (${totalFor(w.id)} pts)`, pageWidth / 2, 35, { align: "center" });
    doc.setTextColor(0);
  }

  const head = [["Round", ...state.players.map((p) => p.name)]];
  const body = state.rounds.map((r, idx) => [
    `R${idx + 1}`,
    ...state.players.map((p) => {
      const v = r.scores[p.id];
      return v === undefined ? "—" : String(v);
    }),
  ]);
  const totalsRow = [
    "Total",
    ...state.players.map((p) => {
      const total = totalFor(p.id);
      return isOut(p.id) ? `${total} (OUT)` : String(total);
    }),
  ];

  doc.autoTable({
    head,
    body,
    foot: [totalsRow],
    startY: w ? 42 : 32,
    theme: "grid",
    headStyles: { fillColor: [60, 80, 160], halign: "center" },
    footStyles: { fillColor: [230, 230, 240], textColor: 20, fontStyle: "bold", halign: "center" },
    bodyStyles: { halign: "center" },
    columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
    didParseCell: (data) => {
      if (data.section === "foot" && data.column.index > 0) {
        const player = state.players[data.column.index - 1];
        if (player && isOut(player.id)) {
          data.cell.styles.textColor = [200, 50, 50];
        }
      }
    },
  });

  const filename = w
    ? `least-count-${w.name.toLowerCase().replace(/\s+/g, "-")}-wins.pdf`
    : `least-count-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

document.getElementById("round-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = document.querySelectorAll("#round-inputs input");
  const scores = {};
  for (const inp of inputs) {
    if (inp.disabled) continue;
    const v = inp.value === "" ? 0 : parseInt(inp.value, 10);
    if (!Number.isFinite(v) || v < 0) {
      alert("Scores must be non-negative numbers.");
      return;
    }
    scores[inp.dataset.playerId] = v;
  }
  if (Object.keys(scores).length === 0) return;
  addRound(scores);
  for (const inp of inputs) inp.value = "";
});

render();
