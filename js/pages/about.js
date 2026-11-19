/* ==========================================================================
   ABOUT HAVENLY  (Role 11)
   Most of this page is writing and layout (STEP 1, STEP 4). The JavaScript
   adds the live parts: the areas we cover, real numbers, and the team.
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;

async function live() {
  try {
    const [a, s] = await Promise.all([api.areas(), api.stats()]);
    H.$("#areas").innerHTML = a.areas.map((x) => `
      <li>${H.icon("pin")}<span>${H.esc(x.name)}</span><small>${x.travel_fee ? "+ " + H.money(x.travel_fee) + " travel" : "No travel fee"}</small></li>`).join("");
    H.$("#numbers").innerHTML = [
      [s.completed_jobs, "Jobs completed in the pilot"],
      [s.average_rating ? s.average_rating + "/5" : "New", "Average customer rating"],
      [s.services, "Services on the menu"],
      [s.teams, "Trained cleaning teams"],
    ].map(([v, l]) => `<div class="stat"><b>${H.esc(v)}</b><span>${l}</span></div>`).join("");
  } catch (err) {
    H.problem(H.$("#areas"), err);
  }
}

const TEAM = [
  ["Lead Developer", "Home page"], ["Developer", "Services"], ["Developer", "Service details"], ["Developer", "Booking: your clean"],
  ["Developer", "Booking: time and details"], ["Developer", "Confirmation"], ["Developer", "Track my booking"], ["Developer", "Change a booking"],
  ["Developer", "Ratings and reports"], ["Developer", "Havenly for Business"], ["Developer", "About Havenly"], ["Developer", "Help centre"],
  ["Developer", "Operations board"], ["Developer", "Job sheet"],
];
function team() {
  H.$("#team").innerHTML = TEAM.map(([name, role], i) => `
    <div class="person"><span class="avatar">${H.esc(name.split(" ").map((w) => w[0]).join("").slice(0, 2))}</span>
      <div><h4>${H.esc(name)} ${i + 1}</h4><span class="small muted">${H.esc(role)}</span></div></div>`).join("");
}

live();
team();
