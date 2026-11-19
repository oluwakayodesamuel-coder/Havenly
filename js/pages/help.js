/* ==========================================================================
   HELP CENTRE  (Role 12)
   api.config()  { policy: { free_cancel_hours, late_cancel_fee_pct, reschedule_hours, closed },
                   areas: [{ name, travel_fee }], support: { phone, whatsapp, email, hours } }
   api.faqs()    { faqs: [{ q, a }] }
   api.contact({ name, email, phone, topic, message })   send a message
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;

/* Done for you: the policy cards, areas and contact cards from api.config(). */
async function info() {
  try {
    const cfg = await api.config();
    const p = cfg.policy;
    const cards = [
      ["calendar", "Free cancellation", `Cancel free until ${p.free_cancel_hours} hours before your arrival window. After that, ${p.late_cancel_fee_pct}% of the price.`],
      ["repeat", "Change the time", `Move your booking until ${p.reschedule_hours} hours before, from Track my booking.`],
      ["briefcase", "Paying", "Pay by bank transfer or card when the job is done. You get a receipt with your reference."],
      ["shield", "If something is wrong", "Tell us within 48 hours. We come back to fix it, or agree a fair refund."],
    ];
    H.$("#policyCards").innerHTML = cards.map(([i, t, d]) => `<div class="policy"><span class="icon-tile">${H.icon(i)}</span><h4>${t}</h4><p class="small muted">${H.esc(d)}</p></div>`).join("");
    H.$("#areaChips").innerHTML = cfg.areas.map((a) => `<span class="pill">${H.icon("pin")} ${H.esc(a.name)}</span>`).join("");
    const s = cfg.support;
    H.$("#contactCards").innerHTML = `
      <a class="contact" href="https://wa.me/${s.whatsapp}"><span class="icon-tile">${H.icon("whatsapp")}</span><span><b>WhatsApp</b><small>Fastest reply</small></span></a>
      <a class="contact" href="tel:${s.phone.replace(/\s/g, "")}"><span class="icon-tile">${H.icon("phone")}</span><span><b>${H.esc(s.phone)}</b><small>${H.esc(s.hours)}</small></span></a>
      <a class="contact" href="mailto:${s.email}"><span class="icon-tile">${H.icon("mail")}</span><span><b>${H.esc(s.email)}</b><small>We reply within one working day</small></span></a>`;
  } catch (err) {
    H.problem(H.$("#policyCards"), err);
  }
}

async function faqs() {
  const box = H.$("#faqs");
  try {
    const data = await api.faqs();
    box.innerHTML = data.faqs.map((f, i) => `<details ${i === 0 ? "open" : ""}><summary>${H.esc(f.q)}</summary><p>${H.esc(f.a)}</p></details>`).join("");
  } catch (err) {
    H.problem(box, err);
  }
}

H.$("#contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const button = H.$("#sendBtn");
  H.busy(button, true);
  try {
    const res = await api.contact(H.values(form));
    form.innerHTML = `<div class="notice ok">${H.icon("check-circle")}<span><b>Message received.</b> ${H.esc(res.next)}</span></div>`;
  } catch (err) {
    H.showError(form, err);
    H.busy(button, false);
  }
});

info();
faqs();
