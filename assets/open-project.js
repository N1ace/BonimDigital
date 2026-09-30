(function(){
  function openWin(url){
    const w=Math.min(1280,(screen.availWidth||1200)-80);
    const h=Math.min(860,(screen.availHeight||800)-80);
    const left=Math.max(0,Math.round(((screen.availWidth||w)-w)/2));
    const top=Math.max(0,Math.round(((screen.availHeight||h)-h)/2));
    const win=window.open(
      url,
      '_blank',
      'popup=yes,width='+w+',height='+h+',left='+left+',top='+top+',scrollbars=yes,resizable=yes'
    );
    if(win){ try{ win.opener=null; }catch(e){} return true; }
    return false;
  }

  function modified(e){
    return e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0;
  }

  function openFromClick(e,url){
    if(!url||modified(e)) return;
    e.preventDefault();
    if(!openWin(url)) location.href=url;
  }

  document.querySelectorAll('a[data-open-window][href]').forEach(a=>{
    a.addEventListener('click',e=>openFromClick(e,a.href));
  });

  document.querySelectorAll('.proj').forEach(card=>{
    const live=card.querySelector('.proj-actions a.btn.solid[href], a[data-open-window][href]');
    if(!live) return;
    card.style.cursor='pointer';
    card.addEventListener('click',e=>{
      const link=e.target.closest('a');
      if(link && link!==live) return;
      if(link===live) return;
      openFromClick(e,live.href);
    });
  });
})();
