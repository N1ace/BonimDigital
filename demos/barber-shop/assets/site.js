/* ===== BUSINESS DATA — the only thing a backend replaces ===== */

// Opening hours by JS weekday (0=Sunday … 6=Saturday). Minutes from midnight. null = closed.
const HOURS = {
  0: [540, 1200], 1: [540, 1200], 2: [540, 1200], 3: [540, 1200], 4: [540, 1200], // Sun–Thu 9:00–20:00
  5: [480, 870],                                                          // Fri 8:00–14:30
  6: null                                                                 // Sat closed
}; // DEMO: hours

// Dates the shop is closed regardless of weekday — חגים, ערבי חג, חופשות.
const CLOSED_DATES = ["2026-09-11", "2026-09-12", "2026-09-21", "2026-10-02"]; // DEMO: holiday closures

const SERVICES = [
  { id: "haircut", name: "תספורת", price: 80, minutes: 30 },
  { id: "combo", name: "תספורת + זקן", price: 110, minutes: 45 },
  { id: "beard", name: "עיצוב זקן", price: 50, minutes: 20 },
  { id: "shave", name: "גילוח תער + מגבת חמה", price: 70, minutes: 30 },
  { id: "kids", name: "תספורת ילדים", price: 60, minutes: 25 },
  { id: "styling", name: "חפיפה וסטיילינג", price: 40, minutes: 15 }
]; // DEMO: services and prices

const BARBERS = [
  { id: "any", name: "הפנוי הראשון", days: [0, 1, 2, 3, 4, 5] },
  { id: "alon", name: "אלון", days: [0, 1, 2, 3, 4] },
  { id: "daniel", name: "דניאל", days: [0, 2, 3, 4, 5] },
  { id: "tomer", name: "תומר", days: [1, 2, 3, 4, 5] }
]; // DEMO: barber names and working days

const WA = "https://wa.me/972505551234"; // DEMO: whatsapp number
const PHONE = "+97235551234"; // DEMO: phone
const PHONE_DISPLAY = "03-555-1234"; // DEMO: phone display
const SHOP_NAME = "השדרה ברברשופ"; // DEMO: shop name
const SHOP_ADDRESS = "אחד העם 12, תל אביב"; // DEMO: address
const SITE_ORIGIN = "https://n1ace.github.io/portfolio/demos/barber-shop"; // DEMO: public base URL
const CUSTOMER_KEY = "hasdera:customer";

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const fmtTime = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseTime = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const validILMobile = (v) => /^05\d{8}$/.test(String(v).replace(/[\s-]/g, ""));
const waLink = (text) => `${WA}?text=${encodeURIComponent(text)}`;

const serviceById = (id) => SERVICES.find((s) => s.id === id);
const serviceByName = (name) => SERVICES.find((s) => s.name === name);
const barberById = (id) => BARBERS.find((b) => b.id === id);
const barberByName = (name) => BARBERS.find((b) => b.name === name);

/* ===== shared chrome: header scroll + mobile menu ===== */
(function wireChrome() {
  const header = document.querySelector("header.site");
  if (header && !header.classList.contains("solid")) {
    const onScroll = () => header.classList.toggle("solid", window.scrollY > 40);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("mobile-menu");
  if (!menuBtn || !menu) return;

  function setMenu(open) {
    menu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
  }
  menuBtn.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", (e) => {
    if (e.target.tagName === "A") setMenu(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("open")) {
      setMenu(false);
      menuBtn.focus();
    }
  });
})();

/* ============ scroll reveals ============ */
(function wireReveals() {
  document.documentElement.classList.add("js");

  /* The `top < 0` branch is mandatory: on a #hash landing or a fast flick,
     elements get scrolled past without ever intersecting, and without this
     they stay at opacity:0 permanently. */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

  /* Safety net for anything left above the fold after scrolling stops. */
  let sweep;
  addEventListener("scroll", () => {
    clearTimeout(sweep);
    sweep = setTimeout(() => {
      document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => {
        if (el.getBoundingClientRect().top < 0) {
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    }, 120);
  }, { passive: true });
})();
