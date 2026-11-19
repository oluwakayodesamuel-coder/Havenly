/* ==========================================================================
   RATE OR REPORT  (Role 9)
   Opened with ?ref=...&phone=... (and &mode=issue for a problem).
   api.feedback(ref, phone, rating, comment, share)       rate a completed booking (once)
   api.reportIssue(ref, phone, category, description)     report a problem
   api.config().issue_categories                          the list for "What went wrong?"
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const ref = H.param("ref");
const phone = H.param("phone");

function openTab(name) {
  H.$$(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
  H.$("#rateForm").hidden = name !== "rate";
  H.$("#issueForm").hidden = name !== "issue";
}
H.$(".tabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (tab) openTab(tab.dataset.tab);
});
openTab(H.param("mode") === "issue" ? "issue" : "rate");

/* Done for you: the booking line at the top, and the problem categories. */
async function load() {
  if (!ref || !phone) {
    H.$("#aboutLine").innerHTML = 'Open this page from <a href="track.html">Track my booking</a>.';
    return;
  }
  try {
    const [res, cfg] = await Promise.all([api.booking(ref, phone), api.config()]);
    const b = res.booking;
    H.$("#aboutLine").innerHTML = `${H.esc(b.service.name)} on ${H.date(b.date)} (${H.esc(b.reference)}).`;
    H.$("#category").innerHTML = '<option value="">Choose one</option>' + cfg.issue_categories.map((c) => `<option>${H.esc(c)}</option>`).join("");
    if (b.rating) done(H.$("#rateForm"), "You rated this clean " + b.rating + " out of 5. Thank you!");
  } catch (err) {
    H.problem(H.$("#rateForm"), err);
  }
}
function done(formEl, text) {
  formEl.innerHTML = `<div class="thanks"><span class="icon-tile">${H.icon("heart")}</span><h3>Thank you</h3><p class="muted">${H.esc(text)}</p>
    <a class="btn btn-ghost" href="${H.link("track.html", { ref, phone })}">Back to my booking</a></div>`;
}

H.$("#rateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const v = H.values(form);
  if (!v.rating) return H.showError(form, { message: "Tap a star to rate." });
  const button = H.$("#rateBtn");
  H.busy(button, true);
  try {
    await api.feedback(ref, phone, Number(v.rating), v.comment, v.share);
    done(form, "Your rating helps the team get better.");
  } catch (err) {
    H.showError(form, err);
    H.busy(button, false);
  }
});
H.$("#issueForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const v = H.values(form);
  if (!v.category) return H.showError(form, { message: "Choose what went wrong.", field: "category" });
  if (!v.description) return H.showError(form, { message: "Tell us what happened.", field: "description" });
  const button = H.$("#issueBtn");
  H.busy(button, true);
  try {
    const res = await api.reportIssue(ref, phone, v.category, v.description);
    done(form, res.next);
  } catch (err) {
    H.showError(form, err);
    H.busy(button, false);
  }
});

load();
