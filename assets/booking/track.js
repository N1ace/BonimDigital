(function(){
  var B = window.BonimBooking; if (!B || !B.projects) return;
  var app = document.getElementById('tr-app'); if (!app) return;
  var PJ = B.projects, WA = (B.cfg && B.cfg.whatsapp) || '972527905122';
  var CAT_COLOR = { website: '#C2410C', booking: '#0B1B33', store: '#3B6FE0', app: '#E0703A', existing: '#52607A', other: '#0038B8' };

  var TEXT = {
    he: {
      eyebrow: '// מעקב פרויקט', title: 'מעקב אחרי הפרויקט שלכם',
      sub: 'הכניסו את קוד המעקב ששלחנו לכם, ותראו בדיוק איפה הפרויקט עומד, מה כבר נעשה ומה הצעד הבא.',
      label: 'קוד מעקב', go: 'מעקב', loading: 'מחפשים…',
      invalid: 'הקוד צריך להיות בפורמט BD-XXXX-XXXX.',
      notFound: 'לא מצאנו פרויקט עם הקוד הזה. בדקו שהקוד הועתק נכון, או כתבו לנו ונבדוק.',
      error: 'משהו השתבש. נסו שוב בעוד רגע.', network: 'אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.',
      demo: 'מצב הדגמה. אפשר לנסות עם הקוד', hi: 'שלום {n}',
      progress: 'התקדמות', stage: 'שלב נוכחי', started: 'התחלה', deadline: 'תאריך יעד',
      daysLeft: 'עוד {d} ימים', today: 'היום', tomorrow: 'מחר', overdue: 'עבר לפני {d} ימים', delivered: 'נמסר {d}',
      delayedT: 'הפרויקט בעיכוב', holdT: 'הפרויקט ממתין', newDate: 'תאריך משוער חדש: {d}',
      delayNote: 'אנחנו מעדכנים כאן ברגע שיש התקדמות.',
      stepsH: 'שלבי הפרויקט', updatesH: 'עדכונים', reqH: 'מה אנחנו בונים', tipsH: 'ההמלצות שלנו',
      doneAt: 'הושלם {d}', startedAt: 'התחיל {d}', pending: 'בהמשך', skipped: 'לא נדרש', ifNeeded: 'אם צריך', now: 'עכשיו',
      done: 'הושלם', latest: 'העדכון האחרון',
      questions: 'יש שאלה על הפרויקט?', questionsSub: 'כתבו לנו עם קוד המעקב ונחזור אליכם תוך 24 שעות.', wa: 'כתבו לנו בוואטסאפ',
      waText: 'שלום, יש לי שאלה על הפרויקט {c}', noUpdates: 'עוד אין עדכונים.', allDone: 'הכל הושלם',
      closedMsg: 'הפרויקט נמסר. תודה שבניתם איתנו!', lastUpdate: 'עודכן לאחרונה {d}'
    },
    en: {
      eyebrow: '// project tracking', title: 'Track your project',
      sub: 'Enter the tracking code we sent you to see exactly where your project stands, what is already done and what comes next.',
      label: 'Tracking code', go: 'Track', loading: 'Searching…',
      invalid: 'The code should look like BD-XXXX-XXXX.',
      notFound: "We couldn't find a project with this code. Check that it was copied correctly, or message us and we'll look into it.",
      error: 'Something went wrong. Please try again in a moment.', network: 'No internet connection. Check it and try again.',
      demo: 'Demo mode. Try the code', hi: 'Hi {n}',
      progress: 'Progress', stage: 'Current stage', started: 'Started', deadline: 'Deadline',
      daysLeft: '{d} days left', today: 'Today', tomorrow: 'Tomorrow', overdue: '{d} days ago', delivered: 'Delivered {d}',
      delayedT: 'The project is delayed', holdT: 'The project is on hold', newDate: 'New estimated date: {d}',
      delayNote: "We'll post an update here as soon as it moves forward.",
      stepsH: 'Project stages', updatesH: 'Updates', reqH: "What we're building", tipsH: 'Our recommendations',
      doneAt: 'Done {d}', startedAt: 'Started {d}', pending: 'Coming up', skipped: 'Not needed', ifNeeded: 'if needed', now: 'Now',
      done: 'Done', latest: 'Latest update',
      questions: 'A question about your project?', questionsSub: "Message us with your tracking code and we'll get back to you within 24 hours.", wa: 'Message us on WhatsApp',
      waText: 'Hi, I have a question about project {c}', noUpdates: 'No updates yet.', allDone: 'All done',
      closedMsg: 'Your project has been delivered. Thank you for building with us!', lastUpdate: 'Last updated {d}'
    }
  };

  var lang = 'he', state = { code: '', loading: false, error: '', data: null };
  function t(k, vars){ var s = TEXT[lang][k] || k; if (vars) Object.keys(vars).forEach(function(v){ s = s.replace('{' + v + '}', vars[v]); }); return s; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function loc(){ return lang === 'he' ? 'he-IL' : 'en-GB'; }
  function icon(path, cls){ return '<svg class="' + (cls || 'tr-i') + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  var I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', check: '<path d="M5 12l5 5L20 7"/>',
    alert: '<path d="M12 8v5M12 16.5v.5M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/>',
    pause: '<path d="M9 5v14M15 5v14"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    chat: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>',
    collect: '<path d="M4 7h16M4 12h10M4 17h7"/><circle cx="18" cy="16" r="3"/><path d="M20.2 18.2 22 20"/>',
    build: '<path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16"/>',
    deliver: '<path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7z"/><path d="M9 12l2 2 4-4"/>',
    edits: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>'
  };

  function utcOf(s){ var a = String(s).split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2]); }
  function todayYmd(){ return B.time.dayKey(B.time.today()); }
  function day(s, long){ return s ? new Intl.DateTimeFormat(loc(), { timeZone: 'UTC', day: 'numeric', month: long ? 'long' : 'short', year: 'numeric' }).format(new Date(utcOf(String(s).slice(0, 10)))) : ''; }
  function when(iso){ return new Intl.DateTimeFormat(loc(), { timeZone: B.time.TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso)); }
  function shortDay(iso){ return new Intl.DateTimeFormat(loc(), { timeZone: B.time.TZ, day: 'numeric', month: 'short' }).format(new Date(iso)); }
  function rel(p){
    if (p.status === 'closed') return { t: t('delivered', { d: p.closed_at ? shortDay(p.closed_at) : '' }), c: 'ok' };
    var d = Math.round((utcOf(String(p.deadline).slice(0, 10)) - utcOf(todayYmd())) / 86400000);
    if (d < 0) return { t: t('overdue', { d: -d }), c: 'late' };
    if (d === 0) return { t: t('today'), c: 'soon' };
    if (d === 1) return { t: t('tomorrow'), c: 'soon' };
    return { t: t('daysLeft', { d: d }), c: d <= 7 ? 'soon' : '' };
  }

  /* ---------- views ---------- */
  function head(){
    return '<header class="tr-head">' +
      '<div class="sec-eyebrow">' + t('eyebrow') + '</div>' +
      '<h1>' + t('title') + '</h1>' +
      '<p class="sec-sub">' + t('sub') + '</p>' +
      '<form class="tr-form" data-form="track" novalidate>' +
        '<label for="tr-code">' + t('label') + '</label>' +
        '<div class="tr-form-row"><input id="tr-code" name="code" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" maxlength="14" placeholder="BD-XXXX-XXXX" value="' + esc(state.code) + '"' + (state.error ? ' aria-invalid="true" aria-describedby="tr-err"' : '') + '>' +
        '<button class="btn solid" type="submit"' + (state.loading ? ' disabled' : '') + '>' + icon(I.search, 'tr-i-sm') + (state.loading ? t('loading') : t('go')) + '</button></div>' +
        (state.error ? '<p class="tr-err" id="tr-err" role="alert">' + esc(t(state.error)) + '</p>' : '') +
        (B.configured ? '' : '<p class="tr-demo">' + t('demo') + ' <button type="button" class="tr-demo-code" data-act="demo" dir="ltr">BD-DEMO-2026</button></p>') +
      '</form></header>';
  }
  function stepper(p){
    var cur = PJ.currentStage(p);
    return '<ol class="tr-steps">' + p.stages.map(function(s, i){
      var L = PJ.L[lang], sub = s.state === 'done' ? t('doneAt', { d: s.done_at ? shortDay(s.done_at) : '' })
        : s.state === 'active' ? t('now') : s.state === 'skipped' ? t('skipped') : (s.k === 'edits' ? t('ifNeeded') : t('pending'));
      return '<li class="s-' + s.state + (i === cur && p.status !== 'closed' ? ' cur' : '') + '"' + (s.state === 'active' ? ' aria-current="step"' : '') + '>' +
        '<span class="tr-dot">' + (s.state === 'done' ? icon(I.check, 'tr-i-sm') : icon(I[s.k], 'tr-i-sm')) + '</span>' +
        '<b>' + (i + 1) + '. ' + esc(L.stages[s.k]) + '</b><small>' + sub + '</small></li>';
    }).join('') + '</ol>';
  }
  function summary(p){
    var L = PJ.L[lang], pr = PJ.progress(p), r = rel(p), cur = p.stages[PJ.currentStage(p)];
    var late = p.status === 'delayed' || p.status === 'on_hold';
    return '<section class="tr-card tr-sum" style="--svc:' + (CAT_COLOR[p.category] || CAT_COLOR.other) + '">' +
      '<div class="tr-top"><div class="tr-top-t">' +
          '<span class="tr-cat"><i></i>' + esc(L.categories[p.category] || '') + '</span>' +
          '<h2 dir="auto">' + esc(p.title) + '</h2>' +
          '<p>' + (p.client ? '<span dir="auto">' + esc(t('hi', { n: p.client })) + '</span>' : '') + (p.business ? ' · <span dir="auto">' + esc(p.business) + '</span>' : '') + '</p>' +
        '</div><div class="tr-top-s"><span class="tr-status st-' + p.status + '">' + esc(L.status[p.status]) + '</span><bdi class="tr-code" dir="ltr">' + esc(p.code) + '</bdi></div></div>' +
      (late ? '<div class="tr-alert">' + icon(p.status === 'on_hold' ? I.pause : I.alert) + '<div><b>' + t(p.status === 'on_hold' ? 'holdT' : 'delayedT') + '</b>' +
        (p.delay_reason ? '<p dir="auto">' + esc(p.delay_reason) + '</p>' : '') +
        (p.delay_until ? '<p class="tr-alert-date">' + t('newDate', { d: day(p.delay_until, true) }) + '</p>' : '') +
        '<small>' + t('delayNote') + '</small></div></div>' : '') +
      (p.status === 'closed' ? '<div class="tr-done">' + icon(I.flag) + '<b>' + t('closedMsg') + '</b></div>' : '') +
      '<dl class="tr-facts">' +
        '<div><dt>' + t('progress') + '</dt><dd class="tr-pct">' + pr + '%</dd></div>' +
        '<div><dt>' + t('stage') + '</dt><dd>' + (p.status === 'closed' ? t('allDone') : esc(L.stages[cur.k])) + '</dd></div>' +
        '<div><dt>' + t('started') + '</dt><dd>' + day(p.start_date) + '</dd></div>' +
        '<div><dt>' + t('deadline') + '</dt><dd>' + day(p.deadline) + ' <span class="tr-rel ' + r.c + '">' + r.t + '</span></dd></div>' +
      '</dl>' +
      '<div class="tr-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pr + '" aria-label="' + t('progress') + '"><i style="width:' + pr + '%"></i></div>' +
      stepper(p) +
      (p.summary ? '<p class="tr-summary" dir="auto">' + esc(p.summary) + '</p>' : '') +
      (p.updated_at ? '<p class="tr-updated">' + t('lastUpdate', { d: when(p.updated_at) }) + '</p>' : '') +
    '</section>';
  }
  function timeline(p){
    var ups = (p.updates || []).slice().sort(function(a, b){ return b.at < a.at ? -1 : 1; });
    return '<section class="tr-card"><h3 class="tr-h">' + t('updatesH') + '</h3>' + (ups.length ? '<ol class="tr-tl">' + ups.map(function(u, i){
      return '<li class="k-' + esc(u.kind) + (i === 0 ? ' latest' : '') + '">' +
        '<time datetime="' + esc(u.at) + '">' + when(u.at) + '</time>' +
        '<b>' + esc(PJ.updateTitle(u, lang)) + '</b>' + (i === 0 ? '<span class="tr-latest">' + t('latest') + '</span>' : '') +
        (u.text ? '<p dir="auto">' + esc(u.text) + '</p>' : '') +
        (u.until ? '<p class="tr-tl-until">' + (u.kind === 'deadline' ? t('deadline') + ': ' + day(u.until, true) : t('newDate', { d: day(u.until, true) })) + '</p>' : '') +
      '</li>';
    }).join('') + '</ol>' : '<p class="tr-muted">' + t('noUpdates') + '</p>') + '</section>';
  }
  function stagesDetail(p){
    var L = PJ.L[lang];
    return '<section class="tr-card"><h3 class="tr-h">' + t('stepsH') + '</h3><ol class="tr-stages">' + p.stages.map(function(s, i){
      var badge = s.state === 'done' ? t('done') : s.state === 'active' ? t('now') : s.state === 'skipped' ? t('skipped') : t('pending');
      return '<li class="s-' + s.state + '">' +
        '<div class="tr-stage-h"><span class="tr-stage-n">' + (s.state === 'done' ? icon(I.check, 'tr-i-sm') : i + 1) + '</span>' +
          '<b>' + esc(L.stages[s.k]) + (s.k === 'edits' ? ' <em>(' + t('ifNeeded') + ')</em>' : '') + '</b><span class="tr-badge">' + badge + '</span></div>' +
        '<p>' + esc(L.stageDesc[s.k]) + '</p>' +
        (s.state === 'skipped' ? '' : '<ul class="tr-tasks">' + (s.tasks || []).map(function(tk){
          return '<li class="' + (tk.done ? 'done' : '') + '"><span class="tr-tick">' + (tk.done ? icon(I.check, 'tr-i-xs') : '') + '</span><span dir="auto">' + esc(PJ.taskLabel(tk, lang)) + '</span></li>';
        }).join('') + '</ul>') +
      '</li>';
    }).join('') + '</ol></section>';
  }
  function side(p){
    var list = function(title, items){ return items && items.length ? '<section class="tr-card"><h3 class="tr-h">' + title + '</h3><ul class="tr-list">' + items.map(function(x){ return '<li dir="auto">' + esc(x) + '</li>'; }).join('') + '</ul></section>' : ''; };
    return list(t('reqH'), p.requirements) + list(t('tipsH'), p.tips) +
      '<section class="tr-card tr-help"><b>' + t('questions') + '</b><p>' + t('questionsSub') + '</p>' +
        '<a class="btn tr-wa" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(t('waText', { c: p.code })) + '" target="_blank" rel="noopener noreferrer">' + icon(I.chat, 'tr-i-sm') + t('wa') + '</a></section>';
  }
  function render(){
    lang = document.documentElement.lang === 'en' ? 'en' : 'he';
    var focused = document.activeElement && document.activeElement.id === 'tr-code', caret = focused ? document.activeElement.selectionStart : null;
    var p = state.data;
    app.innerHTML = head() + (p ? '<div class="tr-result">' + summary(p) +
      '<div class="tr-grid"><div class="tr-main">' + timeline(p) + stagesDetail(p) + '</div><aside class="tr-side">' + side(p) + '</aside></div></div>' : '');
    if (focused) { var i = document.getElementById('tr-code'); i.focus(); if (caret != null) i.setSelectionRange(caret, caret); }
  }

  /* ---------- lookup ---------- */
  var seq = 0;
  function lookup(raw, silent){
    var code = PJ.normCode(raw);
    state.code = code || String(raw || '').trim().toUpperCase();
    if (!code) { state.error = 'invalid'; state.data = null; render(); return; }
    var mine = ++seq;
    state.loading = true; state.error = ''; render();
    PJ.track(code).then(function(data){
      if (mine !== seq) return;
      state.loading = false; state.data = data || null; state.error = data ? '' : 'notFound';
      if (data) { var qs = new URLSearchParams(location.search); qs.set('code', code); history.replaceState(null, '', location.pathname + '?' + qs + location.hash); }
      render();
      if (data && !silent) { var r = app.querySelector('.tr-result'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, function(e){
      if (mine !== seq) return;
      state.loading = false; state.data = null;
      state.error = e && e.code === 'invalid' ? 'invalid' : e && e.code === 'network' ? 'network' : 'error';
      render();
    });
  }

  app.addEventListener('submit', function(ev){
    if (!ev.target.matches('[data-form="track"]')) return;
    ev.preventDefault();
    lookup(ev.target.elements.code.value);
  });
  app.addEventListener('click', function(ev){
    if (ev.target.closest('[data-act="demo"]')) lookup('BD-DEMO-2026');
  });
  window.addEventListener('portfolio-languagechange', render);

  var q = new URLSearchParams(location.search).get('code');
  render();
  if (q) lookup(q, true);
})();
