/* ==========================================================================
   BOOK, STEP 1  (Role 4)
   The customer picks a service, the size, add-ons and the area. Every change
   asks the API for the price (api.quote) and shows it in #priceBox.
   "Choose a time" passes everything to schedule.html in the address, like:
     schedule.html?service=home-cleaning&bedrooms=2&bathrooms=1&extras=fridge,oven&area=yaba
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const form = H.$("#bookForm");
let services = [];

/* Fill the service choices and the areas from the API (this part is done for you). */
async function start() {
  try {
    const [list, cfg] = await Promise.all([api.services(), api.config()]);
    services = list.services.filter((s) => !s.business_only);
    const wanted = H.param("service") || "home-cleaning";
    H.$("#serviceChoices").innerHTML = services.map((s) => `
      <label class="choice">
        <input type="radio" name="service" value="${s.slug}" ${s.slug === wanted ? "checked" : ""}>
        <span class="icon-tile">${H.icon(s.icon)}</span>
        <span><b>${H.esc(s.name)}</b><small>${H.esc(s.from_price_label)}</small></span>
      </label>`).join("");
    H.$("#area").innerHTML = '<option value="">Choose your area</option>' +
      cfg.areas.map((a) => `<option value="${a.key}">${H.esc(a.name)}${a.travel_fee ? " (+" + H.money(a.travel_fee) + " travel)" : ""}</option>`).join("");
    showExtras(cfg.extras);
    update();
  } catch (err) {
    H.problem(H.$("#priceBox"), err);
  }
}

function current() {
  return services.find((s) => s.slug === H.values(form).service) || services[0];
}
function fit() {
  const s = current();
  if (!s) return;
  H.$("#roomsBlock").hidden = s.category !== "home";
  H.$("#carBlock").hidden = s.category !== "car";
  H.$("#extrasBlock").hidden = s.category === "car" || s.pricing === "quote";
  H.$("#repeatBlock").hidden = !s.recurring;
}

/* The add-on choices (done for you). */
function showExtras(extras) {
  H.$("#extras").innerHTML = extras.map((e) => `
    <label class="choice"><input type="checkbox" name="extras" value="${e.key}">
      <span><b>${H.esc(e.name)}</b><small>+ ${H.money(e.price)}</small></span></label>`).join("");
}

function details() {
  return H.values(form);
}
async function update() {
  fit();
  const box = H.$("#priceBox");
  try {
    const q = await api.quote(details());
    if (q.pricing === "quote") {
      box.innerHTML = `<p class="money big">From ${H.money(q.from_price)}</p><p class="small muted">${H.esc(q.message)}</p>`;
    } else {
      box.innerHTML = `<div class="price-lines">
        ${q.lines.map((l) => `<div class="line"><span>${H.esc(l.label)}</span><span>${H.money(l.amount)}</span></div>`).join("")}
        <div class="line total"><span>Total</span><span class="money">${H.esc(q.total_label)}</span></div></div>`;
    }
  } catch (err) {
    H.problem(box, err);
  }
}
form.addEventListener("change", update);

/* The + and − buttons next to bedrooms and bathrooms (done for you). */
form.addEventListener("click", (e) => {
  const b = e.target.closest("[data-step]");
  if (!b) return;
  const input = form.querySelector(`[name="${b.dataset.step}"]`);
  input.value = Math.min(8, Math.max(1, Number(input.value || 1) + Number(b.dataset.by)));
  update();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = details();
  const s = current();
  if (!d.area) return H.showError(form, { message: "Choose your area.", field: "area" });
  H.go("schedule.html", {
    service: d.service,
    bedrooms: s.category === "home" ? d.bedrooms : "",
    bathrooms: s.category === "home" ? d.bathrooms : "",
    car_type: s.category === "car" ? d.car_type : "",
    car_package: s.category === "car" ? d.car_package : "",
    extras: s.category === "home" && s.pricing !== "quote" ? (d.extras || []).join(",") : "",
    area: d.area,
    recurring: s.recurring ? d.recurring : "",
  });
});

start();
