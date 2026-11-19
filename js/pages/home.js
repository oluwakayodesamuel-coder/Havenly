/* ==========================================================================
   HOME PAGE  (Role 1: Lead Developer)
   This file fills three boxes on index.html with real data from the API:
     #popularServices  the three most booked services     (STEP 1)
     #statsStrip       real numbers from real jobs         (STEP 2)
     #reviews          what customers said                 (STEP 3)
   and the small rating line under the hero buttons, #heroProof (STEP 3).
   The helpers you need are in js/ui.js (H) and js/api.js (api).
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;

function serviceCard(s) {
  return `
    <a class="card card-link service-card" href="${H.link("service.html", { slug: s.slug })}">
      <div class="media">
        <img src="${H.asset(s.image)}" alt="${H.esc(s.name)}" loading="lazy">
        ${s.pricing === "quote" ? '<span class="pill light">Quote after a look</span>' : ""}
      </div>
      <div class="body">
        <div class="row"><span class="icon-tile">${H.icon(s.icon)}</span><h3>${H.esc(s.name)}</h3></div>
        <p class="muted">${H.esc(s.summary)}</p>
        <div class="foot">
          <span class="money">${H.esc(s.from_price_label)}</span>
          <span class="link-arrow">Details ${H.icon("arrow")}</span>
        </div>
      </div>
    </a>`;
}

async function loadServices() {
  const box = H.$("#popularServices");
  H.loading(box, 3);
  try {
    const data = await api.services();
    const popular = data.services.filter((s) => s.popular).slice(0, 3);
    box.innerHTML = popular.map(serviceCard).join("");
  } catch (err) {
    H.problem(box, err);
  }
}

async function loadStats() {
  const box = H.$("#statsStrip");
  try {
    const s = await api.stats();
    const items = [
      [s.completed_jobs, "Jobs completed"],
      [s.average_rating ? s.average_rating + "/5" : "New", "Average rating"],
      [s.areas, "Lagos areas covered"],
      [s.teams, "Trained teams"],
    ];
    box.innerHTML = items.map(([value, label]) => `<div class="stat"><b>${H.esc(value)}</b><span>${label}</span></div>`).join("");
  } catch (err) {
    H.problem(box, err);
  }
}

async function loadReviews() {
  const box = H.$("#reviews");
  try {
    const [data, stats] = await Promise.all([api.reviews(3), api.stats()]);
    if (!data.reviews.length) {
      H.empty(box, "No reviews yet", "Our first customers are being served this week.", "star");
    } else {
      box.innerHTML = data.reviews.map((r) => `
        <figure class="card review">
          ${H.stars(r.rating)}
          <blockquote>“${H.esc(r.comment)}”</blockquote>
          <figcaption><b>${H.esc(r.name)}, ${H.esc(r.area)}</b><span class="small muted">${H.esc(r.service)}</span></figcaption>
        </figure>`).join("");
    }
    if (stats.average_rating) {
      H.$("#heroProof").innerHTML = `${H.stars(Math.round(stats.average_rating))}
        <span class="small"><b>Rated ${stats.average_rating} out of 5</b> by ${stats.ratings} Lagos customers</span>`;
    }
  } catch (err) {
    H.problem(box, err);
  }
}

loadServices();
loadStats();
loadReviews();
