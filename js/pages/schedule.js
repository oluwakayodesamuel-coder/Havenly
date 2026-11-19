/* ==========================================================================
   BOOK, STEP 2  (Role 5)
   Everything chosen on book.html arrives in the address, for example
     schedule.html?service=home-cleaning&bedrooms=2&bathrooms=1&extras=fridge&area=yaba
   This page lets the customer choose a day and an arrival window from real
   availability, takes their details, and makes the booking with api.book().
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const form = H.$("#scheduleForm");

/* What was chosen on book.html, read back from the address (done for you). */
const chosen = {};
["service", "bedrooms", "bathrooms", "car_type", "car_package", "area", "recurring"].forEach((k) => {
  if (H.param(k)) chosen[k] = H.param(k);
});
chosen.service = chosen.service || "home-cleaning";
chosen.extras = H.param("extras") ? H.param("extras").split(",") : [];
H.$("#changeLink").href = H.link("book.html", { service: chosen.service });

/* The summary on the right: the service and its price (done for you). */
async function showSummary() {
  try {
    const [svc, q] = await Promise.all([api.service(chosen.service), api.quote(chosen)]);
    const s = svc.service;
    H.$("#summary").innerHTML = `
      <div class="row"><span class="icon-tile">${H.icon(s.icon)}</span><h3>${H.esc(s.name)}</h3></div>
      ${q.pricing === "quote"
        ? `<p class="small muted">${H.esc(q.message)}</p>`
        : `<div class="price-lines">${q.lines.map((l) => `<div class="line"><span>${H.esc(l.label)}</span><span>${H.money(l.amount)}</span></div>`).join("")}
           <div class="line total"><span>Total</span><span class="money">${H.esc(q.total_label)}</span></div></div>`}
      <div id="whenLine"></div>`;
  } catch (err) {
    H.problem(H.$("#summary"), err);
  }
}

async function showDays() {
  const box = H.$("#days");
  try {
    const data = await api.availability(chosen.service);
    box.innerHTML = data.days.map((d) => `
      <button type="button" class="day" data-date="${d.date}" ${d.closed || !d.open_windows ? "disabled" : ""}
              title="${d.closed ? H.esc(d.closed) : d.open_windows + " windows free"}">
        <span>${H.date(d.date, { weekday: "short" })}</span>
        <b>${H.date(d.date, { day: "numeric" })}</b>
        <small>${H.date(d.date, { month: "short" })}</small>
      </button>`).join("");
  } catch (err) {
    H.problem(box, err);
  }
}
H.$("#days").addEventListener("click", (e) => {
  const day = e.target.closest(".day");
  if (!day || day.disabled) return;
  H.$$(".day").forEach((b) => b.classList.toggle("on", b === day));
  showWindows(day.dataset.date);
});

let chosenDate = null;
async function showWindows(date) {
  chosenDate = date;
  const box = H.$("#windows");
  box.innerHTML = '<div class="skeleton" style="height:64px"></div>';
  try {
    const a = await api.availability(chosen.service, date);
    box.innerHTML = a.windows.map((w) => `
      <label class="choice">
        <input type="radio" name="window" value="${w.key}" ${w.available ? "" : "disabled"}>
        <span><b>${H.esc(w.label)}</b><small>${w.available ? w.teams_left + " team" + (w.teams_left > 1 ? "s" : "") + " free" : "Full"}</small></span>
      </label>`).join("");
    H.$("#whenLine").innerHTML = `<p class="when">${H.icon("calendar")} ${H.date(date)}</p>`;
  } catch (err) {
    H.problem(box, err);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = H.$("#bookBtn");
  const v = H.values(form);
  if (!chosenDate) return H.showError(form, { message: "Choose a day for your clean." });
  if (!v.window) return H.showError(form, { message: "Choose an arrival window." });
  if (!v.agree) return H.showError(form, { message: "Tick the box to confirm you have read the policy.", field: "agree" });
  const d = { ...chosen, ...v, date: chosenDate };
  H.busy(button, true);
  try {
    const res = await api.book(d);
    H.go("confirmation.html", { ref: res.reference, phone: d.phone });
  } catch (err) {
    H.showError(form, err);
    H.busy(button, false);
    if (err.field === "window") showWindows(chosenDate);
  }
});

showSummary();
showDays();
