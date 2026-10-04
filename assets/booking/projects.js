(function(){
  var B = window.BonimBooking; if (!B || !B.projects) return;
  var app = document.getElementById('adm-app');
  var userBox = document.getElementById('adm-user');
  var modalRoot = document.getElementById('adm-modal-root');
  var A = B.admin, P = A.projects, PJ = B.projects, L = PJ.L.he, T = B.time;

  var CAT_COLOR = { website: '#C2410C', booking: '#0B1B33', store: '#3B6FE0', app: '#E0703A', existing: '#52607A', other: '#0038B8' };
  var STATUS = { active: 'פעיל', delayed: 'בעיכוב', on_hold: 'תקוע / ממתין', closed: 'סגור' };
  var STAGE_STATE = { pending: 'עוד לא התחיל', active: 'בעבודה', done: 'הושלם', skipped: 'לא נדרש' };
  var FILTERS = [['open', 'פעילים'], ['late', 'בעיכוב'], ['closed', 'סגורים'], ['all', 'הכל']];
  var WA = (B.cfg && B.cfg.whatsapp) || '972527905122';

  var state = { items: [], filter: 'open', q: '', loading: false, error: '', view: null, modal: null, saving: false };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(date, opts){ return new Intl.DateTimeFormat('he-IL', Object.assign({ timeZone: T.TZ }, opts)).format(date); }
  function icon(path, cls){ return '<svg class="' + (cls || 'adm-i') + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function intl(phone){ return '972' + String(phone || '').replace(/\D/g, '').replace(/^0/, ''); }
  var I = {
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', back: '<path d="M9 6l6 6-6 6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    chat: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>',
    mail: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>', pause: '<path d="M9 5v14M15 5v14"/>', play: '<path d="M7 5l12 7-12 7z"/>',
    check: '<path d="M5 12l5 5L20 7"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', alert: '<path d="M12 8v5M12 16.5v.5M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/>'
  };

  /* ---------- dates (all in Israel time; deadlines are plain YYYY-MM-DD days) ---------- */
  function todayYmd(){ return T.dayKey(T.today()); }
  function utcOf(s){ var a = String(s).split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2]); }
  function daysLeft(s){ return Math.round((utcOf(s) - utcOf(todayYmd())) / 86400000); }
  function fmtDay(s, opts){
    if (!s) return '';
    return new Intl.DateTimeFormat('he-IL', Object.assign({ timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }, opts)).format(new Date(utcOf(s)));
  }
  function fmtAt(iso){ return fmt(new Date(iso), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); }
  function due(p){
    if (p.status === 'closed') return { t: 'נמסר ' + (p.closed_at ? fmt(new Date(p.closed_at), { day: 'numeric', month: 'short' }) : ''), c: 'ok' };
    var d = daysLeft(p.deadline);
    if (d < 0) return { t: 'באיחור של ' + (-d === 1 ? 'יום' : -d + ' ימים'), c: 'late' };
    if (d === 0) return { t: 'הדדליין היום', c: 'soon' };
    if (d === 1) return { t: 'הדדליין מחר', c: 'soon' };
    return { t: 'עוד ' + d + ' ימים', c: d <= 7 ? 'soon' : '' };
  }

  /* ---------- data ---------- */
  var seq = 0;
  function load(){
    var mine = ++seq;
    state.loading = true; state.error = ''; render();
    P.list().then(function(rows){
      if (mine !== seq) return;
      state.items = rows || []; state.loading = false; render();
    }, function(e){
      if (mine !== seq) return;
      state.loading = false;
      if (e.code === 'auth') { A.logout(); showLogin('החיבור פג. התחברו שוב.'); return; }
      state.error = e.code === 'network' ? 'אין חיבור לשרת. בדקו את האינטרנט ונסו שוב.' : 'לא הצלחנו לטעון את הפרויקטים. האם הרצתם את supabase/projects-schema.sql?';
      render();
    });
  }
  function find(id){ return state.items.filter(function(p){ return p.id === id; })[0]; }
  function isLate(p){ return p.status === 'delayed' || p.status === 'on_hold'; }
  function count(f){
    return state.items.filter(function(p){
      return f === 'all' || (f === 'open' ? p.status !== 'closed' : f === 'late' ? isLate(p) : p.status === 'closed');
    }).length;
  }
  function visible(){
    var q = state.q.trim().toLowerCase(), digits = q.replace(/\D/g, '');
    return state.items.filter(function(p){
      var f = state.filter;
      if (f === 'open' && p.status === 'closed') return false;
      if (f === 'late' && !isLate(p)) return false;
      if (f === 'closed' && p.status !== 'closed') return false;
      if (!q) return true;
      var hay = [p.title, p.client_name, p.client_business, p.client_email, p.client_city, p.code, L.categories[p.category]].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0 || (digits.length >= 3 && String(p.client_phone || '').indexOf(digits) >= 0);
    }).sort(function(a, b){
      if ((a.status === 'closed') !== (b.status === 'closed')) return a.status === 'closed' ? 1 : -1;
      return a.status === 'closed' ? (b.closed_at || '') < (a.closed_at || '') ? -1 : 1 : a.deadline < b.deadline ? -1 : 1;
    });
  }

  /* ---------- top bar + login ---------- */
  function renderUser(){
    var s = A.session();
    if (!B.configured) userBox.innerHTML = '<span class="adm-badge">מצב הדגמה</span>';
    else if (s) userBox.innerHTML = '<span class="adm-email">' + esc(s.email || '') + '</span><button class="adm-btn ghost" type="button" data-act="logout">יציאה</button>';
    else userBox.innerHTML = '';
  }
  function showLogin(msg){
    renderUser();
    app.innerHTML =
      '<form class="adm-login" data-form="login" novalidate>' +
        '<img src="../assets/logo/bonim-mark.svg" alt="" width="48" height="48">' +
        '<h1>כניסה לפרויקטים</h1><p>רק לבעלי החשבון.</p>' +
        '<label><span>אימייל</span><input name="email" type="email" autocomplete="username" dir="ltr" required></label>' +
        '<label><span>סיסמה</span><input name="password" type="password" autocomplete="current-password" dir="ltr" required></label>' +
        (msg ? '<p class="adm-err" role="alert">' + esc(msg) + '</p>' : '') +
        '<button class="adm-btn solid" type="submit">כניסה</button>' +
      '</form>';
    var f = app.querySelector('input[name="email"]'); if (f) f.focus();
  }

  /* ---------- list ---------- */
  function steps(p){
    return '<span class="adm-steps" aria-hidden="true">' + p.stages.map(function(s){ return '<i class="s-' + s.state + '"></i>'; }).join('') + '</span>';
  }
  function card(p){
    var d = due(p), pr = PJ.progress(p), cur = p.stages[PJ.currentStage(p)];
    return '<li><button type="button" class="adm-proj st-' + p.status + '" data-act="view" data-id="' + esc(p.id) + '" style="--svc:' + (CAT_COLOR[p.category] || CAT_COLOR.other) + '">' +
      '<span class="adm-proj-top"><span class="adm-topic"><i></i>' + esc(L.categories[p.category] || '') + '</span><span class="adm-pill st-' + p.status + '">' + STATUS[p.status] + '</span></span>' +
      '<b class="adm-proj-title" dir="auto">' + esc(p.title) + '</b>' +
      '<span class="adm-proj-client" dir="auto">' + esc(p.client_name) + (p.client_business ? ' · ' + esc(p.client_business) : '') + '</span>' +
      '<span class="adm-proj-stage">' + steps(p) + '<span>' + (p.status === 'closed' ? 'הושלם' : 'שלב ' + (PJ.currentStage(p) + 1) + ': ' + esc(L.stages[cur.k])) + '</span><b>' + pr + '%</b></span>' +
      '<span class="adm-bar"><i style="width:' + pr + '%"></i></span>' +
      '<span class="adm-proj-foot"><bdi class="adm-code" dir="ltr">' + esc(p.code) + '</bdi><span class="adm-due ' + d.c + '">' + d.t + '</span></span>' +
    '</button></li>';
  }
  function listView(){
    var list = visible(), late = count('late');
    return '<div class="adm-head">' +
        '<div class="adm-title"><h1>פרויקטים</h1><p><b>' + count('open') + '</b> פעילים' +
          (late ? ' · <b class="adm-fresh">' + late + ' בעיכוב</b>' : '') +
          (state.loading ? ' · <span class="adm-muted">טוען…</span>' : '') + '</p></div>' +
        '<div class="adm-tools">' +
          '<label class="adm-search">' + icon(I.search, 'adm-i-sm') +
            '<input type="search" data-q placeholder="חיפוש לפי לקוח, פרויקט או קוד" value="' + esc(state.q) + '" aria-label="חיפוש"></label>' +
          '<button class="adm-icon-btn" type="button" data-act="refresh" aria-label="רענון">' + icon(I.refresh) + '</button>' +
          '<button class="adm-btn solid" type="button" data-act="new">' + icon(I.plus, 'adm-i-sm') + 'פרויקט חדש</button>' +
        '</div></div>' +
      '<div class="adm-seg adm-filters" role="tablist">' + FILTERS.map(function(f){
        var n = count(f[0]), on = state.filter === f[0];
        return '<button type="button" role="tab" data-act="filter" data-v="' + f[0] + '" aria-selected="' + on + '"' + (on ? ' class="on"' : '') + '>' +
          f[1] + (n ? '<span class="adm-seg-n">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      (B.configured ? '' : '<p class="adm-demo">מצב הדגמה: הפרויקטים נשמרים רק בדפדפן הזה, ואפשר לבדוק אותם בדף המעקב באותו דפדפן (למשל עם הקוד <code>BD-DEMO-2026</code>). כדי לשמור באמת, הריצו את <code>supabase/projects-schema.sql</code> ומלאו את פרטי Supabase ב־<code>assets/booking/config.js</code>.</p>') +
      (state.error ? '<p class="adm-err" role="alert">' + esc(state.error) + '</p>' : '') +
      (list.length ? '<ul class="adm-projs">' + list.map(card).join('') + '</ul>'
        : (state.loading ? '' : '<div class="adm-none">' + icon(I.folder) + '<p>' +
          (state.q ? 'לא נמצאו פרויקטים שמתאימים לחיפוש.' : state.filter === 'late' ? 'אין פרויקטים בעיכוב.' : state.filter === 'closed' ? 'עוד אין פרויקטים סגורים.' : 'עוד אין פרויקטים. לחצו על "פרויקט חדש" כדי לפתוח את הראשון.') +
          '</p></div>'));
  }

  /* ---------- detail ---------- */
  function trackLink(p){ return new URL('../track.html?code=' + encodeURIComponent(p.code), location.href).href; }
  function clientMessage(p){
    var he = p.client_lang !== 'en', PL = PJ.L[he ? 'he' : 'en'], first = String(p.client_name || '').trim().split(/\s+/)[0];
    var dl = new Intl.DateTimeFormat(he ? 'he-IL' : 'en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(utcOf(p.deadline)));
    var bullets = function(a){ return a.map(function(x){ return '• ' + x; }).join('\n'); };
    var stagesTxt = PJ.stages.map(function(k, i){ return (i + 1) + '. ' + PL.stages[k] + (k === 'edits' ? (he ? ' (אם צריך)' : ' (if needed)') : ''); }).join('\n');
    var out = he
      ? ['שלום ' + first + ',', '', 'הפרויקט "' + p.title + '" נפתח אצלנו בבונים דיגיטל.', '', 'קוד מעקב: ' + p.code, 'סיסמה: ' + (p.access_pass || ''), 'מעקב אחרי ההתקדמות: ' + trackLink(p), '', 'סוג: ' + PL.categories[p.category], 'תאריך יעד: ' + dl]
      : ['Hi ' + first + ',', '', 'Your project "' + p.title + '" is now open at Bonim Digital.', '', 'Tracking code: ' + p.code, 'Password: ' + (p.access_pass || ''), 'Track the progress: ' + trackLink(p), '', 'Type: ' + PL.categories[p.category], 'Deadline: ' + dl];
    if (p.summary) out.push('', p.summary);
    if ((p.requirements || []).length) out.push('', he ? 'מה נבנה:' : 'What we will build:', bullets(p.requirements));
    if ((p.tips || []).length) out.push('', he ? 'הטיפים שלנו:' : 'Our recommendations:', bullets(p.tips));
    out.push('', he ? 'שלבי העבודה:' : 'The stages:', stagesTxt, '',
      he ? 'לכל שאלה אפשר לכתוב לנו בוואטסאפ: https://wa.me/' + WA : 'Any question? Message us on WhatsApp: https://wa.me/' + WA,
      he ? 'בונים דיגיטל' : 'Bonim Digital');
    return { subject: he ? 'קוד מעקב לפרויקט שלך — ' + p.code : 'Your project tracking code — ' + p.code, body: out.join('\n') };
  }
  function row(k, v){ return v ? '<div class="adm-row"><span>' + k + '</span><b>' + v + '</b></div>' : ''; }
  function listBlock(title, items){
    return items && items.length ? '<div class="adm-sub"><h3>' + title + '</h3><ul class="adm-bullets">' + items.map(function(x){ return '<li dir="auto">' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '';
  }
  function stageBlock(p, s, i){
    var closed = p.status === 'closed', locked = closed || s.state === 'skipped';
    var tasks = s.tasks.map(function(t, j){
      return '<li><label class="adm-task' + (t.done ? ' done' : '') + '"><input type="checkbox" data-act="task" data-s="' + i + '" data-t="' + j + '"' + (t.done ? ' checked' : '') + (locked ? ' disabled' : '') + '>' +
        '<span dir="auto">' + esc(PJ.taskLabel(t, 'he')) + '</span></label>' +
        (!t.k && !locked ? '<button class="adm-x" type="button" data-act="del-task" data-s="' + i + '" data-t="' + j + '" aria-label="מחיקת המשימה">' + icon(I.close, 'adm-i-sm') + '</button>' : '') + '</li>';
    }).join('');
    var acts = '';
    if (!closed) {
      if (s.state === 'active') acts += '<button class="adm-btn solid sm" type="button" data-act="finish" data-s="' + i + '">' + icon(I.check, 'adm-i-sm') + 'סיום השלב</button>';
      else if (s.state !== 'skipped') acts += '<button class="adm-btn sm" type="button" data-act="goto" data-s="' + i + '">העברה לשלב הזה</button>';
      if (s.k === 'edits' && s.state === 'pending') acts += '<button class="adm-btn ghost" type="button" data-act="skip" data-s="' + i + '" data-v="1">לא נדרש</button>';
      if (s.k === 'edits' && s.state === 'skipped') acts += '<button class="adm-btn ghost" type="button" data-act="skip" data-s="' + i + '" data-v="0">נדרש בכל זאת</button>';
    }
    var when = s.done_at ? 'הושלם ' + fmt(new Date(s.done_at), { day: 'numeric', month: 'short' }) : s.started_at ? 'התחיל ' + fmt(new Date(s.started_at), { day: 'numeric', month: 'short' }) : '';
    return '<li class="adm-stage s-' + s.state + '">' +
      '<div class="adm-stage-head"><span class="adm-stage-n">' + (s.state === 'done' ? icon(I.check, 'adm-i-sm') : i + 1) + '</span>' +
        '<div class="adm-stage-t"><b>' + esc(L.stages[s.k]) + (s.k === 'edits' ? ' <em>(אם צריך)</em>' : '') + '</b><span>' + STAGE_STATE[s.state] + (when ? ' · ' + when : '') + '</span></div>' +
        (acts ? '<div class="adm-stage-acts">' + acts + '</div>' : '') + '</div>' +
      '<p class="adm-stage-desc">' + esc(L.stageDesc[s.k]) + '</p>' +
      '<ul class="adm-tasks">' + tasks + '</ul>' +
      (locked ? '' : '<form class="adm-addtask" data-form="task" data-s="' + i + '"><input name="t" maxlength="120" placeholder="משימה נוספת לשלב הזה…" aria-label="משימה נוספת"><button class="adm-btn ghost" type="submit">הוספה</button></form>') +
    '</li>';
  }
  function timeline(p){
    var ups = (p.updates || []).slice().sort(function(a, b){ return b.at < a.at ? -1 : 1; });
    if (!ups.length) return '<p class="adm-muted">עוד אין עדכונים.</p>';
    return '<ol class="adm-tl">' + ups.map(function(u){
      return '<li class="k-' + esc(u.kind) + (u.public === false ? ' internal' : '') + '">' +
        '<div class="adm-tl-top"><b>' + esc(PJ.updateTitle(u, 'he')) + '</b>' + (u.public === false ? '<span class="adm-tag">פנימי</span>' : '') +
          '<time datetime="' + esc(u.at) + '">' + fmtAt(u.at) + '</time>' +
          '<button class="adm-x" type="button" data-act="del-update" data-u="' + esc(u.id) + '" aria-label="מחיקת העדכון">' + icon(I.close, 'adm-i-sm') + '</button></div>' +
        (u.text ? '<p dir="auto">' + esc(u.text) + '</p>' : '') +
        (u.until ? '<p class="adm-tl-until">תאריך משוער חדש: ' + fmtDay(u.until) + '</p>' : '') +
      '</li>';
    }).join('') + '</ol>';
  }
  function detailView(p){
    var d = due(p), pr = PJ.progress(p), closed = p.status === 'closed', msg = clientMessage(p);
    var mail = p.client_email ? 'mailto:' + encodeURIComponent(p.client_email) + '?subject=' + encodeURIComponent(msg.subject) + '&body=' + encodeURIComponent(msg.body) : '';
    return '<div class="adm-head">' +
        '<div class="adm-title"><button class="adm-back" type="button" data-act="back">' + icon(I.back, 'adm-i-sm') + 'כל הפרויקטים</button>' +
          '<h1 dir="auto">' + esc(p.title) + '</h1>' +
          '<p><span class="adm-pill st-' + p.status + '">' + STATUS[p.status] + '</span> · ' + esc(L.categories[p.category]) + ' · <bdi class="adm-code" dir="ltr">' + esc(p.code) + '</bdi></p></div>' +
        '<div class="adm-tools">' +
          '<button class="adm-btn" type="button" data-act="edit">' + icon(I.edit, 'adm-i-sm') + 'עריכה</button>' +
          (closed ? '<button class="adm-btn" type="button" data-act="reopen">' + icon(I.play, 'adm-i-sm') + 'פתיחה מחדש</button>'
            : (isLate(p) ? '<button class="adm-btn" type="button" data-act="resume">' + icon(I.play, 'adm-i-sm') + 'חזרה למסלול</button>'
              : '<button class="adm-btn" type="button" data-act="delay">' + icon(I.pause, 'adm-i-sm') + 'עיכוב / השהיה</button>') +
              '<button class="adm-btn solid" type="button" data-act="close-project">' + icon(I.check, 'adm-i-sm') + 'סגירת פרויקט</button>') +
          '<button class="adm-icon-btn danger" type="button" data-act="delete" aria-label="מחיקת הפרויקט">' + icon(I.trash) + '</button>' +
        '</div></div>' +
      (isLate(p) ? '<div class="adm-alert">' + icon(I.alert) + '<div><b>' + (p.status === 'delayed' ? 'הפרויקט בעיכוב' : 'הפרויקט תקוע / ממתין') + '</b>' +
        (p.delay_reason ? '<p dir="auto">' + esc(p.delay_reason) + '</p>' : '') +
        (p.delay_until ? '<p>תאריך משוער חדש: ' + fmtDay(p.delay_until) + '</p>' : '') + '<small>הלקוח רואה את ההודעה הזו בדף המעקב.</small></div></div>' : '') +
      '<div class="adm-pd">' +
        '<div class="adm-pd-main">' +
          '<section class="adm-card"><div class="adm-card-head"><h2>התקדמות</h2><b class="adm-pct">' + pr + '%</b></div>' +
            '<div class="adm-bar lg"><i style="width:' + pr + '%"></i></div>' +
            '<ol class="adm-stages">' + p.stages.map(function(s, i){ return stageBlock(p, s, i); }).join('') + '</ol></section>' +
          '<section class="adm-card"><div class="adm-card-head"><h2>עדכונים</h2></div>' +
            '<form class="adm-upd" data-form="update"><textarea name="text" rows="2" maxlength="1000" placeholder="מה חדש בפרויקט? למשל: העיצוב מוכן ונשלח לאישור" aria-label="עדכון חדש"></textarea>' +
              '<div class="adm-upd-row"><label class="adm-check"><input type="checkbox" name="public" checked>הלקוח יראה את העדכון בדף המעקב</label>' +
              '<button class="adm-btn solid" type="submit">הוספת עדכון</button></div></form>' +
            timeline(p) + '</section>' +
        '</div>' +
        '<aside class="adm-pd-side">' +
          '<section class="adm-card"><div class="adm-card-head"><h2>שליחה ללקוח</h2></div>' +
            '<div class="adm-codebox"><span>קוד מעקב</span><bdi dir="ltr">' + esc(p.code) + '</bdi></div>' +
            '<div class="adm-codebox"><span>סיסמה</span><bdi dir="ltr">' + (p.access_pass ? esc(p.access_pass) : '—') + '</bdi></div>' +
            '<div class="adm-share">' +
              '<button class="adm-btn" type="button" data-act="copy" data-v="code">' + icon(I.copy, 'adm-i-sm') + 'העתקת קוד</button>' +
              '<button class="adm-btn" type="button" data-act="copy" data-v="pass"' + (p.access_pass ? '' : ' disabled') + '>' + icon(I.copy, 'adm-i-sm') + 'העתקת סיסמה</button>' +
              '<button class="adm-btn" type="button" data-act="copy" data-v="link">' + icon(I.link, 'adm-i-sm') + 'העתקת קישור</button>' +
              '<a class="adm-btn" href="' + esc(trackLink(p)) + '" target="_blank" rel="noopener">' + icon(I.open, 'adm-i-sm') + 'דף המעקב</a>' +
              '<button class="adm-btn" type="button" data-act="copy" data-v="msg">' + icon(I.copy, 'adm-i-sm') + 'העתקת ההודעה</button>' +
              (mail ? '<a class="adm-btn" href="' + esc(mail) + '">' + icon(I.mail, 'adm-i-sm') + 'שליחה במייל</a>' : '<span class="adm-btn off" title="אין אימייל ללקוח">' + icon(I.mail, 'adm-i-sm') + 'אין אימייל</span>') +
              (p.client_phone ? '<a class="adm-btn wa" href="https://wa.me/' + esc(intl(p.client_phone)) + '?text=' + encodeURIComponent(msg.body) + '" target="_blank" rel="noopener noreferrer">' + icon(I.chat, 'adm-i-sm') + 'וואטסאפ</a>' : '<span class="adm-btn off" title="אין טלפון ללקוח">' + icon(I.chat, 'adm-i-sm') + 'אין טלפון</span>') +
            '</div><p class="adm-hint">ההודעה כוללת את הקוד, הסיסמה, הקישור, תאריך היעד, הדרישות והטיפים. שליחת מייל אוטומטית תחובר בהמשך. בינתיים "שליחה במייל" פותח טיוטה מוכנה.</p></section>' +
          '<section class="adm-card"><div class="adm-card-head"><h2>לקוח</h2></div>' +
            '<p class="adm-client"><b dir="auto">' + esc(p.client_name) + '</b>' + (p.client_business ? '<span dir="auto">' + esc(p.client_business) + '</span>' : '') + '</p>' +
            (p.client_phone ? '<div class="adm-quick"><a class="adm-btn" href="tel:' + esc(p.client_phone) + '">' + icon(I.phone, 'adm-i-sm') + 'התקשרות</a>' +
              '<a class="adm-btn wa" href="https://wa.me/' + esc(intl(p.client_phone)) + '" target="_blank" rel="noopener noreferrer">' + icon(I.chat, 'adm-i-sm') + 'וואטסאפ</a></div>' : '') +
            '<div class="adm-rows">' +
              row('טלפון', p.client_phone ? '<a dir="ltr" href="tel:' + esc(p.client_phone) + '">' + esc(B.formatPhone(p.client_phone)) + '</a>' : '<span class="adm-muted">חסר. אפשר להוסיף בעריכה</span>') +
              row('אימייל', p.client_email ? '<a dir="ltr" href="mailto:' + esc(p.client_email) + '">' + esc(p.client_email) + '</a>' : '') +
              row('עיר', esc(p.client_city)) +
              row('שפה', p.client_lang === 'en' ? 'אנגלית' : 'עברית') +
            '</div></section>' +
          '<section class="adm-card"><div class="adm-card-head"><h2>פרטי הפרויקט</h2></div>' +
            '<div class="adm-rows">' +
              row('התחלה', fmtDay(p.start_date)) +
              row('דדליין', fmtDay(p.deadline) + ' <span class="adm-due ' + d.c + '">' + d.t + '</span>') +
              row('נפתח', fmt(new Date(p.created_at), { day: 'numeric', month: 'short', year: 'numeric' })) +
              row('קוד מעקב', '<bdi class="adm-code" dir="ltr">' + esc(p.code) + '</bdi>') +
              row('סיסמת מעקב', (p.access_pass ? '<bdi class="adm-code" dir="ltr">' + esc(p.access_pass) + '</bdi>' : '<span class="adm-muted">אין סיסמה</span>') +
                ' <button class="adm-btn ghost sm" type="button" data-act="new-pass">' + icon(I.refresh, 'adm-i-sm') + (p.access_pass ? 'סיסמה חדשה' : 'יצירת סיסמה') + '</button>') +
            '</div>' +
            '<label class="adm-check adm-show"><input type="checkbox" data-act="showcase"' + (p.showcase ? ' checked' : '') + '>פרויקט לדוגמה: נפתח עם הקוד בלבד, בלי סיסמה (רק לפרויקטים שמקושרים מהאתר)</label>' +
            (p.summary ? '<div class="adm-sub"><h3>תקציר</h3><p dir="auto">' + esc(p.summary) + '</p></div>' : '') +
            listBlock('דרישות הלקוח', p.requirements) +
            listBlock('הטיפים שלנו', p.tips) +
            (p.admin_note ? '<div class="adm-sub"><h3>הערה פנימית</h3><p dir="auto">' + esc(p.admin_note) + '</p></div>' : '') +
          '</section>' +
        '</aside>' +
      '</div>';
  }

  function render(){
    renderUser();
    var focused = document.activeElement && document.activeElement.matches && document.activeElement.matches('[data-q]');
    var caret = focused ? document.activeElement.selectionStart : null;
    var p = state.view && find(state.view);
    if (state.view && !p && !state.loading) { state.view = null; setHash(''); }
    app.innerHTML = p ? detailView(p) : listView();
    if (focused) { var q = app.querySelector('[data-q]'); if (q) { q.focus(); if (caret != null) q.setSelectionRange(caret, caret); } }
  }
  function setHash(id){ history.replaceState(null, '', location.pathname + location.search + (id ? '#' + encodeURIComponent(id) : '')); }

  /* ---------- modals ---------- */
  function field(name, label, value, o){
    o = o || {};
    return '<label class="adm-field' + (o.full ? ' full' : '') + '"><span>' + label + (o.req ? ' <i class="adm-req">*</i>' : '') + '</span>' +
      '<input name="' + name + '" type="' + (o.type || 'text') + '" value="' + esc(value) + '"' + (o.dir ? ' dir="' + o.dir + '"' : '') +
      (o.max ? ' maxlength="' + o.max + '"' : '') + (o.req ? ' required' : '') + (o.auto ? ' autocomplete="' + o.auto + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '></label>';
  }
  function area(name, label, value, o){
    o = o || {};
    return '<label class="adm-field full"><span>' + label + '</span>' + (o.hint ? '<small>' + o.hint + '</small>' : '') +
      '<textarea name="' + name + '" rows="' + (o.rows || 3) + '" maxlength="' + (o.max || 2000) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>' + esc(value) + '</textarea></label>';
  }
  function select(name, label, value, opts){
    return '<label class="adm-field"><span>' + label + '</span><select name="' + name + '">' + opts.map(function(o){
      return '<option value="' + o[0] + '"' + (o[0] === value ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('') + '</select></label>';
  }
  function modalHead(title){
    return '<div class="adm-modal-head"><h2 id="adm-m-title">' + title + '</h2><button class="adm-icon-btn" type="button" data-act="modal-close" aria-label="סגירה">' + icon(I.close) + '</button></div>';
  }
  function projectForm(p){
    var v = p || { client_lang: 'he', category: 'website', start_date: todayYmd(), deadline: '', requirements: [], tips: [] };
    var withEdits = p ? p.stages.some(function(s){ return s.k === 'edits' && s.state !== 'skipped'; }) : true;
    return '<form class="adm-modal wide" data-form="project" role="dialog" aria-modal="true" aria-labelledby="adm-m-title" novalidate>' +
      modalHead(p ? 'עריכת פרויקט' : 'פרויקט חדש') +
      '<fieldset class="adm-fs"><legend>פרטי הלקוח</legend><div class="adm-grid2">' +
        field('client_name', 'שם מלא', v.client_name, { req: 1, max: 80 }) +
        field('client_business', 'שם העסק', v.client_business, { max: 120 }) +
        field('client_phone', 'טלפון', v.client_phone ? B.formatPhone(v.client_phone) : '', { req: 1, type: 'tel', dir: 'ltr', ph: '050-000-0000' }) +
        field('client_email', 'אימייל (לשליחת קוד המעקב)', v.client_email, { type: 'email', dir: 'ltr', max: 120 }) +
        field('client_city', 'עיר', v.client_city, { max: 80 }) +
        select('client_lang', 'שפת הלקוח', v.client_lang, [['he', 'עברית'], ['en', 'אנגלית']]) +
      '</div></fieldset>' +
      '<fieldset class="adm-fs"><legend>הפרויקט</legend><div class="adm-grid2">' +
        field('title', 'נושא הפרויקט', v.title, { req: 1, max: 120, full: 1, ph: 'למשל: אתר + מערכת תורים לסטודיו' }) +
        select('category', 'סוג', v.category, PJ.categories.map(function(k){ return [k, L.categories[k]]; })) +
        '<span></span>' +
        field('start_date', 'תאריך התחלה', v.start_date, { type: 'date', dir: 'ltr' }) +
        field('deadline', 'דדליין', v.deadline, { type: 'date', dir: 'ltr', req: 1 }) +
        area('summary', 'תקציר (הלקוח רואה אותו)', v.summary, { rows: 2 }) +
      '</div></fieldset>' +
      '<fieldset class="adm-fs"><legend>דרישות וטיפים</legend>' +
        area('requirements', 'הדרישות של הלקוח', (v.requirements || []).join('\n'), { hint: 'נקודה בכל שורה', rows: 4, ph: 'הזמנת תורים אונליין\nתזכורת SMS יום לפני' }) +
        area('tips', 'טיפים לשיפור מהניסיון שלנו', (v.tips || []).join('\n'), { hint: 'טיפ בכל שורה', rows: 3 }) +
      '</fieldset>' +
      '<fieldset class="adm-fs"><legend>שלבים</legend>' +
        '<ol class="adm-stage-preview">' + PJ.stages.map(function(k){ return '<li><b>' + L.stages[k] + '</b><span>' + L.stageDesc[k] + '</span></li>'; }).join('') + '</ol>' +
        '<label class="adm-check"><input type="checkbox" name="with_edits"' + (withEdits ? ' checked' : '') + '>לכלול את שלב 4: תיקונים קטנים (אפשר לשנות אחר כך)</label>' +
      '</fieldset>' +
      area('admin_note', 'הערה פנימית (רק לנו)', v.admin_note, { rows: 2, max: 1000 }) +
      '<p class="adm-err" data-err role="alert" hidden></p>' +
      '<div class="adm-modal-actions"><button class="adm-btn solid" type="submit">' + (p ? 'שמירה' : 'יצירת פרויקט') + '</button>' +
        '<button class="adm-btn" type="button" data-act="modal-close">ביטול</button></div>' +
    '</form>';
  }
  function delayForm(p){
    return '<form class="adm-modal" data-form="delay" role="dialog" aria-modal="true" aria-labelledby="adm-m-title" novalidate>' +
      modalHead('עיכוב או השהיה') +
      '<div class="adm-field"><span>מה קרה?</span><div class="adm-radios">' +
        '<label><input type="radio" name="kind" value="delayed" checked><b>עיכוב</b><small>העבודה ממשיכה, אבל יותר לאט מהמתוכנן</small></label>' +
        '<label><input type="radio" name="kind" value="on_hold"><b>תקוע / ממתין</b><small>אי אפשר להתקדם עד שמשהו יקרה, למשל חומרים מהלקוח</small></label>' +
      '</div></div>' +
      area('reason', 'הסיבה (הלקוח יראה אותה בדף המעקב)', '', { rows: 3, max: 500, ph: 'למשל: ממתינים לתמונות המוצרים' }) +
      field('until', 'תאריך משוער חדש (לא חובה)', '', { type: 'date', dir: 'ltr' }) +
      '<label class="adm-check"><input type="checkbox" name="move_deadline">לעדכן גם את הדדליין לתאריך הזה</label>' +
      '<p class="adm-err" data-err role="alert" hidden></p>' +
      '<div class="adm-modal-actions"><button class="adm-btn solid" type="submit">שמירה</button><button class="adm-btn" type="button" data-act="modal-close">ביטול</button></div>' +
    '</form>';
  }
  function openModal(kind){
    state.modal = kind;
    var p = find(state.view);
    modalRoot.innerHTML = '<div class="adm-backdrop" data-act="modal-close"></div>' + (kind === 'delay' ? delayForm(p) : projectForm(kind === 'edit' ? p : null));
    document.body.classList.add('adm-lock');
    var f = modalRoot.querySelector('input:not([type=radio]),textarea'); if (f) f.focus();
  }
  function closeModal(){ state.modal = null; modalRoot.innerHTML = ''; document.body.classList.remove('adm-lock'); }
  function formError(form, msg){ var e = form.querySelector('[data-err]'); e.textContent = msg; e.hidden = !msg; if (msg) e.scrollIntoView({ block: 'nearest' }); }
  function busyBtn(form, on, label){ var b = form.querySelector('[type=submit]'); if (!b) return; if (on) { b.dataset.label = b.textContent; b.textContent = 'שומר…'; } else b.textContent = label || b.dataset.label; b.disabled = on; }

  /* ---------- saving ---------- */
  function upd(list, u){ list.push(Object.assign({ id: PJ.uid(), at: new Date().toISOString(), public: true }, u)); return list; }
  function fail(e, form){
    state.saving = false;
    if (form) busyBtn(form, false);
    if (e && e.code === 'auth') { closeModal(); A.logout(); showLogin('החיבור פג. התחברו שוב.'); return; }
    var msg = e && e.code === 'invalid' ? 'חלק מהפרטים לא תקינים. בדקו טלפון, אימייל ותאריכים.' : e && e.code === 'network' ? 'אין חיבור לשרת. נסו שוב.' : 'השמירה נכשלה. נסו שוב.';
    if (form) formError(form, msg); else alert(msg);
  }
  function commit(p, patch, form){
    if (state.saving) return Promise.resolve();
    state.saving = true;
    if (form) busyBtn(form, true);
    return P.update(p.id, patch).then(function(){
      Object.assign(p, patch, { updated_at: new Date().toISOString() });
      state.saving = false;
      if (form) closeModal();
      render();
    }, function(e){ fail(e, form); render(); });
  }
  function setStage(p, idx){
    var stages = clone(p.stages), ups = clone(p.updates || []), now = new Date().toISOString();
    var prev = -1;
    stages.forEach(function(s, i){ if (s.state === 'active') prev = i; });
    stages.forEach(function(s, i){
      if (i < idx) { if (s.state !== 'skipped' && s.state !== 'done') { s.state = 'done'; s.done_at = now; s.started_at = s.started_at || now; } }
      else if (i === idx) { s.state = 'active'; s.started_at = s.started_at || now; s.done_at = null; }
      else if (s.state !== 'skipped') { s.state = 'pending'; s.done_at = null; }
    });
    if (prev >= 0 && prev < idx) upd(ups, { kind: 'stage_done', stage: stages[prev].k });
    upd(ups, { kind: 'stage_start', stage: stages[idx].k });
    return commit(p, { stages: stages, updates: ups });
  }
  function closeProject(p){
    var stages = clone(p.stages), ups = clone(p.updates || []), now = new Date().toISOString();
    stages.forEach(function(s){
      if (s.state === 'skipped') return;
      if (s.k === 'edits' && s.state === 'pending') { s.state = 'skipped'; return; }
      if (s.state !== 'done') { s.state = 'done'; s.started_at = s.started_at || now; s.done_at = now; }
    });
    upd(ups, { kind: 'closed' });
    return commit(p, { status: 'closed', closed_at: now, delay_reason: null, delay_until: null, stages: stages, updates: ups });
  }
  function readProjectForm(form){
    var g = function(n){ return (form.elements[n] && form.elements[n].value || '').trim(); };
    var lines = function(n){ return g(n).split(/\r?\n/).map(function(x){ return x.replace(/^[\s•\-*]+/, '').trim(); }).filter(Boolean).slice(0, 30); };
    var v = {
      client_name: g('client_name'), client_business: g('client_business') || null, client_phone: B.normalizePhone(g('client_phone')),
      client_email: g('client_email') || null, client_city: g('client_city') || null, client_lang: g('client_lang') === 'en' ? 'en' : 'he',
      title: g('title'), category: g('category'), summary: g('summary') || null,
      start_date: g('start_date') || todayYmd(), deadline: g('deadline'),
      requirements: lines('requirements'), tips: lines('tips'), admin_note: g('admin_note') || null
    };
    var err = v.client_name.length < 2 ? 'נא למלא את שם הלקוח.'
      : !B.validPhone(v.client_phone) ? 'מספר הטלפון לא תקין.'
      : v.client_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.client_email) ? 'כתובת האימייל לא תקינה.'
      : v.title.length < 2 ? 'נא למלא את נושא הפרויקט.'
      : !/^\d{4}-\d{2}-\d{2}$/.test(v.deadline) ? 'נא לבחור דדליין.'
      : v.deadline < v.start_date ? 'הדדליין לא יכול להיות לפני תאריך ההתחלה.' : '';
    return { v: v, err: err, withEdits: form.elements.with_edits.checked };
  }
  function saveProject(form){
    var r = readProjectForm(form);
    if (r.err) { formError(form, r.err); return; }
    formError(form, '');
    var p = state.modal === 'edit' && find(state.view);
    if (p) {
      var patch = r.v, stages = clone(p.stages), ups = clone(p.updates || []);
      stages.forEach(function(s){
        if (s.k !== 'edits') return;
        if (!r.withEdits && s.state === 'pending') s.state = 'skipped';
        if (r.withEdits && s.state === 'skipped') s.state = 'pending';
      });
      patch.stages = stages;
      if (r.v.deadline !== p.deadline) { upd(ups, { kind: 'deadline', until: r.v.deadline }); patch.updates = ups; }
      commit(p, patch, form);
      return;
    }
    if (state.saving) return;
    state.saving = true; busyBtn(form, true);
    var row = Object.assign(r.v, { status: 'active', stages: PJ.freshStages(r.withEdits), updates: upd([], { kind: 'created' }) });
    P.create(row).then(function(created){
      state.saving = false;
      if (!created) { load(); closeModal(); return; }
      state.items.unshift(created); state.view = created.id; setHash(created.id);
      closeModal(); render(); window.scrollTo(0, 0);
      toast('הפרויקט נוצר. קוד: ' + created.code + (created.access_pass ? ' · סיסמה: ' + created.access_pass : ''));
    }, function(e){ fail(e, form); });
  }
  function saveDelay(form){
    var p = find(state.view); if (!p) return;
    var kind = form.elements.kind.value === 'on_hold' ? 'on_hold' : 'delayed';
    var reason = form.elements.reason.value.trim(), until = form.elements.until.value;
    if (reason.length < 3) { formError(form, 'נא לכתוב סיבה קצרה. הלקוח יראה אותה.'); return; }
    if (until && until < todayYmd()) { formError(form, 'התאריך המשוער כבר עבר.'); return; }
    if (form.elements.move_deadline.checked && !until) { formError(form, 'כדי לעדכן את הדדליין צריך לבחור תאריך.'); return; }
    var ups = upd(clone(p.updates || []), { kind: kind === 'delayed' ? 'delay' : 'hold', text: reason, until: until || null });
    var patch = { status: kind, delay_reason: reason, delay_until: until || null, updates: ups };
    if (form.elements.move_deadline.checked && until) patch.deadline = until < p.start_date ? p.start_date : until;
    commit(p, patch, form);
  }

  var toastT;
  function toast(msg){
    var t = document.querySelector('.adm-toast');
    if (!t) { t = document.createElement('div'); t.className = 'adm-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove('on'); }, 2600);
  }
  function copy(text, label){
    var ok = function(){ toast(label + ' הועתק'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function(){ window.prompt('העתיקו:', text); });
    else window.prompt('העתיקו:', text);
  }

  /* ---------- events ---------- */
  function onAct(el){
    var act = el.getAttribute('data-act'), p = state.view && find(state.view);
    if (act === 'logout') { A.logout(); state.items = []; showLogin(); return; }
    if (act === 'refresh') { load(); return; }
    if (act === 'filter') { state.filter = el.getAttribute('data-v'); render(); return; }
    if (act === 'new') { openModal('new'); return; }
    if (act === 'modal-close') { closeModal(); return; }
    if (act === 'view') { state.view = el.getAttribute('data-id'); setHash(state.view); render(); window.scrollTo(0, 0); return; }
    if (act === 'back') { state.view = null; setHash(''); render(); return; }
    if (!p) return;
    if (act === 'edit') { openModal('edit'); return; }
    if (act === 'delay') { openModal('delay'); return; }
    if (act === 'resume') { commit(p, { status: 'active', delay_reason: null, delay_until: null, updates: upd(clone(p.updates || []), { kind: 'resume' }) }); return; }
    if (act === 'close-project') { if (confirm('לסגור את הפרויקט ולסמן אותו כנמסר?')) closeProject(p); return; }
    if (act === 'reopen') {
      var st = clone(p.stages), now = new Date().toISOString(), last = st.length - 1;
      st[last].state = 'active'; st[last].started_at = now; st[last].done_at = null;
      commit(p, { status: 'active', closed_at: null, stages: st, updates: upd(clone(p.updates || []), { kind: 'reopened' }) });
      return;
    }
    if (act === 'delete') {
      if (!confirm('למחוק את הפרויקט "' + p.title + '"? הלקוח לא יוכל לעקוב אחריו יותר, ואי אפשר לבטל את זה.')) return;
      P.remove(p.id).then(function(){
        state.items = state.items.filter(function(x){ return x.id !== p.id; });
        state.view = null; setHash(''); render(); toast('הפרויקט נמחק');
      }, function(e){ fail(e); });
      return;
    }
    if (act === 'new-pass') {
      if (p.access_pass && !confirm('ליצור סיסמה חדשה? הסיסמה הנוכחית תפסיק לעבוד, וצריך לשלוח ללקוח את החדשה.')) return;
      var np = PJ.newPass();
      commit(p, { access_pass: np }).then(function(){ if (p.access_pass === np) toast('נוצרה סיסמה חדשה: ' + np); });
      return;
    }
    if (act === 'showcase') { commit(p, { showcase: el.checked }); return; }
    var si = +el.getAttribute('data-s');
    if (act === 'goto') { setStage(p, si); return; }
    if (act === 'finish') {
      var next = -1;
      for (var i = si + 1; i < p.stages.length; i++) if (p.stages[i].state !== 'skipped') { next = i; break; }
      if (next >= 0) { setStage(p, next); return; }
      if (confirm('זה השלב האחרון. לסגור את הפרויקט ולסמן אותו כנמסר?')) closeProject(p);
      return;
    }
    if (act === 'skip') {
      var sk = clone(p.stages);
      sk[si].state = el.getAttribute('data-v') === '1' ? 'skipped' : 'pending';
      commit(p, { stages: sk });
      return;
    }
    if (act === 'task') {
      var tk = clone(p.stages);
      tk[si].tasks[+el.getAttribute('data-t')].done = el.checked;
      commit(p, { stages: tk });
      return;
    }
    if (act === 'del-task') {
      var dt = clone(p.stages);
      dt[si].tasks.splice(+el.getAttribute('data-t'), 1);
      commit(p, { stages: dt });
      return;
    }
    if (act === 'del-update') {
      if (!confirm('למחוק את העדכון?')) return;
      var uid = el.getAttribute('data-u');
      commit(p, { updates: (p.updates || []).filter(function(u){ return u.id !== uid; }) });
      return;
    }
    if (act === 'copy') {
      var what = el.getAttribute('data-v');
      if (what === 'code') copy(p.code, 'הקוד');
      else if (what === 'pass') copy(p.access_pass || '', 'הסיסמה');
      else if (what === 'link') copy(trackLink(p), 'הקישור');
      else { var m = clientMessage(p); copy(m.subject + '\n\n' + m.body, 'ההודעה'); }
    }
  }
  document.addEventListener('click', function(ev){
    var el = ev.target.closest('[data-act]'); if (!el || el.disabled) return;
    if (!app.contains(el) && !modalRoot.contains(el) && !userBox.contains(el)) return;
    if (el.tagName === 'A') return;
    onAct(el);
  });
  document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape' && state.modal) closeModal(); });
  app.addEventListener('input', function(ev){
    if (!ev.target.matches('[data-q]')) return;
    state.q = ev.target.value; render();
  });
  document.addEventListener('submit', function(ev){
    var form = ev.target.closest('[data-form]'); if (!form) return;
    ev.preventDefault();
    var kind = form.getAttribute('data-form'), p = state.view && find(state.view);
    if (kind === 'login') {
      var email = form.elements.email.value.trim(), pw = form.elements.password.value;
      if (!email || !pw) { showLogin('נא למלא אימייל וסיסמה.'); return; }
      var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'מתחבר…';
      A.login(email, pw).then(load, function(e){ showLogin(e.code === 'network' ? 'אין חיבור לשרת.' : 'אימייל או סיסמה שגויים.'); });
      return;
    }
    if (kind === 'project') { saveProject(form); return; }
    if (kind === 'delay') { saveDelay(form); return; }
    if (!p) return;
    if (kind === 'task') {
      var t = form.elements.t.value.trim(); if (!t) return;
      var st = clone(p.stages); st[+form.getAttribute('data-s')].tasks.push({ t: t, done: false });
      commit(p, { stages: st });
      return;
    }
    if (kind === 'update') {
      var text = form.elements.text.value.trim(); if (!text) { form.elements.text.focus(); return; }
      commit(p, { updates: upd(clone(p.updates || []), { kind: 'note', text: text, public: form.elements.public.checked }) });
    }
  });
  setInterval(function(){ if (!document.hidden && !state.modal && !state.view && (A.session() || !B.configured) && app.querySelector('.adm-head')) load(); }, 60000);

  if (location.hash.length > 1) state.view = decodeURIComponent(location.hash.slice(1));
  if (!B.configured || A.session()) load(); else showLogin();
})();
