/* Background journey line: winds down the page margins behind the sections and draws itself with scroll. */
(function(){
  var sections = [].slice.call(document.querySelectorAll('body > section[id], main > section[id]'));
  if (sections.length < 2 || !document.createElementNS) return;

  var NS = 'http://www.w3.org/2000/svg';
  var html = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs){
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  // Offsets rather than getBoundingClientRect, so .rv reveal transforms don't shift the milestones.
  function docTop(e){ var y = 0; while (e){ y += e.offsetTop; e = e.offsetParent; } return y; }
  function docLeft(e){ var x = 0; while (e){ x += e.offsetLeft; e = e.offsetParent; } return x; }

  var svg = el('svg', { 'class': 'sj', 'aria-hidden': 'true', focusable: 'false' });
  var grad = el('linearGradient', { id: 'sj-grad', gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0 });
  grad.appendChild(el('stop', { offset: 0, 'stop-color': '#0038B8' }));
  grad.appendChild(el('stop', { offset: .8, 'stop-color': '#0038B8' }));
  grad.appendChild(el('stop', { offset: 1, 'stop-color': '#C2410C' }));
  var defs = el('defs'); defs.appendChild(grad);
  var probe = el('path', { 'class': 'sj-probe' });
  var track = el('path', { 'class': 'sj-track' });
  var fill = el('path', { 'class': 'sj-fill', stroke: 'url(#sj-grad)' });
  var halo = el('circle', { 'class': 'sj-halo', r: 12 });
  var tip = el('circle', { 'class': 'sj-tip', r: 5 });
  [defs, probe, track, fill, halo, tip].forEach(function(n){ svg.appendChild(n); });
  document.body.insertBefore(svg, document.body.firstChild);
  var safe = document.createElement('div');
  safe.setAttribute('aria-hidden', 'true');
  safe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';
  document.body.appendChild(safe);

  var st = { pieces: [], nodes: [], total: 0, drawn: -1 };

  function build(){
    var vw = html.clientWidth;
    var wrap = sections[0].querySelector('.wrap') || sections[0];
    var wr = wrap.getBoundingClientRect(), cs = getComputedStyle(wrap);
    var cL = wr.left + parseFloat(cs.paddingLeft), cR = wr.right - parseFloat(cs.paddingRight);
    var cw = cR - cL;
    svg.classList.toggle('is-off', cw < 200);
    if (cw < 200){ [].forEach.call(document.querySelectorAll('.sj-point'), function(e){ e.classList.remove('sj-point', 'sj-hit', 'sj-goal'); }); st = { pieces: [], nodes: [], total: 0, drawn: -1 }; return; }
    // The line runs inside the content column, under the text and cards, rather than in the side margins.
    var compact = vw < 760;
    svg.classList.toggle('is-compact', compact);
    var inset = Math.max(24, cw * (compact ? .14 : .22));
    halo.setAttribute('r', compact ? 9 : 12);
    tip.setAttribute('r', compact ? 4 : 5);
    var ss = getComputedStyle(safe);
    var minX = (parseFloat(ss.paddingLeft) || 0) + 8, maxX = vw - (parseFloat(ss.paddingRight) || 0) - 8;
    var sideX = { L: Math.max(cL + inset, minX), R: Math.min(cR - inset, maxX) }, mid = (cL + cR) / 2;

    // Milestones are the section tags themselves: the line threads through the centre of each one.
    var pts = sections.map(function(s){
      var mark = s.querySelector('.sec-eyebrow, h2') || s;
      return { top: docTop(s), y: docTop(mark) + mark.offsetHeight / 2, x: docLeft(mark) + mark.offsetWidth / 2, mark: mark };
    });

    // Between tags the line swings to the far side and back. The swing count is picked by parity so the curve
    // always arrives at a tag from the opposite side, keeping the wave rhythm even down the page.
    var period = compact ? 420 : 560;
    function side(x){ return x > mid ? 'R' : 'L'; }
    function flip(sd){ return sd === 'R' ? 'L' : 'R'; }
    var way = [{ x: pts[0].x, y: pts[0].top + 16 }, { x: pts[0].x, y: pts[0].y, node: 0 }];
    for (var i = 1; i < pts.length; i++){
      var a = pts[i - 1], b = pts[i], gap = b.y - a.y;
      var same = side(a.x) === side(b.x);
      var m = Math.max(0, Math.round(gap / period) - 1);
      if ((m % 2 === 1) !== same) m += 1;
      var sd = flip(side(a.x));
      for (var j = 1; j <= m; j++){ way.push({ x: sideX[sd], y: a.y + gap * j / (m + 1) }); sd = flip(sd); }
      way.push({ x: b.x, y: b.y, node: i });
    }

    // Each waypoint is left and entered vertically, so the joins are seamless S-curves.
    // Every piece keeps (length, y) samples, letting the drawn length follow the scroll position exactly.
    var pieces = [], nodes = [], total = 0, d = 'M' + way[0].x + ' ' + way[0].y;
    for (var w = 1; w < way.length; w++){
      var p = way[w - 1], q = way[w], hgt = q.y - p.y;
      var cmd = Math.abs(q.x - p.x) < 1 ? 'V' + q.y
        : 'C' + p.x + ' ' + (p.y + hgt * .5) + ' ' + q.x + ' ' + (q.y - hgt * .5) + ' ' + q.x + ' ' + q.y;
      probe.setAttribute('d', 'M' + p.x + ' ' + p.y + cmd);
      var len = probe.getTotalLength(), n = Math.max(2, Math.ceil(len / 40)), samples = [];
      for (var s = 0; s <= n; s++){
        var at = len * s / n;
        samples.push({ l: at, y: s === 0 ? p.y : s === n ? q.y : probe.getPointAtLength(at).y });
      }
      pieces.push({ start: total, len: len, y0: p.y, y1: q.y, s: samples });
      total += len; d += cmd;
      if (q.node != null) nodes.push({ len: total, mark: pts[q.node].mark, goal: q.node === pts.length - 1 });
    }
    var cy = way[way.length - 1].y;

    var h = cy + 40;
    svg.setAttribute('width', vw);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + h);
    grad.setAttribute('y1', pts[0].top);
    grad.setAttribute('y2', cy);
    track.setAttribute('d', d);
    fill.setAttribute('d', d);
    fill.style.strokeDasharray = total + ' ' + total;

    nodes.forEach(function(n){ n.mark.classList.add('sj-point'); n.mark.classList.toggle('sj-goal', n.goal); });

    st = { pieces: pieces, nodes: nodes, total: total, drawn: -1 };
  }

  function lengthAt(y){
    for (var i = 0; i < st.pieces.length; i++){
      var p = st.pieces[i];
      if (y <= p.y0) return p.start;
      if (y < p.y1){
        for (var m = 1; m < p.s.length; m++){
          var b = p.s[m];
          if (b.y >= y){ var a = p.s[m - 1], f = b.y > a.y ? (y - a.y) / (b.y - a.y) : 1; return p.start + a.l + (b.l - a.l) * f; }
        }
        return p.start + p.len;
      }
    }
    return st.total;
  }

  function update(){
    if (!st.pieces.length) return;
    var vh = window.innerHeight, y = window.scrollY;
    var atEnd = y + vh >= html.scrollHeight - 4;
    var drawn = reduce || atEnd ? st.total : lengthAt(y + vh * .6);
    if (Math.abs(drawn - st.drawn) < .5) return;
    st.drawn = drawn;
    fill.style.strokeDashoffset = st.total - drawn;
    st.nodes.forEach(function(n){ n.mark.classList.toggle('sj-hit', drawn >= n.len - 1); });
    var moving = !reduce && drawn > 0 && drawn < st.total;
    if (moving){
      var pt = fill.getPointAtLength(drawn);
      tip.setAttribute('cx', pt.x); tip.setAttribute('cy', pt.y);
      halo.setAttribute('cx', pt.x); halo.setAttribute('cy', pt.y);
    }
    svg.classList.toggle('is-moving', moving);
  }

  var queued = false, dirty = true;
  function schedule(rebuild){
    if (rebuild) dirty = true;
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){
      queued = false;
      if (dirty){ build(); dirty = false; }
      update();
    });
  }

  if ('ResizeObserver' in window) new ResizeObserver(function(){ schedule(true); }).observe(document.body);
  if ('MutationObserver' in window) new MutationObserver(function(){ schedule(true); })
    .observe(html, { attributes: true, attributeFilter: ['dir', 'lang'] });
  window.addEventListener('portfolio-languagechange', function(){ schedule(true); });
  window.addEventListener('scroll', function(){ schedule(false); }, { passive: true });
  // Mobile URL bars resize the window while scrolling; only a width change moves the layout.
  var lastW = html.clientWidth;
  window.addEventListener('resize', function(){
    var w = html.clientWidth;
    schedule(w !== lastW);
    lastW = w;
  });
  window.addEventListener('orientationchange', function(){ setTimeout(function(){ schedule(true); }, 250); });
  window.addEventListener('load', function(){ schedule(true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ schedule(true); });
  schedule(true);
})();
