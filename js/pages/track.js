/* ==========================================================================
   TRACK MY BOOKING  (Role 7)
   api.booking(ref, phone) returns { booking } with: reference, status,
   status_label, service.name, date, window_label, area, address, details,
   price_label, quote_note, payment_status, team (name, lead), timeline
   [{ kind, status_label, note, at }], and what the customer may do now:
   can_accept_quote, can_reschedule, can_cancel, can_rate, can_report.
   Try it with a demo booking: the reference and phone of any booking you make.
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const form = H.$("#lookupForm");
let phoneUsed = "";

/* The journey of a booking, in order, for the progress bar (done for you). */
const JOURNEY = [["new", "Requested"], ["confirmed", "Confirmed"], ["assigned", "Team assigned"],
  ["en_route", "On the way"], ["in_progress", "Cleaning"], ["completed", "Done"]];
function progress(status) {
  const order = { new: 0, awaiting_customer: 0, confirmed: 1, assigned: 2, en_route: 3, in_progress: 4, pending_review: 5, issue: 4, completed: 5 };
  const at = order[status];
  if (status === "cancelled" || at === undefined) return "";
  return `<ol class="journey">${JOURNEY.map(([key, label], i) =>
    `<li class="${i < at ? "done" : i === at ? "now" : ""}"><span></span>${label}</li>`).join("")}</ol>`;
}

function show(b) {
  const team = b.team ? `${H.esc(b.team.name)}, lead ${H.esc(b.team.lead)}` : "Not assigned yet";
  H.$("#result").innerHTML = `
    <div class="split" style="margin-top:24px">
      <div class="card pad-lg stack-lg">
        <div class="row between"><div><span class="small muted">Booking</span><h2 class="ref">${H.esc(b.reference)}</h2></div>${H.status(b.status, b.status_label)}</div>
        ${progress(b.status)}
        ${b.quote_note ? `<div class="notice">${H.icon("info")}<span><b>Your quote: ${H.esc(b.price_label)}</b><br>${H.esc(b.quote_note)}</span></div>` : ""}
        <dl class="dl">
          <dt>Service</dt><dd>${H.esc(b.service.name)}</dd>
          <dt>Date</dt><dd>${H.date(b.date)}</dd>
          <dt>Arrival window</dt><dd>${H.esc(b.window_label)}</dd>
          <dt>Address</dt><dd>${H.esc(b.address)}</dd>
          <dt>Team</dt><dd>${team}</dd>
          <dt>Price</dt><dd>${b.price_label ? H.esc(b.price_label) : "Quote on the way"}${b.cancel_fee ? " (late cancellation fee " + H.money(b.cancel_fee) + ")" : ""}</dd>
          <dt>Payment</dt><dd>${b.payment_status === "paid" ? "Paid, thank you" : b.payment_status === "refunded" ? "Refunded" : "Pay when the job is done"}</dd>
        </dl>
        <div class="row" id="actions"></div>
      </div>
      <div class="card pad-lg">
        <h3 style="margin-bottom:18px">Updates</h3>
        <ol class="timeline">${b.timeline.slice().reverse().map((t, i) => `
          <li class="${i === 0 ? "now" : ""}"><b>${H.esc(t.status_label || "Update")}</b>
            ${t.note ? `<span class="small">${H.esc(t.note)}</span><br>` : ""}<time>${H.time(t.at)}</time></li>`).join("")}</ol>
      </div>
    </div>`;
  actions(b);
}

function actions(b) {
  const box = H.$("#actions");
  const q = { ref: b.reference, phone: phoneUsed };
  let html = "";
  if (b.can_accept_quote) html += `<button class="btn" type="button" id="acceptBtn">Accept quote of ${H.esc(b.price_label)}</button>`;
  if (b.can_reschedule || b.can_cancel) html += `<a class="btn btn-ghost" href="${H.link("manage.html", q)}">Reschedule or cancel</a>`;
  if (b.can_rate) html += `<a class="btn" href="${H.link("feedback.html", q)}">${H.icon("star")} Rate this clean</a>`;
  if (b.can_report) html += `<a class="btn btn-ghost" href="${H.link("feedback.html", { ...q, mode: "issue" })}">Report a problem</a>`;
  box.innerHTML = html;
  const accept = H.$("#acceptBtn");
  if (accept) accept.addEventListener("click", async () => {
    H.busy(accept, true);
    try {
      const res = await api.acceptQuote(b.reference, phoneUsed);
      H.toast("Quote accepted. Your booking is confirmed.");
      show(res.booking);
    } catch (err) {
      H.toast(err.message);
      H.busy(accept, false);
    }
  });
}

async function find(ref, phone) {
  const button = H.$("#findBtn");
  H.busy(button, true);
  H.clearErrors(form);
  try {
    const res = await api.booking(ref, phone);
    phoneUsed = phone;
    show(res.booking);
  } catch (err) {
    H.showError(form, err);
    H.$("#result").innerHTML = "";
  }
  H.busy(button, false);
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = H.values(form);
  if (!v.ref || !v.phone) return H.showError(form, { message: "Enter both your reference and your phone number." });
  find(v.ref, v.phone);
});
if (H.param("ref") && H.param("phone")) {
  form.ref.value = H.param("ref");
  form.phone.value = H.param("phone");
  find(H.param("ref"), H.param("phone"));
}
