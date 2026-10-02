(function(){
  /* Fill one of these to switch measurement on. The banner stays hidden while both are empty. */
  var GA4_ID = '';
  var META_PIXEL_ID = '';

  var KEY = 'bd-consent', VERSION = 1, MAX_AGE = 365 * 864e5;
  var doc = document, root = doc.documentElement, w = window;
  var me = doc.currentScript;
  var base = me ? me.src.replace(/assets\/consent\.js.*$/, '') : '';

  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function(){ w.dataLayer.push(arguments); };
  w.gtag('consent', 'default', {
    ad_storage: 'denied', analytics_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
    wait_for_update: 500
  });

  var preview = false;
  try {
    if (/[?&]cookie-preview=1\b/.test(location.search)) sessionStorage.setItem('bd-cookie-preview', '1');
    preview = sessionStorage.getItem('bd-cookie-preview') === '1';
  } catch (e) {}
  var enabled = !!(GA4_ID || META_PIXEL_ID) || preview;

  var state = null, gaLoaded = false, pixelLoaded = false;

  function read(){
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (c && c.v === VERSION && Date.now() - Date.parse(c.ts) < MAX_AGE) return c;
    } catch (e) {}
    return null;
  }

  function loadGA(){
    if (gaLoaded || !GA4_ID) return;
    gaLoaded = true;
    var s = doc.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    doc.head.appendChild(s);
    w.gtag('js', new Date());
    w.gtag('config', GA4_ID, { allow_google_signals: false });
  }

  function loadPixel(){
    if (pixelLoaded || !META_PIXEL_ID) return;
    pixelLoaded = true;
    var n = w.fbq = function(){ n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var s = doc.createElement('script');
    s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    doc.head.appendChild(s);
    w.fbq('consent', 'grant');
    w.fbq('init', META_PIXEL_ID);
    w.fbq('track', 'PageView');
  }

  function dropCookies(prefixes){
    doc.cookie.split(';').forEach(function(c){
      var name = c.split('=')[0].trim();
      if (!prefixes.some(function(p){ return name.indexOf(p) === 0; })) return;
      var host = location.hostname, parts = host.split('.');
      for (var i = 0; i < parts.length; i++) {
        var domain = parts.slice(i).join('.');
        doc.cookie = name + '=; Max-Age=0; path=/; domain=' + domain;
      }
      doc.cookie = name + '=; Max-Age=0; path=/';
    });
  }

  function apply(c){
    var prev = state;
    state = c;
    w.gtag('consent', 'update', {
      analytics_storage: c.analytics ? 'granted' : 'denied',
      ad_storage: c.marketing ? 'granted' : 'denied',
      ad_user_data: c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied'
    });
    if (GA4_ID) w['ga-disable-' + GA4_ID] = !c.analytics;
    if (c.analytics) loadGA();
    else if (prev && prev.analytics) dropCookies(['_ga', '_gid']);
    if (c.marketing) {
      if (pixelLoaded) w.fbq('consent', 'grant'); else loadPixel();
    } else if (pixelLoaded) {
      w.fbq('consent', 'revoke');
      dropCookies(['_fbp', '_fbc']);
    }
  }

  /* Conversion ping for a sent form. Never pass names, phones, emails or message text here. */
  w.bdTrack = function(event, source){
    if (event !== 'lead' || !state) return;
    if (state.analytics && gaLoaded) w.gtag('event', 'generate_lead', { form_id: String(source || '') });
    if (state.marketing && pixelLoaded) w.fbq('track', 'Lead');
  };

  if (!enabled) return;
  root.classList.add('bd-tracking-on');

  var saved = read();
  if (saved) apply(saved);

  var TEXT = {
    he: {
      title: 'עוגיות וכלי מדידה',
      body: 'אנחנו משתמשים בעוגיות ובכלי מדידה של Google ו-Meta כדי להבין איך משתמשים באתר ולהציג מודעות רלוונטיות. הם יופעלו רק אם תאשר.',
      link: 'פרטים במדיניות הפרטיות',
      all: 'מאשר הכל', necessary: 'רק הכרחי', settings: 'הגדרות', save: 'שמירת הבחירה',
      analytics: 'מדידה וסטטיסטיקה', analyticsSub: 'Google Analytics: אילו עמודים נצפים וכמה זמן.',
      marketing: 'שיווק ופרסום', marketingSub: 'Meta Pixel ותגיות Google Ads: מדידת מודעות והצגת מודעות רלוונטיות.',
      always: 'עוגיות הכרחיות (שפה, הגדרות האתר) פועלות תמיד ולא נשלחות לאף אחד.'
    },
    en: {
      title: 'Cookies and measurement',
      body: 'We use cookies and measurement tools from Google and Meta to understand how the site is used and to show relevant ads. They only run if you agree.',
      link: 'Details in the privacy policy',
      all: 'Accept all', necessary: 'Necessary only', settings: 'Settings', save: 'Save my choice',
      analytics: 'Measurement and statistics', analyticsSub: 'Google Analytics: which pages are viewed and for how long.',
      marketing: 'Marketing and ads', marketingSub: 'Meta Pixel and Google Ads tags: ad measurement and relevant ads.',
      always: 'Necessary cookies (language, site settings) always run and are not sent to anyone.'
    }
  };

  var box = null, opener = null, settingsOpen = false;
  function lang(){ return root.lang === 'en' ? 'en' : 'he'; }

  function build(){
    var L = TEXT[lang()], c = state || { analytics: false, marketing: false };
    var html =
      '<h2 class="bd-ck-title" id="bd-ck-title">' + L.title + '</h2>' +
      '<p class="bd-ck-text" id="bd-ck-text">' + L.body + ' <a href="' + base + 'privacy.html#cookies">' + L.link + '</a></p>' +
      '<div class="bd-ck-set" id="bd-ck-set"' + (settingsOpen ? '' : ' hidden') + '>' +
        '<label class="bd-ck-tg"><input type="checkbox" role="switch" name="analytics"' + (c.analytics ? ' checked' : '') + '>' +
          '<span class="bd-ck-sw" aria-hidden="true"></span><span class="bd-ck-tg-txt"><b>' + L.analytics + '</b><small>' + L.analyticsSub + '</small></span></label>' +
        '<label class="bd-ck-tg"><input type="checkbox" role="switch" name="marketing"' + (c.marketing ? ' checked' : '') + '>' +
          '<span class="bd-ck-sw" aria-hidden="true"></span><span class="bd-ck-tg-txt"><b>' + L.marketing + '</b><small>' + L.marketingSub + '</small></span></label>' +
        '<p class="bd-ck-always">' + L.always + '</p>' +
        '<button type="button" class="bd-ck-btn bd-ck-save" data-ck="save">' + L.save + '</button>' +
      '</div>' +
      '<div class="bd-ck-btns">' +
        '<button type="button" class="bd-ck-btn" data-ck="all">' + L.all + '</button>' +
        '<button type="button" class="bd-ck-btn" data-ck="necessary">' + L.necessary + '</button>' +
        '<button type="button" class="bd-ck-btn" data-ck="settings" aria-controls="bd-ck-set" aria-expanded="' + settingsOpen + '">' + L.settings + '</button>' +
      '</div>';
    box.innerHTML = html;
    box.lang = lang(); box.dir = lang() === 'en' ? 'ltr' : 'rtl';
  }

  function open(withSettings, from){
    opener = from || null;
    settingsOpen = !!withSettings;
    if (!box) {
      box = doc.createElement('div');
      box.className = 'bd-ck';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'false');
      box.setAttribute('aria-labelledby', 'bd-ck-title');
      box.setAttribute('aria-describedby', 'bd-ck-text');
      box.setAttribute('data-i18n-skip', '');
      box.addEventListener('click', onClick);
      box.addEventListener('keydown', function(e){
        if (e.key === 'Escape' && state) { e.preventDefault(); close(); }
      });
      doc.body.appendChild(box);
    }
    build();
    box.hidden = false;
    root.classList.add('bd-ck-open');
    if (from) {
      var first = box.querySelector(settingsOpen ? '.bd-ck-set input' : '.bd-ck-btn');
      if (first) first.focus();
    }
  }

  function close(){
    if (!box) return;
    box.hidden = true;
    root.classList.remove('bd-ck-open');
    if (opener && doc.contains(opener)) opener.focus();
    opener = null;
  }

  function save(analytics, marketing){
    var c = { analytics: !!analytics, marketing: !!marketing, ts: new Date().toISOString(), v: VERSION };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    apply(c);
    close();
  }

  function onClick(e){
    var b = e.target.closest('[data-ck]'); if (!b) return;
    var act = b.getAttribute('data-ck');
    if (act === 'all') save(true, true);
    else if (act === 'necessary') save(false, false);
    else if (act === 'save') save(box.querySelector('[name="analytics"]').checked, box.querySelector('[name="marketing"]').checked);
    else if (act === 'settings') {
      settingsOpen = !settingsOpen;
      b.setAttribute('aria-expanded', settingsOpen);
      var set = box.querySelector('.bd-ck-set');
      set.hidden = !settingsOpen;
      if (settingsOpen) set.querySelector('input').focus();
    }
  }

  function init(){
    doc.querySelectorAll('[data-consent-open]').forEach(function(el){ el.hidden = false; });
    doc.addEventListener('click', function(e){
      var t = e.target.closest('[data-consent-open]'); if (!t) return;
      e.preventDefault(); open(true, t);
    });
    w.addEventListener('portfolio-languagechange', function(){
      if (!box || box.hidden) return;
      var set = box.querySelector('.bd-ck-set');
      if (set) settingsOpen = !set.hidden;
      var focused = doc.activeElement && box.contains(doc.activeElement) ? doc.activeElement.getAttribute('data-ck') || doc.activeElement.name : null;
      build();
      if (focused) {
        var again = box.querySelector('[data-ck="' + focused + '"], [name="' + focused + '"]');
        if (again) again.focus();
      }
    });
    if (!state) open(false, null);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
