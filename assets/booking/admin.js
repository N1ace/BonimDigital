(function(){
  var B = window.BonimBooking; if (!B) return;
  var app = document.getElementById('adm-app');
  var userBox = document.getElementById('adm-user');
  var modalRoot = document.getElementById('adm-modal-root');
  var cfg = B.cfg, T = B.time, A = B.admin;

  var HOUR_H = 64;
  var WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var WD_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  var STATUS = { confirmed: 'מאושר', done: 'בוצע', no_show: 'לא הגיע', cancelled: 'בוטל' };
  var MEETING = { phone: 'שיחת טלפון', video: 'שיחת וידאו', whatsapp: 'וואטסאפ' };

  var state = {
    view: window.matchMedia('(max-width:760px)').matches ? 'day' : 'week',
    anchor: T.today(), items: [], loading: false, error: '', open: null, saving: false
  };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(date, opts){ return new Intl.DateTimeFormat('he-IL', Object.assign({ timeZone: T.TZ }, opts)).format(date); }
  function noon(c){ return T.zoned(c.y, c.m, c.d, 12, 0); }
  function svc(id){ return B.service(id) || { he: { name: id }, color: '#52607A', minutes: 30 }; }
  function icon(path, cls){ return '<svg class="' + (cls || 'adm-i') + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  var I = {
    prev: '<path d="M9 6l6 6-6 6"/>', next: '<path d="M15 6l-6 6 6 6"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    check: '<path d="M5 12l5 5L20 7"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'
  };

  /* ---------- ranges ---------- */
  function weekStart(c){ return T.addDays(c, -c.dow); }
  function range(){
    var a = state.anchor, start, days;
    if (state.view === 'day') { start = a; days = 1; }
    else if (state.view === 'week') { start = weekStart(a); days = 7; }
    else {
      var first = T.civil(a.y, a.m, 1), last = T.civil(a.y, a.m + 1, 0);
      start = weekStart(first);
      var end = T.addDays(last, 6 - last.dow);
      days = Math.round((Date.UTC(end.y, end.m - 1, end.d) - Date.UTC(start.y, start.m - 1, start.d)) / 864e5) + 1;
    }
    var list = []; for (var i = 0; i < days; i++) list.push(T.addDays(start, i));
    var endC = T.addDays(start, days);
    return { days: list, from: T.zoned(start.y, start.m, start.d, 0, 0), to: T.zoned(endC.y, endC.m, endC.d, 0, 0) };
  }
  function title(){
    var a = state.anchor;
    if (state.view === 'day') return fmt(noon(a), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (state.view === 'month') return fmt(noon(a), { month: 'long', year: 'numeric' });
    var s = weekStart(a), e = T.addDays(s, 6);
    return fmt(noon(s), { day: 'numeric', month: 'short' }) + ' – ' + fmt(noon(e), { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ---------- data ---------- */
  var loadSeq = 0;
  function load(){
    var r = range(), seq = ++loadSeq;
    state.loading = true; state.error = ''; render();
    A.list(r.from, r.to).then(function(rows){
      if (seq !== loadSeq) return;
      state.items = (rows || []).map(function(b){
        return Object.assign({}, b, { start: new Date(b.start_at), end: new Date(b.end_at) });
      }).sort(function(a, b){ return a.start - b.start; });
      state.loading = false; render();
    }, function(e){
      if (seq !== loadSeq) return;
      state.loading = false;
      if (e.code === 'auth') { A.logout(); showLogin('החיבור פג. התחברו שוב.'); return; }
      state.error = e.code === 'network' ? 'אין חיבור לשרת. בדקו את האינטרנט ונסו שוב.' : 'לא הצלחנו לטעון את הפגישות.';
      render();
    });
  }
  function itemsOn(c){
    var from = T.zoned(c.y, c.m, c.d, 0, 0), next = T.addDays(c, 1), to = T.zoned(next.y, next.m, next.d, 0, 0);
    return state.items.filter(function(b){ return b.start < to && b.end > from; });
  }

  /* ---------- top bar ---------- */
  function renderUser(){
    var s = A.session();
    if (!B.configured) userBox.innerHTML = '<span class="adm-badge">מצב הדגמה</span>';
    else if (s) userBox.innerHTML = '<span class="adm-email">' + esc(s.email || '') + '</span><button class="adm-btn ghost" type="button" data-act="logout">יציאה</button>';
    else userBox.innerHTML = '';
  }

  /* ---------- login ---------- */
  function showLogin(msg){
    renderUser();
    app.innerHTML =
      '<form class="adm-login" data-form="login" novalidate>' +
        '<img src="../assets/logo/bonim-mark.svg" alt="" width="48" height="48">' +
        '<h1>כניסה ליומן</h1><p>רק לבעלי החשבון.</p>' +
        '<label><span>אימייל</span><input name="email" type="email" autocomplete="username" dir="ltr" required></label>' +
        '<label><span>סיסמה</span><input name="password" type="password" autocomplete="current-password" dir="ltr" required></label>' +
        (msg ? '<p class="adm-err" role="alert">' + esc(msg) + '</p>' : '') +
        '<button class="adm-btn solid" type="submit">כניסה</button>' +
      '</form>';
    var f = app.querySelector('input[name="email"]'); if (f) f.focus();
  }

  /* ---------- calendar ---------- */
  function toolbar(){
    var views = [['day', 'יום'], ['week', 'שבוע'], ['month', 'חודש']];
    var count = state.items.filter(function(b){ return b.status !== 'cancelled'; }).length;
    return '<div class="adm-head">' +
      '<div class="adm-title"><h1>יומן פגישות</h1><p>' + esc(title()) + ' · <b>' + count + '</b> פגישות' + (state.loading ? ' · <span class="adm-muted">טוען…</span>' : '') + '</p></div>' +
      '<div class="adm-tools">' +
        '<div class="adm-nav">' +
          '<button class="adm-icon-btn" type="button" data-act="step" data-dir="-1" aria-label="הקודם">' + icon(I.prev) + '</button>' +
          '<button class="adm-chip" type="button" data-act="today">היום</button>' +
          '<button class="adm-icon-btn" type="button" data-act="step" data-dir="1" aria-label="הבא">' + icon(I.next) + '</button>' +
        '</div>' +
        '<div class="adm-seg" role="tablist">' + views.map(function(v){
          return '<button type="button" role="tab" data-act="view" data-v="' + v[0] + '" aria-selected="' + (state.view === v[0]) + '"' + (state.view === v[0] ? ' class="on"' : '') + '>' + v[1] + '</button>';
        }).join('') + '</div>' +
        '<button class="adm-icon-btn" type="button" data-act="refresh" aria-label="רענון">' + icon(I.refresh) + '</button>' +
      '</div></div>' +
      (B.configured ? '' : '<p class="adm-demo">מצב הדגמה: מוצגות פגישות לדוגמה ובקשות שנשמרו בדפדפן הזה. כדי לקבל הזמנות אמיתיות, מלאו את פרטי Supabase ב־<code>assets/booking/config.js</code>.</p>') +
      (state.error ? '<p class="adm-err" role="alert">' + esc(state.error) + '</p>' : '');
  }

  function hourBounds(days){
    var lo = 8, hi = 20;
    days.forEach(function(c){
      var h = cfg.hours[c.dow];
      if (h) { lo = Math.min(lo, Math.floor(T.hm(h[0]) / 60)); hi = Math.max(hi, Math.ceil(T.hm(h[1]) / 60)); }
      itemsOn(c).forEach(function(b){
        var s = T.parts(b.start), e = T.parts(b.end);
        lo = Math.min(lo, s.h); hi = Math.max(hi, e.h + (e.mi ? 1 : 0));
      });
    });
    return { lo: Math.max(0, lo), hi: Math.min(24, Math.max(hi, lo + 1)) };
  }
  function minutesOfDay(date, c){
    var p = T.parts(date);
    if (p.y !== c.y || p.m !== c.m || p.d !== c.d) return date < T.zoned(c.y, c.m, c.d, 0, 0) ? 0 : 24 * 60;
    return p.h * 60 + p.mi;
  }
  function layout(list){
    var cols = [], groups = [], group = [], groupEnd = 0;
    list.forEach(function(b){
      if (group.length && b.start >= groupEnd) { groups.push(group); group = []; cols = []; }
      var placed = false;
      for (var i = 0; i < cols.length; i++) if (cols[i] <= b.start) { b._col = i; cols[i] = b.end; placed = true; break; }
      if (!placed) { b._col = cols.length; cols.push(b.end); }
      group.push(b); groupEnd = Math.max(groupEnd, +b.end); b._group = group; b._cols = cols;
    });
    if (group.length) groups.push(group);
    groups.forEach(function(g){ var n = g[0]._cols.length; g.forEach(function(b){ b._n = n; }); });
  }
  function eventBlock(b, c, bounds){
    var s = svc(b.service_id);
    var top = (minutesOfDay(b.start, c) - bounds.lo * 60) / 60 * HOUR_H;
    var height = Math.max((minutesOfDay(b.end, c) - minutesOfDay(b.start, c)) / 60 * HOUR_H - 3, 24);
    var w = 100 / b._n, short = height < 44;
    return '<button type="button" class="adm-ev st-' + b.status + (short ? ' short' : '') + '" data-act="open" data-id="' + esc(b.id) + '" style="--svc:' + s.color +
      ';top:' + top + 'px;height:' + height + 'px;inset-inline-start:calc(' + (b._col * w) + '% + 2px);width:calc(' + w + '% - 4px)">' +
      '<span class="adm-ev-top"><span class="adm-ev-time"><bdi dir="ltr">' + T.timeLabel(b.start) + (short ? '' : '–' + T.timeLabel(b.end)) + '</bdi></span>' +
      (b.status !== 'confirmed' && !short ? '<span class="adm-ev-st">' + STATUS[b.status] + '</span>' : '') + '</span>' +
      '<b>' + esc(b.name) + '</b>' +
      (short ? '' : '<span class="adm-ev-svc">' + esc(s.he.name) + (b.business ? ' · ' + esc(b.business) : '') + '</span>') +
      (b.status !== 'confirmed' && short ? '<span class="adm-ev-st">' + STATUS[b.status] + '</span>' : '') +
    '</button>';
  }
  function timeGrid(days){
    var bounds = hourBounds(days), hours = bounds.hi - bounds.lo, today = T.today(), now = new Date();
    var html = '<div class="adm-sheet' + (days.length === 1 ? ' one' : '') + '" style="--hour:' + HOUR_H + 'px;--cols:' + days.length + '">';
    html += '<div class="adm-grid-head"><span></span>' + days.map(function(c){
      return '<button type="button" class="adm-colhead' + (T.sameDay(c, today) ? ' today' : '') + '" data-act="goday" data-k="' + T.dayKey(c) + '">' +
        '<span>' + (days.length === 1 ? WEEKDAYS[c.dow] : WD_SHORT[c.dow]) + '</span><b>' + c.d + '</b></button>';
    }).join('') + '</div>';
    html += '<div class="adm-grid-body" style="height:' + (hours * HOUR_H) + 'px"><div class="adm-axis">';
    for (var h = bounds.lo; h < bounds.hi; h++) html += '<span style="top:' + ((h - bounds.lo) * HOUR_H) + 'px"><bdi>' + T.pad(h) + ':00</bdi></span>';
    html += '</div>';
    days.forEach(function(c){
      var list = itemsOn(c); layout(list);
      var wh = cfg.hours[c.dow], off = '';
      if (!wh) off = '<span class="adm-off" style="top:0;height:100%"></span>';
      else {
        var o = (T.hm(wh[0]) - bounds.lo * 60) / 60 * HOUR_H, cl = (T.hm(wh[1]) - bounds.lo * 60) / 60 * HOUR_H;
        if (o > 0) off += '<span class="adm-off" style="top:0;height:' + o + 'px"></span>';
        if (cl < hours * HOUR_H) off += '<span class="adm-off" style="top:' + cl + 'px;bottom:0"></span>';
      }
      var nowLine = '';
      if (T.sameDay(c, today)) {
        var nm = minutesOfDay(now, c);
        if (nm >= bounds.lo * 60 && nm <= bounds.hi * 60) nowLine = '<span class="adm-now" style="top:' + ((nm - bounds.lo * 60) / 60 * HOUR_H) + 'px"></span>';
      }
      html += '<div class="adm-col' + (T.sameDay(c, today) ? ' today' : '') + '">' + off + list.map(function(b){ return eventBlock(b, c, bounds); }).join('') + nowLine + '</div>';
    });
    html += '</div></div>';
    if (days.length === 1 && !itemsOn(days[0]).length && !state.loading) html += '<p class="adm-empty">אין פגישות ביום הזה.</p>';
    return html;
  }
  function monthGrid(days){
    var a = state.anchor, today = T.today();
    var html = '<div class="adm-month"><div class="adm-month-head">' + WD_SHORT.map(function(w){ return '<span>' + w + '</span>'; }).join('') + '</div><div class="adm-month-grid">';
    days.forEach(function(c){
      var list = itemsOn(c), live = list.filter(function(b){ return b.status !== 'cancelled'; });
      var cls = 'adm-cell' + (c.m !== a.m ? ' out' : '') + (T.sameDay(c, today) ? ' today' : '') + (cfg.hours[c.dow] ? '' : ' closed');
      html += '<div class="' + cls + '" role="button" tabindex="0" data-act="goday" data-k="' + T.dayKey(c) + '">' +
        '<div class="adm-cell-top"><b>' + c.d + '</b>' + (live.length ? '<span class="adm-count">' + live.length + '</span>' : '') + '</div>';
      list.slice(0, 3).forEach(function(b){
        var s = svc(b.service_id);
        html += '<button type="button" class="adm-chipev st-' + b.status + '" data-act="open" data-id="' + esc(b.id) + '" style="--svc:' + s.color + '"><bdi>' + T.timeLabel(b.start) + '</bdi> ' + esc(b.name) + '</button>';
      });
      if (list.length > 3) html += '<span class="adm-more">+' + (list.length - 3) + ' נוספות</span>';
      html += '</div>';
    });
    return html + '</div></div>';
  }
  function legend(){
    return '<div class="adm-legend">' + cfg.services.map(function(s){
      return '<span style="--svc:' + s.color + '"><i></i>' + esc(s.he.name) + '</span>';
    }).join('') + '</div>';
  }
  function render(){
    renderUser();
    var r = range();
    app.innerHTML = toolbar() + (state.view === 'month' ? monthGrid(r.days) : timeGrid(r.days)) + legend();
    renderModal();
  }

  /* ---------- modal ---------- */
  function renderModal(){
    var b = state.open && state.items.filter(function(x){ return x.id === state.open; })[0];
    if (!b) { modalRoot.innerHTML = ''; document.body.classList.remove('adm-lock'); return; }
    var s = svc(b.service_id), phone = B.formatPhone(b.phone), intl = '972' + String(b.phone || '').replace(/^0/, '');
    function row(k, v){ return v ? '<div class="adm-row"><span>' + k + '</span><b>' + v + '</b></div>' : ''; }
    modalRoot.innerHTML =
      '<div class="adm-backdrop" data-act="close"></div>' +
      '<div class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-m-title" style="--svc:' + s.color + '">' +
        '<div class="adm-modal-head"><span class="adm-dot"></span><h2 id="adm-m-title">' + esc(s.he.name) + '</h2>' +
        '<button class="adm-icon-btn" type="button" data-act="close" aria-label="סגירה">' + icon(I.close) + '</button></div>' +
        '<p class="adm-modal-when">' + fmt(b.start, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · <bdi dir="ltr">' + T.timeLabel(b.start) + '–' + T.timeLabel(b.end) + '</bdi></p>' +
        '<div class="adm-rows">' +
          row('לקוח', esc(b.name)) +
          row('טלפון', '<a dir="ltr" href="tel:' + esc(b.phone) + '">' + esc(phone) + '</a> · <a href="https://wa.me/' + esc(intl) + '" target="_blank" rel="noopener noreferrer">וואטסאפ</a>') +
          row('אימייל', b.email ? '<a dir="ltr" href="mailto:' + esc(b.email) + '">' + esc(b.email) + '</a>' : '') +
          row('עסק', esc(b.business)) +
          row('אופן השיחה', MEETING[b.meeting] || '') +
          row('משך', Math.round((b.end - b.start) / 60000) + ' דק׳') +
          row('הערת הלקוח', esc(b.note)) +
          row('שיווק', esc(A.consent(b).text) + (A.consent(b).canOptOut ? ' <button class="adm-btn ghost" type="button" data-act="optout">ביקש/ה הסרה</button>' : '')) +
          row('נקבע', b.created_at ? fmt(new Date(b.created_at), { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '') +
        '</div>' +
        '<div class="adm-field"><span>סטטוס</span><div class="adm-seg wide" role="radiogroup">' + Object.keys(STATUS).map(function(k){
          return '<button type="button" role="radio" data-act="status" data-v="' + k + '" aria-checked="' + (b.status === k) + '" class="st-' + k + (b.status === k ? ' on' : '') + '">' + STATUS[k] + '</button>';
        }).join('') + '</div></div>' +
        '<label class="adm-field"><span>הערה פנימית</span><textarea rows="2" data-note maxlength="1000">' + esc(b.admin_note || '') + '</textarea></label>' +
        '<div class="adm-modal-actions">' +
          '<button class="adm-btn solid" type="button" data-act="save"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'שומר…' : 'שמירה') + '</button>' +
          '<button class="adm-btn danger" type="button" data-act="delete">' + icon(I.trash, 'adm-i-sm') + 'מחיקה</button>' +
        '</div>' +
      '</div>';
    document.body.classList.add('adm-lock');
  }
  function openItem(){ return state.items.filter(function(x){ return x.id === state.open; })[0]; }

  /* ---------- events ---------- */
  function parseKey(k){ var p = k.split('-'); return T.civil(+p[0], +p[1], +p[2]); }
  function onAct(el, ev){
    var act = el.getAttribute('data-act');
    if (act === 'logout') { A.logout(); state.items = []; showLogin(); window.dispatchEvent(new Event('bonim-messages-changed')); return; }
    if (act === 'view') { state.view = el.getAttribute('data-v'); load(); return; }
    if (act === 'today') { state.anchor = T.today(); load(); return; }
    if (act === 'refresh') { load(); return; }
    if (act === 'step') {
      var dir = +el.getAttribute('data-dir'), a = state.anchor;
      if (state.view === 'day') state.anchor = T.addDays(a, dir);
      else if (state.view === 'week') state.anchor = T.addDays(a, dir * 7);
      else state.anchor = T.civil(a.y, a.m + dir, 1);
      load(); return;
    }
    if (act === 'goday') {
      state.anchor = parseKey(el.getAttribute('data-k')); state.view = 'day'; load(); return;
    }
    if (act === 'open') { ev && ev.stopPropagation(); state.open = el.getAttribute('data-id'); renderModal(); var m = modalRoot.querySelector('.adm-modal .adm-icon-btn'); if (m) m.focus(); return; }
    if (act === 'close') { state.open = null; renderModal(); return; }
    if (act === 'status') {
      var b = openItem(); if (!b) return;
      b._pending = el.getAttribute('data-v');
      modalRoot.querySelectorAll('[data-act="status"]').forEach(function(x){ var on = x === el; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
      return;
    }
    if (act === 'optout') {
      var o = openItem(); if (!o) return;
      if (!confirm('לסמן ש' + o.name + ' ביקש/ה הסרה מכל השיווק? מעכשיו לא לשלוח הודעות פרסומיות ולהסיר מקהלי פרסום.')) return;
      var op = { marketing_opt_out_at: new Date().toISOString() };
      A.update(o.id, op).then(function(){ Object.assign(o, op); renderModal(); }, function(){ alert('השמירה נכשלה. נסו שוב.'); });
      return;
    }
    if (act === 'save') {
      var it = openItem(); if (!it) return;
      var note = modalRoot.querySelector('[data-note]'), patch = { status: it._pending || it.status, admin_note: note ? note.value.trim() || null : it.admin_note };
      state.saving = true; renderModal();
      A.update(it.id, patch).then(function(){
        Object.assign(it, patch); delete it._pending; state.saving = false; state.open = null; render();
      }, function(e){
        state.saving = false; renderModal();
        alert(e.code === 'taken' ? 'אי אפשר להחזיר את הפגישה: השעה כבר תפוסה.' : 'השמירה נכשלה. נסו שוב.');
      });
      return;
    }
    if (act === 'delete') {
      var d = openItem(); if (!d) return;
      if (!confirm('למחוק את הפגישה של ' + d.name + '? אי אפשר לבטל את זה. (לרוב עדיף לסמן "בוטל")')) return;
      A.remove(d.id).then(function(){ state.open = null; load(); }, function(){ alert('המחיקה נכשלה. נסו שוב.'); });
    }
  }
  document.addEventListener('click', function(ev){
    var el = ev.target.closest('[data-act]'); if (!el || el.disabled) return;
    if (!app.contains(el) && !modalRoot.contains(el) && !userBox.contains(el)) return;
    onAct(el, ev);
  });
  app.addEventListener('keydown', function(ev){
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.adm-cell')) { ev.preventDefault(); onAct(ev.target, ev); }
  });
  document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape' && state.open) { state.open = null; renderModal(); } });
  app.addEventListener('submit', function(ev){
    var form = ev.target.closest('[data-form="login"]'); if (!form) return;
    ev.preventDefault();
    var email = form.elements.email.value.trim(), pw = form.elements.password.value;
    if (!email || !pw) { showLogin('נא למלא אימייל וסיסמה.'); return; }
    var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'מתחבר…';
    A.login(email, pw).then(function(){ load(); window.dispatchEvent(new Event('bonim-messages-changed')); }, function(e){
      showLogin(e.code === 'network' ? 'אין חיבור לשרת.' : 'אימייל או סיסמה שגויים.');
    });
  });
  setInterval(function(){ if (!document.hidden && !state.open && (A.session() || !B.configured) && app.querySelector('.adm-head')) load(); }, 60000);

  if (!B.configured || A.session()) load(); else showLogin();
})();
