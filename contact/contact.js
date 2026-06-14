/* =============================================================
   Contact form — submits to BOTH Netlify Forms and W3Forms so it works
   no matter where the site is hosted:
     • Netlify Forms — captured automatically when deployed on Netlify (the
       POST to "/" is intercepted by Netlify). On other hosts it just 404s
       and is ignored.
     • W3Forms       — a client-side POST that emails you on ANY host
       (Netlify, GitHub Pages, localhost).
   Success is shown if EITHER backend accepts the submission.

   W3Forms ACCESS KEY: a W3Forms key is PUBLISHABLE (it ships in this client
   JS regardless), so it's hardcoded below. It's protected by the Allowed
   Domains list in your W3Forms dashboard (add your netlify.app / custom
   domain), not by secrecy. Inject window.W3FORMS_ACCESS_KEY at build time to
   override it if you ever want to.
   ============================================================= */
(function () {
  "use strict";

  var ACCESS_KEY =
    (typeof window !== "undefined" && window.W3FORMS_ACCESS_KEY) ||
    "w3f_fa884b878c29b474e409d2daeb91e2096d6ff13ccc8b1675";

  var form = document.getElementById("contactForm");
  if (!form) return;

  var statusEl = document.getElementById("formStatus");
  var submitBtn = form.querySelector('button[type="submit"]');
  var defaultBtnHTML = submitBtn ? submitBtn.innerHTML : "";

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.className = "form-status" + (type ? " " + type : "");
    statusEl.style.display = message ? "block" : "none";
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? '<i class="fa-solid fa-spinner fa-spin"></i> Sending\u2026'
      : defaultBtnHTML;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("", "");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setLoading(true);
    setStatus("Sending your message\u2026", "pending");

    // 1) Netlify Forms — captured only when hosted on Netlify; harmless 404 elsewhere.
    var netlifyPost = fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString()
    })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });

    // 2) W3Forms — emails on any host.
    var w3Data = new FormData(form);
    w3Data.set("access_key", ACCESS_KEY);
    var name = (w3Data.get("name") || "").toString().trim();
    w3Data.set("subject", "New portfolio enquiry from " + (name || "a visitor"));
    w3Data.set("from_name", "Souvik Portfolio \u2014 Contact Form");
    var w3Post = fetch("https://api.w3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: w3Data
    })
      .then(function (response) {
        return response.json().then(function (json) {
          return { ok: response.ok, json: json };
        });
      })
      .catch(function () { return { ok: false, json: null }; });

    Promise.all([netlifyPost, w3Post])
      .then(function (results) {
        var netlifyOk = results[0];
        var w3 = results[1];
        var w3Ok = w3.ok && w3.json && w3.json.success;
        if (w3Ok || netlifyOk) {
          setStatus(
            "Thanks! Your message has been sent \u2014 I'll get back to you soon.",
            "success"
          );
          form.reset();
        } else {
          setStatus(
            (w3.json && (w3.json.error || w3.json.message)) ||
              "Something went wrong. Please try again or email me directly at souvik.chat2011@gmail.com.",
            "error"
          );
        }
      })
      .finally(function () {
        setLoading(false);
      });
  });
})();
