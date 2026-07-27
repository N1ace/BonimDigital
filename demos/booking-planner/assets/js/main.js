/* =========================================================================
   תוריו — site logic (vanilla JS, no dependencies)
   All editable constants live in the TORIO_DEMO object below.
   Mirrors planner/src/lib/plan-limits.ts PLAN_QUOTAS (marketing site).
   ========================================================================= */

var TORIO_DEMO = {
  appUrl: "#",
  signupUrl: "#",
  phone: "+972500000000",
  phoneDisplay: "050-000-0000",
  email: "demo@torio-demo.example",
  productName: "תוריו",
  contactName: "Torio Demo",
  legalOwner: "Portfolio demo",
  vatId: "000000000",
  address: "ישראל",
  city: "תל אביב",
  /** ₪ / month, excl. VAT */
  prices: { base: 0, basic: 69, pro: 99, business: 125 },
  /** ₪ / extra staff calendar / month (pro + business), excl. VAT */
  extraStaffPrice: 29,
  messagesPerMonth: { base: 50, basic: 150, pro: 500, business: 750 },
  appointmentsPerMonth: { base: 20, basic: null, pro: null, business: null },
  staffIncluded: { base: 1, basic: 1, pro: 1, business: 3 },
  messageTopUp: { messages: 500, price: 39 },
  vatNote: "המחירים לפני מע״מ"
};

(function () {
  "use strict";

  /** Signup deep link — optional plan preselects package in onboarding. */
  function signupUrlForPlan(planId) {
    var base = TORIO_DEMO.signupUrl;
    if (planId === "free" || planId === "basic" || planId === "pro" || planId === "business") {
      return base + "&plan=" + planId;
    }
    return base;
  }

  function initDemoGuards() {
    document.querySelectorAll("[data-app-link], [data-signup-link]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
      });
      a.setAttribute("title", "תצוגת פורטפוליו — הרשמה לא פעילה");
    });
  }

  function initConstants() {
    document.querySelectorAll("[data-app-link]").forEach(function (a) {
      a.href = TORIO_DEMO.appUrl;
    });

    document.querySelectorAll("[data-signup-link]").forEach(function (a) {
      var plan = a.getAttribute("data-signup-plan");
      a.href = signupUrlForPlan(plan);
    });

    var priceKeys = { base: "base", pro: "pro", business: "business", premium: "business" };
    Object.keys(priceKeys).forEach(function (key) {
      var planKey = priceKeys[key];
      document.querySelectorAll('[data-price="' + key + '"]').forEach(function (el) {
        var amount = TORIO_DEMO.prices[planKey];
        el.textContent = amount === 0 ? "חינם" : "₪" + amount;
      });
    });

    Object.keys(TORIO_DEMO.messagesPerMonth).forEach(function (key) {
      document.querySelectorAll('[data-messages="' + key + '"]').forEach(function (el) {
        el.textContent = TORIO_DEMO.messagesPerMonth[key].toLocaleString("he-IL");
      });
    });

    document.querySelectorAll("[data-extra-staff-price]").forEach(function (el) {
      el.textContent = "₪" + TORIO_DEMO.extraStaffPrice;
    });

    document.querySelectorAll("[data-message-topup]").forEach(function (el) {
      el.textContent =
        TORIO_DEMO.messageTopUp.messages.toLocaleString("he-IL") +
        " הודעות ב-₪" +
        TORIO_DEMO.messageTopUp.price;
    });

    document.querySelectorAll("[data-vat-note]").forEach(function (el) {
      el.textContent = TORIO_DEMO.vatNote;
    });

    var telHref = "tel:" + TORIO_DEMO.phone.replace(/[^0-9+]/g, "");
    document.querySelectorAll("[data-contact-phone]").forEach(function (a) {
      a.href = telHref;
      a.textContent = TORIO_DEMO.phoneDisplay;
    });
    document.querySelectorAll("[data-contact-email]").forEach(function (a) {
      a.href = "mailto:" + TORIO_DEMO.email;
      a.textContent = TORIO_DEMO.email;
    });
    document.querySelectorAll("[data-contact-name]").forEach(function (el) {
      el.textContent = TORIO_DEMO.contactName;
    });
  }

  function initMenu() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("mobile-menu");
    if (!toggle || !menu) return;

    function setMenuOpen(open) {
      menu.classList.toggle("is-open", open);
      toggle.classList.toggle("is-active", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
      document.body.classList.toggle("menu-open", open);
      if (header) header.classList.toggle("is-menu-open", open);
    }

    toggle.addEventListener("click", function () {
      setMenuOpen(!menu.classList.contains("is-open"));
    });

    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var href = a.getAttribute("href") || "";
        if (href.charAt(0) === "#") {
          e.preventDefault();
          setMenuOpen(false);
          var id = href.slice(1);
          var target = document.getElementById(id);
          window.setTimeout(function () {
            if (target) {
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            if (history.replaceState) {
              history.replaceState(null, "", href);
            } else {
              window.location.hash = href;
            }
          }, 50);
          return;
        }
        setMenuOpen(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setMenuOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && menu.classList.contains("is-open")) {
        setMenuOpen(false);
      }
    });
  }

  function initScrollSpy() {
    var links = document.querySelectorAll('[data-spy] a[href^="#"]');
    if (!links.length) return;

    var ids = ["demo", "how", "features", "pricing", "faq", "contact", "blog"];

    function onScroll() {
      var scrollY = window.scrollY + 120;
      // Default to the home tab while the user is still in the hero area.
      var current = "top";
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) current = id;
      });
      links.forEach(function (a) {
        var href = a.getAttribute("href");
        a.classList.toggle("is-active", href === "#" + current);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var btn = item.querySelector(".faq-q");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var open = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.getElementById("contact-status");
      if (status) {
        status.textContent = "תודה! נחזור אליכם בהקדם.";
        status.hidden = false;
      }
      form.reset();
    });
  }

  function planPriceAmount(planId) {
    return TORIO_DEMO.prices[planId === "basic" ? "base" : planId];
  }

  function renderFeatureList(features, className, useCheckSpan) {
    var ul = document.createElement("ul");
    if (className) ul.className = className;
    features.forEach(function (line) {
      var li = document.createElement("li");
      if (useCheckSpan !== false) {
        var check = document.createElement("span");
        check.className = "free-plan-check";
        check.setAttribute("aria-hidden", "true");
        check.textContent = "✓";
        li.appendChild(check);
      }
      li.appendChild(document.createTextNode(line));
      ul.appendChild(li);
    });
    return ul;
  }

  function renderPricingCards(marketing) {
    var grid = document.querySelector("[data-pricing-plans]");
    if (!grid || !marketing || !marketing.plans) return;

    var order = ["free", "basic", "pro", "business"];
    grid.innerHTML = "";

    order.forEach(function (planId) {
      var plan = marketing.plans[planId];
      if (!plan) return;

      var card = document.createElement("div");
      card.className = "price-card" + (plan.popular ? " popular" : "");
      if (planId === "basic") {
        card.id = "pricing-plan-basic";
      }

      if (plan.popular) {
        var badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = "הכי פופולרי";
        card.appendChild(badge);
      }

      var icon = document.createElement("img");
      icon.className = "price-card-icon";
      icon.src = "assets/plans/package-" + planId + ".svg";
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("loading", "lazy");
      icon.width = 64;
      icon.height = 64;
      card.appendChild(icon);

      var h3 = document.createElement("h3");
      h3.textContent = plan.displayName;
      card.appendChild(h3);

      var tagline = document.createElement("p");
      tagline.className = "for";
      tagline.textContent = plan.tagline;
      card.appendChild(tagline);

      var amount = document.createElement("div");
      amount.className = "amount";
      var price = parseInt(String(plan.priceLabel || "").replace(/[^0-9]/g, ""), 10) || 0;
      if (price === 0) {
        amount.innerHTML = "<b>חינם</b><i> / לחודש</i>";
      } else if (plan.introPriceMonthly) {
        amount.innerHTML =
          '<span class="price-was" dir="ltr">₪' +
          price +
          '</span><b class="price-intro" dir="ltr">₪' +
          plan.introPriceMonthly +
          '</b><i> / חודש ראשון</i>';
      } else {
        amount.innerHTML = '<b dir="ltr">₪' + price + '</b><i> / לחודש</i>';
      }
      card.appendChild(amount);

      if (plan.introPriceNote) {
        var introNote = document.createElement("p");
        introNote.className = "price-intro-note";
        introNote.textContent = plan.introPriceNote;
        card.appendChild(introNote);
      }

      if (plan.showTrial && marketing.trialNote) {
        var trial = document.createElement("p");
        trial.className = "price-trial-note";
        trial.textContent = marketing.trialNote;
        card.appendChild(trial);
      }

      var cardTrust = document.createElement("p");
      cardTrust.className = plan.requiresCard ? "price-card-trust price-card-trust--card" : "price-card-trust price-card-trust--free";
      cardTrust.textContent = plan.requiresCard ? marketing.cardRequiredNote : marketing.noCardNote;
      card.appendChild(cardTrust);

      var preview = plan.previewHighlights || plan.features.slice(0, 4);
      card.appendChild(renderFeatureList(preview, "price-card-preview", false));

      if (plan.bridgeNote) {
        var bridge = document.createElement("p");
        bridge.className = "price-bridge-note";
        bridge.textContent = plan.bridgeNote;
        card.appendChild(bridge);
      }

      var detailsWrap = document.createElement("div");
      detailsWrap.className = "price-card-details";
      detailsWrap.hidden = true;
      detailsWrap.id = "price-details-" + planId;

      if (plan.includesPrefix) {
        var prefix = document.createElement("p");
        prefix.className = "price-includes-prefix";
        prefix.textContent = plan.includesPrefix;
        detailsWrap.appendChild(prefix);
      }

      detailsWrap.appendChild(renderFeatureList(plan.features, "price-card-details-list", false));

      var detailsToggle = document.createElement("button");
      detailsToggle.type = "button";
      detailsToggle.className = "price-details-toggle";
      detailsToggle.setAttribute("aria-expanded", "false");
      detailsToggle.setAttribute("aria-controls", detailsWrap.id);
      detailsToggle.innerHTML =
        '<span class="price-details-toggle__label">מה כלול בחבילה?</span>' +
        '<span class="price-details-toggle__chevron" aria-hidden="true"></span>';

      detailsToggle.addEventListener("click", function () {
        var open = detailsWrap.hidden;
        grid.querySelectorAll(".price-card-details").forEach(function (panel) {
          panel.hidden = true;
        });
        grid.querySelectorAll(".price-details-toggle").forEach(function (btn) {
          btn.setAttribute("aria-expanded", "false");
        });
        if (open) {
          detailsWrap.hidden = false;
          detailsToggle.setAttribute("aria-expanded", "true");
        }
      });

      card.appendChild(detailsToggle);
      card.appendChild(detailsWrap);

      var cta = document.createElement("a");
      cta.href = signupUrlForPlan(planId);
      cta.className = plan.popular ? "price-cta-solid" : "price-cta-outline";
      cta.setAttribute("data-signup-link", "");
      cta.setAttribute("data-signup-plan", planId);
      cta.textContent =
        planId === "free"
          ? marketing.ctaStartFree || "התחילו בחינם"
          : marketing.ctaStartTrial || "התחילו 14 ימי ניסיון";
      card.appendChild(cta);

      grid.appendChild(card);
    });

    var footer = document.querySelector("[data-pricing-footer]");
    if (footer && marketing.pricingFooterNote) {
      footer.textContent = marketing.pricingFooterNote;
    }
  }

  function renderPlanDetailPage(marketing) {
    var root = document.querySelector("[data-plan-detail]");
    if (!root || !marketing || !marketing.plans) return;

    var planId = root.getAttribute("data-plan-detail");
    var plan = marketing.plans[planId];
    if (!plan) return;

    var taglineEl = document.querySelector("[data-plan-tagline]");
    if (taglineEl) taglineEl.textContent = plan.tagline;

    var titleEl = document.querySelector("[data-plan-title]");
    if (titleEl) titleEl.textContent = plan.detailPageTitle;

    var featuresHost = document.querySelector("[data-plan-features]");
    if (featuresHost) {
      featuresHost.innerHTML = "";
      if (plan.includesPrefix) {
        var prefix = document.createElement("p");
        prefix.className = "price-includes-prefix price-includes-prefix--detail";
        prefix.textContent = plan.includesPrefix;
        featuresHost.appendChild(prefix);
      }
      featuresHost.appendChild(renderFeatureList(plan.features, "free-plan-list"));
    }

    var footer = document.querySelector("[data-pricing-footer]");
    if (footer && marketing.pricingFooterNote) {
      footer.textContent = marketing.pricingFooterNote;
    }
  }

  function initPlanMarketing() {
    function applyMarketing(marketing) {
      if (!marketing || !marketing.plans) return;
      renderPricingCards(marketing);
      renderPlanDetailPage(marketing);
    }

    if (window.TORIO_PLAN_MARKETING) {
      applyMarketing(window.TORIO_PLAN_MARKETING);
    }

    fetch("assets/plan-marketing.json")
      .then(function (res) {
        if (!res.ok) throw new Error("plan marketing load failed");
        return res.json();
      })
      .then(function (marketing) {
        window.TORIO_PLAN_MARKETING = marketing;
        applyMarketing(marketing);
      })
      .catch(function (err) {
        console.error("plan-marketing fetch failed", err);
      });
  }

  function initStickyCta() {
    var bar = document.querySelector("[data-sticky-cta]");
    var hero = document.querySelector(".hero");
    if (!bar || !hero) return;

    function setVisible(visible) {
      bar.hidden = !visible;
      document.body.classList.toggle("has-sticky-cta", visible);
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          setVisible(!entries[0].isIntersecting);
        },
        { threshold: 0 }
      );
      observer.observe(hero);
    } else {
      window.addEventListener(
        "scroll",
        function () {
          setVisible(window.scrollY > hero.offsetTop + hero.offsetHeight);
        },
        { passive: true }
      );
    }
  }

  function initPricingPlanScroll() {
    document.querySelectorAll('a[href="#pricing-plan-basic"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var target = document.getElementById("pricing-plan-basic");
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (history.replaceState) {
          history.replaceState(null, "", "#pricing-plan-basic");
        } else {
          window.location.hash = "#pricing-plan-basic";
        }
      });
    });
  }

  function initAppDemo() {
    var root = document.querySelector("[data-app-demo]");
    if (!root) return;

    var servicesHost = root.querySelector("[data-demo-services]");
    var staffHost = root.querySelector("[data-demo-staff]");
    var daysHost = root.querySelector("[data-demo-days]");
    var slotsHost = root.querySelector("[data-demo-slots]");
    var summaryEl = root.querySelector("[data-demo-summary]");
    var successList = root.querySelector("[data-demo-success-list]");
    var detailsForm = root.querySelector("[data-demo-details]");
    var nameInput = root.querySelector("[data-demo-name]");
    var phoneInput = root.querySelector("[data-demo-phone]");
    var detailsError = root.querySelector("[data-demo-details-error]");
    var toDetailsBtn = root.querySelector("[data-demo-to-details]");
    var resetBtn = root.querySelector("[data-demo-reset]");
    var backBtn = root.querySelector("[data-demo-back]");
    var hero = root.querySelector("[data-demo-hero]");
    var heroImg = root.querySelector("[data-demo-hero-img]");
    var heroTitle = root.querySelector("[data-demo-hero-title]");
    var heroMeta = root.querySelector("[data-demo-hero-meta]");
    var stepBtns = root.querySelectorAll("[data-demo-step]");
    var panels = root.querySelectorAll("[data-demo-panel]");
    var hints = document.querySelectorAll("[data-demo-hint]");

    var services = [
      {
        id: "haircut",
        name: "תספורת גברים",
        duration: 30,
        price: 80,
        color: "#f8e4d4",
        image: "assets/demo/service-men.svg",
      },
      {
        id: "color",
        name: "תספורת נשים",
        duration: 45,
        price: 200,
        color: "#efe0f8",
        image: "assets/demo/service-women.svg",
      },
      {
        id: "beard",
        name: "עיצוב זקן",
        duration: 20,
        price: 50,
        color: "#dceef8",
        image: "assets/demo/service-beard.svg",
      },
    ];

    var staff = [
      { id: "any", name: "כל מי שפנוי", subtitle: "הפנוי הראשון במועד שבחרתם", image: null },
      { id: "daniel", name: "דניאל", subtitle: "ספר ראשי", image: "assets/demo/staff-daniel.svg" },
      { id: "yael", name: "יעל", subtitle: "מעצב/ת שיער", image: "assets/demo/staff-yael.svg" },
      { id: "omi", name: "עומרי", subtitle: "ברבר", image: "assets/demo/staff-omi.svg" },
    ];

    var slotsByDay = {
      0: ["10:00", "10:30", "11:30", "14:00"],
      1: ["09:30", "11:00", "12:30", "16:00"],
      2: ["10:30", "13:00", "15:30"],
      3: ["09:00", "10:00", "12:00", "16:00"],
      4: ["09:00", "10:00", "11:30", "17:00"],
      5: ["09:00", "11:00", "12:00"],
      6: [],
    };

    var weekdays = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
    var monthNames = [
      "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
      "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
    ];

    var state = {
      step: 1,
      serviceId: null,
      providerId: null,
      dayIndex: null,
      slot: null,
      name: "",
      phone: "",
      days: [],
    };

    function buildDays() {
      var out = [];
      var now = new Date();
      for (var i = 0; i < 7; i++) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        var dow = d.getDay();
        var slots = slotsByDay[dow] || [];
        out.push({
          index: i,
          weekday: weekdays[dow],
          dayNum: d.getDate(),
          label: weekdays[dow] + ", " + d.getDate() + " ב" + monthNames[d.getMonth()],
          unavailable: slots.length === 0,
          slots: slots,
        });
      }
      state.days = out;
    }

    function selectedService() {
      return services.find(function (s) {
        return s.id === state.serviceId;
      }) || null;
    }

    function selectedStaff() {
      return staff.find(function (s) {
        return s.id === state.providerId;
      }) || null;
    }

    function selectedDay() {
      if (state.dayIndex === null) return null;
      return state.days[state.dayIndex] || null;
    }

    function canReach(step) {
      if (step <= 1) return true;
      if (step === 2) return !!state.serviceId;
      if (step === 3) return !!state.serviceId && !!state.providerId;
      if (step === 4) {
        return !!state.serviceId && !!state.providerId && state.dayIndex !== null && !!state.slot;
      }
      if (step === 5) {
        return (
          !!state.serviceId &&
          !!state.providerId &&
          state.dayIndex !== null &&
          !!state.slot &&
          !!state.name.trim() &&
          isValidPhone(state.phone)
        );
      }
      return false;
    }

    function isValidPhone(value) {
      var digits = String(value || "").replace(/\D/g, "");
      if (digits.indexOf("972") === 0) digits = "0" + digits.slice(3);
      return /^0(5\d{8}|[2-489]\d{7})$/.test(digits);
    }

    function updateHero() {
      if (!hero) return;
      var service = selectedService();
      var person = selectedStaff();
      if (state.step <= 1 || !service) {
        hero.hidden = true;
        return;
      }
      hero.hidden = false;
      var image =
        state.step >= 3 && person && person.image
          ? person.image
          : service.image;
      if (heroImg) {
        heroImg.src = image || service.image;
        heroImg.alt = "";
      }
      if (heroTitle) {
        heroTitle.textContent =
          state.step >= 3 && person
            ? person.name
            : service.name;
      }
      if (heroMeta) {
        var parts = [];
        if (state.step >= 3 && person) parts.push(service.name);
        parts.push(service.duration + " דק׳");
        parts.push("₪" + service.price);
        heroMeta.textContent = parts.join(" · ");
      }
    }

    function setStep(step) {
      state.step = step;
      stepBtns.forEach(function (btn) {
        var n = parseInt(btn.getAttribute("data-demo-step"), 10);
        var active = n === step;
        var done = n < step;
        btn.classList.toggle("is-active", active);
        btn.classList.toggle("is-done", done);
        btn.setAttribute("aria-selected", active ? "true" : "false");
        var num = btn.querySelector(".app-demo-step-num");
        if (num) num.textContent = done ? "✓" : String(n);
      });
      panels.forEach(function (panel) {
        var n = parseInt(panel.getAttribute("data-demo-panel"), 10);
        var show = n === step;
        panel.classList.toggle("is-active", show);
        panel.hidden = !show;
      });
      hints.forEach(function (li) {
        li.classList.toggle("is-active", li.getAttribute("data-demo-hint") === String(step));
      });
      if (backBtn) backBtn.hidden = step <= 1 || step >= 5;
      updateHero();
      updateDetailsBtn();
    }

    function goBack() {
      if (state.step <= 1) return;
      setStep(state.step - 1);
    }

    function renderServices() {
      if (!servicesHost) return;
      servicesHost.innerHTML = "";
      services.forEach(function (service) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "app-demo-service" + (state.serviceId === service.id ? " is-selected" : "");
        btn.innerHTML =
          '<img class="app-demo-service-img" src="' +
          service.image +
          '" alt="" width="64" height="64">' +
          '<span class="app-demo-service-body"><strong>' +
          service.name +
          '</strong><span dir="ltr" class="ltr-nums">' +
          service.duration +
          ' דק׳</span></span><span class="app-demo-service-price ltr-nums" dir="ltr">₪' +
          service.price +
          "</span>";
        btn.addEventListener("click", function () {
          state.serviceId = service.id;
          state.providerId = null;
          state.dayIndex = null;
          state.slot = null;
          renderServices();
          renderStaff();
          renderDays();
          renderSlots();
          window.setTimeout(function () {
            setStep(2);
          }, 180);
        });
        servicesHost.appendChild(btn);
      });
    }

    function renderStaff() {
      if (!staffHost) return;
      staffHost.innerHTML = "";
      staff.forEach(function (person) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "app-demo-staff-card" + (state.providerId === person.id ? " is-selected" : "");
        var avatar = person.image
          ? '<img class="app-demo-staff-img" src="' + person.image + '" alt="" width="56" height="56">'
          : '<span class="app-demo-staff-any" aria-hidden="true">★</span>';
        btn.innerHTML =
          avatar +
          '<span class="app-demo-staff-body"><strong>' +
          person.name +
          "</strong><span>" +
          person.subtitle +
          "</span></span>";
        btn.addEventListener("click", function () {
          state.providerId = person.id;
          state.dayIndex = null;
          state.slot = null;
          renderStaff();
          renderDays();
          renderSlots();
          window.setTimeout(function () {
            setStep(3);
          }, 180);
        });
        staffHost.appendChild(btn);
      });
    }

    function renderDays() {
      if (!daysHost) return;
      daysHost.innerHTML = "";
      state.days.forEach(function (day) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "app-demo-day";
        if (day.unavailable) btn.classList.add("is-unavailable");
        if (state.dayIndex === day.index) btn.classList.add("is-selected");
        btn.disabled = day.unavailable;
        btn.innerHTML =
          '<span class="app-demo-day-week">' +
          day.weekday +
          '</span><span class="app-demo-day-num ltr-nums">' +
          day.dayNum +
          "</span>";
        btn.addEventListener("click", function () {
          if (day.unavailable) return;
          state.dayIndex = day.index;
          state.slot = null;
          renderDays();
          renderSlots();
          updateDetailsBtn();
        });
        daysHost.appendChild(btn);
      });

      if (state.dayIndex === null && state.step === 3) {
        var firstOpen = state.days.find(function (d) {
          return !d.unavailable;
        });
        if (firstOpen) {
          state.dayIndex = firstOpen.index;
          renderDays();
          renderSlots();
        }
      }
    }

    function renderSlots() {
      if (!slotsHost) return;
      slotsHost.innerHTML = "";
      var day = selectedDay();
      if (!day) return;
      day.slots.forEach(function (time) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "app-demo-slot ltr-nums";
        btn.dir = "ltr";
        btn.textContent = time;
        if (state.slot === time) btn.classList.add("is-selected");
        btn.addEventListener("click", function () {
          state.slot = time;
          renderSlots();
          updateDetailsBtn();
        });
        slotsHost.appendChild(btn);
      });
    }

    function updateDetailsBtn() {
      if (!toDetailsBtn) return;
      toDetailsBtn.disabled = !(
        state.serviceId &&
        state.providerId &&
        state.dayIndex !== null &&
        state.slot
      );
    }

    function updateSummary() {
      var service = selectedService();
      var person = selectedStaff();
      var day = selectedDay();
      if (!service || !person || !day || !state.slot) return;
      if (summaryEl) {
        summaryEl.textContent = service.name + " · " + day.label + " · " + state.slot;
      }
      if (successList) {
        successList.innerHTML =
          "<li><span>שירות</span><strong>" +
          service.name +
          "</strong></li>" +
          "<li><span>איש צוות</span><strong>" +
          person.name +
          "</strong></li>" +
          "<li><span>מועד</span><strong>" +
          day.label +
          " · " +
          state.slot +
          "</strong></li>" +
          "<li><span>לקוח/ה</span><strong>" +
          state.name.trim() +
          "</strong></li>" +
          '<li><span>מחיר</span><strong dir="ltr" class="ltr-nums">₪' +
          service.price +
          "</strong></li>";
      }
    }

    function resetDemo() {
      state.serviceId = null;
      state.providerId = null;
      state.dayIndex = null;
      state.slot = null;
      state.name = "";
      state.phone = "";
      if (nameInput) nameInput.value = "";
      if (phoneInput) phoneInput.value = "";
      if (detailsError) {
        detailsError.hidden = true;
        detailsError.textContent = "";
      }
      renderServices();
      renderStaff();
      renderDays();
      renderSlots();
      updateDetailsBtn();
      setStep(1);
    }

    if (toDetailsBtn) {
      toDetailsBtn.addEventListener("click", function () {
        if (toDetailsBtn.disabled) return;
        setStep(4);
      });
    }

    if (detailsForm) {
      detailsForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = nameInput ? nameInput.value.trim() : "";
        var phone = phoneInput ? phoneInput.value.trim() : "";
        if (!name || name.length < 2) {
          if (detailsError) {
            detailsError.hidden = false;
            detailsError.textContent = "נא להזין שם מלא";
          }
          return;
        }
        if (!isValidPhone(phone)) {
          if (detailsError) {
            detailsError.hidden = false;
            detailsError.textContent = "מספר טלפון לא תקין (לדוגמה 0541234567)";
          }
          return;
        }
        if (detailsError) {
          detailsError.hidden = true;
          detailsError.textContent = "";
        }
        state.name = name;
        state.phone = phone;
        updateSummary();
        setStep(5);
      });
    }

    if (resetBtn) resetBtn.addEventListener("click", resetDemo);
    if (backBtn) backBtn.addEventListener("click", goBack);

    stepBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = parseInt(btn.getAttribute("data-demo-step"), 10);
        if (target > state.step && !canReach(target)) return;
        if (target < state.step || canReach(target)) {
          if (target === 5) updateSummary();
          setStep(target);
        }
      });
    });

    buildDays();
    renderServices();
    renderStaff();
    renderDays();
    renderSlots();
    updateDetailsBtn();
    setStep(1);

    function revealDemo() {
      root.classList.add("is-inview");
    }

    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      revealDemo();
    } else if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          if (!entries[0].isIntersecting) return;
          revealDemo();
          revealObserver.disconnect();
        },
        { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
      );
      revealObserver.observe(root);
    } else {
      revealDemo();
    }
  }

  function initHeroCalendar() {
    var host = document.querySelector("[data-cal-days]");
    if (!host) return;
    var offset = 3; // July 2026 starts on Wednesday
    var daysInMonth = 31;
    var selected = 14;
    host.innerHTML = "";
    for (var i = 0; i < offset; i++) {
      var pad = document.createElement("span");
      pad.setAttribute("aria-hidden", "true");
      host.appendChild(pad);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var span = document.createElement("span");
      span.textContent = String(d);
      if (d === selected) span.className = "sel";
      host.appendChild(span);
    }
  }

  function initHowStepsReveal() {
    var list = document.querySelector(".how-steps");
    if (!list) return;

    function reveal() {
      list.classList.add("is-inview");
    }

    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      reveal();
      return;
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          if (!entries[0].isIntersecting) return;
          reveal();
          observer.disconnect();
        },
        { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
      );
      observer.observe(list);
    } else {
      reveal();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initConstants();
    initDemoGuards();
    initMenu();
    initScrollSpy();
    initFaq();
    initContactForm();
    initPlanMarketing();
    initPricingPlanScroll();
    initStickyCta();
    initHeroCalendar();
    initAppDemo();
    initHowStepsReveal();
  });
})();
