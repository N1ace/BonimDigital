(function(){
  var cfg = window.BONIM_BOOKING || {};
  var TZ = cfg.timeZone || 'Asia/Jerusalem';
  var DEMO_KEY = 'bonim-bookings-demo';
  var MSG_DEMO_KEY = 'bonim-contact-demo';
  var SESSION_KEY = 'bonim-admin-session';

  /* ---------- time (everything is shown in Israel time) ---------- */
  var partsFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short'
  });
  var DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function parts(date){
    var o = {};
    partsFmt.formatToParts(date).forEach(function(p){ o[p.type] = p.value; });
    return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, dow: DOW[o.weekday] };
  }
  function offsetMin(date){
    var p = parts(date);
    var asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    return Math.round((asUtc - Math.floor(date.getTime() / 60000) * 60000) / 60000);
  }
  /* wall-clock time in Israel → real instant */
  function zoned(y, m, d, h, mi){
    var guess = Date.UTC(y, m - 1, d, h || 0, mi || 0);
    var off = offsetMin(new Date(guess));
    var t = guess - off * 60000;
    var off2 = offsetMin(new Date(t));
    if (off2 !== off) t = guess - off2 * 60000;
    return new Date(t);
  }
  /* civil dates as {y,m,d}; arithmetic is done on UTC midnights so DST never shifts a day */
  function civil(y, m, d){ var t = new Date(Date.UTC(y, m - 1, d)); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() }; }
  function addDays(c, n){ return civil(c.y, c.m, c.d + n); }
  function sameDay(a, b){ return a && b && a.y === b.y && a.m === b.m && a.d === b.d; }
  function dayKey(c){ return c.y + '-' + String(c.m).padStart(2, '0') + '-' + String(c.d).padStart(2, '0'); }
  function today(){ var p = parts(new Date()); return civil(p.y, p.m, p.d); }
  function hm(str){ var a = str.split(':'); return +a[0] * 60 + +a[1]; }
  function pad(n){ return String(n).padStart(2, '0'); }
  function timeLabel(date){ var p = parts(date); return pad(p.h) + ':' + pad(p.mi); }

  /* ---------- helpers ---------- */
  function service(id){ return (cfg.services || []).filter(function(s){ return s.id === id; })[0] || null; }
  function normalizePhone(v){ return String(v || '').replace(/\D/g, '').replace(/^972/, '0'); }
  function validPhone(v){ var d = normalizePhone(v); return /^05\d{8}$/.test(d) || /^0[2-9]\d{7,8}$/.test(d); }
  function formatPhone(v){
    var d = normalizePhone(v);
    if (/^05\d{8}$/.test(d)) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
    if (/^0[2-9]\d{7}$/.test(d)) return d.slice(0, 2) + '-' + d.slice(2, 5) + '-' + d.slice(5);
    return v;
  }
  function err(code, message){ var e = new Error(message || code); e.code = code; return e; }

  /* ---------- demo storage ---------- */
  function demoAll(){ try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || []; } catch (e) { return []; } }
  function demoSave(list){ localStorage.setItem(DEMO_KEY, JSON.stringify(list)); }
  function overlaps(aStart, aEnd, bStart, bEnd){ return aStart < bEnd && aEnd > bStart; }

  /* ---------- supabase (plain REST, no SDK) ---------- */
  var configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  var base = configured ? cfg.supabaseUrl.replace(/\/+$/, '') : '';

  function api(path, opts, token){
    opts = opts || {};
    var headers = { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json' };
    headers.Authorization = 'Bearer ' + (token || cfg.supabaseAnonKey);
    if (opts.prefer) headers.Prefer = opts.prefer;
    return fetch(base + path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .catch(function(){ throw err('network'); })
      .then(function(res){
        if (res.status === 204) return null;
        return res.text().then(function(txt){
          var data = null;
          try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
          if (!res.ok) {
            var code = (data && data.code) || '';
            var msg = (data && (data.message || data.error_description || data.msg)) || res.statusText;
            if (code === '23P01') throw err('taken', msg);
            if (code === '23505') throw err('duplicate', msg);
            if (code === 'P0429') throw err('too_many', msg);
            if (res.status === 401 || res.status === 403 || code === 'PGRST301') throw err('auth', msg);
            if (code === '22023' || code === '23514') throw err('invalid', msg);
            throw err('server', msg);
          }
          return data;
        });
      });
  }

  /* ---------- public API ---------- */
  function busy(from, to){
    if (!configured) {
      return Promise.resolve(demoAll().filter(function(b){
        return b.status !== 'cancelled' && overlaps(new Date(b.start_at), new Date(b.end_at), from, to);
      }).map(function(b){ return { start: new Date(b.start_at), end: new Date(b.end_at) }; }));
    }
    return api('/rest/v1/rpc/booking_busy', { method: 'POST', body: { p_from: from.toISOString(), p_to: to.toISOString() } })
      .then(function(rows){ return (rows || []).map(function(r){ return { start: new Date(r.start_at), end: new Date(r.end_at) }; }); });
  }

  function create(b){
    var s = service(b.service);
    if (!s) return Promise.reject(err('invalid'));
    var start = b.start, end = new Date(start.getTime() + s.minutes * 60000);
    if (!configured) {
      var list = demoAll();
      var clash = list.some(function(x){ return x.status !== 'cancelled' && overlaps(new Date(x.start_at), new Date(x.end_at), start, end); });
      if (clash) return Promise.reject(err('taken'));
      var row = {
        id: 'demo-' + Date.now().toString(36), service_id: s.id, start_at: start.toISOString(), end_at: end.toISOString(),
        name: b.name, phone: normalizePhone(b.phone), email: b.email || null, business: b.business || null,
        meeting: b.meeting, note: b.note || null, lang: b.lang, status: 'confirmed', admin_note: null,
        created_at: new Date().toISOString()
      };
      list.push(row); demoSave(list);
      return Promise.resolve({ id: row.id, demo: true });
    }
    return api('/rest/v1/rpc/booking_create', { method: 'POST', body: {
      p_service: s.id, p_start: start.toISOString(), p_name: b.name, p_phone: normalizePhone(b.phone),
      p_email: b.email || null, p_business: b.business || null, p_meeting: b.meeting, p_note: b.note || null, p_lang: b.lang
    } }).then(function(id){ return { id: id, demo: false }; });
  }

  /* ---------- admin API ---------- */
  function getSession(){ try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { return null; } }
  function setSession(s){ if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SESSION_KEY); }
  function keepSession(data){
    var s = { access_token: data.access_token, refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000, email: data.user && data.user.email };
    setSession(s); return s;
  }
  function login(email, password){
    if (!configured) return Promise.resolve({ demo: true });
    return api('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email, password: password } })
      .catch(function(e){ if (e.code === 'server' || e.code === 'invalid') e.code = 'auth'; throw e; })
      .then(keepSession);
  }
  function token(){
    var s = getSession();
    if (!s) return Promise.reject(err('auth'));
    if (s.expires_at - Date.now() > 60000) return Promise.resolve(s.access_token);
    return api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } })
      .then(function(d){ return keepSession(d).access_token; })
      .catch(function(e){ setSession(null); throw err('auth', e.message); });
  }
  function logout(){ setSession(null); }

  function list(from, to){
    if (!configured) {
      return Promise.resolve(demoAll().concat(sampleBookings(from, to)).filter(function(b){
        return overlaps(new Date(b.start_at), new Date(b.end_at), from, to);
      }));
    }
    return token().then(function(t){
      var q = '/rest/v1/bookings?select=*&start_at=lt.' + encodeURIComponent(to.toISOString()) +
        '&end_at=gt.' + encodeURIComponent(from.toISOString()) + '&order=start_at.asc';
      return api(q, {}, t);
    });
  }
  function update(id, patch){
    if (!configured) {
      var all = demoAll(), hit = false;
      all.forEach(function(b){ if (b.id === id) { Object.assign(b, patch); hit = true; } });
      if (hit) demoSave(all);
      else sampleOverrides[id] = Object.assign(sampleOverrides[id] || {}, patch);
      return Promise.resolve();
    }
    return token().then(function(t){ return api('/rest/v1/bookings?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: patch, prefer: 'return=minimal' }, t); });
  }
  function remove(id){
    if (!configured) {
      demoSave(demoAll().filter(function(b){ return b.id !== id; }));
      sampleOverrides[id] = Object.assign(sampleOverrides[id] || {}, { deleted: true });
      return Promise.resolve();
    }
    return token().then(function(t){ return api('/rest/v1/bookings?id=eq.' + encodeURIComponent(id), { method: 'DELETE', prefer: 'return=minimal' }, t); });
  }

  /* ---------- contact messages ---------- */
  var TOPICS = ['website', 'booking', 'store', 'app', 'existing', 'unsure'];
  function msgDemoAll(){ try { return JSON.parse(localStorage.getItem(MSG_DEMO_KEY)) || []; } catch (e) { return []; } }
  function msgDemoSave(list){ localStorage.setItem(MSG_DEMO_KEY, JSON.stringify(list)); }

  function sendMessage(m){
    var row = {
      name: String(m.name || '').trim(), phone: normalizePhone(m.phone), email: String(m.email || '').trim() || null,
      business: String(m.business || '').trim() || null, topic: TOPICS.indexOf(m.topic) >= 0 ? m.topic : 'unsure',
      message: String(m.message || '').trim() || null, lang: m.lang === 'en' ? 'en' : 'he'
    };
    if (!configured) {
      var list = msgDemoAll();
      list.push(Object.assign({ id: 'demo-' + Date.now().toString(36), status: 'new', admin_note: null, created_at: new Date().toISOString() }, row));
      msgDemoSave(list);
      return Promise.resolve({ demo: true });
    }
    return api('/rest/v1/rpc/contact_create', { method: 'POST', body: {
      p_name: row.name, p_phone: row.phone, p_email: row.email, p_business: row.business,
      p_topic: row.topic, p_message: row.message, p_lang: row.lang
    } }).then(function(id){ return { id: id, demo: false }; });
  }

  var msgOverrides = {};
  function listMessages(){
    if (!configured) {
      return Promise.resolve(msgDemoAll().concat(sampleMessages()).sort(function(a, b){ return b.created_at < a.created_at ? -1 : 1; }));
    }
    return token().then(function(t){ return api('/rest/v1/contact_messages?select=*&order=created_at.desc&limit=500', {}, t); });
  }
  function updateMessage(id, patch){
    if (!configured) {
      var all = msgDemoAll(), hit = false;
      all.forEach(function(x){ if (x.id === id) { Object.assign(x, patch); hit = true; } });
      if (hit) msgDemoSave(all); else msgOverrides[id] = Object.assign(msgOverrides[id] || {}, patch);
      return Promise.resolve();
    }
    return token().then(function(t){ return api('/rest/v1/contact_messages?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: patch, prefer: 'return=minimal' }, t); });
  }
  function removeMessage(id){
    if (!configured) {
      msgDemoSave(msgDemoAll().filter(function(x){ return x.id !== id; }));
      msgOverrides[id] = Object.assign(msgOverrides[id] || {}, { deleted: true });
      return Promise.resolve();
    }
    return token().then(function(t){ return api('/rest/v1/contact_messages?id=eq.' + encodeURIComponent(id), { method: 'DELETE', prefer: 'return=minimal' }, t); });
  }
  var SAMPLE_MSG = [
    [0.3, 'מיכל אברהם', 'סטודיו לפילאטיס מיכל', 'booking', 'new', 'רוצה שהלקוחות יקבעו שיעורים לבד ויקבלו תזכורת. היום הכל בוואטסאפ ואני מאבדת שעות.'],
    [5, 'אלון גבאי', 'גבאי אינסטלציה', 'website', 'new', 'אין לי אתר בכלל. רוצה שימצאו אותי בגוגל באזור השרון.'],
    [26, 'Sarah Levi', 'Levi Ceramics', 'store', 'in_progress', 'I sell handmade ceramics on Instagram and want a proper store with shipping.'],
    [50, 'דוד כץ', '', 'existing', 'done', 'האתר שלי בוורדפרס איטי מאוד ולא מופיע בגוגל. אפשר לבדוק?'],
    [98, 'רונית שלום', 'קליניקה לטיפולי פנים', 'app', 'done', 'רעיון לאפליקציה ללקוחות קבועים עם כרטיסייה.'],
    [170, 'בדיקה', '', 'unsure', 'spam', 'test test']
  ];
  function sampleMessages(){
    var now = Date.now();
    return SAMPLE_MSG.map(function(r, i){
      var id = 'sample-msg-' + i, ov = msgOverrides[id] || {};
      return Object.assign({
        id: id, created_at: new Date(now - r[0] * 3600000).toISOString(), name: r[1], business: r[2] || null,
        phone: '05' + String(24000000 + i * 3456789).slice(0, 8), email: i % 2 ? null : 'hello' + i + '@example.com',
        topic: r[3], status: r[4], message: r[5], lang: /[a-z]/i.test(r[1]) ? 'en' : 'he', admin_note: null, sample: true
      }, ov);
    }).filter(function(m){ return !m.deleted; });
  }

  /* demo calendar filler so the admin preview is not empty */
  var sampleOverrides = {};
  var SAMPLE = [
    ['intro', 0, '09:30', 'נועה כהן', 'סטודיו נועה'], ['booking', 0, '11:00', 'אבי לוי', 'מספרת אבי'],
    ['website', 1, '10:00', 'דנה מזרחי', 'משרד עו״ד מזרחי'], ['review', 1, '14:30', 'יוסי ביטון', 'ביטון שיפוצים'],
    ['store', 2, '12:00', 'מאיה פרץ', 'מאפיית מאיה'], ['intro', 3, '09:00', 'רון אזולאי', ''],
    ['app', 3, '15:00', 'שירן דהן', 'כושר עם שירן'], ['booking', 4, '10:30', 'עומר חדד', 'קליניקה חדד'],
    ['intro', 5, '11:30', 'ליאת שמעוני', '']
  ];
  function sampleBookings(from, to){
    var out = [], t0 = today(), sunday = addDays(t0, -t0.dow);
    for (var w = -1; w <= 4; w++) {
      SAMPLE.forEach(function(r, i){
        if ((i + w) % 3 === 0 && w !== 0) return;
        var s = service(r[0]); if (!s) return;
        var c = addDays(sunday, w * 7 + r[1]), t = r[2].split(':');
        var start = zoned(c.y, c.m, c.d, +t[0], +t[1]);
        var id = 'sample-' + w + '-' + i, ov = sampleOverrides[id] || {};
        if (ov.deleted) return;
        out.push(Object.assign({
          id: id, service_id: s.id, start_at: start.toISOString(),
          end_at: new Date(start.getTime() + s.minutes * 60000).toISOString(),
          name: r[3], phone: '05' + String(20000000 + i * 1234567).slice(0, 8), email: null, business: r[4] || null,
          meeting: ['phone', 'video', 'whatsapp'][i % 3], note: null, lang: 'he',
          status: start < new Date() ? (i % 4 === 0 ? 'no_show' : 'done') : 'confirmed', admin_note: null, sample: true
        }, ov));
      });
    }
    return out.filter(function(b){ return overlaps(new Date(b.start_at), new Date(b.end_at), from, to); });
  }

  /* ---------- client projects ---------- */
  var PROJ_KEY = 'bonim-projects-demo', PROJ_SEEDED = 'bonim-projects-seeded';
  var STAGES = ['collect', 'build', 'deliver', 'edits'];
  var TASKS = {
    collect: ['materials', 'requirements', 'tips', 'plan'],
    build: ['database', 'design', 'branding', 'debug', 'security'],
    deliver: ['present', 'tweaks', 'guide'],
    edits: ['edits']
  };
  var CATEGORIES = ['website', 'booking', 'store', 'app', 'existing', 'other'];
  var WEIGHT = { collect: 20, build: 55, deliver: 25, edits: 0 };
  // 32 symbols without I, O, 0, 1 so a code read over the phone can't be mistyped.
  var CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  var PL = {
    he: {
      stages: { collect: 'איסוף', build: 'הפקה', deliver: 'מוצר מוגמר', edits: 'תיקונים קטנים' },
      stageDesc: {
        collect: 'אוספים את כל החומרים והנתונים, עוברים איתכם על כל דרישה ומציעים טיפים לשיפור מהניסיון שלנו.',
        build: 'העבודה עצמה: מסד נתונים ותשתית, עיצוב UI/UX, מיתוג שמדבר לקהל שלכם, בדיקות ואבטחת מידע מעודכנת. בכל שלב אנחנו חושבים כמו הלקוחות שלכם.',
        deliver: 'מציגים לכם את הפרויקט, מבצעים התאמות אחרונות לפי בקשתכם ונותנים הדרכה מלאה על המערכת והניהול.',
        edits: 'אם צריך: תיקונים ושינויים קטנים אחרי המסירה.'
      },
      tasks: {
        materials: 'איסוף חומרים ונתונים', requirements: 'מעבר על כל הדרישות יחד', tips: 'טיפים לשיפור מהניסיון שלנו', plan: 'אישור תוכנית העבודה',
        database: 'הקמת מסד נתונים ותשתית', design: 'עיצוב UI/UX', branding: 'מיתוג שמדבר לקהל שלכם', debug: 'פיתוח ובדיקות', security: 'אבטחת מידע ועדכונים',
        present: 'הצגת הפרויקט', tweaks: 'התאמות אחרונות לפי בקשתכם', guide: 'הדרכה מלאה על המערכת והניהול',
        edits: 'תיקונים קטנים לפי הצורך'
      },
      categories: { website: 'אתר', booking: 'מערכת תורים', store: 'חנות אונליין', app: 'אפליקציה', existing: 'שיפור אתר קיים', other: 'אחר' },
      status: { active: 'בתהליך', delayed: 'בעיכוב', on_hold: 'ממתין', closed: 'נמסר' },
      kinds: {
        created: 'הפרויקט נפתח', stage_start: 'התחיל שלב: {s}', stage_done: 'הסתיים שלב: {s}', delay: 'הפרויקט בעיכוב',
        hold: 'הפרויקט ממתין', resume: 'הפרויקט חזר למסלול', closed: 'הפרויקט נמסר', reopened: 'הפרויקט נפתח מחדש',
        deadline: 'תאריך היעד עודכן', note: 'עדכון'
      }
    },
    en: {
      stages: { collect: 'Collection', build: 'Production', deliver: 'Final product', edits: 'Small edits' },
      stageDesc: {
        collect: 'We gather all materials and data, go through every requirement with you and suggest improvements from our experience.',
        build: 'The hands-on work: database and infrastructure, UI/UX design, branding that speaks to your audience, testing and up-to-date security. At every step we think like your customers.',
        deliver: 'We present the project, make final tweaks at your request and give you a full guide to the system and its management.',
        edits: 'If needed: small fixes and changes after delivery.'
      },
      tasks: {
        materials: 'Collecting materials and data', requirements: 'Going through every requirement together', tips: 'Improvement tips from our experience', plan: 'Approving the work plan',
        database: 'Database and infrastructure setup', design: 'UI/UX design', branding: 'Branding that speaks to your audience', debug: 'Development and testing', security: 'Security and updates',
        present: 'Presenting the project', tweaks: 'Final tweaks at your request', guide: 'Full guide to the system and management',
        edits: 'Small edits as needed'
      },
      categories: { website: 'Website', booking: 'Booking system', store: 'Online store', app: 'App', existing: 'Existing site upgrade', other: 'Other' },
      status: { active: 'On track', delayed: 'Delayed', on_hold: 'On hold', closed: 'Delivered' },
      kinds: {
        created: 'Project opened', stage_start: 'Stage started: {s}', stage_done: 'Stage completed: {s}', delay: 'Project delayed',
        hold: 'Project on hold', resume: 'Project back on track', closed: 'Project delivered', reopened: 'Project reopened',
        deadline: 'Deadline updated', note: 'Update'
      }
    }
  };

  function newCode(){
    var a = new Uint32Array(8), s = '';
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < 8; i++) s += CODE_ABC[a[i] % 32];
    return 'BD-' + s.slice(0, 4) + '-' + s.slice(4);
  }
  function normCode(v){
    var s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.length === 10 && s.indexOf('BD') === 0) s = s.slice(2);
    return /^[A-Z0-9]{8}$/.test(s) ? 'BD-' + s.slice(0, 4) + '-' + s.slice(4) : '';
  }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function freshStages(withEdits, at){
    at = at || new Date().toISOString();
    return STAGES.map(function(k, i){
      return { k: k, state: i === 0 ? 'active' : (k === 'edits' && !withEdits ? 'skipped' : 'pending'),
        started_at: i === 0 ? at : null, done_at: null, tasks: TASKS[k].map(function(t){ return { k: t, done: false }; }) };
    });
  }
  function progress(p){
    if (p.status === 'closed') return 100;
    var total = 0;
    (p.stages || []).forEach(function(s){
      var w = WEIGHT[s.k] || 0;
      if (!w) return;
      if (s.state === 'done' || s.state === 'skipped') total += w;
      else if (s.state === 'active') {
        var n = (s.tasks || []).length, d = (s.tasks || []).filter(function(t){ return t.done; }).length;
        total += w * (.1 + .8 * (n ? d / n : 0));
      }
    });
    return Math.min(99, Math.round(total));
  }
  function currentStage(p){
    var st = p.stages || [], i;
    for (i = 0; i < st.length; i++) if (st[i].state === 'active') return i;
    for (i = st.length - 1; i >= 0; i--) if (st[i].state === 'done') return i;
    return 0;
  }
  function taskLabel(t, lang){ return t.k ? (PL[lang] || PL.he).tasks[t.k] || t.k : t.t || ''; }
  function updateTitle(u, lang){
    var L = PL[lang] || PL.he, s = (L.kinds[u.kind] || L.kinds.note);
    return s.replace('{s}', u.stage ? L.stages[u.stage] || u.stage : '');
  }
  function publicView(p){
    return {
      code: p.code, status: p.status, title: p.title, category: p.category, summary: p.summary || null,
      client: String(p.client_name || '').trim().split(/\s+/)[0] || '', business: p.client_business || null,
      start_date: p.start_date, deadline: p.deadline, requirements: p.requirements || [], tips: p.tips || [],
      stages: p.stages || [], updates: (p.updates || []).filter(function(u){ return u.public !== false; }),
      delay_reason: p.delay_reason || null, delay_until: p.delay_until || null,
      created_at: p.created_at, updated_at: p.updated_at, closed_at: p.closed_at || null
    };
  }

  function projDemoAll(){
    if (!localStorage.getItem(PROJ_SEEDED)) { localStorage.setItem(PROJ_KEY, JSON.stringify(sampleProjects())); localStorage.setItem(PROJ_SEEDED, '1'); }
    var list;
    try { list = JSON.parse(localStorage.getItem(PROJ_KEY)) || []; } catch (e) { list = []; }
    var missing = realProjects().filter(function(r){ return !list.some(function(p){ return p.code === r.code; }); });
    if (missing.length) { list = list.concat(missing); projDemoSave(list); }
    return list;
  }
  function projDemoSave(list){ localStorage.setItem(PROJ_KEY, JSON.stringify(list)); }

  function listProjects(){
    if (!configured) return Promise.resolve(projDemoAll().sort(function(a, b){ return b.created_at < a.created_at ? -1 : 1; }));
    return token().then(function(t){ return api('/rest/v1/projects?select=*&order=created_at.desc&limit=500', {}, t); });
  }
  function createProject(row, tries){
    tries = tries || 0;
    var data = Object.assign({}, row, { code: newCode() });
    if (!configured) {
      var list = projDemoAll(), now = new Date().toISOString();
      if (list.some(function(p){ return p.code === data.code; })) return createProject(row, tries + 1);
      data = Object.assign({ id: 'demo-' + uid(), created_at: now, updated_at: now, closed_at: null }, data);
      list.push(data); projDemoSave(list);
      return Promise.resolve(data);
    }
    return token().then(function(t){
      return api('/rest/v1/projects', { method: 'POST', body: data, prefer: 'return=representation' }, t);
    }).then(function(rows){ return rows && rows[0]; }, function(e){
      if (e.code === 'duplicate' && tries < 3) return createProject(row, tries + 1);
      throw e;
    });
  }
  function updateProject(id, patch){
    if (!configured) {
      var all = projDemoAll();
      all.forEach(function(p){ if (p.id === id) Object.assign(p, patch, { updated_at: new Date().toISOString() }); });
      projDemoSave(all);
      return Promise.resolve();
    }
    return token().then(function(t){ return api('/rest/v1/projects?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: patch, prefer: 'return=minimal' }, t); });
  }
  function removeProject(id){
    if (!configured) { projDemoSave(projDemoAll().filter(function(p){ return p.id !== id; })); return Promise.resolve(); }
    return token().then(function(t){ return api('/rest/v1/projects?id=eq.' + encodeURIComponent(id), { method: 'DELETE', prefer: 'return=minimal' }, t); });
  }
  function track(code){
    var c = normCode(code);
    if (!c) return Promise.reject(err('invalid'));
    if (!configured) {
      var hit = projDemoAll().filter(function(p){ return p.code === c; })[0];
      return Promise.resolve(hit ? publicView(hit) : null);
    }
    return api('/rest/v1/rpc/project_track', { method: 'POST', body: { p_code: c } });
  }

  /* delivered client projects, kept in sync with supabase/projects-seed.sql */
  function realProjects(){
    function at(s){ return new Date(s + ':00+03:00').toISOString(); }
    function done(k, from, to){
      return { k: k, state: 'done', started_at: at(from), done_at: at(to), tasks: TASKS[k].map(function(t){ return { k: t, done: true }; }) };
    }
    return [
      {
        id: 'real-aryian', code: 'BD-ARYN-0726', status: 'closed',
        created_at: at('2026-07-03T10:00'), updated_at: at('2026-07-24T18:00'), closed_at: at('2026-07-24T18:00'),
        client_name: 'לידור', client_business: 'Aryian Studio', client_phone: null, client_email: null, client_city: 'אשדוד', client_lang: 'he',
        title: 'אתר + מערכת תורים ל־Aryian Studio', category: 'booking',
        summary: 'אתר למספרה עם מערכת תורים ותזכורות SMS אוטומטיות, ניהול לידים, ניהול הכיסאות שמושכרים לספרים ומאגר לקוחות, הכל במקום אחד. הלקוחות קובעים תור לבד, 24/7.',
        start_date: '2026-07-03', deadline: '2026-07-24',
        requirements: ['הזמנת תורים אונליין 24/7', 'תזכורות SMS אוטומטיות לפני כל תור', 'אתר למספרה', 'ניהול לידים', 'ניהול הכיסאות שמושכרים לספרים', 'מאגר לקוחות'],
        tips: ['תשלום חד פעמי במקום מנוי חודשי, עם אפשרות לפריסה לתשלומים', 'עלות חודשית רק על הודעות ה-SMS'],
        stages: [
          done('collect', '2026-07-03T10:00', '2026-07-04T09:00'),
          done('build', '2026-07-04T09:00', '2026-07-22T12:00'),
          done('deliver', '2026-07-22T12:00', '2026-07-22T18:00'),
          done('edits', '2026-07-22T18:00', '2026-07-24T17:59')
        ],
        delay_reason: null, delay_until: null, admin_note: null,
        updates: [
          { id: 'u1', at: at('2026-07-03T10:00'), kind: 'created', public: true },
          { id: 'u2', at: at('2026-07-04T09:00'), kind: 'stage_done', stage: 'collect', public: true },
          { id: 'u3', at: at('2026-07-04T09:01'), kind: 'stage_start', stage: 'build', public: true },
          { id: 'u4', at: at('2026-07-22T12:00'), kind: 'stage_done', stage: 'build', public: true },
          { id: 'u5', at: at('2026-07-22T12:01'), kind: 'stage_start', stage: 'deliver', public: true },
          { id: 'u6', at: at('2026-07-22T18:00'), kind: 'stage_done', stage: 'deliver', public: true },
          { id: 'u7', at: at('2026-07-22T18:01'), kind: 'stage_start', stage: 'edits', public: true },
          { id: 'u8', at: at('2026-07-24T17:59'), kind: 'stage_done', stage: 'edits', public: true },
          { id: 'u9', at: at('2026-07-24T18:00'), kind: 'closed', public: true }
        ]
      }
    ];
  }

  /* demo projects so the admin tab and the tracking page can be tried before Supabase is set up */
  function sampleProjects(){
    var DAY = 86400000, now = Date.now();
    function iso(d){ return new Date(now + d * DAY).toISOString(); }
    function ymd(d){ var p = parts(new Date(now + d * DAY)); return p.y + '-' + pad(p.m) + '-' + pad(p.d); }
    function mark(stages, upto, activeDone){
      stages.forEach(function(s, i){
        if (i < upto) { s.state = 'done'; s.started_at = iso(-30 + i * 6); s.done_at = iso(-24 + i * 6); s.tasks.forEach(function(t){ t.done = true; }); }
        else if (i === upto) { s.state = 'active'; s.started_at = iso(-6); s.tasks.forEach(function(t, j){ t.done = j < activeDone; }); }
        else if (s.state !== 'skipped') { s.state = 'pending'; s.started_at = null; }
      });
      return stages;
    }
    var noa = mark(freshStages(true, iso(-12)), 1, 2);
    noa[0].started_at = iso(-12); noa[0].done_at = iso(-6);
    var maya = mark(freshStages(false, iso(-9)), 0, 1);
    maya[0].started_at = iso(-9);
    var law = freshStages(false, iso(-40));
    law.forEach(function(s, i){ if (s.state !== 'skipped') { s.state = 'done'; s.started_at = iso(-40 + i * 10); s.done_at = iso(-31 + i * 10); s.tasks.forEach(function(t){ t.done = true; }); } });
    return [
      {
        id: 'demo-noa', code: 'BD-DEMO-2026', status: 'active', created_at: iso(-12), updated_at: iso(-2), closed_at: null,
        client_name: 'נועה כהן', client_business: 'סטודיו נועה', client_phone: '0521234567', client_email: 'noa@example.com', client_city: 'תל אביב', client_lang: 'he',
        title: 'אתר + מערכת תורים לסטודיו נועה', category: 'booking', summary: 'אתר תדמית קליל עם מערכת תורים ותזכורות SMS, כדי שהלקוחות יקבעו לבד ויהיו פחות ביטולים.',
        start_date: ymd(-12), deadline: ymd(21),
        requirements: ['הזמנת תורים אונליין 24/7', 'תזכורת SMS יום לפני התור', 'גלריית עבודות', 'כפתור וואטסאפ בכל עמוד'],
        tips: ['להוסיף מקדמה קטנה בהזמנה כדי להפחית ביטולים', 'עמוד ביקורות מגוגל כדי לבנות אמון'],
        stages: noa, delay_reason: null, delay_until: null, admin_note: 'מעדיפה עדכונים בוואטסאפ בערב.',
        updates: [
          { id: 'u1', at: iso(-12), kind: 'created', public: true },
          { id: 'u2', at: iso(-6), kind: 'stage_done', stage: 'collect', public: true },
          { id: 'u3', at: iso(-6), kind: 'stage_start', stage: 'build', public: true },
          { id: 'u4', at: iso(-2), kind: 'note', text: 'העיצוב הראשוני מוכן ונשלח אלייך לאישור בוואטסאפ.', public: true },
          { id: 'u5', at: iso(-1), kind: 'note', text: 'לבדוק ספק SMS זול יותר.', public: false }
        ]
      },
      {
        id: 'demo-maya', code: 'BD-7K3M-Q9XA', status: 'delayed', created_at: iso(-9), updated_at: iso(-1), closed_at: null,
        client_name: 'מאיה פרץ', client_business: 'מאפיית מאיה', client_phone: '0547654321', client_email: null, client_city: 'חיפה', client_lang: 'he',
        title: 'חנות אונליין למאפיית מאיה', category: 'store', summary: 'חנות עם הזמנות לאיסוף עצמי ומשלוחים באזור.',
        start_date: ymd(-9), deadline: ymd(30),
        requirements: ['קטלוג של 20 מוצרים', 'תשלום בכרטיס אשראי', 'בחירת יום איסוף'],
        tips: ['צילום מוצרים מקצועי יעלה את המכירות'],
        stages: maya, delay_reason: 'ממתינים לתמונות המוצרים ולמחירון מהלקוחה.', delay_until: ymd(10), admin_note: null,
        updates: [
          { id: 'u1', at: iso(-9), kind: 'created', public: true },
          { id: 'u2', at: iso(-1), kind: 'delay', text: 'ממתינים לתמונות המוצרים ולמחירון מהלקוחה.', until: ymd(10), public: true }
        ]
      },
      {
        id: 'demo-law', code: 'BD-R2P8-LM4T', status: 'closed', created_at: iso(-40), updated_at: iso(-5), closed_at: iso(-5),
        client_name: 'דנה מזרחי', client_business: 'משרד עו״ד מזרחי', client_phone: '0501112233', client_email: 'dana@example.com', client_city: 'רמת גן', client_lang: 'he',
        title: 'אתר תדמית למשרד עו״ד מזרחי', category: 'website', summary: null,
        start_date: ymd(-40), deadline: ymd(-4),
        requirements: ['עמודי תחומי עיסוק', 'טופס יצירת קשר'], tips: [],
        stages: law, delay_reason: null, delay_until: null, admin_note: null,
        updates: [
          { id: 'u1', at: iso(-40), kind: 'created', public: true },
          { id: 'u2', at: iso(-5), kind: 'closed', public: true }
        ]
      }
    ];
  }

  window.BonimBooking = {
    cfg: cfg, configured: configured,
    projects: {
      L: PL, stages: STAGES, tasks: TASKS, categories: CATEGORIES,
      normCode: normCode, freshStages: freshStages, progress: progress, currentStage: currentStage,
      taskLabel: taskLabel, updateTitle: updateTitle, uid: uid, track: track
    },
    time: { TZ: TZ, parts: parts, zoned: zoned, civil: civil, addDays: addDays, sameDay: sameDay, dayKey: dayKey, today: today, hm: hm, pad: pad, timeLabel: timeLabel },
    service: service, validPhone: validPhone, formatPhone: formatPhone, normalizePhone: normalizePhone,
    busy: busy, create: create, sendMessage: sendMessage, topics: TOPICS,
    admin: {
      session: getSession, login: login, logout: logout, list: list, update: update, remove: remove,
      messages: { list: listMessages, update: updateMessage, remove: removeMessage },
      projects: { list: listProjects, create: createProject, update: updateProject, remove: removeProject }
    }
  };
})();
