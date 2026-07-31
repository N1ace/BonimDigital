/* Booking page — depends on globals from site.js */

// Swap this one constant for `await fetch('/api/availability?from=…')` — nothing else changes.
const TAKEN = (function buildTaken() {
  const map = {};
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const patterns = [
    { alon: ["10:00", "10:30", "16:30"], daniel: ["12:00"], tomer: ["18:00", "18:30"] },
    { alon: ["09:00", "09:30", "11:00"], daniel: ["15:30", "16:00"], tomer: ["10:00"] },
    { alon: ["13:00", "13:30"], daniel: ["14:00", "19:00"], tomer: ["11:30", "12:00"] },
    { alon: ["10:00", "17:30"], daniel: ["09:30"], tomer: ["16:00", "16:30"] },
    { alon: ["09:00", "12:30", "18:30"], daniel: ["19:00", "19:30"], tomer: ["14:00"] },
    { alon: ["11:00"], daniel: ["08:00", "08:30", "09:00"], tomer: ["10:30"] },
    { alon: ["10:30", "16:00"], daniel: ["17:00"], tomer: ["12:30", "13:00"] },
    { alon: ["15:00", "15:30"], daniel: ["11:00", "11:30"], tomer: ["09:00"] },
    { alon: ["09:30", "18:00"], daniel: ["13:00"], tomer: ["17:00", "17:30"] },
    { alon: ["12:00", "12:30", "19:00"], daniel: ["10:00"], tomer: ["16:30"] },
    { alon: ["08:30"], daniel: ["14:30", "15:00"], tomer: ["11:00", "18:00"] },
    { alon: ["16:00", "16:30"], daniel: ["09:00", "12:00"], tomer: ["13:30"] },
    { alon: ["10:00", "14:00"], daniel: ["17:30"], tomer: ["09:30", "15:00"] },
    { alon: ["11:30", "18:30"], daniel: ["10:30", "16:00"], tomer: ["12:00"] }
  ]; // DEMO: fake availability
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    map[toISODate(d)] = patterns[i % patterns.length];
  }
  return map;
})();

function getTaken(dateISO, barberId) {
  const day = TAKEN[dateISO] || {};
  if (barberId && barberId !== "any") return day[barberId] || [];
  // "any": only times where every working barber that day is booked
  const weekday = new Date(dateISO + "T12:00:00").getDay();
  const working = BARBERS.filter((b) => b.id !== "any" && b.days.includes(weekday));
  if (!working.length) return [];
  const sets = working.map((b) => new Set(day[b.id] || []));
  const allTimes = new Set();
  sets.forEach((s) => s.forEach((t) => allTimes.add(t)));
  return [...allTimes].filter((t) => sets.every((s) => s.has(t)));
}

function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function isSlotTaken(dateISO, barberId, startMin, duration) {
  const booked = getTaken(dateISO, barberId);
  const end = startMin + duration;
  return booked.some((t) => {
    const bs = parseTime(t);
    // Treat each taken start as occupying 30 min unless we know better — demo seam
    const be = bs + 30;
    return intervalsOverlap(startMin, end, bs, be);
  });
}

(function initBooking() {
  const bookForm = document.getElementById("bookForm");
  if (!bookForm) return;

  const dayChips = document.getElementById("dayChips");
  const slotGrid = document.getElementById("slotGrid");
  const emptySlots = document.getElementById("emptySlots");
  const slotHint = document.getElementById("slotHint");
  const serviceChips = document.getElementById("serviceChips");
  const barberChips = document.getElementById("barberChips");
  const stickyBar = document.getElementById("stickyBook");
  const stickyText = document.getElementById("stickyText");
  const stickyPrice = document.getElementById("stickyPrice");
  const stickyBtn = document.getElementById("stickySubmit");
  let selectedTime = null;
  let openDays = [];
  let returningChip = null;

  /* ---- render chips from data ---- */
  serviceChips.innerHTML = SERVICES.map((s, i) => {
    const short =
      s.id === "shave" ? "גילוח תער" :
      s.id === "kids" ? "ילדים" :
      s.id === "styling" ? "סטיילינג" : s.name;
    return `<label><input type="radio" name="service" value="${s.id}" ${i === 0 ? "checked" : ""}>
      <span class="chip">${short} <small><bdi>₪${s.price}</bdi></small></span></label>`;
  }).join("");

  // DEMO: barber names
  barberChips.innerHTML = BARBERS.map((b, i) =>
    `<label><input type="radio" name="barber" value="${b.id}" ${i === 0 ? "checked" : ""}>
      <span class="chip">${b.name}</span></label>`
  ).join("");

  function selectedService() {
    return serviceById(bookForm.elements.service.value) || SERVICES[0];
  }
  function selectedBarber() {
    return barberById(bookForm.elements.barber.value) || BARBERS[0];
  }

  function buildOpenDays() {
    openDays = [];
    let offset = 0;
    while (openDays.length < 6 && offset < 21) {
      const dt = new Date();
      dt.setHours(12, 0, 0, 0);
      dt.setDate(dt.getDate() + offset);
      const iso = toISODate(dt);
      const hours = HOURS[dt.getDay()];
      if (hours && !CLOSED_DATES.includes(iso)) {
        openDays.push({ offset, date: dt, iso });
      }
      offset++;
    }
    dayChips.innerHTML = openDays.map((d, i) => {
      const label = d.offset === 0 ? "היום" : d.offset === 1 ? "מחר" : `יום ${DAY_NAMES[d.date.getDay()]}`;
      const dateStr = `${d.date.getDate()}.${d.date.getMonth() + 1}`;
      return `<label><input type="radio" name="day" value="${d.iso}" ${i === 0 ? "checked" : ""}>
        <span class="chip">${label} <small><bdi>${dateStr}</bdi></small></span></label>`;
    }).join("");
  }

  function clearSelectedTime() {
    selectedTime = null;
    updateSticky();
  }

  function nextWorkingDayFor(barber, afterISO) {
    const start = new Date(afterISO + "T12:00:00");
    for (let i = 1; i <= 21; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = toISODate(d);
      if (HOURS[d.getDay()] && !CLOSED_DATES.includes(iso) && barber.days.includes(d.getDay())) {
        return { date: d, iso, offset: Math.round((d - new Date(new Date().setHours(12, 0, 0, 0))) / 86400000) };
      }
    }
    return null;
  }

  function renderSlots() {
    const svc = selectedService();
    const barber = selectedBarber();
    const iso = bookForm.elements.day.value;
    const day = openDays.find((d) => d.iso === iso);
    if (!day) return;

    const h = HOURS[day.date.getDay()];
    const weekday = day.date.getDay();
    clearSelectedTime();

    // Barber off that day
    if (!barber.days.includes(weekday)) {
      slotGrid.innerHTML = "";
      slotGrid.hidden = true;
      if (slotHint) { slotHint.hidden = true; slotHint.textContent = ""; }
      const next = nextWorkingDayFor(barber, iso);
      const nextLabel = next
        ? (next.iso === toISODate(new Date()) ? "היום" :
          (() => {
            const t = new Date(); t.setHours(12, 0, 0, 0);
            const diff = Math.round((next.date - t) / 86400000);
            return diff === 1 ? "מחר" : `יום ${DAY_NAMES[next.date.getDay()]}`;
          })())
        : null;
      emptySlots.hidden = false;
      emptySlots.innerHTML = `
        <p><strong>${barber.name}</strong> לא עובד בימי ${DAY_NAMES[weekday]}.
        ${next ? `אפשר לקבוע לו ליום ${DAY_NAMES[next.date.getDay()]}, או לתפוס את הפנוי הראשון היום.` : "אפשר לתפוס את הפנוי הראשון."}</p>
        <div class="empty-actions">
          ${next ? `<button type="button" class="btn btn-primary" id="switchDayBtn">לקבוע ל${barber.name} — ${nextLabel}</button>` : ""}
          <button type="button" class="btn btn-ghost" id="switchAnyBtn">הפנוי הראשון</button>
        </div>`;
      document.getElementById("switchDayBtn")?.addEventListener("click", () => {
        const radio = bookForm.querySelector(`input[name="day"][value="${next.iso}"]`);
        if (radio) {
          radio.checked = true;
        } else {
          // ensure day exists in chips
          buildOpenDays();
          // rebuild may not include far day — force-select by appending if needed
          let r = bookForm.querySelector(`input[name="day"][value="${next.iso}"]`);
          if (!r) {
            openDays.push(next);
            dayChips.insertAdjacentHTML("beforeend",
              `<label><input type="radio" name="day" value="${next.iso}">
                <span class="chip">יום ${DAY_NAMES[next.date.getDay()]} <small><bdi>${next.date.getDate()}.${next.date.getMonth() + 1}</bdi></small></span></label>`);
            r = bookForm.querySelector(`input[name="day"][value="${next.iso}"]`);
          }
          if (r) r.checked = true;
        }
        renderSlots();
      });
      document.getElementById("switchAnyBtn")?.addEventListener("click", () => {
        const r = bookForm.querySelector('input[name="barber"][value="any"]');
        if (r) r.checked = true;
        renderSlots();
      });
      updateSticky();
      return;
    }

    const now = new Date();
    const todayISO = toISODate(now);
    const isToday = iso === todayISO;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const step = svc.minutes;
    const groups = { morning: [], noon: [], evening: [] };
    let freeCount = 0;

    for (let m = h[0]; m + step <= h[1]; m += step) {
      const t = `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
      const isPast = isToday && m <= nowMins;
      const isTaken = isSlotTaken(iso, barber.id, m, step);
      const off = isPast || isTaken;
      if (!off) freeCount++;
      const item = { t, m, off, isTaken };
      if (m < 12 * 60) groups.morning.push(item);
      else if (m < 16 * 60) groups.noon.push(item);
      else groups.evening.push(item);
    }

    if (freeCount === 0) {
      slotGrid.innerHTML = "";
      slotGrid.hidden = true;
      if (slotHint) { slotHint.hidden = true; slotHint.textContent = ""; }
      emptySlots.hidden = false;
      const idx = openDays.findIndex((d) => d.iso === iso);
      const next = openDays[idx + 1] || openDays[0];
      const nh = HOURS[next.date.getDay()];
      const nextLabel = next.offset === 1 || (next.iso !== iso && (() => {
        const t = new Date(); t.setHours(12, 0, 0, 0);
        return Math.round((next.date - t) / 86400000) === 1;
      })()) ? "מחר" : `ביום ${DAY_NAMES[next.date.getDay()]}`;
      emptySlots.innerHTML = `
        <p>היום הזה כבר מלא — קורה, אנחנו פופולריים.
        הפתיחה הקרובה: <strong>${nextLabel} ב־<bdi>${fmtTime(nh[0])}</bdi></strong>.</p>
        <p>רוצה שנדחוף אותך אם מתפנה משהו?</p>
        <form id="waitlistForm" class="waitlist" novalidate>
          <div class="field">
            <label for="waitPhone">נייד</label>
            <input type="tel" id="waitPhone" name="waitPhone" autocomplete="tel" inputmode="tel" placeholder="050-1234567" dir="ltr">
          </div>
          <button type="submit" class="btn btn-primary">עדכנו אותי אם מתפנה</button>
        </form>
        <div class="empty-actions">
          <a class="btn btn-ghost" href="${waLink("היי, אין מקום ביום שרציתי — תעדכנו אם מתפנה תור?")}">וואטסאפ למקרה שמתפנה</a>
        </div>`;
      document.getElementById("waitlistForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const phone = document.getElementById("waitPhone").value.trim();
        if (!validILMobile(phone)) {
          document.getElementById("waitPhone").focus();
          return;
        }
        // Backend seam: POST /api/waitlist
        emptySlots.querySelector(".waitlist").outerHTML =
          `<p class="waitlist-ok" role="status">רשמנו אותך. אם מתפנה תור ביום הזה — אתה הראשון שיודע.</p>`;
      });
      updateSticky();
      return;
    }

    emptySlots.hidden = true;
    emptySlots.innerHTML = "";
    slotGrid.hidden = false;

    if (slotHint) {
      slotHint.hidden = false;
      if (freeCount <= 2) {
        slotHint.innerHTML = `נשאר <bdi>${freeCount}</bdi> תור פנוי ביום הזה. מומלץ לסגור עכשיו.`;
      } else {
        slotHint.innerHTML = `נשארו <bdi>${freeCount}</bdi> תורים פנויים ביום הזה`;
      }
    }

    const labels = [
      ["morning", "בוקר"],
      ["noon", "צהריים"],
      ["evening", "ערב"]
    ];
    slotGrid.innerHTML = labels.map(([key, title]) => {
      const items = groups[key].filter(Boolean);
      if (!items.length) return "";
      const buttons = items.map(({ t, off, isTaken }) =>
        `<button type="button" class="slot" data-t="${t}" aria-pressed="false"
          ${off ? "disabled" : ""} ${isTaken ? 'title="תפוס"' : ""}><bdi>${t}</bdi></button>`
      ).join("");
      return `<div class="slot-group"><h4>${title}</h4><div class="slots">${buttons}</div></div>`;
    }).join("");
    updateSticky();
  }

  slotGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".slot");
    if (!btn || btn.disabled) return;
    slotGrid.querySelectorAll(".slot").forEach((s) => s.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    selectedTime = btn.dataset.t;
    updateSticky();
  });

  function dayLabelForISO(iso) {
    const day = openDays.find((d) => d.iso === iso);
    if (!day) return iso;
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    const diff = Math.round((day.date - t) / 86400000);
    if (diff === 0) return "היום";
    if (diff === 1) return "מחר";
    return `יום ${DAY_NAMES[day.date.getDay()]}`;
  }

  function clearBookingAlerts() {
    bookForm.querySelectorAll(".needs-fix").forEach((el) => el.classList.remove("needs-fix"));
  }

  function collectMissing() {
    const missing = [];
    const name = bookForm.elements.name.value.trim();
    const phone = bookForm.elements.phone.value.trim();

    if (!bookForm.elements.service?.value) {
      missing.push({
        step: bookForm.querySelector('[data-step="service"]'),
        msg: "לבחור שירות (שלב 1)"
      });
    }
    if (!bookForm.elements.barber?.value) {
      missing.push({
        step: bookForm.querySelector('[data-step="barber"]'),
        msg: "לבחור ספר (שלב 2)"
      });
    }
    if (!bookForm.elements.day?.value) {
      missing.push({
        step: bookForm.querySelector('[data-step="day"]'),
        msg: "לבחור יום (שלב 3)"
      });
    }
    if (!selectedTime) {
      missing.push({
        step: bookForm.querySelector('[data-step="time"]'),
        msg: "לבחור שעה מהרשימה (שלב 4)"
      });
    }

    const detailsStep = bookForm.querySelector('[data-step="details"]');
    if (!name) {
      missing.push({
        step: detailsStep,
        field: bookForm.elements.name.closest(".field"),
        focus: bookForm.elements.name,
        msg: "למלא שם — שנדע למי לקרוא כשהכיסא מתפנה"
      });
    }
    if (!phone) {
      missing.push({
        step: detailsStep,
        field: bookForm.elements.phone.closest(".field"),
        focus: bookForm.elements.phone,
        msg: "למלא מספר נייד"
      });
    } else if (!validILMobile(phone)) {
      missing.push({
        step: detailsStep,
        field: bookForm.elements.phone.closest(".field"),
        focus: bookForm.elements.phone,
        msg: "לתקן את הנייד — צריך מספר ישראלי בפורמט <bdi>05X-XXXXXXX</bdi>"
      });
    }
    if (!bookForm.elements.consent.checked) {
      missing.push({
        step: detailsStep,
        field: bookForm.elements.consent.closest(".consent"),
        focus: bookForm.elements.consent,
        msg: "לאשר קבלת תזכורת (בלי זה אין לנו איך לשלוח אישור תור)"
      });
    }
    return missing;
  }

  function showMissing(missing) {
    clearBookingAlerts();
    const msg = document.getElementById("bookMsg");
    missing.forEach((item) => {
      item.step?.classList.add("needs-fix");
      item.field?.classList.add("needs-fix");
    });
    msg.className = "form-msg err";
    msg.innerHTML = `עוד לא סגרנו. חסר לנו:<ul>${missing.map((p) => `<li>${p.msg}</li>`).join("")}</ul>`;

    const first = missing[0];
    const scrollTarget = first.step?.querySelector(".lbl") || first.step || first.field;
    scrollTarget?.scrollIntoView({ block: "center", behavior: "smooth" });
    setTimeout(() => {
      if (first.focus && typeof first.focus.focus === "function") first.focus.focus({ preventScroll: true });
    }, 350);
  }

  function updateSticky() {
    if (!stickyBar) return;
    const svc = selectedService();
    const barber = selectedBarber();
    const iso = bookForm.elements.day?.value;
    const parts = [];
    if (svc) parts.push(svc.name);
    if (barber) parts.push(`אצל ${barber.name}`);
    if (iso && selectedTime) parts.push(`${dayLabelForISO(iso)} <bdi>${selectedTime}</bdi>`);
    else if (iso) parts.push(dayLabelForISO(iso));

    stickyText.innerHTML = parts.length ? parts.join(" · ") : "השלם את הפרטים כדי לסגור";
    stickyPrice.innerHTML = svc ? `<bdi>₪${svc.price}</bdi>` : "";

    const complete = collectMissing().length === 0;
    stickyBtn.disabled = false;
    stickyBtn.classList.toggle("is-muted", !complete);
    stickyBtn.textContent = "סוגרים את התור";
    stickyBtn.setAttribute("aria-disabled", complete ? "false" : "true");
  }

  function reRenderAll() {
    renderSlots();
  }

  bookForm.addEventListener("change", (e) => {
    if (["service", "barber", "day"].includes(e.target.name)) reRenderAll();
    else updateSticky();
    if (bookForm.querySelector(".needs-fix")) {
      const still = collectMissing();
      const msg = document.getElementById("bookMsg");
      if (!still.length) {
        clearBookingAlerts();
        if (msg.classList.contains("err")) {
          msg.className = "form-msg";
          msg.textContent = "";
        }
      } else {
        clearBookingAlerts();
        still.forEach((item) => {
          item.step?.classList.add("needs-fix");
          item.field?.classList.add("needs-fix");
        });
        msg.className = "form-msg err";
        msg.innerHTML = `עוד לא סגרנו. חסר לנו:<ul>${still.map((p) => `<li>${p.msg}</li>`).join("")}</ul>`;
      }
    }
  });
  bookForm.addEventListener("input", () => {
    updateSticky();
    if (bookForm.querySelector(".needs-fix")) {
      const still = collectMissing();
      const msg = document.getElementById("bookMsg");
      if (!still.length) {
        clearBookingAlerts();
        if (msg.classList.contains("err")) {
          msg.className = "form-msg";
          msg.textContent = "";
        }
      } else {
        clearBookingAlerts();
        still.forEach((item) => {
          item.step?.classList.add("needs-fix");
          item.field?.classList.add("needs-fix");
        });
        msg.className = "form-msg err";
        msg.innerHTML = `עוד לא סגרנו. חסר לנו:<ul>${still.map((p) => `<li>${p.msg}</li>`).join("")}</ul>`;
      }
    }
  });

  /* ---- returning customer ---- */
  function loadCustomer() {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !data.name) return;
      bookForm.elements.name.value = data.name || "";
      bookForm.elements.phone.value = data.phone || "";
      if (data.service && serviceById(data.service)) {
        const r = bookForm.querySelector(`input[name="service"][value="${data.service}"]`);
        if (r) r.checked = true;
      }
      if (data.barber && barberById(data.barber)) {
        const r = bookForm.querySelector(`input[name="barber"][value="${data.barber}"]`);
        if (r) r.checked = true;
      }
      if (data.consent) bookForm.elements.consent.checked = true;

      returningChip = document.createElement("div");
      returningChip.className = "returning";
      returningChip.id = "returningChip";
      returningChip.innerHTML = `שלום <strong>${data.name}</strong>, מילאנו את הפרטים שלך —
        <button type="button" class="linkish" id="notMeBtn">לא אני</button>`;
      bookForm.parentNode.insertBefore(returningChip, bookForm);
      document.getElementById("notMeBtn")?.addEventListener("click", () => {
        localStorage.removeItem(CUSTOMER_KEY);
        returningChip.remove();
        returningChip = null;
        bookForm.reset();
        buildOpenDays();
        const s0 = bookForm.querySelector('input[name="service"]');
        const b0 = bookForm.querySelector('input[name="barber"]');
        if (s0) s0.checked = true;
        if (b0) b0.checked = true;
        const d0 = bookForm.querySelector('input[name="day"]');
        if (d0) d0.checked = true;
        renderSlots();
      });
    } catch (_) { /* ignore corrupt storage */ }
  }

  function saveCustomer(name, phone, barberId, serviceId) {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify({
      name, phone, barber: barberId, service: serviceId, consent: true
    }));
  }

  /* ---- calendar helpers ---- */
  function buildICS({ summary, location, start, endMinutes }) {
    const fmt = (d) =>
      `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
    const stamp = fmt(new Date());
    const uid = `${Date.now()}@hasdera`;
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hasdera//Booking//HE",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(new Date(start.getTime() + endMinutes * 60000))}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      "DESCRIPTION:תזכורת לתור",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
  }

  function googleCalURL({ title, location, start, endMinutes }) {
    const fmt = (d) =>
      `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
    const end = new Date(start.getTime() + endMinutes * 60000);
    const dates = `${fmt(start)}/${fmt(end)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
  }

  /* ---- submit ---- */
  bookForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // Honeypot
    if (bookForm.elements.website && bookForm.elements.website.value) {
      return; // silently succeed
    }

    const msg = document.getElementById("bookMsg");
    const missing = collectMissing();
    if (missing.length) {
      showMissing(missing);
      return;
    }

    clearBookingAlerts();
    msg.className = "form-msg";
    msg.textContent = "";

    const name = bookForm.elements.name.value.trim();
    const phone = bookForm.elements.phone.value.trim();
    const svc = selectedService();
    const barber = selectedBarber();
    const iso = bookForm.elements.day.value;

    const day = openDays.find((d) => d.iso === iso);
    const dayLabel = dayLabelForISO(iso);
    const start = new Date(day.date);
    const [hh, mm] = selectedTime.split(":").map(Number);
    start.setHours(hh, mm, 0, 0);
    const summary = `${svc.name} אצל ${barber.name} · ${SHOP_NAME}`;
    const ics = buildICS({ summary, location: SHOP_ADDRESS, start, endMinutes: svc.minutes });
    const icsURL = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const gURL = googleCalURL({ title: summary, location: SHOP_ADDRESS, start, endMinutes: svc.minutes });

    // Backend seam: POST {service, barber, dateISO, time, name, phone, notes}
    saveCustomer(name, phone, barber.id, svc.id);

    const wrap = document.getElementById("bookSubmitWrap");
    wrap.innerHTML = `
      <div class="booked-summary" role="status" tabindex="-1" id="bookedSummary">
        <h3>סגור. מחכים לך, ${name}.</h3>
        <p style="margin:0;">
          <strong>${svc.name}</strong> אצל <strong>${barber.name}</strong>,
          <strong>${dayLabel}</strong> בשעה <strong><bdi>${selectedTime}</bdi></strong>.<br>
          אישור בוואטסאפ בדרך אליך ל־<bdi class="phone-ltr">${phone}</bdi>. צריך לשנות? פשוט תענה להודעה.
        </p>
        <div class="cal-links">
          <a class="btn btn-ghost" href="${icsURL}" download="hasdera-booking.ics">הוספה ליומן</a>
          <a class="btn btn-ghost" href="${gURL}" target="_blank" rel="noopener">יומן גוגל</a>
        </div>
      </div>`;

    if (stickyBar) stickyBar.hidden = true;
    document.body.classList.add("booking-done");
    const summaryEl = document.getElementById("bookedSummary");
    summaryEl?.focus();
    summaryEl?.scrollIntoView({ block: "center", behavior: "smooth" });
  });

  stickyBtn?.addEventListener("click", () => {
    const missing = collectMissing();
    if (missing.length) {
      showMissing(missing);
      return;
    }
    bookForm.requestSubmit();
  });

  /* ---- deep links ?service= & ?barber= (Hebrew name or id) ---- */
  (function applyQuery() {
    const q = new URLSearchParams(location.search);
    const svcQ = q.get("service");
    const barberQ = q.get("barber");
    if (svcQ) {
      const svc = serviceById(svcQ) || serviceByName(svcQ) || serviceByName(decodeURIComponent(svcQ));
      if (svc) {
        const r = bookForm.querySelector(`input[name="service"][value="${svc.id}"]`);
        if (r) r.checked = true;
      }
    }
    if (barberQ) {
      const b = barberById(barberQ) || barberByName(barberQ) || barberByName(decodeURIComponent(barberQ));
      if (b) {
        const r = bookForm.querySelector(`input[name="barber"][value="${b.id}"]`);
        if (r) r.checked = true;
      }
    }
  })();

  buildOpenDays();
  loadCustomer();
  renderSlots();
})();
