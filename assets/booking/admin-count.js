(function(){
  var B = window.BonimBooking; if (!B) return;
  var badge = document.querySelector('[data-new-count]'); if (!badge) return;
  function refresh(){
    if (B.configured && !B.admin.session()) { badge.hidden = true; return; }
    B.admin.messages.list().then(function(rows){
      var n = (rows || []).filter(function(m){ return m.status === 'new'; }).length;
      badge.textContent = n; badge.hidden = !n;
    }, function(){ badge.hidden = true; });
  }
  window.addEventListener('bonim-messages-changed', refresh);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) refresh(); });
  setInterval(function(){ if (!document.hidden) refresh(); }, 60000);
  refresh();
})();
