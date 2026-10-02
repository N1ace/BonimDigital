(function(){
  const year=document.getElementById('yr');
  if(year) year.textContent=new Date().getFullYear();

  const toggle=document.querySelector('.nav-toggle');
  const menu=document.getElementById('site-menu');
  if(toggle && menu){
    function closeMenu(){
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Open menu');
      toggle.textContent='☰';
      document.body.style.overflow='';
    }
    toggle.addEventListener('click',()=>{
      const open=menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded',open);
      toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
      toggle.textContent=open?'×':'☰';
      document.body.style.overflow=open?'hidden':'';
    });
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
    window.addEventListener('resize',()=>{ if(window.innerWidth>900) closeMenu(); });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape' && menu.classList.contains('is-open')){ closeMenu(); toggle.focus(); }
    });
  }

  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target);} });
  },{threshold:.12});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));

  // a table that scrolls sideways must be reachable and scrollable with the keyboard
  const wraps=[...document.querySelectorAll('.tbl')];
  if(wraps.length){
    wraps.forEach(w=>{
      const cap=w.querySelector('caption');
      w.setAttribute('role','region');
      if(cap) w.setAttribute('aria-label',cap.textContent.trim());
    });
    const sync=()=>wraps.forEach(w=>{
      if(w.scrollWidth>w.clientWidth+1) w.tabIndex=0; else w.removeAttribute('tabindex');
    });
    sync();
    window.addEventListener('resize',sync);
  }
})();
