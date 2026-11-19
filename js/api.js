/* ==========================================================================
   HAVENLY API CLIENT  (shared file: do not edit, ask the Lead Developer)

   Every page talks to the real Havenly backend through these functions.
   Each one returns a Promise. Use it like this:

       Havenly.api.services().then(function (data) {
         console.log(data.services);          // the list of services
       }).catch(function (err) {
         console.log(err.message);            // a sentence you can show the user
       });

   or, inside an async function:

       const data = await Havenly.api.services();

   When the API refuses something (a missing field, a full time slot), the
   Promise rejects with an Error whose .message is a friendly sentence and
   whose .field (if any) names the form field that needs fixing.
   Full list of what every call returns: API.md
   ========================================================================== */
(function () {
  "use strict";

  /* Where the API lives. Webbo3 Code's preview, the saved site link and the
     platform itself all sit on webbo3.com (or localhost while testing). Pages
     hosted anywhere else (GitHub Pages, a laptop) use webbo3.com. */
  function apiBase() {
    if (window.HAVENLY_API) return window.HAVENLY_API;
    var candidates = [location.href, document.baseURI, document.referrer];
    for (var i = 0; i < candidates.length; i++) {
      try {
        var u = new URL(candidates[i]);
        if (/^https?:$/.test(u.protocol) && /(^|\.)webbo3\.(com|xyz)$|^localhost$|^127\.0\.0\.1$/.test(u.hostname)) {
          return u.origin + "/havenly/api/v1";
        }
      } catch (e) { /* not a URL */ }
    }
    return "https://webbo3.com/havenly/api/v1";
  }
  var BASE = apiBase();

  var TOKEN_KEY = "havenly.ops.token";
  var memory = {};
  /* Remembers small things between pages (the staff sign-in). Webbo3 Code's
     preview has no localStorage, so there it keeps them in the editor instead. */
  var w3 = window.__w3 && window.__w3.store;
  function store(key, value) {
    if (value === undefined) {
      if (w3) return w3.get(key);
      try { var v = window.localStorage.getItem(key); if (v !== null) return v; } catch (e) { /* sandboxed */ }
      return memory[key] === undefined ? null : memory[key];
    }
    if (value === null) {
      delete memory[key];
      if (w3) w3.set(key, null);
      try { window.localStorage.removeItem(key); } catch (e) { /* sandboxed */ }
      return null;
    }
    memory[key] = value;
    if (w3) w3.set(key, value);
    try { window.localStorage.setItem(key, value); } catch (e) { /* sandboxed: memory only */ }
    return value;
  }

  function query(params) {
    var parts = [];
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      if (v === undefined || v === null || v === "") return;
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
    });
    return parts.length ? "?" + parts.join("&") : "";
  }

  function request(method, path, body, auth) {
    var headers = { "Accept": "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
      var token = store(TOKEN_KEY);
      if (token) headers["Authorization"] = "Bearer " + token;
    }
    return fetch(BASE + path, { method: method, headers: headers, body: body === undefined ? undefined : JSON.stringify(body) })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || data.ok === false) {
            var err = new Error(data.error || "Something went wrong. Please try again.");
            err.status = res.status;
            err.field = data.field || null;
            if (res.status === 401 && auth) store(TOKEN_KEY, null);
            throw err;
          }
          return data;
        });
      }, function () {
        var err = new Error("We could not reach Havenly. Check your connection and try again.");
        err.status = 0;
        throw err;
      });
  }
  var get = function (path, params, auth) { return request("GET", path + query(params), undefined, auth); };
  var post = function (path, body, auth) { return request("POST", path, body || {}, auth); };
  var ref = function (r) { return encodeURIComponent(String(r || "").trim().toUpperCase()); };

  var api = {
    base: BASE,

    /* ---- public: anyone can call these ---- */
    config: function () { return get("/config"); },                                   // areas, windows, extras, policy, support
    services: function (category) { return get("/services", { category: category }); }, // { services: [...] }
    service: function (slug) { return get("/services/" + encodeURIComponent(slug)); },   // { service, related, extras }
    areas: function () { return get("/areas"); },
    faqs: function () { return get("/faqs"); },                                       // { faqs: [{ q, a }] }
    reviews: function (limit) { return get("/reviews", { limit: limit }); },           // { reviews: [...] }
    stats: function () { return get("/stats"); },                                     // { completed_jobs, average_rating, ... }
    availability: function (service, date) { return get("/availability", { service: service, date: date }); },
    quote: function (details) { return post("/quote", details); },                    // { total, lines: [{ label, amount }] }
    book: function (details) { return post("/bookings", details); },                  // { reference, booking }
    booking: function (reference, phone) { return get("/bookings/" + ref(reference), { phone: phone }); },
    acceptQuote: function (reference, phone) { return post("/bookings/" + ref(reference) + "/accept-quote", { phone: phone }); },
    reschedule: function (reference, phone, date, window) { return post("/bookings/" + ref(reference) + "/reschedule", { phone: phone, date: date, window: window }); },
    cancel: function (reference, phone, reason) { return post("/bookings/" + ref(reference) + "/cancel", { phone: phone, reason: reason }); },
    feedback: function (reference, phone, rating, comment, share) { return post("/bookings/" + ref(reference) + "/feedback", { phone: phone, rating: rating, comment: comment, share: share }); },
    reportIssue: function (reference, phone, category, description) { return post("/bookings/" + ref(reference) + "/issues", { phone: phone, category: category, description: description }); },
    business: function (details) { return post("/business-enquiries", details); },    // { reference }
    contact: function (details) { return post("/contact", details); },

    /* ---- operations: staff only, after login ---- */
    login: function (email, password) {
      return post("/auth/login", { email: email, password: password }).then(function (data) { store(TOKEN_KEY, data.token); return data; });
    },
    logout: function () { store(TOKEN_KEY, null); },
    signedIn: function () { return !!store(TOKEN_KEY); },
    me: function () { return get("/auth/me", {}, true); },
    ops: {
      bookings: function (filters) { return get("/ops/bookings", filters, true); },   // { bookings, by_status }
      job: function (reference) { return get("/ops/bookings/" + ref(reference), {}, true); }, // { booking, teams, service }
      setStatus: function (reference, status, note) { return post("/ops/bookings/" + ref(reference) + "/status", { status: status, note: note }, true); },
      assign: function (reference, teamId) { return post("/ops/bookings/" + ref(reference) + "/assign", { team_id: teamId }, true); },
      sendQuote: function (reference, price, note) { return post("/ops/bookings/" + ref(reference) + "/quote", { price: price, note: note }, true); },
      payment: function (reference, status, method) { return post("/ops/bookings/" + ref(reference) + "/payment", { payment_status: status, method: method }, true); },
      tick: function (reference, itemId, done) { return post("/ops/bookings/" + ref(reference) + "/checklist", { item_id: itemId, done: done }, true); },
      note: function (reference, note) { return post("/ops/bookings/" + ref(reference) + "/note", { note: note }, true); },
      teams: function (date) { return get("/ops/teams", { date: date }, true); },
      issues: function (status) { return get("/ops/issues", { status: status }, true); },
      resolve: function (issueId, resolution) { return post("/ops/issues/" + issueId + "/resolve", { resolution: resolution }, true); },
      enquiries: function (stage) { return get("/ops/enquiries", { stage: stage }, true); },
      setStage: function (reference, stage, value) { return post("/ops/enquiries/" + ref(reference) + "/stage", { stage: stage, proposal_value: value }, true); },
      messages: function () { return get("/ops/messages", {}, true); },
      metrics: function () { return get("/ops/metrics", {}, true); }
    }
  };

  window.Havenly = window.Havenly || {};
  window.Havenly.api = api;
  window.Havenly.store = store;
})();
