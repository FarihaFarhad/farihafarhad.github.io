(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- scroll-spy ---------- */
  var sectionIds = ["about", "skills", "projects", "publications", "education", "awards", "contact"];
  var navAnchors = {};
  sectionIds.forEach(function (id) {
    var a = navLinks.querySelector('a[href="#' + id + '"]');
    if (a) navAnchors[id] = a;
  });

  function updateScrollSpy() {
    var fromTop = window.scrollY + 140;
    var current = null;
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= fromTop) current = id;
    });
    Object.keys(navAnchors).forEach(function (id) {
      navAnchors[id].classList.toggle("active", id === current);
    });
  }
  window.addEventListener("scroll", updateScrollSpy, { passive: true });
  updateScrollSpy();

  /* ---------- typing effect ---------- */
  var typeWord = document.getElementById("typeWord");
  var words = ["CSE Student", "Researcher", "Aspiring Educator", "Problem Solver", "Paper Writer"];
  var wordIndex = 0;
  var charIndex = 0;
  var deleting = false;

  function typeLoop() {
    var word = words[wordIndex];
    charIndex += deleting ? -1 : 1;
    typeWord.textContent = word.slice(0, charIndex);

    var delay = deleting ? 45 : 95;
    if (!deleting && charIndex === word.length) {
      delay = 1600;
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 350;
    }
    setTimeout(typeLoop, delay);
  }

  if (reduceMotion) {
    typeWord.textContent = words[0];
  } else {
    setTimeout(typeLoop, 600);
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  function attachTilt(card) {
    if (reduceMotion) return;
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        "rotateY(" + (px * 8).toFixed(2) + "deg) rotateX(" + (-py * 8).toFixed(2) + "deg)";
    });
    card.addEventListener("mouseleave", function () {
      card.style.transform = "";
    });
    setTimeout(function () { card.classList.add("tilt-ready"); }, 1000);
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            if (entry.target.classList.contains("tilt")) attachTilt(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- scroll-linked effects: progress, parallax, timeline draw ---------- */
  var progressBar = document.getElementById("progressBar");
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var timeline = document.querySelector(".timeline");

  function updateScrollEffects() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = "scaleX(" + (max > 0 ? y / max : 0).toFixed(4) + ")";

    if (!reduceMotion) {
      parallaxEls.forEach(function (el) {
        el.style.translate = "0 " + (y * parseFloat(el.dataset.parallax)).toFixed(1) + "px";
      });
    }

    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var p = (window.innerHeight * 0.85 - r.top) / r.height;
      timeline.style.setProperty("--draw", Math.max(0, Math.min(1, p)).toFixed(3));
    }
  }
  window.addEventListener("scroll", updateScrollEffects, { passive: true });
  window.addEventListener("resize", updateScrollEffects);
  updateScrollEffects();

  /* ---------- animated stat counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var statNums = document.querySelectorAll(".stat-num");
  if ("IntersectionObserver" in window) {
    var statObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    statNums.forEach(function (el) { statObserver.observe(el); });
  } else {
    statNums.forEach(animateCount);
  }

  /* ---------- publication filter ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var pubCards = document.querySelectorAll(".pub-card");
  var pubEmpty = document.getElementById("pubEmpty");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");

      var filter = btn.dataset.filter;
      var visible = 0;
      pubCards.forEach(function (card) {
        var themes = (card.dataset.theme || "").split(/\s+/);
        var show = filter === "all" || themes.indexOf(filter) !== -1;
        card.classList.toggle("is-hidden", !show);
        if (show) visible++;
      });
      pubEmpty.hidden = visible !== 0;
    });
  });

  /* ---------- contact form -> mailto ---------- */
  var form = document.getElementById("contactForm");
  var formNote = document.getElementById("formNote");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("cfName");
    var email = document.getElementById("cfEmail");
    var msg = document.getElementById("cfMsg");

    var valid = true;
    [name, email, msg].forEach(function (field) {
      var ok = field.value.trim() !== "";
      if (field === email) ok = ok && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      field.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      formNote.style.color = "#c76a86";
      formNote.textContent = "oops — please fill in every field (with a real email!) 🌧️";
      return;
    }

    var subject = encodeURIComponent("Hello from " + name.value.trim() + " — via your portfolio");
    var body = encodeURIComponent(msg.value.trim() + "\n\n— " + name.value.trim() + "\n" + email.value.trim());
    window.location.href = "mailto:farihafarhad24@gmail.com?subject=" + subject + "&body=" + body;

    formNote.style.color = "#4c9a7c";
    formNote.textContent = "opening your mail app… thank you for saying hi! ♡";
    form.reset();
  });

  /* ---------- back to top ---------- */
  var toTop = document.getElementById("toTop");
  window.addEventListener(
    "scroll",
    function () {
      toTop.classList.toggle("show", window.scrollY > 600);
    },
    { passive: true }
  );
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
})();
