(function(){
  var B = window.BonimBooking; if (!B) return;
  var root = document.getElementById('bk-app'); if (!root) return;
  var cfg = B.cfg, T = B.time;

  var TEXT = {
    he: {
      eyebrow: '// קביעת פגישה', title: 'קבעו שיחה איתנו', sub: 'בחרו נושא, יום ושעה — ואנחנו ניצור קשר בדיוק בזמן שקבעתם.',
      steps: ['נושא', 'מועד', 'פרטים', 'אישור'], back: 'חזרה', backHome: 'חזרה לעמוד הראשי',
      pickService: 'על מה נדבר?', min: 'דק׳', free: 'ללא עלות',
      pickDay: 'בחרו יום ושעה', tz: 'השעות לפי שעון ישראל', pickDayHint: 'בחרו יום ביומן כדי לראות שעות פנויות',
      slotsFor: 'שעות פנויות ל{d}', noSlots: 'אין שעות פנויות ביום הזה. נסו יום אחר.', loading: 'טוען שעות…',
      loadErr: 'לא הצלחנו לטעון את היומן. נסו לרענן את העמוד.', prevMonth: 'החודש הקודם', nextMonth: 'החודש הבא',
      weekdays: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
      details: 'הפרטים שלכם', name: 'שם מלא', phone: 'טלפון', email: 'אימייל (לא חובה)', business: 'שם העסק (לא חובה)',
      meeting: 'איך נוח לכם לדבר?', meet: { phone: 'שיחת טלפון', video: 'שיחת וידאו', whatsapp: 'וואטסאפ' },
      note: 'על מה תרצו לדבר? (לא חובה)', notePh: 'למשל: יש לי מספרה ואני רוצה שלקוחות יקבעו תור לבד',
      toConfirm: 'המשך לאישור', errName: 'נא למלא שם (לפחות 2 תווים)', errPhone: 'מספר טלפון לא תקין', errEmail: 'כתובת אימייל לא תקינה',
      confirm: 'אישור הפגישה', rService: 'נושא', rWhen: 'מועד', rLength: 'משך', rMeeting: 'אופן השיחה', rName: 'שם',
      rPhone: 'טלפון', rEmail: 'אימייל', rBusiness: 'עסק', rNote: 'הערה',
      book: 'אשרו וקבעו', booking: 'קובע…', privacy: 'הפרטים שתשאירו ישמשו אותנו רק כדי לחזור אליכם ולטפל בפנייה.', privacyLink: 'מדיניות הפרטיות',
      optLegend: 'עדכונים (לא חובה)',
      optMarketing: 'אני מאשר/ת לקבל מבונים דיגיטל הודעות פרסומיות, עדכונים והצעות בוואטסאפ, ב-SMS או במייל. אפשר להסיר בכל עת.',
      optAds: 'אני מאשר/ת שבונים דיגיטל תשתמש בטלפון ובמייל שלי כדי להציג לי מודעות שלה בפייסבוק, באינסטגרם ובגוגל.',
      rOptins: 'הסכמות', optM: 'הודעות פרסומיות', optA: 'קהלי פרסום',
      taken: 'השעה הזו נתפסה הרגע. בחרו שעה אחרת.', invalid: 'השעה כבר לא זמינה. בחרו שעה אחרת.',
      failed: 'משהו השתבש. נסו שוב, או כתבו לנו בוואטסאפ.',
      done: 'הפגישה נקבעה', doneSub: 'ניצור קשר בזמן שקבעתם. אם משהו משתנה — פשוט כתבו לנו.',
      addGoogle: 'Google Calendar', addIcs: 'יומן אחר', sendWa: 'שלחו לנו בוואטסאפ',
      demoNote: 'מצב הדגמה: הבקשה נשמרה רק בדפדפן הזה. כדי שנקבל אותה, שלחו אותה בוואטסאפ.',
      another: 'קביעת פגישה נוספת', home: 'לעמוד הראשי', at: 'בשעה',
      waMsg: 'שלום בונים דיגיטל, קבעתי {s} ל{d} בשעה {t}. שם: {n}, טלפון: {p}',
      calTitle: '{s} — בונים דיגיטל', calDetails: 'פגישה עם בונים דיגיטל. לשינויים: https://wa.me/{w}'
    },
    en: {
      eyebrow: '// book a meeting', title: 'Book a call with us', sub: 'Pick a topic, a day and a time — and we will get in touch exactly when you chose.',
      steps: ['Topic', 'Time', 'Details', 'Confirm'], back: 'Back', backHome: 'Back to the home page',
      pickService: 'What should we talk about?', min: 'min', free: 'Free',
      pickDay: 'Pick a day and time', tz: 'Times are in Israel time', pickDayHint: 'Pick a day to see free times',
      slotsFor: 'Free times on {d}', noSlots: 'No free times on this day. Try another one.', loading: 'Loading times…',
      loadErr: 'We could not load the calendar. Try refreshing the page.', prevMonth: 'Previous month', nextMonth: 'Next month',
      weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      details: 'Your details', name: 'Full name', phone: 'Phone', email: 'Email (optional)', business: 'Business name (optional)',
      meeting: 'How would you like to talk?', meet: { phone: 'Phone call', video: 'Video call', whatsapp: 'WhatsApp' },
      note: 'What would you like to discuss? (optional)', notePh: 'For example: I run a barbershop and want clients to book on their own',
      toConfirm: 'Continue', errName: 'Please enter your name (at least 2 characters)', errPhone: 'That phone number does not look right', errEmail: 'That email does not look right',
      confirm: 'Confirm the meeting', rService: 'Topic', rWhen: 'When', rLength: 'Length', rMeeting: 'Meeting', rName: 'Name',
      rPhone: 'Phone', rEmail: 'Email', rBusiness: 'Business', rNote: 'Note',
      book: 'Confirm and book', booking: 'Booking…', privacy: 'We use your details only to get back to you and handle your request.', privacyLink: 'Privacy policy',
      optLegend: 'Updates (optional)',
      optMarketing: 'I agree to receive promotional messages, updates and offers from Bonim Digital on WhatsApp, SMS or email. I can unsubscribe at any time.',
      optAds: 'I agree that Bonim Digital may use my phone and email to show me its ads on Facebook, Instagram and Google.',
      rOptins: 'Consents', optM: 'Promotional messages', optA: 'Ad audiences',
      taken: 'That time was just taken. Please pick another one.', invalid: 'That time is no longer available. Please pick another one.',
      failed: 'Something went wrong. Try again, or message us on WhatsApp.',
      done: 'Your meeting is booked', doneSub: 'We will get in touch at the time you chose. If anything changes, just message us.',
      addGoogle: 'Google Calendar', addIcs: 'Other calendar', sendWa: 'Send us on WhatsApp',
      demoNote: 'Demo mode: this request was saved in this browser only. To make sure we get it, send it on WhatsApp.',
      another: 'Book another meeting', home: 'Home page', at: 'at',
      waMsg: 'Hi Bonim Digital, I booked {s} for {d} at {t}. Name: {n}, phone: {p}',
      calTitle: '{s} — Bonim Digital', calDetails: 'Meeting with Bonim Digital. To change it: https://wa.me/{w}'
    }
  };

  var ICONS = {
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    layout: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16M8 15h2v2H8z"/>',
    bag: '<path d="M6.33 8h11.34a2 2 0 0 1 1.98 2.3l-1.26 8.16A3 3 0 0 1 15.43 21H8.57a3 3 0 0 1-2.96-2.54l-1.26-8.16A2 2 0 0 1 6.33 8z"/><path d="M9 11V6a3 3 0 0 1 6 0v5"/>',
    mobile: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M11 4h2M12 17v.01"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/>',
    chevron: '<path d="M15 6l-6 6 6 6"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    plus: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16M12 14v4M10 16h4"/>',
    google: '<path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.96-4.33 2.96-7.34z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.5c-.9.61-2.05.96-3.4.96-2.6 0-4.82-1.76-5.6-4.13H3.06v2.58A10 10 0 0 0 12 22z"/><path fill="#FBBC04" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.06a10 10 0 0 0 0 8.96z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.8.5 3.84 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.52L6.4 10.1C7.18 7.74 9.4 5.98 12 5.98z"/>',
    wa: '<path fill="currentColor" d="M12 2a9.7 9.7 0 0 0-8.4 14.55L2.3 21.7l5.28-1.38A9.7 9.7 0 1 0 12 2Zm0 17.65a7.94 7.94 0 0 1-4.05-1.1l-.29-.17-3.13.82.84-3.05-.19-.31A7.94 7.94 0 1 1 12 19.65Zm4.36-5.95c-.24-.12-1.41-.7-1.63-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18a7.2 7.2 0 0 1-1.33-1.66c-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.41-.58 1.61-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/>'
  };
  var FILLED = { google: 1, wa: 1 };
  function icon(name, cls){ return '<svg class="' + (cls || 'bk-i') + (FILLED[name] ? ' bk-fill' : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; }

  var lang = 'he';
  function t(key){ return TEXT[lang][key]; }
  function fill(str, map){ return str.replace(/\{(\w)\}/g, function(_, k){ return map[k] != null ? map[k] : ''; }); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sname(s){ return s[lang].name; }
  function locale(){ return lang === 'he' ? 'he-IL' : 'en-GB'; }
  function fmt(date, opts){ return new Intl.DateTimeFormat(locale(), Object.assign({ timeZone: T.TZ }, opts)).format(date); }
  function dayLabel(c){ return fmt(T.zoned(c.y, c.m, c.d, 12, 0), { weekday: 'long', day: 'numeric', month: 'long' }); }

  var todayC = T.today();
  var state = {
    step: 1, service: null, month: { y: todayC.y, m: todayC.m }, day: null, slot: null,
    busy: {}, busyState: {}, form: { name: '', phone: '', email: '', business: '', meeting: 'phone', note: '', marketing: false, ads: false },
    errors: {}, submitting: false, notice: '', result: null
  };

  /* ---------- availability ---------- */
  function horizonEnd(){ return T.addDays(todayC, cfg.horizonDays || 30); }
  function monthKey(y, m){ return y + '-' + m; }
  function monthRange(y, m){
    var first = T.civil(y, m, 1), last = T.civil(y, m + 1, 0);
    return { from: T.zoned(first.y, first.m, first.d, 0, 0), to: T.zoned(last.y, last.m, last.d + 1, 0, 0) };
  }
  function loadMonth(y, m){
    var key = monthKey(y, m);
    if (state.busyState[key]) return;
    state.busyState[key] = 'loading';
    var r = monthRange(y, m);
    B.busy(r.from, r.to).then(function(rows){
      state.busy[key] = rows; state.busyState[key] = 'ok'; render();
    }, function(){ state.busyState[key] = 'error'; render(); });
  }
  function slotsFor(c){
    var s = state.service, hours = cfg.hours[c.dow];
    if (!s || !hours) return [];
    var busy = state.busy[monthKey(c.y, c.m)] || [];
    var open = T.hm(hours[0]), close = T.hm(hours[1]), step = cfg.slotStep || 30;
    var earliest = Date.now() + (cfg.leadMinutes || 120) * 60000, out = [];
    for (var m = open; m + s.minutes <= close; m += step) {
      var start = T.zoned(c.y, c.m, c.d, Math.floor(m / 60), m % 60);
      if (start.getTime() < earliest) continue;
      var end = new Date(start.getTime() + s.minutes * 60000);
      var clash = busy.some(function(b){ return start < b.end && end > b.start; });
      if (!clash) out.push(start);
    }
    return out;
  }
  function inRange(c){
    var k = T.dayKey(c);
    return k >= T.dayKey(todayC) && k <= T.dayKey(horizonEnd()) && !!cfg.hours[c.dow];
  }

  /* ---------- rendering ---------- */
  function progress(){
    var html = '<ol class="bk-progress">';
    t('steps').forEach(function(label, i){
      var n = i + 1, cls = state.step === 'done' || n < state.step ? 'done' : n === state.step ? 'on' : '';
      html += '<li class="' + cls + '"' + (n === state.step ? ' aria-current="step"' : '') + '><span class="bk-dot">' +
        (cls === 'done' ? icon('check', 'bk-i-sm') : n) + '</span><span>' + label + '</span></li>';
    });
    return html + '</ol>';
  }
  function backBtn(){
    if (state.step === 1) return '<a class="bk-back" href="index.html">' + icon('chevron', 'bk-i-sm bk-flip') + t('backHome') + '</a>';
    return '<button class="bk-back" type="button" data-act="back">' + icon('chevron', 'bk-i-sm bk-flip') + t('back') + '</button>';
  }

  function viewServices(){
    var html = '<h2 class="bk-h">' + t('pickService') + '</h2><div class="bk-services">';
    cfg.services.forEach(function(s){
      html += '<button type="button" class="bk-service' + (state.service === s ? ' sel' : '') + '" data-act="service" data-id="' + s.id + '" style="--svc:' + s.color + '">' +
        '<span class="bk-service-ic">' + icon(s.icon) + '</span>' +
        '<span class="bk-service-body"><b>' + esc(sname(s)) + '</b><span>' + esc(s[lang].desc) + '</span></span>' +
        '<span class="bk-service-meta"><span class="bk-mins">' + icon('clock', 'bk-i-sm') + s.minutes + ' ' + t('min') + '</span>' +
        (s.free ? '<span class="bk-free">' + t('free') + '</span>' : '') + '</span>' +
        icon('chevron', 'bk-i-sm bk-go') + '</button>';
    });
    return html + '</div>';
  }

  function viewCalendar(){
    var y = state.month.y, m = state.month.m, key = monthKey(y, m), st = state.busyState[key];
    loadMonth(y, m);
    var first = T.civil(y, m, 1), days = T.civil(y, m + 1, 0).d;
    var canPrev = T.dayKey(T.civil(y, m, 0)) >= T.dayKey(todayC);
    var canNext = T.dayKey(T.civil(y, m + 1, 1)) <= T.dayKey(horizonEnd());
    var title = fmt(T.zoned(y, m, 15, 12, 0), { month: 'long', year: 'numeric' });

    var html = '<div class="bk-h-row"><h2 class="bk-h">' + t('pickDay') + '</h2><span class="bk-pill" style="--svc:' + state.service.color + '">' + esc(sname(state.service)) + ' · ' + state.service.minutes + ' ' + t('min') + '</span></div>';
    html += '<div class="bk-cal"><div class="bk-cal-head">' +
      '<button type="button" class="bk-icon-btn" data-act="month" data-dir="-1" aria-label="' + t('prevMonth') + '"' + (canPrev ? '' : ' disabled') + '>' + icon('chevron', 'bk-i-sm bk-flip') + '</button>' +
      '<b>' + title + '</b>' +
      '<button type="button" class="bk-icon-btn" data-act="month" data-dir="1" aria-label="' + t('nextMonth') + '"' + (canNext ? '' : ' disabled') + '>' + icon('chevron', 'bk-i-sm') + '</button></div>';
    html += '<div class="bk-cal-grid" role="group" aria-label="' + esc(title) + '">';
    t('weekdays').forEach(function(w){ html += '<span class="bk-wd" aria-hidden="true">' + w + '</span>'; });
    for (var i = 0; i < first.dow; i++) html += '<span aria-hidden="true"></span>';
    for (var d = 1; d <= days; d++) {
      var c = T.civil(y, m, d), ok = inRange(c) && st === 'ok' && slotsFor(c).length > 0;
      var sel = !!T.sameDay(c, state.day), isToday = !!T.sameDay(c, todayC);
      var cls = 'bk-day' + (sel ? ' sel' : '') + (isToday ? ' today' : '');
      html += '<button type="button" class="' + cls + '" data-act="day" data-d="' + d + '" aria-label="' + esc(dayLabel(c)) + '" aria-pressed="' + sel + '"' + (isToday ? ' aria-current="date"' : '') + (ok ? '' : ' disabled') + '>' + d + '</button>';
    }
    html += '</div></div>';

    html += '<div class="bk-slots-wrap"><p class="bk-tz">' + icon('clock', 'bk-i-sm') + t('tz') + '</p>';
    if (st === 'error') html += '<p class="bk-msg err">' + t('loadErr') + '</p>';
    else if (st !== 'ok') html += '<p class="bk-msg">' + t('loading') + '</p>';
    else if (!state.day) html += '<p class="bk-msg">' + t('pickDayHint') + '</p>';
    else {
      var slots = slotsFor(state.day);
      html += '<h3 class="bk-sub">' + fill(t('slotsFor'), { d: dayLabel(state.day) }) + '</h3>';
      if (!slots.length) html += '<p class="bk-msg">' + t('noSlots') + '</p>';
      else {
        html += '<div class="bk-slots">';
        slots.forEach(function(s){
          var sel = state.slot && state.slot.getTime() === s.getTime();
          html += '<button type="button" class="bk-slot' + (sel ? ' sel' : '') + '" data-act="slot" data-t="' + s.getTime() + '"><bdi>' + T.timeLabel(s) + '</bdi></button>';
        });
        html += '</div>';
      }
    }
    if (state.notice) html += '<p class="bk-msg err" role="alert">' + state.notice + '</p>';
    return html + '</div>';
  }

  function field(name, label, type, extra){
    var f = state.form, e = state.errors[name];
    return '<label class="bk-field' + (e ? ' bad' : '') + '"><span>' + label + '</span>' +
      '<input name="' + name + '" type="' + type + '" value="' + esc(f[name]) + '"' + (extra || '') + '>' +
      (e ? '<small role="alert">' + e + '</small>' : '') + '</label>';
  }
  function viewDetails(){
    var html = '<h2 class="bk-h">' + t('details') + '</h2>' + summaryStrip() + '<form class="bk-form" novalidate data-form="details">';
    html += field('name', t('name'), 'text', ' autocomplete="name" maxlength="80" required');
    html += field('phone', t('phone'), 'tel', ' autocomplete="tel" inputmode="tel" dir="ltr" placeholder="05X-XXX-XXXX" required');
    html += field('email', t('email'), 'email', ' autocomplete="email" dir="ltr" maxlength="120"');
    html += field('business', t('business'), 'text', ' autocomplete="organization" maxlength="120"');
    html += '<fieldset class="bk-field"><legend>' + t('meeting') + '</legend><div class="bk-choices">';
    ['phone', 'video', 'whatsapp'].forEach(function(k){
      html += '<label class="bk-choice"><input type="radio" name="meeting" value="' + k + '"' + (state.form.meeting === k ? ' checked' : '') + '><span>' + t('meet')[k] + '</span></label>';
    });
    html += '</div></fieldset>';
    html += '<label class="bk-field"><span>' + t('note') + '</span><textarea name="note" rows="3" maxlength="1000" placeholder="' + esc(t('notePh')) + '">' + esc(state.form.note) + '</textarea></label>';
    html += '<fieldset class="form-optins"><legend>' + t('optLegend') + '</legend>' +
      '<label class="form-optin"><input type="checkbox" name="marketing_opt_in" value="1"' + (state.form.marketing ? ' checked' : '') + '><span>' + t('optMarketing') + '</span></label>' +
      '<label class="form-optin"><input type="checkbox" name="ads_audience_opt_in" value="1"' + (state.form.ads ? ' checked' : '') + '><span>' + t('optAds') + '</span></label></fieldset>';
    html += '<button class="btn solid bk-wide" type="submit">' + t('toConfirm') + '</button>' + privacyNote() + '</form>';
    return html;
  }
  function privacyNote(){ return '<p class="form-privacy">' + t('privacy') + ' <a href="privacy.html">' + t('privacyLink') + '</a></p>'; }
  function whenLabel(){ return dayLabel(state.day) + ' · ' + T.timeLabel(state.slot); }
  function summaryStrip(){
    return '<div class="bk-strip" style="--svc:' + state.service.color + '"><span class="bk-service-ic">' + icon(state.service.icon) + '</span><div><b>' + esc(sname(state.service)) + '</b><span><bdi>' + whenLabel() + '</bdi></span></div></div>';
  }
  function row(label, value){ return value ? '<div class="bk-row"><span>' + label + '</span><b>' + value + '</b></div>' : ''; }
  function viewConfirm(){
    var f = state.form, s = state.service;
    var html = '<h2 class="bk-h">' + t('confirm') + '</h2><div class="bk-summary">';
    html += row(t('rService'), esc(sname(s)));
    html += row(t('rWhen'), '<bdi>' + whenLabel() + '</bdi>');
    html += row(t('rLength'), s.minutes + ' ' + t('min'));
    html += row(t('rMeeting'), t('meet')[f.meeting]);
    html += row(t('rName'), esc(f.name));
    html += row(t('rPhone'), '<bdi dir="ltr">' + esc(B.formatPhone(f.phone)) + '</bdi>');
    html += row(t('rEmail'), f.email ? '<bdi dir="ltr">' + esc(f.email) + '</bdi>' : '');
    html += row(t('rBusiness'), esc(f.business));
    html += row(t('rNote'), esc(f.note));
    html += row(t('rOptins'), [f.marketing && t('optM'), f.ads && t('optA')].filter(Boolean).join(', '));
    html += '</div>';
    if (state.notice) html += '<p class="bk-msg err" role="alert">' + state.notice + '</p>';
    html += '<button class="btn solid bk-wide" type="button" data-act="submit"' + (state.submitting ? ' disabled' : '') + '>' + (state.submitting ? t('booking') : t('book')) + '</button>';
    html += privacyNote();
    return html;
  }

  function stamp(d){ return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
  function waText(){
    var f = state.form;
    return fill(t('waMsg'), { s: sname(state.service), d: dayLabel(state.day), t: T.timeLabel(state.slot), n: f.name, p: B.formatPhone(f.phone) });
  }
  function viewDone(){
    var s = state.service, start = state.slot, end = new Date(start.getTime() + s.minutes * 60000);
    var title = fill(t('calTitle'), { s: sname(s) }), details = fill(t('calDetails'), { w: cfg.whatsapp });
    var g = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) +
      '&dates=' + stamp(start) + '/' + stamp(end) + '&details=' + encodeURIComponent(details);
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bonim Digital//Booking//HE', 'BEGIN:VEVENT',
      'UID:' + (state.result && state.result.id || Date.now()) + '@bonim-digital', 'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(start), 'DTEND:' + stamp(end), 'SUMMARY:' + title, 'DESCRIPTION:' + details, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var wa = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(waText());
    var demo = state.result && state.result.demo;

    var html = '<div class="bk-done" style="--svc:' + s.color + '"><span class="bk-done-ic">' + icon('check') + '</span>' +
      '<p class="bk-done-k">' + t('done') + '</p><h2>' + esc(sname(s)) + '</h2><p class="bk-done-when"><bdi>' + whenLabel() + '</bdi></p>' +
      '<p class="bk-done-sub">' + t('doneSub') + '</p>';
    if (demo) html += '<p class="bk-demo">' + t('demoNote') + '</p>';
    html += '<div class="bk-tiles">' +
      '<a class="bk-tile" href="' + g + '" target="_blank" rel="noopener noreferrer">' + icon('google') + '<span>' + t('addGoogle') + '</span></a>' +
      '<a class="bk-tile" href="data:text/calendar;charset=utf-8,' + encodeURIComponent(ics) + '" download="bonim-digital.ics">' + icon('plus') + '<span>' + t('addIcs') + '</span></a>' +
      '<a class="bk-tile wa' + (demo ? ' strong' : '') + '" href="' + wa + '" target="_blank" rel="noopener noreferrer">' + icon('wa') + '<span>' + t('sendWa') + '</span></a></div>' +
      '<div class="bk-done-actions"><button type="button" class="btn" data-act="restart">' + t('another') + '</button><a class="btn" href="index.html">' + t('home') + '</a></div></div>';
    return html;
  }

  function render(){
    lang = document.documentElement.lang === 'en' ? 'en' : 'he';
    var body;
    if (state.step === 1) body = viewServices();
    else if (state.step === 2) body = viewCalendar();
    else if (state.step === 3) body = viewDetails();
    else if (state.step === 4) body = viewConfirm();
    else body = viewDone();
    root.innerHTML =
      '<header class="bk-head"><div class="sec-eyebrow">' + t('eyebrow') + '</div><h1>' + t('title') + '</h1><p class="sec-sub">' + t('sub') + '</p></header>' +
      progress() + (state.step === 'done' ? '' : backBtn()) + '<div class="bk-panel">' + body + '</div>';
  }
  function go(step){
    state.step = step; state.notice = ''; render();
    var top = root.getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    var h = root.querySelector('.bk-panel .bk-h, .bk-done h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- events ---------- */
  function readForm(form){
    var f = state.form;
    ['name', 'phone', 'email', 'business', 'note'].forEach(function(k){ var el = form.elements[k]; if (el) f[k] = el.value.trim(); });
    var m = form.querySelector('input[name="meeting"]:checked'); if (m) f.meeting = m.value;
    f.marketing = !!(form.elements.marketing_opt_in && form.elements.marketing_opt_in.checked);
    f.ads = !!(form.elements.ads_audience_opt_in && form.elements.ads_audience_opt_in.checked);
  }
  function validate(){
    var f = state.form, e = {};
    if (f.name.length < 2) e.name = t('errName');
    if (!B.validPhone(f.phone)) e.phone = t('errPhone');
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = t('errEmail');
    state.errors = e;
    return !Object.keys(e).length;
  }
  function submit(){
    if (state.submitting) return;
    state.submitting = true; state.notice = ''; render();
    var f = state.form;
    B.create({ service: state.service.id, start: state.slot, name: f.name, phone: f.phone, email: f.email, business: f.business, meeting: f.meeting, note: f.note, lang: lang, marketing: f.marketing, ads: f.ads })
      .then(function(res){
        state.submitting = false; state.result = res;
        if (window.bdTrack) window.bdTrack('lead', 'booking');
        go('done');
      })
      .catch(function(e){
        state.submitting = false;
        if (e.code === 'taken' || e.code === 'invalid') {
          state.busyState[monthKey(state.day.y, state.day.m)] = null;
          state.slot = null; state.step = 2; state.notice = e.code === 'taken' ? t('taken') : t('invalid'); render();
        } else { state.notice = t('failed'); render(); }
      });
  }

  root.addEventListener('click', function(ev){
    var el = ev.target.closest('[data-act]'); if (!el || el.disabled) return;
    var act = el.getAttribute('data-act');
    if (act === 'service') {
      var s = B.service(el.getAttribute('data-id'));
      if (state.service !== s) { state.slot = null; }
      state.service = s; go(2);
    } else if (act === 'back') {
      go(state.step - 1);
    } else if (act === 'month') {
      var dir = +el.getAttribute('data-dir'), c = T.civil(state.month.y, state.month.m + dir, 1);
      state.month = { y: c.y, m: c.m }; render();
    } else if (act === 'day') {
      state.day = T.civil(state.month.y, state.month.m, +el.getAttribute('data-d')); state.slot = null; state.notice = ''; render();
      var sl = root.querySelector('.bk-slots-wrap'); if (sl && window.matchMedia('(max-width:720px)').matches) sl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (act === 'slot') {
      state.slot = new Date(+el.getAttribute('data-t')); go(3);
    } else if (act === 'submit') {
      submit();
    } else if (act === 'restart') {
      state.slot = null; state.day = null; state.result = null; state.busyState = {}; go(1);
    }
  });
  root.addEventListener('submit', function(ev){
    var form = ev.target.closest('[data-form="details"]'); if (!form) return;
    ev.preventDefault(); readForm(form);
    if (validate()) { state.form.phone = B.formatPhone(state.form.phone); go(4); }
    else { render(); var bad = root.querySelector('.bk-field.bad input'); if (bad) bad.focus(); }
  });
  root.addEventListener('focusout', function(ev){
    if (ev.target.name === 'phone' && B.validPhone(ev.target.value)) ev.target.value = B.formatPhone(ev.target.value);
  });
  root.addEventListener('input', function(ev){
    var form = ev.target.form; if (form && form.getAttribute('data-form') === 'details') readForm(form);
  });
  window.addEventListener('portfolio-languagechange', render);

  var pre = new URLSearchParams(location.search).get('s');
  if (pre && B.service(pre)) { state.service = B.service(pre); state.step = 2; }
  render();
})();
