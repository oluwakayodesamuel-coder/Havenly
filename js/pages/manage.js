/* ==========================================================================
   RESCHEDULE OR CANCEL  (Role 8)
   Opened with ?ref=...&phone=... from track.html.
   api.booking(ref, phone)                 the booking (can_reschedule, can_cancel, free_cancel, price)
   api.availability(service)               the next 14 days
   api.availability(service, date)         the windows of one day
   api.reschedule(ref, phone, date, window)  move it
   api.cancel(ref, phone, reason)          cancel it; returns { fee, fee_label }
   The rules (24 hours free cancellation, 12 hours to reschedule) are checked
   by the API too, so a wrong click can never break them.
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const ref = H.param("ref");
const phone = H.param("phone");
let booking = null;
let newDate = null;

H.$("#backLink").href = H.link("track.html", { ref, phone });

async function load() {
  if (!ref || !phone) {
    H.$("#bookingLine").innerHTML = 'Open this page from <a href="track.html">Track my booking</a>.';
    return;
  }
  try {
    const res = await api.booking(ref, phone);
    booking = res.booking;
    H.$("#bookingLine").innerHTML = `${H.esc(booking.service.name)}, ${H.date(booking.date)}, ${H.esc(booking.window_label)}. ${H.status(booking.status, booking.status_label)}`;
    if (!booking.can_reschedule) lock(H.$("#moveForm"), "This booking can no longer be moved online. Call us on +234 813 456 7890.");
    else showDays();
    if (!booking.can_cancel) lock(H.$("#cancelForm"), "This booking can no longer be cancelled online.");
    else feeNote();
  } catch (err) {
    H.problem(H.$(".manage"), err);
  }
}
function lock(formEl, text) {
  if (!formEl) return;
  formEl.innerHTML = `<div class="notice warn">${H.icon("info")}<span>${H.esc(text)}</span></div>`;
}

async function showDays() {
  const data = await api.availability(booking.service.slug);
  H.$("#days").innerHTML = data.days.map((d) => `
    <button type="button" class="day" data-date="${d.date}" ${d.closed || !d.open_windows ? "disabled" : ""}>
      <span>${H.date(d.date, { weekday: "short" })}</span><b>${H.date(d.date, { day: "numeric" })}</b><small>${H.date(d.date, { month: "short" })}</small>
    </button>`).join("");
}
H.$("#days").addEventListener("click", async (e) => {
  const day = e.target.closest(".day");
  if (!day || day.disabled) return;
  H.$$(".day").forEach((b) => b.classList.toggle("on", b === day));
  newDate = day.dataset.date;
  const a = await api.availability(booking.service.slug, newDate);
  H.$("#windows").innerHTML = a.windows.map((w) => `
    <label class="choice"><input type="radio" name="window" value="${w.key}" ${w.available ? "" : "disabled"}>
      <span><b>${H.esc(w.label)}</b><small>${w.available ? "Free" : "Full"}</small></span></label>`).join("");
});

H.$("#moveForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const win = H.values(form).window;
  if (!newDate || !win) return H.showError(form, { message: "Choose a new day and an arrival window." });
  const button = H.$("#moveBtn");
  H.busy(button, true);
  try {
    await api.reschedule(ref, phone, newDate, win);
    H.toast("Booking moved");
    setTimeout(() => H.go("track.html", { ref, phone }), 700);
  } catch (err) {
    H.showError(form, err);
    H.busy(button, false);
  }
});

function feeNote() {
  const box = H.$("#feeNote");
  if (!box) return;
  box.innerHTML = booking.free_cancel
    ? `<div class="notice ok">${H.icon("check-circle")}<span><b>Free cancellation.</b> You are more than 24 hours before your window.</span></div>`
    : `<div class="notice warn">${H.icon("alert")}<span><b>A late cancellation fee applies:</b> ${H.money(Math.round((booking.price || 0) * 0.2))} (20%), because your window is less than 24 hours away.</span></div>`;
}
const cancelForm = H.$("#cancelForm");
if (cancelForm) cancelForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!confirm("Cancel this booking? This cannot be undone.")) return;
  const button = H.$("#cancelBtn");
  H.busy(button, true);
  try {
    const res = await api.cancel(ref, phone, H.values(cancelForm).reason);
    H.toast(res.fee ? "Booking cancelled. Fee: " + res.fee_label : "Booking cancelled, free of charge");
    setTimeout(() => H.go("track.html", { ref, phone }), 900);
  } catch (err) {
    H.showError(cancelForm, err);
    H.busy(button, false);
  }
});

load();
