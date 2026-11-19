/* ==========================================================================
   JOB SHEET  (Role 14)  staff only
   api.ops.job(ref) returns { booking, teams, service }:
     booking: everything a customer sees plus phone, email, access_notes,
              notes, next_statuses ["assigned", "cancelled"], checklist
              [{ id, task, done, by, at }], timeline (with actor), issues,
              payment_status, pricing ("fixed" or "quote")
     teams:   [{ id, name, lead, skills, jobs: [that day's jobs] }]
   Actions (each returns the updated { booking }):
     api.ops.setStatus(ref, status, note)     api.ops.assign(ref, teamId)
     api.ops.sendQuote(ref, price, note)      api.ops.payment(ref, "paid", "transfer")
     api.ops.tick(ref, itemId, true|false)    api.ops.note(ref, text)
     api.ops.resolve(issueId, text)
   The API checks every rule (who may do what, which status comes next), so
   show its error message with H.toast(err.message) when it says no.
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const ref = H.param("ref");
let job = null;

const LABELS = { confirmed: "Confirm booking", assigned: "Mark assigned", en_route: "Team on the way", in_progress: "Start the job",
  pending_review: "Job done, for review", completed: "Complete", issue: "Flag an issue", awaiting_customer: "Waiting for customer", cancelled: "Cancel booking" };

async function load() {
  if (!api.signedIn()) return H.go("index.html");
  if (!ref) return H.problem(H.$("#jobHead"), { message: "Open a job from the job board." });
  try {
    H.staff((await api.me()).staff);
    job = await api.ops.job(ref);
    render();
  } catch (err) {
    if (err.status === 401) return H.go("index.html");
    H.problem(H.$("#jobHead"), err);
  }
}
function render() {
  head(job.booking);
  details(job.booking);
  checklist(job.booking);
  actions(job.booking, job.teams);
  audit(job.booking);
  issues(job.booking);
}
/* After any action: keep the new booking and draw again (done for you). */
async function act(promise, message) {
  try {
    const res = await promise;
    if (res.booking) job.booking = res.booking;
    if (res.checklist) job.booking.checklist = res.checklist;
    H.toast(message);
    job = await api.ops.job(ref);
    render();
  } catch (err) {
    H.toast(err.message);
  }
}

function head(b) {
  H.$("#jobHead").innerHTML = `
    <div><span class="small muted">${H.esc(b.service.name)}${b.demo ? " · demo job" : ""}</span><h1 class="mono">${H.esc(b.reference)}</h1></div>
    <div class="row">${H.status(b.status, b.status_label)}<span class="pill">${H.icon("calendar")} ${H.date(b.date)} · ${H.esc(b.window_label)}</span></div>`;
}
function details(b) {
  const d = b.details || {};
  const size = d.bedrooms ? `${d.bedrooms} bedroom${d.bedrooms > 1 ? "s" : ""}, ${d.bathrooms} bathroom${d.bathrooms > 1 ? "s" : ""}` : d.car_type ? `${d.car_type}, ${d.car_package}` : "";
  const rows = [
    ["Customer", H.esc(b.customer_name)], ["Phone", `<a href="tel:${H.esc(b.phone)}">${H.esc(b.phone)}</a>`],
    ["Email", H.esc(b.email || "")], ["Area", H.esc(b.area)], ["Address", H.esc(b.address)],
    ["Access notes", H.esc(b.access_notes || "")], ["Size", H.esc(size)], ["Add-ons", H.esc((d.extras || []).join(", "))],
    ["Repeat", H.esc(d.recurring || "")], ["Customer notes", H.esc(b.notes || "")],
    ["Price", b.price_label ? H.esc(b.price_label) : "Quote needed"],
    ["Payment", b.payment_status === "paid" ? `Paid by ${H.esc(b.payment_method)}` : H.esc(b.payment_status)],
  ].filter(([, v]) => v);
  H.$("#details").innerHTML = `<h3>Customer and job</h3><dl class="dl job-dl">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
}

function checklist(b) {
  const list = b.checklist || [];
  const done = list.filter((c) => c.done).length;
  H.$("#checklist").innerHTML = `
    <div class="row between"><h3>Checklist</h3><span class="small muted">${done} of ${list.length} done</span></div>
    <div class="meter"><i style="width:${list.length ? Math.round(done * 100 / list.length) : 0}%"></i></div>
    <div class="ticklist">${list.map((c) => `
      <label class="tick-row ${c.done ? "done" : ""}"><input type="checkbox" data-item="${c.id}" ${c.done ? "checked" : ""}>
        <span><span class="task">${H.esc(c.task)}</span>${c.done && c.by ? `<small>by ${H.esc(c.by)}</small>` : ""}</span></label>`).join("")}</div>`;
}
H.$("#checklist").addEventListener("change", (e) => {
  const box = e.target.closest("[data-item]");
  if (box) act(api.ops.tick(ref, Number(box.dataset.item), box.checked), box.checked ? "Ticked" : "Unticked");
});

function actions(b, teams) {
  let html = `<h3>Next step</h3>`;
  html += b.next_statuses.length
    ? `<div class="action-buttons">${b.next_statuses.map((s) =>
        `<button type="button" class="btn ${s === "cancelled" ? "btn-ghost danger" : s === "issue" ? "btn-ghost" : "btn-dark"} btn-sm" data-status="${s}">${LABELS[s] || s}</button>`).join("")}</div>`
    : `<p class="small muted">This job is closed.</p>`;
  if (["confirmed", "assigned"].includes(b.status)) {
    html += `<div class="action-block"><label class="label" for="teamPick">Team</label>
      <div class="row"><select class="select" id="teamPick">${teams.map((t) =>
        `<option value="${t.id}" ${b.team_id === t.id ? "selected" : ""}>${H.esc(t.name)} (lead ${H.esc(t.lead)}), ${t.jobs.length} job${t.jobs.length === 1 ? "" : "s"} that day</option>`).join("")}</select>
      <button type="button" class="btn btn-sm" id="assignBtn">Assign team</button></div></div>`;
  }
  if (b.pricing === "quote" && ["new", "awaiting_customer"].includes(b.status)) {
    html += `<div class="action-block"><label class="label" for="quotePrice">Quote (₦)</label>
      <input class="input" id="quotePrice" type="number" min="1000" step="500" value="${b.price || ""}" placeholder="150000">
      <input class="input" id="quoteNote" placeholder="What the quote covers (optional)" value="${H.esc(b.quote_note || "")}">
      <button type="button" class="btn btn-sm" id="quoteBtn">Send quote</button></div>`;
  }
  if (b.status === "completed" && b.payment_status !== "paid") {
    html += `<div class="action-block"><label class="label" for="payMethod">Payment received</label>
      <div class="row"><select class="select" id="payMethod"><option value="transfer">Bank transfer</option><option value="card">Card</option><option value="cash">Cash</option></select>
      <button type="button" class="btn btn-sm" id="payBtn">Mark paid</button></div></div>`;
  }
  html += `<div class="action-block"><label class="label" for="noteText">Internal note</label>
    <textarea class="textarea" id="noteText" rows="2" placeholder="Only staff see this"></textarea>
    <button type="button" class="btn btn-ghost btn-sm" id="noteBtn">Add note</button></div>`;
  H.$("#actions").innerHTML = html;
}
H.$("#actions").addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.status) {
    if (t.dataset.status === "cancelled" && !confirm("Cancel this booking?")) return;
    act(api.ops.setStatus(ref, t.dataset.status, t.dataset.status === "pending_review" ? H.$("#noteText").value : undefined), "Status updated");
  }
  if (t.id === "assignBtn") act(api.ops.assign(ref, Number(H.$("#teamPick").value)), "Team assigned");
  if (t.id === "quoteBtn") act(api.ops.sendQuote(ref, Number(H.$("#quotePrice").value), H.$("#quoteNote").value), "Quote sent to the customer");
  if (t.id === "payBtn") act(api.ops.payment(ref, "paid", H.$("#payMethod").value), "Payment recorded");
  if (t.id === "noteBtn" && H.$("#noteText").value.trim()) act(api.ops.note(ref, H.$("#noteText").value.trim()), "Note added");
});

function audit(b) {
  H.$("#audit").innerHTML = `<h3>History</h3><ol class="timeline" style="margin-top:16px">${b.timeline.slice().reverse().map((t, i) => `
    <li class="${i === 0 ? "now" : ""}"><b>${H.esc(t.status_label || t.kind)}</b>${t.note ? `<span class="small">${H.esc(t.note)}</span><br>` : ""}
      <time>${H.esc(t.actor || "")} · ${H.time(t.at)}</time></li>`).join("")}</ol>`;
}
function issues(b) {
  const box = H.$("#issues");
  box.hidden = !b.issues.length;
  box.innerHTML = `<h3>Issues</h3>${b.issues.map((i) => `
    <div class="issue ${i.status}">
      <div class="row between"><b>${H.esc(i.category)}</b>${H.status(i.status === "open" ? "issue" : "completed", i.status === "open" ? "Open" : "Resolved")}</div>
      <p class="small">${H.esc(i.description)}</p>
      ${i.status === "open"
        ? `<div class="row"><input class="input" data-fix="${i.id}" placeholder="How was it resolved?"><button type="button" class="btn btn-sm" data-resolve="${i.id}">Resolve</button></div>`
        : `<p class="tiny muted">${H.esc(i.resolution)} (${H.esc(i.resolved_by)})</p>`}
    </div>`).join("")}`;
}
H.$("#issues").addEventListener("click", (e) => {
  const b = e.target.closest("[data-resolve]");
  if (!b) return;
  const text = H.$(`[data-fix="${b.dataset.resolve}"]`).value.trim();
  if (!text) return H.toast("Write how it was resolved first.");
  act(api.ops.resolve(Number(b.dataset.resolve), text), "Issue resolved");
});

load();
