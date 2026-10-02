(function(){
  var root=document.getElementById('services'); if(!root) return;
  var chips=root.querySelectorAll('.svc-chip');
  var cards=root.querySelectorAll('.svc-bento .svc-card');
  var band=root.querySelector('.svc-band');
  function has(el,f){return (' '+(el.getAttribute('data-t')||'')+' ').indexOf(' '+f+' ')>-1}
  function apply(f){
    var all=f==='all';
    cards.forEach(function(c){
      var match=all||has(c,f);
      c.classList.toggle('dim',!match);
      c.classList.toggle('hl',match&&!all);
    });
    if(band){
      var any=all||f==='has'||!!band.querySelector('.svc-card:not(.dim)');
      band.classList.toggle('dim',!any);
    }
  }
  chips.forEach(function(chip){
    chip.addEventListener('click',function(){
      chips.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false')});
      chip.classList.add('on');chip.setAttribute('aria-pressed','true');
      apply(chip.getAttribute('data-f'));
    });
  });
})();
