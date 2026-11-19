/* ==========================================================================
   OPERATIONS JOB BOARD  (Role 13)  staff only
   api.login(email, password)     signs in and remembers the sign-in
   api.me()                       who is signed in ({ staff: { name, role, team } })
   api.ops.metrics()              the pilot numbers (operations and admin only)
   api.ops.bookings(filters)      { bookings: [...], by_status: { new: 3, ... }, statuses }
       filters: { status, date, q, sort }   e.g. { status: "new", date: "2026-11-12" }
   Each booking: reference, status, status_label, customer_name, phone,
   service.name, date, window_label, area, team ({ name, lead } or null),
   price_label, payment_status, open_issues.
   A row opens the job sheet: H.link("job.html", { ref: b.reference })
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const filters = { status: "", date: "", q: "" };
let me = null;

/* Sign-in or board (done for you). */
async function start() {
  if (!api.signedIn()) return showSignin();
  try {
    me = (await api.me()).staff;
    H.staff(me);
    H.$("#signin").hidden = true;
    H.$("#board").hidden = false;
    H.$("#today").textContent = "Signed in as " + me.name + ". " + H.date(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" });
    if (me.role !== "lead") loadMetrics(); else H.$("#metrics").hidden = true;
    loadBoard();
  } catch (err) {
    showSignin();
  }
}
function showSignin() {
  H.staff(null);
  H.$("#board").hidden = true;
  H.$("#signin").hidden = false;
}

const loginForm = H.$("#loginForm");
if (loginForm) loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = H.values(loginForm);
  const button = H.$("#loginBtn");
  H.busy(button, true);
  try {
    await api.login(v.email, v.password);
    H.busy(button, false);
    start();
  } catch (err) {
    H.showError(loginForm, err);
    H.busy(button, false);
  }
});

async function loadMetrics() {
  try {
    const m = (await api.ops.metrics()).metrics;
    const card = (label, value, sub) => `<div class="card metric"><span class="small muted">${label}</span><b>${value}</b>${sub ? `<span class="tiny muted">${sub}</span>` : ""}</div>`;
    H.$("#metrics").innerHTML =
      card("Jobs today", m.today, "Across all teams") +
      card("Open jobs", m.open, m.awaiting_quote + " waiting for a quote") +
      card("Completion rate", m.completion_rate == null ? "None yet" : m.completion_rate + "%", m.completed + " completed, " + m.cancelled + " cancelled") +
      card("Revenue completed", H.money(m.revenue), "Average rating " + (m.average_rating || "none") + " from " + m.ratings);
  } catch (err) {
    H.problem(H.$("#metrics"), err);
  }
}

async function loadBoard() {
  const box = H.$("#tableWrap");
  try {
    const data = await api.ops.bookings(filters);
    const total = Object.values(data.by_status).reduce((a, b) => a + b, 0);
    const keys = ["new", "awaiting_customer", "confirmed", "assigned", "en_route", "in_progress", "pending_review", "issue", "completed", "cancelled"];
    H.$("#statusTabs").innerHTML = `<button type="button" class="stab ${filters.status ? "" : "on"}" data-status="">All <span>${total}</span></button>` +
      keys.filter((k) => data.by_status[k]).map((k) =>
        `<button type="button" class="stab ${filters.status === k ? "on" : ""}" data-status="${k}">${H.esc(data.statuses[k])} <span>${data.by_status[k]}</span></button>`).join("");
    if (!data.bookings.length) return H.empty(box, "No jobs here", "Try another status or date.", "list");
    box.innerHTML = `<table class="table">
      <thead><tr><th>Reference</th><th>Customer</th><th>Service</th><th>When</th><th>Area</th><th>Team</th><th>Status</th><th>Price</th></tr></thead>
      <tbody>${data.bookings.map((b) => `
        <tr data-ref="${b.reference}">
          <td><b class="mono">${H.esc(b.reference)}</b>${b.open_issues ? ' <span class="flag" title="Open issue"></span>' : ""}${b.demo ? ' <span class="tiny muted">demo</span>' : ""}</td>
          <td>${H.esc(b.customer_name)}<br><span class="tiny muted">${H.esc(b.phone)}</span></td>
          <td>${H.esc(b.service.name)}</td>
          <td>${H.date(b.date, { weekday: "short", day: "numeric", month: "short" })}<br><span class="tiny muted">${H.esc(b.window_label)}</span></td>
          <td>${H.esc(b.area)}</td>
          <td>${b.team ? H.esc(b.team.name) : '<span class="muted">Not assigned</span>'}</td>
          <td>${H.status(b.status, b.status_label)}</td>
          <td>${b.price_label ? H.esc(b.price_label) : '<span class="muted">Quote</span>'}</td>
        </tr>`).join("")}</tbody></table>`;
  } catch (err) {
    if (err.status === 401) return showSignin();
    H.problem(box, err);
  }
}
H.$("#statusTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".stab");
  if (!b) return;
  filters.status = b.dataset.status;
  loadBoard();
});
H.$("#tableWrap").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-ref]");
  if (row) H.go("job.html", { ref: row.dataset.ref });
});

/* Search and date (done for you): wait until typing stops, then reload. */
let typing = null;
H.$("#search").addEventListener("input", (e) => {
  clearTimeout(typing);
  typing = setTimeout(() => { filters.q = e.target.value.trim(); loadBoard(); }, 300);
});
H.$("#date").addEventListener("change", (e) => { filters.date = e.target.value; loadBoard(); });

start();
