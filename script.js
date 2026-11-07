// ============ THEME TOGGLE ============
const root = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");

function currentTheme() {
  const set = root.getAttribute("data-theme");
  if (set) return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

themeBtn.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});

// ============ MOBILE MENU ============
const menuBtn = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  })
);

// ============ NAV BORDER ON SCROLL ============
const nav = document.querySelector(".nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

// ============ ACTIVE NAV LINK ============
const sections = document.querySelectorAll("main section[id]");
const linkFor = (id) => navLinks.querySelector(`a[href="#${id}"]`);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const link = linkFor(entry.target.id);
    if (link && entry.isIntersecting) {
      navLinks.querySelectorAll("a").forEach((a) => a.classList.remove("active"));
      link.classList.add("active");
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => sectionObserver.observe(s));

// ============ SCROLL REVEAL ============
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ============ PROJECT FILTER ============
const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll("#projects .project-card");

filters.forEach((btn) =>
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    projects.forEach((p) => {
      const cats = p.dataset.category.split(" ");
      p.classList.toggle("hidden", f !== "all" && !cats.includes(f));
    });
  })
);

// ============ PROJECT GALLERIES ============
function buildMedia(type, src, poster, inLightbox) {
  if (type === "video") {
    const v = document.createElement("video");
    v.src = src;
    if (poster) v.poster = poster;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.setAttribute("muted", "");
    if (inLightbox) { v.controls = true; v.autoplay = true; }
    return v;
  }
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  return img;
}

// Play videos only while visible
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) v.play().catch(() => {});
    else v.pause();
  });
}, { threshold: 0.4 });

const lightbox = document.getElementById("lightbox");
const lbContent = lightbox.querySelector(".lightbox-content");
const lbCaption = lightbox.querySelector(".lightbox-caption");

function openLightbox(btn) {
  lbContent.replaceChildren(buildMedia(btn.dataset.type, btn.dataset.src, btn.dataset.poster, true));
  lbCaption.textContent = btn.dataset.caption || "";
  lightbox.showModal();
}
function closeLightbox() {
  lightbox.close();
}
lightbox.addEventListener("close", () => lbContent.replaceChildren());
lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

document.querySelectorAll(".gallery").forEach((gallery) => {
  const main = gallery.querySelector(".gallery-main");
  const caption = gallery.querySelector(".gallery-caption");
  const thumbs = [...gallery.querySelectorAll(".gallery-thumbs button")];
  let current = null;
  if (thumbs.length < 2) gallery.classList.add("single");

  function show(btn) {
    current = btn;
    thumbs.forEach((t) => t.classList.toggle("active", t === btn));
    const media = buildMedia(btn.dataset.type, btn.dataset.src, btn.dataset.poster, false);
    const expand = document.createElement("button");
    expand.className = "expand";
    expand.type = "button";
    expand.textContent = "⤢ Expand";
    expand.setAttribute("aria-label", "View full screen");
    main.replaceChildren(media, expand);
    if (media.tagName === "VIDEO") videoObserver.observe(media);
    caption.textContent = btn.dataset.caption || "";
  }

  thumbs.forEach((t) => t.addEventListener("click", () => show(t)));
  main.addEventListener("click", () => current && openLightbox(current));
  if (thumbs[0]) show(thumbs[0]);
});

// ============ FOOTER YEAR ============
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============ ROLE ROTATOR (typewriter) ============
(function () {
  const el = document.getElementById("role");
  if (!el) return;
  const roles = ["edge AI", "embedded systems", "computer vision", "medical device software", "IoT platforms", "secure systems"];
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let i = 0, j = roles[0].length, deleting = true;
  function tick() {
    const word = roles[i];
    if (deleting) {
      j--;
      if (j <= 0) { deleting = false; i = (i + 1) % roles.length; }
    } else {
      j++;
      if (j >= roles[i].length) { deleting = true; el.textContent = roles[i]; return setTimeout(tick, 2200); }
    }
    el.textContent = roles[i].slice(0, Math.max(j, 0)) || "​";
    setTimeout(tick, deleting ? 35 : 70);
  }
  setTimeout(tick, 2400);
})();

// ============ STAT COUNTERS ============
(function () {
  const nums = document.querySelectorAll(".stat-num[data-count]");
  if (!nums.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el = e.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || "";
      const t0 = performance.now(), dur = 1200;
      (function step(now) {
        const p = Math.min(1, (now - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * eased).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  nums.forEach((n) => obs.observe(n));
})();

// ============ SCROLL PROGRESS ============
(function () {
  const bar = document.querySelector(".scroll-progress");
  if (!bar) return;
  const update = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  };
  addEventListener("scroll", update, { passive: true });
  update();
})();

// ============ CARD SPOTLIGHT ============
document.querySelectorAll(".project-card, .skill-card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});
