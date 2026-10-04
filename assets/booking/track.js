(function(){
  var B = window.BonimBooking; if (!B || !B.projects) return;
  var app = document.getElementById('tr-app'); if (!app) return;
  var PJ = B.projects, WA = (B.cfg && B.cfg.whatsapp) || '972527905122';
  var CAT_COLOR = { website: '#C2410C', booking: '#0B1B33', store: '#3B6FE0', app: '#E0703A', existing: '#52607A', other: '#0038B8' };

  var TEXT = {
    he: {
      eyebrow: '// מעקב פרויקט', title: 'מעקב אחרי הפרויקט שלכם',
      sub: 'הכניסו את קוד המעקב והסיסמה ששלחנו לכם, ותראו בדיוק איפה הפרויקט עומד, מה כבר נעשה ומה הצעד הבא.',
      label: 'קוד מעקב', passLabel: 'סיסמה', passShow: 'הצגת הסיסמה', passHide: 'הסתרת הסיסמה', go: 'מעקב', loading: 'מחפשים…',
      invalid: 'הקוד צריך להיות בפורמט BD-XXXX-XXXX.',
      noPass: 'נא להכניס את הסיסמה ששלחנו לכם יחד עם הקוד.',
      notFound: 'הקוד או הסיסמה לא נכונים. בדקו שהעתקתם אותם נכון (בסיסמה יש הבדל בין אותיות גדולות לקטנות), או כתבו לנו ונבדוק.',
      error: 'משהו השתבש. נסו שוב בעוד רגע.', network: 'אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.',
      demo: 'מצב הדגמה. אפשר לנסות עם', hi: 'שלום {n}',
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
      sub: 'Enter the tracking code and password we sent you to see exactly where your project stands, what is already done and what comes next.',
      label: 'Tracking code', passLabel: 'Password', passShow: 'Show password', passHide: 'Hide password', go: 'Track', loading: 'Searching…',
      invalid: 'The code should look like BD-XXXX-XXXX.',
      noPass: 'Please enter the password we sent you with the code.',
      notFound: "The code or password is incorrect. Check that you copied them exactly (the password is case-sensitive), or message us and we'll look into it.",
      error: 'Something went wrong. Please try again in a moment.', network: 'No internet connection. Check it and try again.',
      demo: 'Demo mode. Try', hi: 'Hi {n}',
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

  var HOW = {
    he: {
      howH: 'איך המעקב עובד', howSub: 'בלי הרשמה ובלי אפליקציה. קוד וסיסמה, ואתם רואים בדיוק מה קורה בפרויקט.',
      s1t: 'מקבלים קוד וסיסמה', s1p: 'כשהפרויקט נפתח, אנחנו שולחים לכם בוואטסאפ או במייל קוד מעקב, סיסמה אישית וקישור ישיר לדף הזה.',
      s2t: 'מכניסים את הקוד והסיסמה', s2p: 'הקישור כבר ממלא את הקוד, ונשאר רק להקליד את הסיסמה. אפשר גם להקליד את שניהם בשדות למעלה, מכל מכשיר.',
      s3t: 'רואים איפה הפרויקט עומד', s3p: 'אחוז ההתקדמות, השלב הנוכחי, תאריך היעד וכל העדכונים שלנו במקום אחד. בכל כניסה תראו את המצב העדכני.',
      chatFrom: 'בונים דיגיטל', chatHi: 'שלום נועה, הפרויקט נפתח אצלנו.', chatCode: 'קוד מעקב:', chatPass: 'סיסמה:', chatLink: 'מעקב אחרי ההתקדמות',
      anatH: 'ככה נראה דף הפרויקט שלכם', anatSub: 'דוגמה עם נתונים מומצאים. כל מספר בתמונה מוסבר ברשימה שלידה.',
      mTitle: 'אתר לסטודיו פילאטיס', mHi: 'שלום נועה', mBiz: 'סטודיו נועה', mNote: 'העיצוב של דף הבית מוכן ונשלח אליכם לאישור.', mTasks: 'משימות בשלב',
      l1t: 'סטטוס וקוד הפרויקט', l1p: 'בשורה אחת: האם הכל לפי התוכנית, וקוד המעקב שלכם.',
      l2t: 'התקדמות ותאריך יעד', l2p: 'האחוז עולה אוטומטית בכל פעם שאנחנו מסיימים משימה. ליד תאריך היעד כתוב כמה ימים נשארו.',
      l3t: 'ארבעת השלבים', l3p: 'ירוק זה שלב שהושלם, כחול זה מה שעובדים עליו עכשיו, ואפור זה מה שבהמשך.',
      l4t: 'עדכונים', l4p: 'כל שינוי נרשם עם תאריך ושעה: שלב שהתחיל או הסתיים, עיכוב, או הודעה אישית מאיתנו. האחרון תמיד למעלה.',
      l5t: 'המשימות בכל שלב', l5p: 'רשימת העבודה המלאה של כל שלב, עם וי ליד מה שכבר נעשה.',
      l6t: 'שאלה על הפרויקט', l6p: 'כפתור וואטסאפ שפותח הודעה עם קוד הפרויקט, כך שלא צריך להסביר מי אתם.',
      stH: 'מה קורה בכל שלב', stSub: 'כל פרויקט עובר את אותם ארבעה שלבים. אחוז ההתקדמות מחושב לפי המשקל של כל שלב.',
      wOf: '{w}% מההתקדמות', wNone: 'אם צריך, לא נכלל באחוז',
      stsH: 'מה אומר הסטטוס',
      sts: {
        active: 'הכל מתקדם לפי התוכנית.',
        delayed: 'משהו מעכב את העבודה. תמיד נכתוב למה, ומה תאריך היעד המשוער החדש.',
        on_hold: 'העבודה עוצרת זמנית, בדרך כלל כשאנחנו מחכים לחומרים או לאישור מכם.',
        closed: 'הפרויקט הושלם ונמסר לכם.'
      },
      qH: 'שאלות נפוצות על המעקב',
      qa: [
        ['מי יכול לראות את הפרויקט?', 'רק מי שיש לו גם את הקוד וגם את הסיסמה. הדף מציג את שם הפרויקט, השם הפרטי שלכם וההתקדמות, ואף פעם לא טלפון, מייל או הערות פנימיות שלנו.'],
        ['למה צריך גם סיסמה?', 'כדי שרק אתם תראו את הפרויקט, גם אם הקוד או הקישור הגיעו בטעות למישהו אחר.'],
        ['כמה פעמים זה מתעדכן?', 'בכל פעם שאנחנו מסיימים משימה, עוברים שלב או כשמשהו משתנה. הדף מציג את המצב העדכני ברגע שפותחים אותו.'],
        ['איך נראים הקוד והסיסמה?', 'הקוד: BD ואחריו 8 אותיות ומספרים. הסיסמה: 8 תווים אקראיים של אותיות, מספרים וסימנים, ויש בה הבדל בין אותיות גדולות לקטנות. אין בהם תווים שקל להתבלבל ביניהם, כמו O ו-0 או I ו-1.'],
        ['איבדתי את הקוד או הסיסמה, מה עושים?', 'כתבו לנו בוואטסאפ ונשלח לכם אותם שוב, או ניצור לכם סיסמה חדשה.']
      ],
      waLost: 'היי, איבדתי את פרטי המעקב של הפרויקט שלי'
    },
    en: {
      howH: 'How tracking works', howSub: 'No sign-up and no app. A code and a password, and you see exactly what is happening with your project.',
      s1t: 'You get a code and password', s1p: 'When your project opens, we send you a tracking code, a personal password and a direct link to this page by WhatsApp or email.',
      s2t: 'Enter the code and password', s2p: 'The link fills in the code for you, so you only type the password. You can also type both in the boxes above, on any device.',
      s3t: 'See where your project stands', s3p: 'Progress, the current stage, the deadline and all our updates in one place. Every visit shows the latest status.',
      chatFrom: 'Bonim Digital', chatHi: 'Hi Noa, your project is now open.', chatCode: 'Tracking code:', chatPass: 'Password:', chatLink: 'Track the progress',
      anatH: 'What your project page looks like', anatSub: 'An example with invented data. Each number in the picture is explained in the list next to it.',
      mTitle: 'Website for a Pilates studio', mHi: 'Hi Noa', mBiz: 'Noa Studio', mNote: 'The home page design is ready and sent to you for approval.', mTasks: 'Tasks in this stage',
      l1t: 'Status and project code', l1p: 'One line tells you whether everything is on plan, next to your tracking code.',
      l2t: 'Progress and deadline', l2p: 'The percentage goes up automatically every time we finish a task. Next to the deadline you see how many days are left.',
      l3t: 'The four stages', l3p: 'Green is a finished stage, blue is what we are working on now, and grey is still to come.',
      l4t: 'Updates', l4p: 'Every change is logged with a date and time: a stage that started or finished, a delay, or a personal note from us. The newest is always on top.',
      l5t: 'Tasks in each stage', l5p: 'The full work list of every stage, with a check next to what is already done.',
      l6t: 'A question about the project', l6p: 'A WhatsApp button that opens a message with your project code, so you never need to explain who you are.',
      stH: 'What happens in each stage', stSub: 'Every project goes through the same four stages. Progress is calculated from the weight of each stage.',
      wOf: '{w}% of progress', wNone: 'If needed, not counted',
      stsH: 'What the status means',
      sts: {
        active: 'Everything is moving according to plan.',
        delayed: 'Something is holding the work up. We always write why, and the new estimated deadline.',
        on_hold: 'Work is paused for now, usually while we wait for materials or your approval.',
        closed: 'The project is finished and delivered to you.'
      },
      qH: 'Tracking FAQ',
      qa: [
        ['Who can see my project?', 'Only someone with both the code and the password. The page shows the project name, your first name and the progress, never your phone, email or our internal notes.'],
        ['Why is there a password too?', 'So only you can see the project, even if the code or the link reaches someone else by mistake.'],
        ['How often is it updated?', 'Every time we finish a task, move to a new stage or something changes. The page shows the latest status the moment you open it.'],
        ['What do the code and password look like?', 'The code: BD followed by 8 letters and numbers. The password: 8 random letters, numbers and signs, and it is case-sensitive. Neither uses characters that are easy to mix up, like O and 0 or I and 1.'],
        ['I lost my code or password. What now?', "Message us on WhatsApp and we'll send them again, or set a new password for you."]
      ],
      waLost: 'Hi, I lost the tracking details for my project'
    }
  };

  var lang = 'he', state = { code: '', pass: '', show: false, loading: false, error: '', data: null };
  var SS_KEY = 'bonim-track-pass';
  function savedPass(code){ try { return (JSON.parse(sessionStorage.getItem(SS_KEY)) || {})[code] || ''; } catch (e) { return ''; } }
  function savePass(code, pass){ try { var o = {}; o[code] = pass; sessionStorage.setItem(SS_KEY, JSON.stringify(o)); } catch (e) {} }
  function h(k){ return HOW[lang][k]; }
  function t(k, vars){ var s = TEXT[lang][k] || k; if (vars) Object.keys(vars).forEach(function(v){ s = s.replace('{' + v + '}', vars[v]); }); return s; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function loc(){ return lang === 'he' ? 'he-IL' : 'en-GB'; }
  function icon(path, cls){ return '<svg class="' + (cls || 'tr-i') + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  var I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', check: '<path d="M5 12l5 5L20 7"/>',
    alert: '<path d="M12 8v5M12 16.5v.5M10.3 4.2 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/>',
    pause: '<path d="M9 5v14M15 5v14"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
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
      '<form class="tr-form" data-form="track" novalidate><div class="tr-form-row">' +
        '<div class="tr-fld"><label for="tr-code">' + t('label') + '</label>' +
          '<input id="tr-code" name="code" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" maxlength="14" placeholder="BD-XXXX-XXXX" value="' + esc(state.code) + '"' + bad('code') + '></div>' +
        '<div class="tr-fld"><label for="tr-pass">' + t('passLabel') + '</label><div class="tr-pass">' +
          '<input id="tr-pass" name="pass" type="' + (state.show ? 'text' : 'password') + '" dir="ltr" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="64" placeholder="••••••••" value="' + esc(state.pass) + '"' + bad('pass') + '>' +
          '<button type="button" class="tr-eye" data-act="show" aria-pressed="' + state.show + '" aria-label="' + t(state.show ? 'passHide' : 'passShow') + '" title="' + t(state.show ? 'passHide' : 'passShow') + '">' + icon(state.show ? I.eyeOff : I.eye, 'tr-i-sm') + '</button></div></div>' +
        '<button class="btn solid" type="submit"' + (state.loading ? ' disabled' : '') + '>' + icon(I.search, 'tr-i-sm') + (state.loading ? t('loading') : t('go')) + '</button></div>' +
        (state.error ? '<p class="tr-err" id="tr-err" role="alert">' + esc(t(state.error)) + '</p>' : '') +
        (B.configured ? '' : '<p class="tr-demo">' + t('demo') + ' <button type="button" class="tr-demo-code" data-act="demo" dir="ltr">BD-DEMO-2026 · ' + esc(PJ.demoPass) + '</button></p>') +
      '</form></header>';
  }
  function bad(field){
    var e = state.error, hit = e === 'notFound' || (field === 'code' ? e === 'invalid' : e === 'noPass');
    return hit ? ' aria-invalid="true" aria-describedby="tr-err"' : '';
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
  /* ---------- how it works (shown until a project is loaded) ---------- */
  var EX_CODE = 'BD-7K3M-Q9XA', EX_PASS = 'Rk4#vN8q';
  function ymdIn(n){ return new Date(utcOf(todayYmd()) + n * 86400000).toISOString().slice(0, 10); }
  function isoAgo(days, hh, mm){ var d = new Date(); d.setDate(d.getDate() - days); d.setHours(hh, mm, 0, 0); return d.toISOString(); }
  function mark(n){ return '<i class="tk-m">' + n + '</i>'; }
  function howSteps(){
    var ill1 = '<div class="tk-chat"><span class="tk-chat-from"><img src="assets/logo/bonim-mark.svg" alt="" width="18" height="18">' + h('chatFrom') + '</span>' +
      '<p class="tk-bubble">' + h('chatHi') + '<br>' + h('chatCode') + ' <b dir="ltr">' + EX_CODE + '</b><br>' + h('chatPass') + ' <b dir="ltr">' + EX_PASS + '</b><br><u>' + h('chatLink') + '</u></p></div>';
    var ill2 = '<div class="tk-field"><small>' + t('label') + '</small><span class="tk-type" dir="ltr"><span>' + EX_CODE + '</span></span>' +
      '<small>' + t('passLabel') + '</small><div class="tk-field-row"><span class="tk-type tk-dots" dir="ltr"><span>••••••••</span></span>' +
      '<span class="tk-go">' + icon(I.search, 'tr-i-sm') + t('go') + '</span></div></div>';
    var ill3 = '<div class="tk-mini"><div class="tk-mini-h"><span class="tr-status">' + esc(PJ.L[lang].status.active) + '</span><b class="tk-mini-pct">43%</b></div>' +
      '<div class="tr-bar"><i style="width:43%"></i></div>' +
      '<div class="tk-mini-dots"><i class="done">' + icon(I.check, 'tr-i-xs') + '</i><i class="now"></i><i></i><i></i></div></div>';
    var item = function(n, ill){ return '<li><div class="tk-ill" aria-hidden="true">' + ill + '</div><span class="tk-n">' + n + '</span><b>' + h('s' + n + 't') + '</b><p>' + h('s' + n + 'p') + '</p></li>'; };
    return '<section class="tk-sec" aria-labelledby="tk-how"><h2 class="tk-h" id="tk-how">' + h('howH') + '</h2><p class="tk-sub">' + h('howSub') + '</p>' +
      '<ol class="tk-steps">' + item(1, ill1) + item(2, ill2) + item(3, ill3) + '</ol></section>';
  }
  function anatomy(){
    var L = PJ.L[lang], st = PJ.stages;
    var phase = { collect: 'done', build: 'active', deliver: 'pending', edits: 'pending' };
    var steps = st.map(function(k, i){
      var s = phase[k];
      return '<li class="s-' + s + '"><span class="tk-dot">' + (s === 'done' ? icon(I.check, 'tr-i-xs') : i + 1) + '</span><b>' + esc(L.stages[k]) + '</b><small>' +
        (s === 'done' ? t('doneAt', { d: shortDay(isoAgo(6, 17, 40)) }) : s === 'active' ? t('now') : k === 'edits' ? t('ifNeeded') : t('pending')) + '</small></li>';
    }).join('');
    var ups = [
      [L.kinds.note, h('mNote'), isoAgo(1, 10, 30)],
      [L.kinds.stage_start.replace('{s}', L.stages.build), '', isoAgo(6, 17, 45)],
      [L.kinds.stage_done.replace('{s}', L.stages.collect), '', isoAgo(6, 17, 40)]
    ].map(function(u, i){
      return '<li' + (i === 0 ? ' class="latest"' : '') + '><time>' + when(u[2]) + '</time><b>' + esc(u[0]) + '</b>' + (u[1] ? '<p>' + esc(u[1]) + '</p>' : '') + '</li>';
    }).join('');
    var tasks = PJ.tasks.build.map(function(k, i){
      var done = i < 2;
      return '<li' + (done ? ' class="done"' : '') + '><span class="tr-tick">' + (done ? icon(I.check, 'tr-i-xs') : '') + '</span>' + esc(L.tasks[k]) + '</li>';
    }).join('');
    var mock = '<figure class="tk-mock" aria-hidden="true">' +
      '<div class="tk-m-top"><div><span class="tr-cat" style="--svc:' + CAT_COLOR.website + '"><i></i>' + esc(L.categories.website) + '</span><b class="tk-m-title">' + h('mTitle') + '</b><small>' + h('mHi') + ' · ' + h('mBiz') + '</small></div>' +
        '<div class="tk-m-st">' + mark(1) + '<span class="tr-status">' + esc(L.status.active) + '</span><bdi class="tr-code" dir="ltr">' + EX_CODE + '</bdi></div></div>' +
      '<div class="tk-r">' + mark(2) + '<dl class="tk-m-facts"><div><dt>' + t('progress') + '</dt><dd class="tk-m-pct">43%</dd></div><div><dt>' + t('stage') + '</dt><dd>' + esc(L.stages.build) + '</dd></div>' +
        '<div><dt>' + t('deadline') + '</dt><dd>' + day(ymdIn(12)) + ' <span class="tr-rel">' + t('daysLeft', { d: 12 }) + '</span></dd></div></dl>' +
        '<div class="tr-bar"><i style="width:43%"></i></div></div>' +
      '<div class="tk-r">' + mark(3) + '<ol class="tk-m-steps">' + steps + '</ol></div>' +
      '<div class="tk-m-grid"><div class="tk-m-box tk-r">' + mark(4) + '<b class="tk-m-h">' + t('updatesH') + '</b><ol class="tk-m-tl">' + ups + '</ol></div>' +
        '<div class="tk-m-box tk-r">' + mark(5) + '<b class="tk-m-h">' + h('mTasks') + ': ' + esc(L.stages.build) + '</b><ul class="tr-tasks tk-m-tasks">' + tasks + '</ul></div></div>' +
      '<div class="tk-m-help">' + mark(6) + '<span class="tk-m-q">' + t('questions') + '</span><span class="tk-m-wa">' + icon(I.chat, 'tr-i-sm') + t('wa') + '</span></div>' +
    '</figure>';
    var legend = [1, 2, 3, 4, 5, 6].map(function(n){ return '<li>' + mark(n) + '<div><b>' + h('l' + n + 't') + '</b><p>' + h('l' + n + 'p') + '</p></div></li>'; }).join('');
    return '<section class="tk-sec" aria-labelledby="tk-anat"><h2 class="tk-h" id="tk-anat">' + h('anatH') + '</h2><p class="tk-sub">' + h('anatSub') + '</p>' +
      '<div class="tk-anat">' + mock + '<ol class="tk-legend">' + legend + '</ol></div></section>';
  }
  function stageGuide(){
    var L = PJ.L[lang], W = PJ.weight || {};
    var bar = PJ.stages.filter(function(k){ return W[k]; }).map(function(k){
      return '<span style="flex:' + W[k] + '"><b>' + W[k] + '%</b>' + esc(L.stages[k]) + '</span>';
    }).join('');
    return '<section class="tk-sec" aria-labelledby="tk-st"><h2 class="tk-h" id="tk-st">' + h('stH') + '</h2><p class="tk-sub">' + h('stSub') + '</p>' +
      (bar ? '<div class="tk-wbar" aria-hidden="true">' + bar + '</div>' : '') +
      '<ol class="tk-stages">' + PJ.stages.map(function(k, i){
        return '<li><div class="tk-st-h"><span class="tk-st-ic">' + icon(I[k]) + '</span><span class="tk-st-n">' + (i + 1) + '</span></div>' +
          '<b>' + esc(L.stages[k]) + '</b><span class="tk-w">' + (W[k] ? h('wOf').replace('{w}', W[k]) : h('wNone')) + '</span>' +
          '<p>' + esc(L.stageDesc[k]) + '</p></li>';
      }).join('') + '</ol></section>';
  }
  function statusGuide(){
    var L = PJ.L[lang], S = h('sts');
    return '<section class="tk-sec" aria-labelledby="tk-sts"><h2 class="tk-h" id="tk-sts">' + h('stsH') + '</h2>' +
      '<dl class="tk-sts">' + ['active', 'delayed', 'on_hold', 'closed'].map(function(k){
        return '<div><dt><span class="tr-status st-' + k + '">' + esc(L.status[k]) + '</span></dt><dd>' + S[k] + '</dd></div>';
      }).join('') + '</dl></section>';
  }
  function howFaq(){
    var qa = h('qa');
    return '<section class="tk-sec" aria-labelledby="tk-q"><h2 class="tk-h" id="tk-q">' + h('qH') + '</h2><dl class="tk-qa">' + qa.map(function(x, i){
      return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + (i === qa.length - 1 ? ' <a href="https://wa.me/' + WA + '?text=' + encodeURIComponent(h('waLost')) + '" target="_blank" rel="noopener noreferrer">' + t('wa') + '</a>' : '') + '</dd></div>';
    }).join('') + '</dl></section>';
  }
  function how(){ return '<div class="tk">' + howSteps() + anatomy() + stageGuide() + statusGuide() + howFaq() + '</div>'; }

  var io = null, seen = {};
  function reveal(){
    var els = [].slice.call(app.querySelectorAll('.tk-sec'));
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) { els.forEach(function(e){ e.classList.add('tk-in'); }); return; }
    io = new IntersectionObserver(function(list){
      list.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('tk-in'); seen[en.target.getAttribute('aria-labelledby')] = 1; io.unobserve(en.target); } });
    }, { threshold: .2 });
    els.forEach(function(e){ if (seen[e.getAttribute('aria-labelledby')]) e.classList.add('tk-in'); else io.observe(e); });
  }

  function render(){
    lang = document.documentElement.lang === 'en' ? 'en' : 'he';
    var ae = document.activeElement, fid = ae && (ae.id === 'tr-code' || ae.id === 'tr-pass') ? ae.id : null, caret = fid ? ae.selectionStart : null;
    var p = state.data;
    app.innerHTML = head() + (p ? '<div class="tr-result">' + summary(p) +
      '<div class="tr-grid"><div class="tr-main">' + timeline(p) + stagesDetail(p) + '</div><aside class="tr-side">' + side(p) + '</aside></div></div>' : how());
    if (!p) reveal();
    if (fid) { var i = document.getElementById(fid); i.focus(); if (caret != null) try { i.setSelectionRange(caret, caret); } catch (e) {} }
  }

  /* ---------- lookup ---------- */
  var seq = 0;
  // probe: a link opened with ?code= only. Showcase projects open without a password; for the rest
  // a miss just leaves the code filled in and moves focus to the password field.
  function lookup(raw, pass, silent, probe){
    var code = PJ.normCode(raw);
    state.code = code || String(raw || '').trim().toUpperCase();
    state.pass = pass = String(pass || '');
    if (!code) { state.error = 'invalid'; state.data = null; render(); return; }
    if (!pass && !probe) { state.error = 'noPass'; state.data = null; render(); var pf = document.getElementById('tr-pass'); if (pf) pf.focus(); return; }
    var mine = ++seq;
    state.loading = true; state.error = ''; render();
    PJ.track(code, pass).then(function(data){
      if (mine !== seq) return;
      state.loading = false; state.data = data || null; state.error = data || probe ? '' : 'notFound';
      if (data) {
        if (pass) savePass(code, pass);
        var qs = new URLSearchParams(location.search); qs.set('code', code); history.replaceState(null, '', location.pathname + '?' + qs + location.hash);
      }
      render();
      if (!data && probe) { var f = document.getElementById('tr-pass'); if (f) f.focus(); }
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
    lookup(ev.target.elements.code.value, ev.target.elements.pass.value);
  });
  app.addEventListener('input', function(ev){
    if (ev.target.id === 'tr-code') state.code = ev.target.value;
    else if (ev.target.id === 'tr-pass') state.pass = ev.target.value;
  });
  app.addEventListener('click', function(ev){
    if (ev.target.closest('[data-act="demo"]')) { lookup('BD-DEMO-2026', PJ.demoPass); return; }
    if (ev.target.closest('[data-act="show"]')) {
      state.show = !state.show; render();
      var f = document.getElementById('tr-pass'); f.focus(); f.setSelectionRange(f.value.length, f.value.length);
    }
  });
  window.addEventListener('portfolio-languagechange', render);

  var q = new URLSearchParams(location.search).get('code'), qc = PJ.normCode(q);
  render();
  if (q) { var sp = qc ? savedPass(qc) : ''; lookup(q, sp, true, !sp); }
})();
