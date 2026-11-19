/* ==========================================================================
   HAVENLY UI HELPERS  (shared file: do not edit, ask the Lead Developer)

   1. Puts the same header and footer on every page. A page only needs:
        <body data-page="services">
          <header data-havenly="header"></header>
          ... your page ...
          <footer data-havenly="footer"></footer>
   2. Gives every page small helpers on Havenly.ui (shortened to H below):

        H.$("#id")                   one element          H.$$(".card")   all of them
        H.money(52000)               "₦52,000"
        H.date("2026-11-12")         "Thu, 12 Nov 2026"
        H.time(isoDateTime)          "12 Nov, 9:41 AM"
        H.icon("home")               an <svg> icon as text, to put in innerHTML
        H.status("confirmed", "Confirmed")   a coloured status pill
        H.stars(4)                   four gold stars out of five
        H.param("slug")              read ?slug=... from the page address
        H.link("service.html", { slug: "car-cleaning" })   "service.html?slug=car-cleaning"
        H.go("track.html", { ref: "HV-ABC123" })            open another page
        H.values(form)               every field of a <form> as an object
        H.showError(form, err)       show an API error next to the right field
        H.busy(button, true|false)   spinner on a button while waiting
        H.toast("Saved")             a small message at the bottom
        H.esc(text)                  make text safe to put in innerHTML
   ========================================================================== */
(function () {
  "use strict";
  var H = {};

  /* ---------- icons (24px line icons in the brand style) ---------- */
  var P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',
    building: '<path d="M4 21V5l8-2v18M12 7l8 2v12"/><path d="M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01M2 21h20"/>',
    car: '<path d="M5 17h14v-5l-2-5H7l-2 5v5Z"/><path d="M5 12h14"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
    sparkle: '<path d="M12 3c.7 4.6 2.4 6.3 7 7-4.6.7-6.3 2.4-7 7-.7-4.6-2.4-6.3-7-7 4.6-.7 6.3-2.4 7-7Z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5A6.5 6.5 0 0 1 21.5 20"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.3-1.8-1-1 .8a4 4 0 0 1-2.4-2.4l.8-1-1-1.8L9 9.5Z"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z"/><path d="M5 19 13 11"/>'
  };
  H.icon = function (name, cls) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (cls ? ' class="' + cls + '"' : "") + ">" + (P[name] || P.sparkle) + "</svg>";
  };

  /* ---------- small helpers ---------- */
  H.$ = function (s, root) { return (root || document).querySelector(s); };
  H.$$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  H.esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  H.money = function (n) { return n == null ? "" : "₦" + Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 }); };
  H.date = function (iso, opts) {
    if (!iso) return "";
    var d = new Date(String(iso).length === 10 ? iso + "T12:00:00" : iso);
    return d.toLocaleDateString("en-GB", opts || { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };
  H.time = function (iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  /* A picture or file of the site (for example a service photo from the API).
     Works on every page, in ops/ too, and inside Webbo3 Code's preview. */
  H.asset = function (path) {
    if (!path || /^(https?:|data:|\/\/)/.test(path)) return path;
    var p = root() + String(path).replace(/^\/+/, "");
    return window.__w3 && window.__w3.asset ? window.__w3.asset(p) : p;
  };
  H.status = function (status, label) { return '<span class="status status-' + H.esc(status) + '">' + H.esc(label || status) + "</span>"; };
  H.stars = function (n) {
    var out = '<span class="stars" aria-label="' + n + ' out of 5">';
    for (var i = 1; i <= 5; i++) out += '<span class="' + (i <= n ? "" : "off") + '">' + H.icon("star").replace('fill="none"', 'fill="currentColor"') + "</span>";
    return out + "</span>";
  };

  /* The page address. Webbo3 Code's preview passes ?query through window.__w3. */
  H.params = function () {
    var search = (window.__w3 && window.__w3.search) || location.search || "";
    return new URLSearchParams(search);
  };
  H.param = function (name) { return H.params().get(name); };
  H.link = function (page, params) {
    var q = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) { if (params[k] !== undefined && params[k] !== null && params[k] !== "") q.set(k, params[k]); });
    var s = q.toString();
    return page + (s ? "?" + s : "");
  };
  H.go = function (page, params) {
    var href = H.link(page, params);
    if (window.__w3 && window.__w3.go) window.__w3.go(href); else location.href = href;
  };

  /* Forms */
  H.values = function (form) {
    var out = {};
    H.$$("input, select, textarea", form).forEach(function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === "checkbox") {
        var many = H.$$('input[type="checkbox"][name="' + el.name + '"]', form).length > 1;
        if (many) { out[el.name] = out[el.name] || []; if (el.checked) out[el.name].push(el.value); }
        else out[el.name] = el.checked;
      } else if (el.type === "radio") {
        if (el.checked) out[el.name] = el.value; else if (!(el.name in out)) out[el.name] = "";
      } else out[el.name] = el.value.trim();
    });
    return out;
  };
  H.clearErrors = function (form) {
    H.$$(".field.has-error", form).forEach(function (f) { f.classList.remove("has-error"); });
    H.$$(".field .error, .form-error", form).forEach(function (e) { e.remove(); });
  };
  H.showError = function (form, err) {
    H.clearErrors(form);
    var input = err && err.field ? form.querySelector('[name="' + err.field + '"]') : null;
    var field = input && input.closest(".field");
    var p = document.createElement("p");
    if (field) {
      p.className = "error"; p.textContent = err.message; field.classList.add("has-error"); field.appendChild(p);
      input.focus && input.focus();
    } else {
      p.className = "notice error form-error"; p.innerHTML = H.icon("alert") + "<span>" + H.esc(err ? err.message : "Something went wrong.") + "</span>";
      form.prepend(p);
    }
  };
  H.busy = function (button, on) {
    if (!button) return;
    button.disabled = !!on;
    button.classList.toggle("is-loading", !!on);
  };
  H.toast = function (text) {
    var t = H.$(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.classList.add("on");
    clearTimeout(H.toast.timer); H.toast.timer = setTimeout(function () { t.classList.remove("on"); }, 3200);
  };
  H.loading = function (el, rows) {
    if (!el) return;
    var html = "";
    for (var i = 0; i < (rows || 3); i++) html += '<div class="skeleton" style="height:' + (i === 0 ? 180 : 22) + 'px;margin-bottom:12px"></div>';
    el.innerHTML = html;
  };
  H.empty = function (el, title, text, icon) {
    if (!el) return;
    el.innerHTML = '<div class="empty"><div class="icon-tile">' + H.icon(icon || "search") + '</div><h4>' + H.esc(title) + "</h4>" +
      (text ? '<p class="small" style="margin-top:6px">' + H.esc(text) + "</p>" : "") + "</div>";
  };
  H.problem = function (el, err) {
    if (el) el.innerHTML = '<div class="notice error">' + H.icon("alert") + "<span>" + H.esc(err && err.message ? err.message : String(err)) + "</span></div>";
  };

  /* ---------- the header and footer every page shares ---------- */
  var NAV = [
    ["services", "services.html", "Services"],
    ["help", "help.html", "How it works"],
    ["business", "business.html", "For business"],
    ["about", "about.html", "About"],
    ["track", "track.html", "Track booking"]
  ];
  function brand(white) {
    return '<a class="brand' + (white ? " white" : "") + '" href="index.html" aria-label="Havenly home"><img src="' +
      H.asset(white ? "assets/mark-white.svg" : "assets/mark.svg") + '" alt=""><span>havenly</span></a>';
  }
  function root() { return /(^|\/)ops\//.test((window.__w3 && window.__w3.page) || location.pathname) ? "../" : ""; }

  function header(page) {
    var r = root();
    return '<div class="wrap">' + brand(false).replace('href="index.html"', 'href="' + r + 'index.html"') +
      '<button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false">' + H.icon("menu") + "</button>" +
      '<nav class="nav" aria-label="Main">' +
      NAV.map(function (n) { return '<a href="' + r + n[1] + '"' + (n[0] === page ? ' class="on" aria-current="page"' : "") + ">" + n[2] + "</a>"; }).join("") +
      '<a class="btn btn-sm" href="' + r + 'book.html">Book a clean</a></nav></div>';
  }
  function footer() {
    var r = root();
    return '<div class="wrap"><div class="cols">' +
      '<div>' + brand(true).replace('href="index.html"', 'href="' + r + 'index.html"') +
      '<p class="small" style="max-width:32ch">Everyday cleaning, made easy. Trusted cleaning for homes, cars and offices in Lagos.</p></div>' +
      '<div><h4>Services</h4><ul>' +
      '<li><a href="' + r + 'service.html?slug=home-cleaning">Home Cleaning</a></li>' +
      '<li><a href="' + r + 'service.html?slug=deep-cleaning">Deep Cleaning</a></li>' +
      '<li><a href="' + r + 'service.html?slug=move-in-cleaning">Move-in Cleaning</a></li>' +
      '<li><a href="' + r + 'service.html?slug=car-cleaning">Car Cleaning</a></li>' +
      '<li><a href="' + r + 'business.html">Office Cleaning</a></li></ul></div>' +
      '<div><h4>Company</h4><ul>' +
      '<li><a href="' + r + 'about.html">About Havenly</a></li><li><a href="' + r + 'help.html">How it works</a></li>' +
      '<li><a href="' + r + 'track.html">Track a booking</a></li><li><a href="' + r + 'ops/index.html">Staff sign-in</a></li></ul></div>' +
      '<div><h4>Talk to us</h4><ul>' +
      '<li class="contact-line">' + H.icon("phone") + '<a href="tel:+2348134567890">+234 813 456 7890</a></li>' +
      '<li class="contact-line">' + H.icon("whatsapp") + '<a href="https://wa.me/2348134567890">WhatsApp us</a></li>' +
      '<li class="contact-line">' + H.icon("mail") + '<a href="mailto:hello@havenly.ng">hello@havenly.ng</a></li>' +
      '<li class="contact-line">' + H.icon("clock") + "<span>Mon to Sat, 8 AM to 6 PM</span></li></ul></div>" +
      '</div><div class="legal"><span>© 2026 Havenly. Everyday cleaning, made easy.</span><span>Built by Cascade Pod II at Webbo3</span></div></div>';
  }

  /* The staff bar on ops/ pages: <body data-shell="ops"> */
  function opsHeader(page) {
    var r = root();
    return '<div class="wrap">' + brand(false).replace('href="index.html"', 'href="' + r + 'index.html"') +
      '<span class="ops-tag">Operations</span>' +
      '<nav class="ops-nav" aria-label="Operations">' +
      '<a href="index.html"' + (page === "board" ? ' class="on"' : "") + ">" + H.icon("list") + "Job board</a>" +
      '<span class="ops-who" id="opsWho"></span>' +
      '<button class="btn btn-ghost btn-sm" type="button" id="signOut" hidden>' + H.icon("logout") + "Sign out</button></nav></div>";
  }

  function mount() {
    var page = document.body.getAttribute("data-page") || "";
    var ops = document.body.getAttribute("data-shell") === "ops";
    var h = H.$('[data-havenly="header"]');
    if (h && ops) {
      h.classList.add("site-header", "ops-header");
      h.innerHTML = opsHeader(page);
      H.$("#signOut").addEventListener("click", function () { Havenly.api.logout(); H.go("index.html"); });
    } else if (h) {
      h.classList.add("site-header");
      h.innerHTML = header(page);
      var btn = H.$(".menu-btn", h), nav = H.$(".nav", h);
      btn.addEventListener("click", function () { var open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", open); });
    }
    /* Show who is signed in on the staff bar (pages call H.staff(staff) after api.me()). */
    var f = H.$('[data-havenly="footer"]');
    if (f) { f.classList.add("site-footer"); f.innerHTML = footer(); }
    /* any <i data-icon="calendar"></i> becomes that icon */
    H.$$("[data-icon]").forEach(function (el) { el.outerHTML = H.icon(el.getAttribute("data-icon"), el.className); });
  }
  H.staff = function (staff) {
    var who = H.$("#opsWho"), out = H.$("#signOut");
    if (!who) return;
    who.innerHTML = staff ? H.icon("user") + "<span>" + H.esc(staff.name) + ' <small>' + H.esc(staff.role) + (staff.team ? ", " + H.esc(staff.team.name) : "") + "</small></span>" : "";
    if (out) out.hidden = !staff;
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();

  window.Havenly = window.Havenly || {};
  window.Havenly.ui = H;
})();
