const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const menuLinks = mobileMenu?.querySelectorAll("a") ?? [];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const scrollProgress = document.querySelector("[data-scroll-progress]");
const serviceItems = [...document.querySelectorAll(".service-item")];
const principle = document.querySelector("[data-principle]");
const principleWords = [...document.querySelectorAll("[data-principle-word]")];
const principleCaptions = [...document.querySelectorAll("[data-principle-caption]")];
const principleIndex = document.querySelector("[data-principle-index]");
const principleProgress = document.querySelector("[data-principle-progress]");
const hero = document.querySelector(".hero");
const heroMotion = document.querySelector(".hero__motion");
const pageJump = document.querySelector("[data-page-jump]");
let activePrincipleStage = 0;
let pageJumpTimer;
let pageRevealTimer;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const closeMenu = () => {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Öppna meny");
  mobileMenu.classList.remove("is-open");
  document.body.classList.remove("menu-open");
};

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Öppna meny" : "Stäng meny");
  mobileMenu?.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

menuLinks.forEach((link) => link.addEventListener("click", closeMenu));

const sectionLinks = document.querySelectorAll(
  '.site-header a[href^="#"], .site-footer a[href^="#"], .hero a[href^="#"]',
);

sectionLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const selector = link.getAttribute("href");
    const target = selector ? document.querySelector(selector) : null;

    if (!target) return;

    event.preventDefault();
    closeMenu();

    const currentY = window.scrollY;
    const targetY = target.getBoundingClientRect().top + currentY;
    const principleTop = principle?.offsetTop ?? Number.POSITIVE_INFINITY;
    const principleBottom = principle
      ? principleTop + principle.offsetHeight
      : Number.NEGATIVE_INFINITY;
    const pathStart = Math.min(currentY, targetY);
    const pathEnd = Math.max(currentY, targetY);
    const crossesPrinciple =
      pathStart < principleBottom &&
      pathEnd > principleTop &&
      Math.abs(currentY - targetY) > window.innerHeight * 0.75;

    const finishNavigation = () => {
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, targetY);
      root.style.scrollBehavior = previousScrollBehavior;
      window.history.pushState(null, "", selector);
      updateScrollEffects();
    };

    window.clearTimeout(pageJumpTimer);
    window.clearTimeout(pageRevealTimer);
    document.body.classList.remove("is-page-jumping", "is-page-revealing");

    if (reduceMotion || !crossesPrinciple || !pageJump) {
      window.scrollTo({
        top: targetY,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      window.history.pushState(null, "", selector);
      return;
    }

    document.body.classList.add("is-page-jumping");
    pageJumpTimer = window.setTimeout(() => {
      finishNavigation();
      document.body.classList.remove("is-page-jumping");
      document.body.classList.add("is-page-revealing");

      pageRevealTimer = window.setTimeout(() => {
        document.body.classList.remove("is-page-revealing");
      }, 520);
    }, 200);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

const updateScrollEffects = () => {
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const maxScroll = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);
  const pageProgress = clamp(scrollY / maxScroll);

  header?.classList.toggle("is-scrolled", scrollY > 24);
  if (scrollProgress) {
    scrollProgress.style.transform = `scaleX(${pageProgress})`;
  }

  if (!reduceMotion && scrollY < viewportHeight * 1.25) {
    const heroProgress = clamp(scrollY / viewportHeight);
    root.style.setProperty("--hero-shift", `${heroProgress * 92}px`);
    root.style.setProperty("--hero-scale", String(1.06 + heroProgress * 0.08));
    root.style.setProperty("--hero-copy-y", `${heroProgress * -82}px`);
    root.style.setProperty("--hero-copy-opacity", String(1 - heroProgress * 0.72));
    root.style.setProperty("--hero-grid-x", `${heroProgress * -42}px`);
    root.style.setProperty("--hero-motion-scroll", `${heroProgress * -48}px`);
  }

  let closestService = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  serviceItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const isVisible = rect.bottom > viewportHeight * 0.16 && rect.top < viewportHeight * 0.84;
    const distance = Math.abs(rect.top + rect.height / 2 - viewportHeight * 0.52);

    if (isVisible && distance < closestDistance) {
      closestService = item;
      closestDistance = distance;
    }
  });

  serviceItems.forEach((item) => item.classList.toggle("is-active", item === closestService));

  if (principle) {
    const rect = principle.getBoundingClientRect();
    const scrollableDistance = Math.max(principle.offsetHeight - viewportHeight, 1);
    const progress = clamp(-rect.top / scrollableDistance);
    const stage = Math.min(principleWords.length - 1, Math.floor(progress * principleWords.length));

    if (stage !== activePrincipleStage) activePrincipleStage = stage;

    principleWords.forEach((word, index) => {
      word.classList.toggle("is-active", index === activePrincipleStage);
      word.classList.toggle("is-past", index < activePrincipleStage);
    });

    principleCaptions.forEach((caption, index) => {
      caption.classList.toggle("is-active", index === activePrincipleStage);
    });

    if (principleIndex) {
      principleIndex.textContent = String(activePrincipleStage + 1).padStart(2, "0");
    }

    if (principleProgress) {
      principleProgress.style.transform = `scaleX(${progress})`;
    }

    if (!reduceMotion) {
      principle.style.setProperty("--principle-rotation", `${progress * 38}deg`);
      principle.style.setProperty("--principle-ring-scale", String(0.84 + progress * 0.24));
      principle.style.setProperty("--principle-rings-opacity", String(0.3 + progress * 0.38));
      principle.style.setProperty("--principle-glow-x", `${(progress - 0.5) * 220}px`);
      principle.style.setProperty("--principle-glow-y", `${(progress - 0.5) * 90}px`);
      principle.style.setProperty("--principle-glow-scale", String(0.78 + progress * 0.42));
    }
  }
};

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollEffects();
      ticking = false;
    });
  },
  { passive: true },
);

window.addEventListener("resize", updateScrollEffects, { passive: true });

if (!reduceMotion && hero && heroMotion) {
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 22;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 16;

    heroMotion.style.setProperty("--hero-motion-x", `${x}px`);
    heroMotion.style.setProperty("--hero-motion-y", `${y}px`);
  });

  hero.addEventListener("pointerleave", () => {
    heroMotion.style.setProperty("--hero-motion-x", "0px");
    heroMotion.style.setProperty("--hero-motion-y", "0px");
  });
}

updateScrollEffects();

const reveals = document.querySelectorAll("[data-reveal]");

if (reduceMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -6% 0px",
    },
  );

  reveals.forEach((element) => revealObserver.observe(element));
}

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());
