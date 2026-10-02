/* Scroll-drawn journey line through the numbered steps (.sp-steps). */
(function(){
  var roots = [].slice.call(document.querySelectorAll('.sp-steps'));
  if (!roots.length || !('ResizeObserver' in window)) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs){
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }

  var items = roots.map(function(root){
    root.classList.add('has-journey');
    var svg = el('svg', { 'class': 'jr', 'aria-hidden': 'true', focusable: 'false' });
    var head = el('circle', { 'class': 'jr-head', r: 5 });
    svg.appendChild(head);
    root.insertBefore(svg, root.firstChild);
    return { root: root, svg: svg, head: head, steps: [].slice.call(root.querySelectorAll('.sp-step')), segs: [], total: 0, p: -1 };
  });

  // Offsets rather than getBoundingClientRect, so the .rv reveal transform doesn't skew the route.
  function points(st){
    return st.steps.map(function(s){
      var n = s.querySelector('.sp-step-n');
      return {
        x: s.offsetLeft + n.offsetLeft + n.offsetWidth / 2,
        y: s.offsetTop + n.offsetTop + n.offsetHeight / 2,
        w: n.offsetWidth / 2 + 7,
        h: n.offsetHeight / 2 + 7,
        top: s.offsetTop,
        bot: s.offsetTop + s.offsetHeight,
        l: s.offsetLeft,
        r: s.offsetLeft + s.offsetWidth
      };
    });
  }

  function corner(cx, cy, x, y){ return 'Q' + cx + ' ' + cy + ' ' + x + ' ' + y; }

  // Segments start and end beside the badges and only travel through the empty badge row and the gaps
  // between cards, so the line never covers a number or crosses text.
  function route(a, b, gap){
    if (Math.abs(a.y - b.y) < 4){
      var s = b.x > a.x ? 1 : -1;
      return 'M' + (a.x + s * a.w) + ' ' + a.y + 'H' + (b.x - s * b.w);
    }
    var so = (a.r - a.x) < (a.x - a.l) ? 1 : -1;
    var xo = (so > 0 ? a.r : a.l) + so * gap / 2;
    var x0 = a.x + so * a.w;
    var bo = (so > 0 ? b.r : b.l) + so * gap / 2;
    var r;
    if (Math.abs(bo - xo) < 2){
      var x1 = b.x + so * b.w;
      r = Math.max(0, Math.min(12, Math.abs(xo - x0), Math.abs(xo - x1), (b.y - a.y) / 2));
      return 'M' + x0 + ' ' + a.y + 'H' + (xo - so * r) + corner(xo, a.y, xo, a.y + r) +
        'V' + (b.y - r) + corner(xo, b.y, xo - so * r, b.y) + 'H' + x1;
    }
    var gy = (a.bot + b.top) / 2, y1 = b.y - b.h, sx = b.x > xo ? 1 : -1;
    r = Math.max(0, Math.min(12, Math.abs(xo - x0), (gy - a.y) / 2, Math.abs(b.x - xo) / 2, y1 - gy));
    return 'M' + x0 + ' ' + a.y + 'H' + (xo - so * r) + corner(xo, a.y, xo, a.y + r) +
      'V' + (gy - r) + corner(xo, gy, xo + sx * r, gy) +
      'H' + (b.x - sx * r) + corner(b.x, gy, b.x, gy + r) + 'V' + y1;
  }

  function build(st){
    st.segs.forEach(function(g){ g.track.remove(); g.fill.remove(); });
    st.segs = []; st.total = 0; st.p = -1;
    st.svg.setAttribute('viewBox', '0 0 ' + st.root.clientWidth + ' ' + st.root.clientHeight);
    var pts = points(st);
    var gap = parseFloat(getComputedStyle(st.root).columnGap) || 14;
    for (var i = 0; i < pts.length - 1; i++){
      var d = route(pts[i], pts[i + 1], gap);
      var track = el('path', { d: d, 'class': 'jr-track' });
      var fill = el('path', { d: d, 'class': 'jr-fill' });
      st.svg.insertBefore(track, st.head);
      st.svg.insertBefore(fill, st.head);
      var len = fill.getTotalLength();
      fill.style.strokeDasharray = len + ' ' + len;
      fill.style.strokeDashoffset = len;
      st.segs.push({ track: track, fill: fill, len: len, start: st.total });
      st.total += len;
    }
  }

  function update(st){
    var r = st.root.getBoundingClientRect(), vh = window.innerHeight;
    // 0 when the steps' top reaches 85% of the viewport, 1 when their bottom reaches 55%.
    var p = reduce ? 1 : clamp((vh * .85 - r.top) / (vh * .3 + r.height), 0, 1);
    if (Math.abs(p - st.p) < .0005) return;
    st.p = p;
    var drawn = p * st.total, headSeg = null;
    st.segs.forEach(function(g){
      var l = clamp(drawn - g.start, 0, g.len);
      g.fill.style.strokeDashoffset = g.len - l;
      if (l > 0 && l < g.len) headSeg = { g: g, l: l };
    });
    st.steps.forEach(function(s, i){
      var at = i ? st.segs[i - 1].start + st.segs[i - 1].len : 0;
      s.classList.toggle('is-reached', p > .01 && drawn >= at - 2);
    });
    if (headSeg && !reduce){
      var pt = headSeg.g.fill.getPointAtLength(headSeg.l);
      st.head.setAttribute('cx', pt.x);
      st.head.setAttribute('cy', pt.y);
      st.head.classList.add('on');
    } else st.head.classList.remove('on');
  }

  var queued = false, dirty = true;
  function schedule(rebuild){
    if (rebuild) dirty = true;
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){
      queued = false;
      items.forEach(function(st){ if (dirty) build(st); update(st); });
      dirty = false;
    });
  }

  var ro = new ResizeObserver(function(){ schedule(true); });
  items.forEach(function(st){ ro.observe(st.root); });
  new MutationObserver(function(){ schedule(true); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['dir', 'lang'] });
  window.addEventListener('scroll', function(){ schedule(false); }, { passive: true });
  window.addEventListener('resize', function(){ schedule(true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ schedule(true); });
  schedule(true);
})();
