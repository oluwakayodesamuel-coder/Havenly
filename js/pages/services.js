/* ==========================================================================
   SERVICES PAGE  (Role 2)
   Shows every Havenly service as a card in #serviceGrid, and lets the
   customer filter by category with the buttons in #filters.
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
let allServices = [];

function card(s) {
  return `
    <a class="card card-link service-card" href="${H.link("service.html", { slug: s.slug })}">
      <div class="media">
        <img src="${H.asset(s.image)}" alt="${H.esc(s.name)}" loading="lazy">
        ${s.pricing === "quote" ? '<span class="pill light">Priced after a look</span>' : ""}
      </div>
      <div class="body">
        <div class="row"><span class="icon-tile">${H.icon(s.icon)}</span><h3>${H.esc(s.name)}</h3></div>
        <p class="muted">${H.esc(s.summary)}</p>
        <p class="small meta">${H.icon("clock")} About ${s.hours} hour${s.hours > 1 ? "s" : ""}, ${s.crew} cleaner${s.crew > 1 ? "s" : ""}</p>
        <div class="foot">
          <span class="money">${H.esc(s.from_price_label)}</span>
          <span class="link-arrow">View service ${H.icon("arrow")}</span>
        </div>
      </div>
    </a>`;
}

function show(category) {
  const grid = H.$("#serviceGrid");
  const list = allServices.filter((s) => !category || s.category === category);
  if (!list.length) return H.empty(grid, "Nothing here yet", "Try another category.");
  grid.innerHTML = list.map(card).join("");
}

async function load() {
  const grid = H.$("#serviceGrid");
  H.loading(grid, 3);
  try {
    const data = await api.services();
    allServices = data.services;
    show("");
  } catch (err) {
    H.problem(grid, err);
  }
}

H.$("#filters").addEventListener("click", (e) => {
  const button = e.target.closest(".chip");
  if (!button) return;
  H.$$(".chip", H.$("#filters")).forEach((b) => b.classList.toggle("on", b === button));
  show(button.dataset.category);
});

load();
