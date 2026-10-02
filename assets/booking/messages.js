(function(){
  var B = window.BonimBooking; if (!B) return;
  var app = document.getElementById('adm-app');
  var userBox = document.getElementById('adm-user');
  var modalRoot = document.getElementById('adm-modal-root');
  var A = B.admin, M = A.messages, T = B.time;

  var TOPIC = {
    website:  { name: 'אתר חדש', color: '#C2410C' },
    booking:  { name: 'מערכת תורים', color: '#0B1B33' },
    store:    { name: 'חנות אונליין', color: '#3B6FE0' },
    app:      { name: 'אפליקציה', color: '#E0703A' },
    existing: { name: 'שיפור אתר קיים', color: '#52607A' },
    unsure:   { name: 'עוד לא בטוח', color: '#0038B8' }
  };
  var STATUS = { 'new': 'חדשה', in_progress: 'בטיפול', done: 'טופלה', spam: 'ספאם' };
  var FILTERS = [['all', 'הכל'], ['new', 'חדשות'], ['in_progress', 'בטיפול'], ['done', 'טופלו'], ['spam', 'ספאם']];

  var state = { items: [], filter: 'all', q: '', loading: false, error: '', open: null, saving: false };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(date, opts){ return new Intl.DateTimeFormat('he-IL', Object.assign({ timeZone: T.TZ }, opts)).format(date); }
  function topic(id){ return TOPIC[id] || TOPIC.unsure; }
  function icon(path, cls){ return '<svg class="' + (cls || 'adm-i') + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  var I = {
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    chat: '<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z"/>',
    mail: '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    inbox: '<path d="M4 13h4l2 3h4l2-3h4M5 5h14l1 8v6H4v-6z"/>'
  };

  function ago(iso){
    var d = new Date(iso), s = (Date.now() - d) / 1000;
    if (s < 60) return 'עכשיו';
    if (s < 3600) return 'לפני ' + Math.floor(s / 60) + ' דק׳';
    if (s < 86400) return 'לפני ' + Math.floor(s / 3600) + ' שע׳';
    if (s < 86400 * 2) return 'אתמול';
    if (s < 86400 * 7) return 'לפני ' + Math.floor(s / 86400) + ' ימים';
    return fmt(d, { day: 'numeric', month: 'short' });
  }
  function intl(phone){ return '972' + String(phone || '').replace(/\D/g, '').replace(/^0/, ''); }

  /* ---------- data ---------- */
  var seq = 0;
  function load(){
    var mine = ++seq;
    state.loading = true; state.error = ''; render();
    M.list().then(function(rows){
      if (mine !== seq) return;
      state.items = rows || []; state.loading = false; render();
    }, function(e){
      if (mine !== seq) return;
      state.loading = false;
      if (e.code === 'auth') { A.logout(); showLogin('החיבור פג. התחברו שוב.'); return; }
      state.error = e.code === 'network' ? 'אין חיבור לשרת. בדקו את האינטרנט ונסו שוב.' : 'לא הצלחנו לטעון את הפניות.';
      render();
    });
  }
  function changed(){ window.dispatchEvent(new Event('bonim-messages-changed')); }
  function visible(){
    var q = state.q.trim().toLowerCase(), digits = q.replace(/\D/g, '');
    return state.items.filter(function(m){
      if (state.filter === 'all' ? m.status === 'spam' : m.status !== state.filter) return false;
      if (!q) return true;
      var hay = [m.name, m.business, m.email, m.message, topic(m.topic).name].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0 || (digits.length >= 3 && String(m.phone || '').indexOf(digits) >= 0);
    });
  }
  function count(status){
    return state.items.filter(function(m){ return status === 'all' ? m.status !== 'spam' : m.status === status; }).length;
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
        '<h1>כניסה לפניות</h1><p>רק לבעלי החשבון.</p>' +
        '<label><span>אימייל</span><input name="email" type="email" autocomplete="username" dir="ltr" required></label>' +
        '<label><span>סיסמה</span><input name="password" type="password" autocomplete="current-password" dir="ltr" required></label>' +
        (msg ? '<p class="adm-err" role="alert">' + esc(msg) + '</p>' : '') +
        '<button class="adm-btn solid" type="submit">כניסה</button>' +
      '</form>';
    var f = app.querySelector('input[name="email"]'); if (f) f.focus();
  }

  /* ---------- inbox ---------- */
  function head(){
    var fresh = count('new');
    return '<div class="adm-head">' +
      '<div class="adm-title"><h1>פניות מהאתר</h1><p><b>' + count('all') + '</b> פניות' +
        (fresh ? ' · <b class="adm-fresh">' + fresh + ' חדשות</b>' : '') +
        (state.loading ? ' · <span class="adm-muted">טוען…</span>' : '') + '</p></div>' +
      '<div class="adm-tools">' +
        '<label class="adm-search">' + icon(I.search, 'adm-i-sm') +
          '<input type="search" data-q placeholder="חיפוש לפי שם, טלפון או מילה" value="' + esc(state.q) + '" aria-label="חיפוש"></label>' +
        '<button class="adm-icon-btn" type="button" data-act="refresh" aria-label="רענון">' + icon(I.refresh) + '</button>' +
      '</div></div>' +
      '<div class="adm-seg adm-filters" role="tablist">' + FILTERS.map(function(f){
        var n = count(f[0]), on = state.filter === f[0];
        return '<button type="button" role="tab" data-act="filter" data-v="' + f[0] + '" aria-selected="' + on + '"' + (on ? ' class="on"' : '') + '>' +
          f[1] + (n ? '<span class="adm-seg-n">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div>' +
      (B.configured ? '' : '<p class="adm-demo">מצב הדגמה: מוצגות פניות לדוגמה ופניות שנשלחו מהדפדפן הזה. בינתיים הטופס באתר פותח וואטסאפ עם תוכן הפנייה. כדי לשמור פניות כאן, מלאו את פרטי Supabase ב־<code>assets/booking/config.js</code> והריצו את <code>supabase/contact-schema.sql</code>.</p>') +
      (state.error ? '<p class="adm-err" role="alert">' + esc(state.error) + '</p>' : '');
  }
  function row(m){
    var t = topic(m.topic);
    return '<li><button type="button" class="adm-msg st-' + m.status + '" data-act="open" data-id="' + esc(m.id) + '" style="--svc:' + t.color + '">' +
      '<span class="adm-msg-av" aria-hidden="true">' + esc((m.name || '?').trim().charAt(0)) + '</span>' +
      '<span class="adm-msg-main">' +
        '<span class="adm-msg-top"><b dir="auto">' + esc(m.name) + '</b>' + (m.business ? '<span class="adm-msg-biz" dir="auto">' + esc(m.business) + '</span>' : '') + '</span>' +
        '<span class="adm-msg-txt"' + (m.message ? ' dir="auto">' + esc(m.message) : '><i>בלי הודעה — רק פרטים לחזרה</i>') + '</span>' +
        '<span class="adm-msg-tags"><span class="adm-topic"><i></i>' + esc(t.name) + '</span>' +
          '<bdi class="adm-msg-phone" dir="ltr">' + esc(B.formatPhone(m.phone)) + '</bdi></span>' +
      '</span>' +
      '<span class="adm-msg-side"><time datetime="' + esc(m.created_at) + '">' + ago(m.created_at) + '</time>' +
        '<span class="adm-pill st-' + m.status + '">' + STATUS[m.status] + '</span></span>' +
    '</button></li>';
  }
  function render(){
    renderUser();
    var list = visible(), focused = document.activeElement && document.activeElement.matches('[data-q]');
    var caret = focused ? document.activeElement.selectionStart : null;
    app.innerHTML = head() + (list.length
      ? '<ul class="adm-msgs">' + list.map(row).join('') + '</ul>'
      : (state.loading ? '' : '<div class="adm-none">' + icon(I.inbox) + '<p>' + (state.q ? 'לא נמצאו פניות שמתאימות לחיפוש.' : state.filter === 'all' ? 'עוד אין פניות. כשמישהו ימלא את הטופס באתר, הפנייה תופיע כאן.' : 'אין פניות בסטטוס הזה.') + '</p></div>'));
    if (focused) { var q = app.querySelector('[data-q]'); q.focus(); if (caret != null) q.setSelectionRange(caret, caret); }
    renderModal();
  }

  /* ---------- modal ---------- */
  function openItem(){ return state.items.filter(function(x){ return x.id === state.open; })[0]; }
  function renderModal(){
    var m = openItem();
    if (!m) { modalRoot.innerHTML = ''; document.body.classList.remove('adm-lock'); return; }
    var t = topic(m.topic), pend = m._pending || m.status;
    function r(k, v){ return v ? '<div class="adm-row"><span>' + k + '</span><b>' + v + '</b></div>' : ''; }
    modalRoot.innerHTML =
      '<div class="adm-backdrop" data-act="close"></div>' +
      '<div class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-m-title" style="--svc:' + t.color + '">' +
        '<div class="adm-modal-head"><span class="adm-dot"></span><h2 id="adm-m-title"><bdi>' + esc(m.name) + '</bdi></h2>' +
        '<button class="adm-icon-btn" type="button" data-act="close" aria-label="סגירה">' + icon(I.close) + '</button></div>' +
        '<p class="adm-modal-when">' + esc(t.name) + ' · ' + fmt(new Date(m.created_at), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) + '</p>' +
        '<div class="adm-quick">' +
          '<a class="adm-btn" href="tel:' + esc(m.phone) + '">' + icon(I.phone, 'adm-i-sm') + 'התקשרות</a>' +
          '<a class="adm-btn wa" href="https://wa.me/' + esc(intl(m.phone)) + '" target="_blank" rel="noopener noreferrer">' + icon(I.chat, 'adm-i-sm') + 'וואטסאפ</a>' +
          (m.email ? '<a class="adm-btn" href="mailto:' + esc(m.email) + '">' + icon(I.mail, 'adm-i-sm') + 'אימייל</a>' : '') +
        '</div>' +
        (m.message ? '<blockquote class="adm-quote" dir="auto">' + esc(m.message) + '</blockquote>' : '') +
        '<div class="adm-rows">' +
          r('טלפון', '<a dir="ltr" href="tel:' + esc(m.phone) + '">' + esc(B.formatPhone(m.phone)) + '</a>') +
          r('אימייל', m.email ? '<a dir="ltr" href="mailto:' + esc(m.email) + '">' + esc(m.email) + '</a>' : '') +
          r('עסק', esc(m.business)) +
          r('מה צריך', esc(t.name)) +
          r('שפת האתר', m.lang === 'en' ? 'אנגלית' : 'עברית') +
        '</div>' +
        '<div class="adm-field"><span>סטטוס</span><div class="adm-seg wide" role="radiogroup">' + Object.keys(STATUS).map(function(k){
          return '<button type="button" role="radio" data-act="status" data-v="' + k + '" aria-checked="' + (pend === k) + '" class="st-' + k + (pend === k ? ' on' : '') + '">' + STATUS[k] + '</button>';
        }).join('') + '</div></div>' +
        '<label class="adm-field"><span>הערה פנימית</span><textarea rows="2" data-note maxlength="1000" placeholder="למשל: חזרתי אליו, שלחתי הצעת מחיר">' + esc(m._note != null ? m._note : m.admin_note || '') + '</textarea></label>' +
        '<div class="adm-modal-actions">' +
          '<button class="adm-btn solid" type="button" data-act="save"' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? 'שומר…' : 'שמירה') + '</button>' +
          '<button class="adm-btn danger" type="button" data-act="delete">' + icon(I.trash, 'adm-i-sm') + 'מחיקה</button>' +
        '</div>' +
      '</div>';
    document.body.classList.add('adm-lock');
  }
  function close(){
    var m = openItem(); if (m) { delete m._pending; delete m._note; }
    var id = state.open; state.open = null; renderModal();
    var back = id && app.querySelector('[data-act="open"][data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); if (back) back.focus();
  }

  /* ---------- events ---------- */
  function onAct(el){
    var act = el.getAttribute('data-act');
    if (act === 'logout') { A.logout(); state.items = []; changed(); showLogin(); return; }
    if (act === 'refresh') { load(); changed(); return; }
    if (act === 'filter') { state.filter = el.getAttribute('data-v'); render(); return; }
    if (act === 'open') {
      state.open = el.getAttribute('data-id'); renderModal();
      var x = modalRoot.querySelector('.adm-modal-head .adm-icon-btn'); if (x) x.focus();
      return;
    }
    if (act === 'close') { close(); return; }
    if (act === 'status') {
      var m = openItem(); if (!m) return;
      m._pending = el.getAttribute('data-v');
      modalRoot.querySelectorAll('[data-act="status"]').forEach(function(b){ var on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      return;
    }
    if (act === 'save') {
      var it = openItem(); if (!it) return;
      var note = modalRoot.querySelector('[data-note]');
      var patch = { status: it._pending || it.status, admin_note: note ? note.value.trim() || null : it.admin_note };
      it._note = note ? note.value : null;
      state.saving = true; renderModal();
      M.update(it.id, patch).then(function(){
        Object.assign(it, patch); delete it._pending; delete it._note;
        state.saving = false; state.open = null; render(); changed();
      }, function(e){
        state.saving = false; renderModal();
        if (e.code === 'auth') { A.logout(); showLogin('החיבור פג. התחברו שוב.'); return; }
        alert('השמירה נכשלה. נסו שוב.');
      });
      return;
    }
    if (act === 'delete') {
      var d = openItem(); if (!d) return;
      if (!confirm('למחוק את הפנייה של ' + d.name + '? אי אפשר לבטל את זה.')) return;
      M.remove(d.id).then(function(){
        state.items = state.items.filter(function(x){ return x.id !== d.id; });
        state.open = null; render(); changed();
      }, function(){ alert('המחיקה נכשלה. נסו שוב.'); });
    }
  }
  document.addEventListener('click', function(ev){
    var el = ev.target.closest('[data-act]'); if (!el || el.disabled) return;
    if (!app.contains(el) && !modalRoot.contains(el) && !userBox.contains(el)) return;
    onAct(el);
  });
  document.addEventListener('keydown', function(ev){ if (ev.key === 'Escape' && state.open) close(); });
  app.addEventListener('input', function(ev){
    if (!ev.target.matches('[data-q]')) return;
    state.q = ev.target.value; render();
  });
  app.addEventListener('submit', function(ev){
    var form = ev.target.closest('[data-form="login"]'); if (!form) return;
    ev.preventDefault();
    var email = form.elements.email.value.trim(), pw = form.elements.password.value;
    if (!email || !pw) { showLogin('נא למלא אימייל וסיסמה.'); return; }
    var btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'מתחבר…';
    A.login(email, pw).then(function(){ load(); changed(); }, function(e){
      showLogin(e.code === 'network' ? 'אין חיבור לשרת.' : 'אימייל או סיסמה שגויים.');
    });
  });
  setInterval(function(){ if (!document.hidden && !state.open && (A.session() || !B.configured) && app.querySelector('.adm-head')) load(); }, 60000);

  if (!B.configured || A.session()) load(); else showLogin();
})();
