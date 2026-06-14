/* =============================================================
   Contact form — sends submissions to your email via W3Forms.
   Works on any host (Netlify, Live Server, etc.); no server needed.

   ACCESS KEY (injected, not committed):
   The key is provided one of two ways so it stays out of source control:
     • CI / deploy: have your pipeline (e.g. GitHub Actions) replace the
       __W3FORMS_ACCESS_KEY__ token below with the secret before publishing.
     • Runtime: define window.W3FORMS_ACCESS_KEY before this script loads
       (e.g. a gitignored contact/config.js used for local testing).
   Note: a W3Forms access key is PUBLISHABLE — it ships in client-side JS
   regardless. It is protected by the Allowed Domains list in your W3Forms
   dashboard (add souvik-portfolio1.netlify.app and 127.0.0.1), not by secrecy.
   ============================================================= */
(function () {
  "use strict";

  var ACCESS_KEY = (typeof window !== "undefined" && window.W3FORMS_ACCESS_KEY) || "__W3FORMS_ACCESS_KEY__";

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

    if (!ACCESS_KEY || ACCESS_KEY.indexOf("__") === 0 || ACCESS_KEY === "YOUR_W3FORMS_ACCESS_KEY") {
      setStatus(
        "Contact form isn't configured yet \u2014 the W3Forms access key hasn't been injected.",
        "error"
      );
      return;
    }

    var data = new FormData(form);
    data.set("access_key", ACCESS_KEY);

    var name = (data.get("name") || "").toString().trim();
    data.set("subject", "New portfolio enquiry from " + (name || "a visitor"));
    data.set("from_name", "Souvik Portfolio \u2014 Contact Form");

    setLoading(true);
    setStatus("Sending your message\u2026", "pending");

    fetch("https://api.w3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data
    })
      .then(function (response) {
        return response.json().then(function (json) {
          return { ok: response.ok, json: json };
        });
      })
      .then(function (result) {
        if (result.ok && result.json.success) {
          setStatus(
            "Thanks! Your message has been sent \u2014 I'll get back to you soon.",
            "success"
          );
          form.reset();
        } else {
          setStatus(
            (result.json && (result.json.error || result.json.message)) ||
              "Something went wrong. Please try again or email me directly.",
            "error"
          );
        }
      })
      .catch(function () {
        setStatus(
          "Network error. Please try again, or email me directly at souvik.chat2011@gmail.com.",
          "error"
        );
      })
      .finally(function () {
        setLoading(false);
      });
  });
})();
