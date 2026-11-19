/* ==========================================================================
   BOOKING CONFIRMED  (Role 6)
   schedule.html sends the customer here with ?ref=HV-ABC123&phone=0803...
   api.booking(ref, phone) returns { booking } with: reference, status_label,
   service.name, date, window_label, area, address, details, price_label,
   quote_note, team, timeline.
   ========================================================================== */
const H = Havenly.ui;
const api = Havenly.api;
const ref = H.param("ref");
const phone = H.param("phone");

function card(b) {
  const quote = !b.price_label;
  return `
    <span class="tick">${H.icon("check")}</span>
    <div class="stack" style="text-align:center">
      <h1>${quote ? "Quote requested" : "Booking received"}</h1>
      <p class="lead" style="margin:0 auto">${quote
        ? "We will look at your request and send you a written quote. Accept it from Track my booking."
        : "Thank you, " + H.esc(b.customer_name.split(" ")[0]) + ". We will confirm it shortly and assign your team."}</p>
    </div>
    <div class="ref-box">
      <span class="small muted">Your booking reference</span>
      <p class="ref" id="refText">${H.esc(b.reference)}</p>
      <button class="btn btn-ghost btn-sm" type="button" id="copyBtn">Copy reference</button>
    </div>
    <dl class="dl">
      <dt>Service</dt><dd>${H.esc(b.service.name)}</dd>
      <dt>Date</dt><dd>${H.date(b.date)}</dd>
      <dt>Arrival</dt><dd>${H.esc(b.window_label)}</dd>
      <dt>Where</dt><dd>${H.esc(b.area)}</dd>
      <dt>Price</dt><dd>${b.price_label ? H.esc(b.price_label) : "We will send a quote"}</dd>
    </dl>
    <div class="row" style="justify-content:center">
      <a class="btn" href="${H.link("track.html", { ref: b.reference, phone })}">Track this booking</a>
      <button class="btn btn-ghost" type="button" id="calBtn">${H.icon("calendar")} Add to calendar</button>
    </div>`;
}

function wire(b) {
  H.$("#copyBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(b.reference).then(() => H.toast("Reference copied"), () => {
      const range = document.createRange();
      range.selectNodeContents(H.$("#refText"));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      H.toast("Press Ctrl+C to copy");
    });
  });
  H.$("#calBtn").addEventListener("click", () => {
    const start = Number(b.window.slice(0, 2));
    const day = b.date.replace(/-/g, "");
    const pad = (n) => String(n).padStart(2, "0");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Havenly//Booking//EN", "BEGIN:VEVENT",
      "UID:" + b.reference + "@havenly.ng",
      "DTSTART;TZID=Africa/Lagos:" + day + "T" + pad(start) + "0000",
      "DTEND;TZID=Africa/Lagos:" + day + "T" + pad(start + 2) + "0000",
      "SUMMARY:Havenly " + b.service.name + " (" + b.reference + ")",
      "LOCATION:" + b.address.replace(/,/g, "\\,"),
      "DESCRIPTION:Your Havenly team arrives in this window. Track it at havenly.ng with " + b.reference,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "havenly-" + b.reference + ".ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}

async function load() {
  const box = H.$("#confirm");
  if (!ref || !phone) {
    box.innerHTML = `<div class="empty"><h3>No booking to show</h3><p class="muted">Open this page from the booking form, or find your booking with its reference.</p>
      <a class="btn" style="margin-top:16px" href="track.html">Track a booking</a></div>`;
    return;
  }
  H.loading(box, 3);
  try {
    const data = await api.booking(ref, phone);
    box.innerHTML = card(data.booking);
    wire(data.booking);
  } catch (err) {
    H.problem(box, err);
  }
}
load();
