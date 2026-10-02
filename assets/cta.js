(function(){
  var html = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) html.classList.add('cta-js');

  document.addEventListener('pointermove', function(e){
    var b = e.target.closest && e.target.closest('.cta'); if (!b) return;
    var r = b.getBoundingClientRect();
    b.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    b.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  function init(){
    var list = [].slice.call(document.querySelectorAll('.cta'));
    if (!html.classList.contains('cta-js')) return;
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target;
        setTimeout(function(){ el.classList.add('cta-in'); }, 120);
        io.unobserve(el);
      });
    }, { threshold: .4 });
    list.forEach(function(el){ io.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
