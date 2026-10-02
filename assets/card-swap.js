(function(){
  var stage = document.querySelector('[data-card-swap]');
  if (!stage) return;
  var anchor = stage.querySelector('.cs-anchor');
  var cards = [].slice.call(stage.querySelectorAll('.cs-card'));
  var works = stage.closest('.works');
  var items = works ? [].slice.call(works.querySelectorAll('.works-item')) : [];
  var list = works && works.querySelector('.works-list');
  var n = cards.length, spread = Math.max(1, n - 1);
  var stacked = matchMedia('(max-width: 900px)');
  var touchedList = 0;
  if (!anchor || n < 2) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DELAY = 4.5, SKEW = 4, DUR = 2, OVERLAP = 0.9, RETURN_DELAY = 0.05, STAGGER = 0.15, DROP = 500;

  // GSAP elastic.out(0.6, 0.9)
  function elastic(p){ return p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p - 0.375) * 4.18879) + 1; }
  function easeOut(p){ return 1 - Math.pow(1 - p, 3); }

  var dist = { x: 44, y: 40 }, dir = 1;
  var order = cards.map(function(_, i){ return i; });
  var pos = cards.map(function(){ return { x: 0, y: 0, z: 0 }; });
  var tweens = [], events = [];
  var clock = 0, next = DELAY, hold = false, paused = false, visible = false, raf = 0, last = 0;

  function slot(i){ return { x: i * dist.x * dir, y: -i * dist.y, z: -i * dist.x * 1.5, zi: n - i }; }
  function paint(i){
    var p = pos[i];
    cards[i].style.transform = 'translate(-50%,-50%) translate3d(' + p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px,' + p.z.toFixed(2) + 'px) skewY(' + (SKEW * dir) + 'deg)';
  }
  function place(i, s){ pos[i] = { x: s.x, y: s.y, z: s.z }; cards[i].style.zIndex = s.zi; paint(i); }
  function tween(i, to, at, dur, ease){ tweens.push({ i: i, to: to, at: at, dur: dur, ease: ease }); }
  function call(at, fn){ events.push({ at: at, fn: fn }); }

  function setActive(idx){
    items.forEach(function(it){
      var on = +it.getAttribute('data-idx') === idx;
      it.classList.toggle('on', on);
      it.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (!on) { var b = it.querySelector('.works-bar i'); if (b) b.style.transform = ''; }
      if (on) reveal(it);
    });
  }

  // keep the active item visible inside the list without moving the page
  function reveal(it){
    if (!list || Date.now() - touchedList < 4000 || list.matches(':hover')) return;
    var lr = list.getBoundingClientRect(), ir = it.getBoundingClientRect(), pad = 12;
    var dy = ir.top < lr.top ? ir.top - lr.top - pad : ir.bottom > lr.bottom ? ir.bottom - lr.bottom + pad : 0;
    var dx = ir.left < lr.left ? ir.left - lr.left - pad : ir.right > lr.right ? ir.right - lr.right + pad : 0;
    if (dx || dy) list.scrollBy({ top: dy, left: dx, behavior: reduce ? 'auto' : 'smooth' });
  }

  function fades(){
    if (!list || !items.length) return;
    var lr = list.getBoundingClientRect();
    var a = items[0].getBoundingClientRect(), z = items[items.length - 1].getBoundingClientRect();
    var left = Math.min(a.left, z.left), right = Math.max(a.right, z.right);
    list.classList.toggle('f-up', a.top < lr.top - 2);
    list.classList.toggle('f-down', z.bottom > lr.bottom + 2);
    list.classList.toggle('f-left', left < lr.left - 2);
    list.classList.toggle('f-right', right > lr.right + 2);
  }

  function swap(){
    var front = order[0], rest = order.slice(1), t0 = clock;
    tween(front, { dy: DROP }, t0, DUR, elastic);
    var promote = t0 + DUR * (1 - OVERLAP);
    call(promote, function(){ setActive(rest[0]); });
    rest.forEach(function(idx, i){
      var s = slot(i);
      call(promote, function(){ cards[idx].style.zIndex = s.zi; });
      tween(idx, s, promote + i * STAGGER, DUR, elastic);
    });
    var ret = promote + DUR * RETURN_DELAY, back = slot(n - 1);
    call(ret, function(){ cards[front].style.zIndex = back.zi; });
    tween(front, back, ret, DUR, elastic);
    order = rest.concat(front);
  }

  function step(){
    events = events.filter(function(ev){ if (clock >= ev.at) { ev.fn(); return false; } return true; });
    var dirty = {};
    tweens.forEach(function(t){
      if (t.dead || clock < t.at || t.from) return;
      tweens.forEach(function(o){ if (o !== t && o.i === t.i && o.from) o.dead = true; });
      var p = pos[t.i];
      t.from = { x: p.x, y: p.y, z: p.z };
      t.target = {
        x: t.to.x != null ? t.to.x : p.x,
        y: t.to.dy != null ? p.y + t.to.dy : (t.to.y != null ? t.to.y : p.y),
        z: t.to.z != null ? t.to.z : p.z
      };
    });
    tweens = tweens.filter(function(t){
      if (t.dead) return false;
      if (!t.from) return true;
      var k = Math.min(1, (clock - t.at) / t.dur), e = t.ease(k);
      pos[t.i] = {
        x: t.from.x + (t.target.x - t.from.x) * e,
        y: t.from.y + (t.target.y - t.from.y) * e,
        z: t.from.z + (t.target.z - t.from.z) * e
      };
      dirty[t.i] = 1;
      return k < 1;
    });
    for (var i in dirty) paint(+i);
    // Promote layers only while moving; at rest the browser re-rasterises the cards at full sharpness.
    var moving = tweens.length > 0;
    if (moving !== animating){ animating = moving; stage.classList.toggle('is-anim', moving); }
  }
  var animating = false;

  function progress(){
    var active = items.filter(function(it){ return it.classList.contains('on'); })[0];
    var bar = active && active.querySelector('.works-bar i');
    if (bar) bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, 1 - (next - clock) / DELAY)).toFixed(3) + ')';
  }

  function running(){ return visible && !document.hidden; }

  function frame(ts){
    raf = 0;
    if (!running()) { last = 0; return; }
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    clock += dt;
    if (hold || paused) next += dt;
    if (!reduce && clock >= next) { swap(); next = clock + DELAY; }
    step();
    if (!reduce) progress();
    if (reduce && !tweens.length && !events.length) { last = 0; return; }
    raf = requestAnimationFrame(frame);
  }

  function kick(){
    if (works) works.classList.toggle('is-paused', hold || paused || !running());
    if (running() && !raf) { last = 0; raf = requestAnimationFrame(frame); }
  }

  function goTo(idx){
    var p = order.indexOf(idx);
    if (p <= 0) return;
    tweens = []; events = [];
    order = order.slice(p).concat(order.slice(0, p));
    order.forEach(function(ci, i){
      var s = slot(i);
      cards[ci].style.zIndex = s.zi;
      if (reduce) place(ci, s); else tween(ci, s, clock, 0.8, easeOut);
    });
    setActive(idx);
    next = clock + DELAY;
    kick();
  }

  function layout(){
    var w = stage.clientWidth;
    if (!w) return;
    dir = getComputedStyle(stage).direction === 'rtl' ? -1 : 1;
    var small = w < 560, side = small ? 28 : 40;
    // every card behind the front one keeps a strip of at least 24px to tap (WCAG 2.5.8)
    dist = small ? { x: 48 / spread, y: Math.max(32, 72 / spread) } : { x: 132 / spread, y: 120 / spread };
    var even = function(v){ return Math.round(v / 2) * 2; };
    // the back card is pushed away in 3D and drawn smaller; 1200 must match .cs-anchor perspective
    var reach = spread * dist.x, s = 1200 / (1200 + reach * 1.5);
    var cardW = even(Math.max(small ? 200 : 230, Math.min(small ? 400 : 480, (w - reach * s - side * 2) / (1 - (1 - s) / 2))));
    var cardH = even(cardW * (small ? 0.88 : 0.72));
    var padT = 28 + spread * dist.y, padB = 48, stageH = cardH + padT + padB;
    stage.style.height = stageH + 'px';
    if (list) list.style.maxHeight = stacked.matches ? '' : stageH + 'px';
    var stackW = cardW + reach * s - (1 - s) * cardW / 2;
    var off = Math.max(0, (w - stackW) / 2);
    anchor.style.width = cardW + 'px';
    anchor.style.height = cardH + 'px';
    anchor.style.top = padT + 'px';
    anchor.style.left = (dir > 0 ? off : w - off - cardW) + 'px';
    cards.forEach(function(c){
      c.style.width = cardW + 'px';
      c.style.height = cardH + 'px';
      var shot = c.querySelector('.cs-shot');
      if (shot) shot.style.setProperty('--cs-scale', (cardW / 1280).toFixed(4));
    });
    tweens = []; events = [];
    order.forEach(function(ci, i){ place(ci, slot(i)); });
    fades();
  }

  if (list) {
    list.addEventListener('scroll', fades, { passive: true });
    ['wheel', 'touchstart', 'pointerdown'].forEach(function(t){
      list.addEventListener(t, function(){ touchedList = Date.now(); }, { passive: true });
    });
  }

  items.forEach(function(it){
    it.addEventListener('click', function(){ goTo(+it.getAttribute('data-idx')); });
  });
  cards.forEach(function(c, i){
    c.addEventListener('focus', function(){ if (c.matches(':focus-visible')) goTo(i); });
  });
  stage.addEventListener('mouseenter', function(){ hold = true; kick(); });
  stage.addEventListener('mouseleave', function(){ hold = stage.contains(document.activeElement); kick(); });
  stage.addEventListener('focusin', function(){ hold = true; kick(); });
  stage.addEventListener('focusout', function(e){ if (!stage.contains(e.relatedTarget)) { hold = stage.matches(':hover'); kick(); } });
  if (!reduce) {
    var pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.className = 'a11y-pause cs-pause';
    pauseBtn.setAttribute('aria-pressed', 'false');
    pauseBtn.setAttribute('aria-label', 'Pause the project slideshow');
    pauseBtn.innerHTML = '<svg class="a11y-stop" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg><svg class="a11y-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
    pauseBtn.addEventListener('click', function(){
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (!paused) hold = false;
      kick();
    });
    stage.appendChild(pauseBtn);
  }
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('portfolio-languagechange', layout);
  var rz = 0;
  window.addEventListener('resize', function(){ cancelAnimationFrame(rz); rz = requestAnimationFrame(layout); });

  new IntersectionObserver(function(es){
    visible = es[0].isIntersecting;
    kick();
  }, { threshold: 0.15 }).observe(stage);

  var lite = window.matchMedia('(hover: none), (pointer: coarse), (max-width: 1023px)').matches;
  var shotIo = new IntersectionObserver(function(es){
    if (!es[0].isIntersecting) return;
    shotIo.disconnect();
    stage.querySelectorAll('.cs-shot[data-src] iframe').forEach(function(f){
      if (f.getAttribute('src')) return;
      var poster = f.parentNode.getAttribute('data-poster');
      if (lite && poster) {
        var img = new Image();
        img.alt = f.title || '';
        img.decoding = 'async';
        img.className = 'cs-poster';
        img.src = poster;
        f.replaceWith(img);
        return;
      }
      f.src = f.parentNode.getAttribute('data-src');
    });
  }, { rootMargin: '200px' });
  shotIo.observe(stage);

  layout();
  setActive(order[0]);
})();
