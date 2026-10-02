(function(){
  var root = document.querySelector('[data-stepper]'); if (!root) return;
  var items = [].slice.call(root.querySelectorAll('.stp-ind li'));
  var dots = items.map(function(li){ return li.querySelector('.stp-dot'); });
  var panels = [].slice.call(root.querySelectorAll('.stp-panel'));
  var body = root.querySelector('.stp-body');
  var back = root.querySelector('.stp-back'), next = root.querySelector('.stp-next');
  var countEl = root.querySelector('.stp-count b');
  var total = panels.length, current = 0, token = 0;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rtl(){ return document.documentElement.dir === 'rtl'; }

  function paint(){
    items.forEach(function(li, i){
      li.classList.toggle('is-on', i === current);
      li.classList.toggle('is-done', i < current);
      if (i === current) dots[i].setAttribute('aria-current', 'step'); else dots[i].removeAttribute('aria-current');
    });
    root.classList.toggle('is-last', current === total - 1);
    back.setAttribute('aria-hidden', current === 0 ? 'true' : 'false');
    back.tabIndex = current === 0 ? -1 : 0;
    if (countEl) countEl.textContent = current + 1;
  }

  function show(i){
    panels.forEach(function(p, k){ p.classList.toggle('is-on', k === i); p.classList.remove('is-out'); });
  }

  function go(to){
    to = Math.max(0, Math.min(total - 1, to));
    if (to === current) return;
    var dir = to > current ? 1 : -1, from = panels[current], mine = ++token;
    var dx = (rtl() ? -20 : 20) * dir + 'px';
    current = to; paint();

    if (reduce) { show(to); return; }

    var startH = body.offsetHeight;
    body.style.height = startH + 'px';
    from.style.setProperty('--dx', dx);
    from.classList.remove('is-in'); from.classList.add('is-out');

    setTimeout(function(){
      if (mine !== token) return;
      from.classList.remove('is-out');
      show(to);
      var p = panels[to];
      p.style.setProperty('--dx', dx);
      p.classList.remove('is-in'); void p.offsetWidth; p.classList.add('is-in');
      body.style.height = 'auto';
      var endH = body.offsetHeight;
      body.style.height = startH + 'px'; void body.offsetHeight;
      body.classList.add('is-sizing');
      body.style.height = endH + 'px';
      setTimeout(function(){
        if (mine !== token) return;
        body.classList.remove('is-sizing'); body.style.height = '';
      }, 480);
    }, 180);
  }

  dots.forEach(function(d, i){ d.addEventListener('click', function(){ go(i); }); });
  back.addEventListener('click', function(){ go(current - 1); });
  next.addEventListener('click', function(){ go(current + 1); });

  root.querySelector('.stp-ind').addEventListener('keydown', function(e){
    var i = dots.indexOf(document.activeElement); if (i < 0) return;
    var fwd = rtl() ? 'ArrowLeft' : 'ArrowRight', bwd = rtl() ? 'ArrowRight' : 'ArrowLeft', to = -1;
    if (e.key === fwd) to = Math.min(total - 1, i + 1);
    else if (e.key === bwd) to = Math.max(0, i - 1);
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = total - 1;
    if (to < 0) return;
    e.preventDefault(); dots[to].focus(); go(to);
  });

  var sx = null, sy = 0;
  body.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  body.addEventListener('touchend', function(e){
    if (sx == null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    var forward = rtl() ? dx > 0 : dx < 0;
    go(current + (forward ? 1 : -1));
  }, { passive: true });

  root.classList.add('is-ready');
  show(0); paint();
})();
