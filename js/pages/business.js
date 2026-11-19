/* ==========================================================================
   HAVENLY FOR BUSINESS  (Role 10)
   The enquiry form sends a lead to the business team with api.business(details).
   api.config() gives the lists: business_types, frequencies, services.
   The API answers with { reference: "HB-XXXXXX", next: "..." }.
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const form = H.$("#bizForm");

const FOR_BUSINESS = ["office-cleaning", "deep-cleaning", "post-construction", "car-cleaning"];
async function fill() {
  try {
    const cfg = await api.config();
    H.$("#business_type").innerHTML = '<option value="">Choose one</option>' + cfg.business_types.map((t) => `<option>${H.esc(t)}</option>`).join("");
    H.$("#frequency").innerHTML = cfg.frequencies.map((f) => `<option ${f === "Weekly" ? "selected" : ""}>${H.esc(f)}</option>`).join("");
    H.$("#serviceChecks").innerHTML = cfg.services.filter((s) => FOR_BUSINESS.includes(s.slug)).map((s) => `
      <label class="choice"><input type="checkbox" name="services" value="${s.slug}" ${s.slug === "office-cleaning" ? "checked" : ""}>
        <span><b>${H.esc(s.name)}</b></span></label>`).join("");
    form.start_date.min = cfg.today;
  } catch (err) {
    H.showError(form, err);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = H.$("#bizBtn");
  H.busy(button, true);
  try {
    const res = await api.business(H.values(form));
    form.innerHTML = `
      <div class="thanks">
        <span class="icon-tile dark">${H.icon("check")}</span>
        <h3>Request received</h3>
        <p class="muted">Your reference is <b>${H.esc(res.reference)}</b>.</p>
        <p class="muted">${H.esc(res.next)}</p>
        <a class="btn btn-ghost" href="index.html">Back to Havenly</a>
      </div>`;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    H.showError(form, err);
    H.busy(button, false);
  }
});

fill();
