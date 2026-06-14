/* =============================================================
   Portfolio 1.0 — Shared Theme + Navigation
   Injects a consistent navbar/footer and handles light/dark theme.
   Each page may set `window.SITE_ROOT` (e.g. "../") and
   `window.SITE_PAGE` (e.g. "home") before loading this script.
   ============================================================= */
(function () {
  "use strict";

  var ROOT = window.SITE_ROOT || "./";
  var PAGE = window.SITE_PAGE || "";

  var BRAND = "Souvik Chatterjee";
  var NAV = [
    { id: "home", label: "Home", href: ROOT },
    { id: "about", label: "About", href: ROOT + "about/" },
    { id: "services", label: "Services", href: ROOT + "services/" },
    { id: "blogs", label: "Blogs", href: ROOT + "blogs/" },
    { id: "contact", label: "Contact", href: ROOT + "contact/" },
    { id: "resume", label: "Resume", href: ROOT + "Documents/resume.pdf", external: true },
  ];
  var SOCIALS = [
    { icon: "fa-brands fa-linkedin-in", href: "https://www.linkedin.com/in/souvik06/", label: "LinkedIn" },
    { icon: "fa-brands fa-github", href: "https://github.com/Souvik06", label: "GitHub" },
    { icon: "fa-brands fa-hackerrank", href: "https://www.hackerrank.com/Souvik06", label: "HackerRank" },
    { icon: "fa-brands fa-facebook-f", href: "https://www.facebook.com/Souvik.chatterjee.06", label: "Facebook" },
    { icon: "fa-solid fa-envelope", href: "mailto:souvik.chat2011@gmail.com", label: "Email" },
  ];

  /* ---------- Theme ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }
  function syncToggleIcon() {
    var icons = document.querySelectorAll(".theme-toggle i");
    var dark = currentTheme() === "dark";
    icons.forEach(function (i) {
      i.className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    });
  }
  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    syncToggleIcon();
  }
  function watchSystemTheme() {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", function (e) {
      if (!localStorage.getItem("theme")) {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        syncToggleIcon();
      }
    });
  }

  /* ---------- Markup ---------- */
  function navLinksHTML(extraClass) {
    return NAV.map(function (n) {
      var active = n.id === PAGE ? " class=\"active\"" : "";
      return '<a href="' + n.href + '"' + active + ">" + n.label + "</a>";
    }).join("");
  }

  function buildNav() {
    var mount = document.getElementById("site-nav");
    if (!mount) return;
    function linkAttrs(n) {
      var cls = n.id === PAGE ? ' class="active"' : "";
      var ext = n.external ? ' target="_blank" rel="noopener"' : "";
      return cls + ext;
    }
    mount.innerHTML =
      '<nav class="site-nav" id="siteNav">' +
        '<a class="nav-brand" href="' + ROOT + '">' + BRAND + "</a>" +
        '<div class="nav-right">' +
          '<ul class="nav-links">' +
            NAV.map(function (n) {
              return "<li>" + '<a href="' + n.href + '"' + linkAttrs(n) + ">" + n.label + "</a></li>";
            }).join("") +
          "</ul>" +
          '<button class="theme-toggle" id="themeToggle" aria-label="Toggle theme"><i class="fa-solid fa-moon"></i></button>' +
          '<button class="nav-hamburger" id="navHamburger" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>' +
        "</div>" +
      "</nav>" +
      '<div class="mobile-menu" id="mobileMenu"><ul>' +
        NAV.map(function (n) {
          return "<li>" + '<a href="' + n.href + '"' + linkAttrs(n) + ">" + n.label + "</a></li>";
        }).join("") +
      "</ul></div>";
  }

  function buildFooter() {
    var mount = document.getElementById("site-footer");
    if (!mount) return;
    var year = new Date().getFullYear();
    mount.innerHTML =
      '<footer class="site-footer">' +
        '<div class="social-row">' +
          SOCIALS.map(function (s) {
            return '<a class="social-link" href="' + s.href + '" aria-label="' + s.label + '" target="_blank" rel="noopener"><i class="' + s.icon + '"></i></a>';
          }).join("") +
        "</div>" +
        "Copyright © " + year + " " + BRAND + ". All Rights Reserved." +
      "</footer>";
  }

  /* ---------- Wiring ---------- */
  function wire() {
    var toggle = document.getElementById("themeToggle");
    if (toggle) toggle.addEventListener("click", toggleTheme);

    var ham = document.getElementById("navHamburger");
    var menu = document.getElementById("mobileMenu");
    if (ham && menu) {
      ham.addEventListener("click", function () {
        menu.classList.toggle("open");
        var open = menu.classList.contains("open");
        ham.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
      });
    }

    var nav = document.getElementById("siteNav");
    if (nav) {
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          nav.classList.toggle("scrolled", window.scrollY > 20);
          ticking = false;
        });
      }, { passive: true });
    }
  }

  /* ---------- Recommendations carousel (responsive, infinite) ---------- */
  function buildCarousel() {
    var root = document.querySelector("[data-carousel]");
    if (!root) return;
    var track = root.querySelector("[data-track]");
    var viewport = root.querySelector(".carousel-viewport");
    var wrapper = root.querySelector(".carousel-wrapper");
    var prevBtn = root.querySelector(".carousel-prev");
    var nextBtn = root.querySelector(".carousel-next");
    var dotsEl = root.querySelector("[data-dots]");
    if (!track || !viewport) return;

    var templates = Array.prototype.slice.call(track.children).map(function (c) {
      return c.cloneNode(true);
    });
    if (!templates.length) return;

    var GAP = 24, PEEK = 32, AUTO_MS = 6000;
    var perView = 1, looping = false, virtual = 0, cardW = 0, transitioning = false, timer = null;

    function calcPerView() {
      var w = Math.min(window.innerWidth, window.screen.width || window.innerWidth);
      var pv = w <= 600 ? 1 : (w <= 1000 ? 2 : 3);
      return Math.min(pv, templates.length);
    }
    function render(d) {
      var c = d.cloneNode(true);
      c.classList.add("c-card");
      return c;
    }
    function makeClone(d) {
      var c = render(d);
      c.setAttribute("aria-hidden", "true");
      c.querySelectorAll("a, button").forEach(function (n) { n.setAttribute("tabindex", "-1"); });
      return c;
    }
    function build() {
      perView = calcPerView();
      looping = templates.length > perView;
      track.innerHTML = "";
      var real = templates.map(function (d) { return render(d); });
      if (looping) {
        templates.slice(-perView).forEach(function (d) { track.appendChild(makeClone(d)); });
        real.forEach(function (c) { track.appendChild(c); });
        templates.slice(0, perView).forEach(function (d) { track.appendChild(makeClone(d)); });
        virtual = perView;
      } else {
        real.forEach(function (c) { track.appendChild(c); });
        virtual = 0;
      }
      buildDots();
      updateControls();
      layout(false);
    }
    function buildDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = "";
      if (!looping) { dotsEl.style.display = "none"; return; }
      dotsEl.style.display = "";
      for (var i = 0; i < templates.length; i++) {
        (function (idx) {
          var b = document.createElement("button");
          b.className = "dot" + (idx === 0 ? " active" : "");
          b.setAttribute("aria-label", "Go to recommendation " + (idx + 1));
          b.addEventListener("click", function () { goTo(idx); });
          dotsEl.appendChild(b);
        })(i);
      }
    }
    function updateControls() {
      [prevBtn, nextBtn].forEach(function (b) { if (b) b.style.display = looping ? "" : "none"; });
    }
    function realIndex() {
      if (!looping) return 0;
      var r = (virtual - perView) % templates.length;
      if (r < 0) r += templates.length;
      return r;
    }
    function updateDots() {
      if (!dotsEl || !looping) return;
      var ri = realIndex();
      dotsEl.querySelectorAll(".dot").forEach(function (d, i) { d.classList.toggle("active", i === ri); });
    }
    function apply() {
      var peekOffset = (looping && perView > 1) ? (PEEK + GAP) : 0;
      track.style.transform = "translateX(" + (peekOffset - virtual * (cardW + GAP)) + "px)";
    }
    function layout(animate) {
      var vw = viewport.offsetWidth;
      var hasPeek = looping && perView > 1;
      cardW = hasPeek
        ? (vw - 2 * PEEK - (perView + 1) * GAP) / perView
        : (vw - GAP * (perView - 1)) / perView;
      track.querySelectorAll(".c-card").forEach(function (c) { c.style.width = cardW + "px"; });
      var fade = PEEK + GAP;
      var mask = hasPeek
        ? "linear-gradient(to right, transparent 0, #000 " + fade + "px, #000 calc(100% - " + fade + "px), transparent 100%)"
        : "";
      viewport.style.webkitMaskImage = mask;
      viewport.style.maskImage = mask;
      if (!animate) track.style.transition = "none";
      apply();
      if (!animate) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { track.style.transition = ""; }); });
      }
      updateDots();
    }
    function move(dir) {
      if (!looping || transitioning) return;
      transitioning = true;
      virtual += dir;
      apply();
      updateDots();
    }
    function goTo(i) {
      if (!looping || transitioning) return;
      transitioning = true;
      virtual = perView + i;
      apply();
      updateDots();
      restart();
    }
    track.addEventListener("transitionend", function (e) {
      if (e.propertyName !== "transform") return;
      if (looping) {
        if (virtual >= templates.length + perView) { virtual -= templates.length; snap(); }
        else if (virtual < perView) { virtual += templates.length; snap(); }
      }
      transitioning = false;
    });
    function snap() {
      track.style.transition = "none";
      apply();
      requestAnimationFrame(function () { requestAnimationFrame(function () { track.style.transition = ""; }); });
    }
    function start() { stop(); if (looping) timer = setInterval(function () { move(1); }, AUTO_MS); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { start(); }

    if (prevBtn) prevBtn.addEventListener("click", function () { move(-1); restart(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { move(1); restart(); });
    if (wrapper) {
      wrapper.addEventListener("mouseenter", stop);
      wrapper.addEventListener("mouseleave", start);
    }
    var touchStartX = 0;
    viewport.addEventListener("touchstart", function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener("touchend", function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { move(diff > 0 ? 1 : -1); restart(); }
    }, { passive: true });

    build();
    start();

    var lastVPWidth = viewport.offsetWidth;
    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(function () {
        var w = viewport.offsetWidth;
        if (w === lastVPWidth) return;
        lastVPWidth = w;
        var pv = calcPerView();
        if (pv !== perView) { build(); start(); }
        else { track.style.transition = "none"; layout(false); }
      });
      ro.observe(viewport);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildNav();
    buildFooter();
    wire();
    watchSystemTheme();
    syncToggleIcon();
    buildCarousel();
  });
})();
