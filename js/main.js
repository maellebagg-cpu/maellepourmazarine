(() => {
  const root = document.documentElement;

  /* Theme: read saved preference, fall back to dark. */
  const savedTheme = localStorage.getItem("mpm-theme");
  if (savedTheme === "light") root.setAttribute("data-theme", "light");

  const themeToggle = document.querySelector("[data-theme-toggle]");
  themeToggle?.addEventListener("click", () => {
    const isLight = root.getAttribute("data-theme") === "light";
    if (isLight) {
      root.removeAttribute("data-theme");
      localStorage.setItem("mpm-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
      localStorage.setItem("mpm-theme", "light");
    }
  });

  /* Mobile nav burger */
  const nav = document.querySelector("[data-nav]");
  const burger = document.querySelector("[data-nav-burger]");
  burger?.addEventListener("click", () => nav.classList.toggle("is-open"));
  nav?.querySelectorAll(".nav__link").forEach(link => {
    link.addEventListener("click", () => nav.classList.remove("is-open"));
  });

  /* Navbar scroll state — stays transparent as long as the case-hero photo
     occupies the viewport, then switches to the surfaced state below it. */
  const heroForNav = document.querySelector(".case-hero");
  const onScroll = () => {
    let onHero = false;
    if (heroForNav) {
      const r = heroForNav.getBoundingClientRect();
      onHero = r.top <= 0 && r.bottom > 80;
    }
    if (window.scrollY > 24 && !onHero) nav?.classList.add("is-scrolled");
    else nav?.classList.remove("is-scrolled");
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Hero: split title into per-character spans for stagger animation */
  const heroTitle = document.querySelector("[data-split]");
  if (heroTitle) {
    const text = heroTitle.textContent.trim();
    heroTitle.textContent = "";
    const words = text.split(" ");
    let charIdx = 0;
    words.forEach((word, wi) => {
      const wEl = document.createElement("span");
      wEl.className = "word";
      [...word].forEach(ch => {
        const cEl = document.createElement("span");
        cEl.className = "char";
        cEl.textContent = ch;
        cEl.style.transitionDelay = `${charIdx * 45}ms`;
        wEl.appendChild(cEl);
        charIdx++;
      });
      heroTitle.appendChild(wEl);
      if (wi < words.length - 1) heroTitle.appendChild(document.createTextNode(" "));
    });
  }
  requestAnimationFrame(() => {
    document.querySelector(".hero")?.classList.add("is-ready");
  });

  /* Louvre — click-driven card stack swap (atelier page) */
  const louvre = document.querySelector("[data-louvre]");
  if (louvre) {
    const stack = louvre.querySelector("[data-louvre-stack]");
    const counter = louvre.querySelector("[data-louvre-counter]");
    const cardCount = stack ? stack.querySelectorAll(".louvre__card").length : 0;
    let active = 0;
    const renderLouvre = () => {
      if (stack) stack.setAttribute("data-active", String(active));
      if (counter) counter.textContent = String(active + 1).padStart(2, "0");
    };
    const advance = () => {
      active = (active + 1) % Math.max(1, cardCount);
      renderLouvre();
    };
    stack?.addEventListener("click", advance);
    stack?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    });
    renderLouvre();
  }

  /* Gallery — scroll-driven 3D walkthrough (atelier page) */
  const gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    const scene = gallery.querySelector("[data-gallery-scene]");
    const cards = Array.from(gallery.querySelectorAll(".gallery-card"));
    const counter = gallery.querySelector("[data-gallery-counter]");
    const cardZs = cards.map((c) => parseFloat(c.dataset.z) || 0);
    const TRAVEL_END = 9400;
    let raf = null;

    const updateScene = () => {
      const rect = gallery.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      const travel = progress * TRAVEL_END;

      scene.style.setProperty("--travel", `${travel}px`);

      let activeIdx = 0;
      let minDist = Infinity;

      cards.forEach((card, i) => {
        const effZ = cardZs[i] + travel;
        let opacity;
        if (effZ < -2000) opacity = 0;
        else if (effZ < -1200) opacity = (effZ + 2000) / 800;
        else if (effZ < 100) opacity = 1;
        else if (effZ < 600) opacity = 1 - effZ / 600;
        else opacity = 0;
        card.style.opacity = String(Math.max(0, Math.min(1, opacity)));

        const dist = Math.abs(effZ);
        if (dist < minDist) {
          minDist = dist;
          activeIdx = i;
        }
      });

      if (counter) counter.textContent = String(activeIdx + 1).padStart(2, "0");
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        updateScene();
        raf = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateScene();
  }

  /* Timeline — horizontal scroll-jacking driven by vertical scroll */
  const timeline = document.querySelector("[data-timeline]");
  if (timeline && window.matchMedia("(min-width: 701px)").matches) {
    const sticky = timeline.querySelector("[data-timeline-sticky]");
    const track = timeline.querySelector("[data-timeline-track]");
    let tlRaf = null;
    const updateTimeline = () => {
      const rect = timeline.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      const maxX = Math.max(0, track.scrollWidth - sticky.clientWidth);
      track.style.transform = `translate3d(${-progress * maxX}px, 0, 0)`;
    };
    const onTimelineScroll = () => {
      if (tlRaf) return;
      tlRaf = requestAnimationFrame(() => {
        updateTimeline();
        tlRaf = null;
      });
    };
    window.addEventListener("scroll", onTimelineScroll, { passive: true });
    window.addEventListener("resize", onTimelineScroll, { passive: true });
    updateTimeline();
  }

  /* Moodboard — flat mosaic at scroll 0, peripheral photos translate forward
     first (the further from centre, the faster), camera advances toward the
     lotus until it fills the screen. */
  const moodSection = document.querySelector("[data-moodboard]");
  if (moodSection && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const moodItems = Array.from(moodSection.querySelectorAll(".moodboard-grid__item"));
    const moodMeta = moodItems.map((it) => {
      const cs = getComputedStyle(it);
      const x = parseFloat(cs.getPropertyValue("--target-x")) || 0;
      const y = parseFloat(cs.getPropertyValue("--target-y")) || 0;
      return { x, y, dist: Math.hypot(x, y), isLotus: it.classList.contains("moodboard-grid__item--lotus") };
    });
    const maxDist = Math.max(1, ...moodMeta.map((m) => m.dist));
    const CAMERA_END = 900;       // centre photo fills the screen at end of zoom
    const PHOTO_Z_MAX = 1300;     // peripheral photos fly past well before the centre lands
    let mRaf = null;
    const apply = () => {
      const rect = moodSection.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      moodSection.style.setProperty("--mood-progress", progress.toFixed(4));
      moodSection.style.setProperty("--mood-travel", `${(progress * CAMERA_END).toFixed(1)}px`);
      moodItems.forEach((item, i) => {
        const m = moodMeta[i];
        // Peripherality: 0 at centre (lotus), 1 at the corner photos.
        const periph = m.isLotus ? 0 : m.dist / maxDist;
        const photoZ = periph * PHOTO_Z_MAX * progress;
        item.style.setProperty("--photo-z", `${photoZ.toFixed(1)}px`);
        // Effective Z = photo Z + camera Z. Fade out as item passes camera.
        const effZ = photoZ + progress * CAMERA_END;
        let opacity = 1;
        if (!m.isLotus) {
          if (effZ > 1100) opacity = 0;
          else if (effZ > 800) opacity = 1 - (effZ - 800) / 300;
        }
        item.style.opacity = opacity.toFixed(3);
      });
      // Header fades out as soon as the camera starts moving
      const headOp = Math.max(0, 1 - progress / 0.2);
      moodSection.style.setProperty("--mood-head-opacity", headOp.toFixed(3));
      mRaf = null;
    };
    const schedule = () => { if (!mRaf) mRaf = requestAnimationFrame(apply); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    apply();
  }

  /* Case study hero — scroll-driven parallax: photo drifts slightly DOWN as
     the user scrolls (with a touch of zoom), titles drift slightly faster UP. */
  const caseHero = document.querySelector("[data-case-hero]");
  if (caseHero && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const pages = caseHero.querySelectorAll(".case-hero__page");
    let chRaf = null;
    const apply = () => {
      const rect = caseHero.getBoundingClientRect();
      const range = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      // Photo slides from sky (top) to water (bottom) as the user scrolls
      caseHero.style.setProperty("--bg-pos-y", `${(progress * 100).toFixed(2)}%`);
      // Three pages with progressively gentler parallax: title > concept > campagne
      pages[0]?.style.setProperty("--page-pan", `${progress * -100}px`);
      pages[1]?.style.setProperty("--page-pan", `${progress * -60}px`);
      pages[2]?.style.setProperty("--page-pan", `${progress * -25}px`);
      chRaf = null;
    };
    const schedule = () => { if (!chRaf) chRaf = requestAnimationFrame(apply); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    apply();
  }

  /* Timeline — auto-unfold each card while it's visible in the viewport */
  const timelineItems = document.querySelectorAll(".timeline-item");
  if ("IntersectionObserver" in window && timelineItems.length) {
    const tlIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle("is-open", e.isIntersecting);
      });
    }, { threshold: 0.5 });
    timelineItems.forEach((it) => tlIO.observe(it));
  }

  /* Book — cover swings open on click */
  document.querySelectorAll("[data-book]").forEach((b) => {
    b.addEventListener("click", () => b.classList.toggle("is-open"));
  });

  /* Reveal on scroll */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-visible"));
  }
})();
