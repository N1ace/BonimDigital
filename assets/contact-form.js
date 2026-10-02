(function(){
  var form = document.getElementById('contact-form'); if (!form) return;
  var B = window.BonimBooking;
  var card = form.parentNode, done = card.querySelector('.cf-done');
  var errBox = form.querySelector('.cf-err'), btn = form.querySelector('.cf-send'), btnTxt = btn.querySelector('span');
  var doneP = done.querySelector('p');
  var WA = (B && B.cfg.whatsapp) || '972527905122';
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function tr(s){ return window.portfolioTr ? window.portfolioTr(s) : s; }
  function lang(){ return document.documentElement.lang === 'en' ? 'en' : 'he'; }
  function validPhone(v){ return B ? B.validPhone(v) : /^0?5\d{8}$/.test(String(v).replace(/\D/g, '').replace(/^972/, '0')); }

  function showError(msg, field){
    errBox.textContent = msg; errBox.hidden = !msg;
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }
  function busy(on){
    btn.disabled = on;
    btnTxt.textContent = on ? 'Sending…' : 'Send message';
  }
  function lead(){ if (window.bdTrack) window.bdTrack('lead', 'contact-form'); }
  function finish(viaWhatsApp){
    doneP.textContent = viaWhatsApp
      ? 'WhatsApp opened with your message. Just press send and we will get back to you.'
      : 'We will get back to you within 24 hours. Need an answer sooner?';
    form.hidden = true; done.hidden = false; done.focus({ preventScroll: true });
    var r = card.getBoundingClientRect();
    if (r.top < 70 || r.top > window.innerHeight * .6) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function waText(d, topicLabel){
    var he = lang() === 'he';
    var lines = [
      he ? 'שלום בונים דיגיטל, השארתי פנייה באתר:' : 'Hi Bonim Digital, I left a message on the site:',
      (he ? 'שם: ' : 'Name: ') + d.name,
      (he ? 'טלפון: ' : 'Phone: ') + d.phone
    ];
    if (d.email) lines.push((he ? 'אימייל: ' : 'Email: ') + d.email);
    if (d.business) lines.push((he ? 'עסק: ' : 'Business: ') + d.business);
    lines.push((he ? 'מה צריך: ' : 'Need: ') + topicLabel);
    if (d.message) lines.push('', d.message);
    return lines.join('\n');
  }

  form.addEventListener('input', function(e){
    if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
    if (!errBox.hidden) showError('');
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var f = form.elements;
    var topic = form.querySelector('input[name="topic"]:checked');
    var d = {
      name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(),
      business: f.business.value.trim(), message: f.message.value.trim(),
      topic: topic ? topic.value : 'unsure', lang: lang(),
      marketing: f.marketing_opt_in.checked, ads: f.ads_audience_opt_in.checked
    };
    if (f.website.value) { finish(false); return; }
    if (d.name.length < 2) return showError(tr('Please enter your name.'), f.name);
    if (!validPhone(d.phone)) return showError(tr('Please enter a valid phone number.'), f.phone);
    if (d.email && !EMAIL_RE.test(d.email)) return showError(tr('Please enter a valid email or leave it empty.'), f.email);
    showError('');

    if (!B || !B.configured) {
      var label = topic ? topic.parentNode.querySelector('span').textContent.trim() : '';
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(waText(d, label)), '_blank', 'noopener');
      if (B) B.sendMessage(d);
      lead(); finish(true);
      return;
    }

    busy(true);
    B.sendMessage(d).then(function(){
      busy(false); lead(); finish(false);
    }, function(err){
      busy(false);
      var code = err && err.code;
      showError(tr(
        code === 'too_many' ? 'Too many messages from this number. Please try again in a few minutes.' :
        code === 'network' ? 'No connection. Check the internet and try again.' :
        code === 'invalid' ? 'Please check the phone number and try again.' :
        'Something went wrong. Please try again or message us on WhatsApp.'
      ));
    });
  });

  card.querySelector('[data-cf-again]').addEventListener('click', function(){
    form.reset(); done.hidden = true; form.hidden = false;
    form.elements.name.focus();
  });
})();
