/* ==========================================================================
   SERVICE DETAILS PAGE  (Role 3)
   The page reads which service to show from the address: service.html?slug=car-cleaning
   api.service(slug) returns { service, related, extras }:
     service: name, summary, description, image, icon, hours, crew,
              includes [..], excludes [..], pricing ("fixed" or "quote"),
              from_price_label, rates (rooms), packages and cars (car),
              recurring (true when it can be weekly)
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const slug = H.param("slug") || "home-cleaning";

function intro(s) {
  return `
    <img class="service-photo" src="${H.asset(s.image)}" alt="${H.esc(s.name)} by Havenly">
    <div class="stack">
      <span class="eyebrow">${s.category === "car" ? "Car care" : s.category === "business" ? "For business" : "Home services"}</span>
      <h1>${H.esc(s.name)}</h1>
      <span class="bar"></span>
      <p class="lead">${H.esc(s.description)}</p>
      <div class="facts">
        <span>${H.icon("clock")} About ${s.hours} hour${s.hours > 1 ? "s" : ""}</span>
        <span>${H.icon("users")} ${s.crew} trained cleaner${s.crew > 1 ? "s" : ""}</span>
        ${s.recurring ? `<span>${H.icon("repeat")} Weekly plans</span>` : ""}
      </div>
    </div>`;
}

function scope(s) {
  const list = (items, icon) => items.map((t) => `<li>${H.icon(icon)}<span>${H.esc(t)}</span></li>`).join("");
  return `
    <div class="grid grid-2">
      <div class="card flat"><h3>What's included</h3><ul class="ticks" style="margin-top:16px">${list(s.includes, "check")}</ul></div>
      <div class="card flat"><h3>Not included</h3><ul class="ticks cross" style="margin-top:16px">${list(s.excludes, "x")}</ul></div>
    </div>`;
}

function priceBox(s) {
  let lines = "";
  if (s.rates) {
    lines = `<div class="price-lines">
      <div class="line"><span>Base price</span><b>${H.money(s.rates.base)}</b></div>
      <div class="line"><span>Each extra bedroom</span><b>+ ${H.money(s.rates.per_bedroom)}</b></div>
      <div class="line"><span>Each extra bathroom</span><b>+ ${H.money(s.rates.per_bathroom)}</b></div>
      <p class="tiny muted">${H.esc(s.rates.note)}</p></div>`;
  } else if (s.packages) {
    lines = `<div class="price-lines">${s.packages.map((p) => `<div class="line"><span>${H.esc(p.name)}</span><b>${H.money(p.price)}</b></div>`).join("")}
      ${s.cars.filter((c) => c.price).map((c) => `<div class="line"><span>${H.esc(c.name)}</span><b>+ ${H.money(c.price)}</b></div>`).join("")}</div>`;
  } else {
    lines = `<p class="muted">Every job is different. We look at your photos or visit, then send a written quote before anything is booked.</p>`;
  }
  const action = s.business_only
    ? `<a class="btn btn-block" href="business.html">Request a proposal</a>`
    : `<a class="btn btn-block" href="${H.link("book.html", { service: s.slug })}">${s.pricing === "quote" ? "Request a quote" : "Book this clean"}</a>`;
  return `
    <span class="eyebrow">${s.pricing === "quote" ? "Priced after a look" : "Clear pricing"}</span>
    <p class="money big">${H.esc(s.from_price_label)}</p>
    ${lines}
    ${action}
    <p class="tiny muted center">${H.icon("shield")} Free cancellation until 24 hours before.</p>`;
}

async function load() {
  const body = H.$("#serviceBody");
  H.loading(body, 4);
  try {
    const data = await api.service(slug);
    const s = data.service;
    document.title = s.name + " | Havenly";
    H.$("#crumbName").textContent = s.name;
    body.innerHTML = intro(s) + scope(s);
    H.$("#priceCard").innerHTML = priceBox(s);
    H.$("#related").innerHTML = data.related.map((r) => `
      <a class="card card-link row" href="${H.link("service.html", { slug: r.slug })}">
        <span class="icon-tile">${H.icon(r.icon)}</span>
        <span><b style="color:var(--teal)">${H.esc(r.name)}</b><br><span class="small muted">${H.esc(r.from_price_label)}</span></span>
      </a>`).join("") || '<p class="muted">This is our only service of its kind.</p>';
  } catch (err) {
    H.problem(body, err);
  }
}
load();
