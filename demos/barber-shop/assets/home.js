/* Landing page extras — depends on globals from site.js */

/* ============ hero: old video on mobile, new on desktop ============ */
(function () {
  const mobile = document.querySelector(".hero .bg-mobile");
  const desktop = document.querySelector(".hero .bg-desktop");
  if (!mobile || !desktop) return;
  const mq = matchMedia("(min-width:900px)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const sync = () => {
    if (reduce.matches) {
      mobile.pause();
      desktop.pause();
      mobile.removeAttribute("src");
      desktop.removeAttribute("src");
      mobile.load();
      desktop.load();
      return;
    }
    if (mq.matches) {
      mobile.pause();
      if (mobile.getAttribute("src")) {
        mobile.removeAttribute("src");
        mobile.load();
      }
      const src = desktop.dataset.src;
      if (src && desktop.getAttribute("src") !== src) desktop.src = src;
      desktop.play().catch(() => {});
    } else {
      desktop.pause();
      if (desktop.getAttribute("src")) {
        desktop.removeAttribute("src");
        desktop.load();
      }
      const src = mobile.dataset.src;
      if (src && mobile.getAttribute("src") !== src) mobile.src = src;
      mobile.play().catch(() => {});
    }
  };
  sync();
  mq.addEventListener("change", sync);
})();

/* ============ live open/closed chip ============ */
(function () {
  const chip = document.getElementById("openChip");
  const txt = document.getElementById("openChipText");
  if (!chip || !txt) return;
  const now = new Date();
  const d = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = HOURS[d];
  if (today && mins >= today[0] && mins < today[1]) {
    txt.innerHTML = `פתוח עכשיו · עד <bdi>${fmtTime(today[1])}</bdi>`;
  } else {
    chip.classList.add("closed");
    for (let i = today && mins < today[0] ? 0 : 1; i <= 7; i++) {
      const nd = (d + i) % 7;
      const h = HOURS[nd];
      if (h) {
        const when = i === 0 ? "היום" : i === 1 ? "מחר" : `ביום ${DAY_NAMES[nd]}`;
        txt.innerHTML = `סגור · נפתח ${when} ב־<bdi>${fmtTime(h[0])}</bdi>`;
        break;
      }
    }
  }
})();

/* ============ today's row in the hours table ============ */
document.querySelector(`#hoursTable tr[data-day="${new Date().getDay()}"]`)?.classList.add("today");

/* ============ contact form ============ */
document.getElementById("contactForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  if (this.elements.website && this.elements.website.value) return;
  const msg = document.getElementById("contactMsg");
  const name = (document.getElementById("cName")?.value || "").trim();
  const phone = (document.getElementById("cPhone")?.value || "").trim();
  const body = (document.getElementById("cMsg")?.value || "").trim();
  const problems = [];
  if (!name) problems.push("שם — שנדע אל מי לחזור");
  if (!phone) problems.push("נייד — שיהיה לאן לחזור");
  else if (!validILMobile(phone)) problems.push("נייד תקין בפורמט <bdi>05X-XXXXXXX</bdi>");
  if (!body) problems.push("את ההודעה עצמה — השדה הגדול נשאר ריק");
  if (problems.length) {
    msg.className = "form-msg err";
    msg.innerHTML = `ההודעה לא נשלחה עדיין. חסר לנו:<ul>${problems.map((p) => `<li>${p}</li>`).join("")}</ul>`;
    return;
  }
  msg.className = "form-msg ok";
  msg.innerHTML = `קיבלנו, ${name}! נחזור אליך היום ל־<bdi class="phone-ltr">${phone}</bdi>. דחוף? <a href="${waLink("היי, רציתי לשאול לגבי תור")}">שלח וואטסאפ</a>.`;
  this.querySelectorAll("input:not([name=website]),textarea").forEach((f) => { f.value = ""; });
});
