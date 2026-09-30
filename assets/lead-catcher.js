(function(){
  var box=document.getElementById('lead-catcher'); if(!box) return;
  var cv=document.getElementById('lc-canvas'); if(!cv) return;
  var cx=cv.getContext('2d'); if(!cx) return;
  var elL=document.getElementById('lc-leads'), elB=document.getElementById('lc-books'), elR=document.getElementById('lc-rev'), hint=document.getElementById('lc-hint');
  var cs=getComputedStyle(document.documentElement);
  function v(n,f){var x=cs.getPropertyValue(n).trim();return x||f}
  function he(){return document.documentElement.lang==='he'}
  var C={bg:v('--card','#252B33'),line:v('--line','#3A424C'),text:v('--text','#EEE8DF'),muted:v('--muted','#A39B92'),brick:v('--accent','#E8703F'),teal:v('--accent-2','#4FB3A6'),gold:v('--gold','#E8A33D'),ink:v('--ink','#1C2127'),bug:'#C44B4B'};
  var W=0,H=0,dpr=1,u=1;
  var bk={x:0,tx:0,w:0,h:0,y:0,bump:0,shake:0};
  function size(){
    var r=box.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=Math.max(1,Math.round(r.width));
    H=Math.max(1,Math.round(r.height));
    cv.width=Math.round(W*dpr);
    cv.height=Math.round(H*dpr);
    cv.style.width=W+'px';
    cv.style.height=H+'px';
    cx.setTransform(dpr,0,0,dpr,0,0);
    u=Math.min(W,H)/420;
    bk.w=124*u; bk.h=50*u; bk.y=H-bk.h-110*u;
    if(!bk.x) bk.x=bk.tx=W/2;
  }
  var items=[],pops=[],stars=[],leads=0,books=0,rev=0,auto=true,lastInput=0,spawnT=0,last=0,running=false,visible=true;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(var i=0;i<40;i++) stars.push({x:Math.random(),y:Math.random(),s:Math.random()*1.2+.4});
  function pick(){var r=Math.random();return r<.36?'coin':r<.64?'lead':r<.86?'book':'bug'}
  function spawn(){var t=pick(),r=16*u;items.push({t:t,x:r+Math.random()*(W-2*r),y:-r,r:r,vy:(H*(.26+Math.random()*.14)),sw:Math.random()*6.28,skip:auto&&t!=='bug'&&Math.random()<.18})}
  function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
  function drawItem(it){
    var r=it.r;
    cx.save();
    cx.translate(it.x,it.y);
    if(it.t==='coin'){
      cx.fillStyle=C.gold;cx.beginPath();cx.arc(0,0,r,0,Math.PI*2);cx.fill();
      cx.strokeStyle='rgba(28,33,39,.35)';cx.lineWidth=Math.max(1.5,1.8*u);cx.beginPath();cx.arc(0,0,r*.7,0,Math.PI*2);cx.stroke();
      cx.fillStyle=C.ink;cx.font='800 '+(r*1.05)+'px Heebo,Arial,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('₪',0,r*.06);
    }else if(it.t==='lead'){
      cx.fillStyle=C.teal;rr(-r,-r*.72,r*2,r*1.44,r*.42);cx.fill();
      cx.beginPath();cx.moveTo(-r*.28,r*.72);cx.lineTo(-r*.52,r*1.08);cx.lineTo(r*.02,r*.72);cx.fill();
      cx.fillStyle=C.ink;for(var k=-1;k<2;k++){cx.beginPath();cx.arc(k*r*.36,-r*.04,r*.12,0,Math.PI*2);cx.fill()}
    }else if(it.t==='book'){
      cx.fillStyle=C.brick;rr(-r,-r*.78,r*2,r*1.56,r*.28);cx.fill();
      cx.fillStyle=C.ink;cx.fillRect(-r,-r*.78+r*.4,r*2,Math.max(1.5,r*.1));
      cx.fillRect(-r*.48,-r*1.02,r*.16,r*.36);cx.fillRect(r*.32,-r*1.02,r*.16,r*.36);
      cx.strokeStyle=C.ink;cx.lineWidth=Math.max(1.8,2.1*u);cx.lineCap='round';cx.lineJoin='round';
      cx.beginPath();cx.moveTo(-r*.36,r*.22);cx.lineTo(-r*.06,r*.5);cx.lineTo(r*.42,-.02);cx.stroke();
    }else{
      cx.strokeStyle=C.bug;cx.lineWidth=Math.max(1.5,1.8*u);cx.lineCap='round';
      for(var s=-1;s<2;s+=2)for(var j=-1;j<2;j++){cx.beginPath();cx.moveTo(s*r*.38,j*r*.28);cx.lineTo(s*r*.82,j*r*.42);cx.stroke()}
      cx.beginPath();cx.moveTo(-r*.16,-r*.58);cx.lineTo(-r*.32,-r*.88);cx.moveTo(r*.16,-r*.58);cx.lineTo(r*.32,-r*.88);cx.stroke();
      cx.fillStyle=C.bug;cx.beginPath();cx.arc(0,0,r*.58,0,Math.PI*2);cx.fill();
      cx.strokeStyle=C.bg;cx.lineWidth=Math.max(1.2,1.4*u);cx.beginPath();cx.moveTo(0,-r*.58);cx.lineTo(0,r*.58);cx.stroke();
    }
    cx.restore();
  }
  function drawBasket(){var w=bk.w,h=bk.h,x=bk.x-w/2+(bk.shake?Math.sin(bk.shake*60)*4*u:0),y=bk.y+bk.bump*6*u,g=3*u,rad=3*u,bh=(h-2*g)/3,wall=14*u;
    var fw=(w-g)/2;cx.fillStyle=C.brick;rr(x,y+2*(bh+g),fw,bh,rad);cx.fill();rr(x+fw+g,y+2*(bh+g),fw,bh,rad);cx.fill();
    for(var i=0;i<2;i++){cx.fillStyle=i?C.teal:C.text;rr(x,y+i*(bh+g),wall,bh,rad);cx.fill();cx.fillStyle=i?C.text:C.teal;rr(x+w-wall,y+i*(bh+g),wall,bh,rad);cx.fill()}
    cx.fillStyle=C.muted;cx.font='500 '+(10.5*u)+'px "IBM Plex Mono",monospace';cx.textAlign='center';cx.textBaseline='top';cx.fillText('your-business.co.il',bk.x,y+h+8*u);
    cx.fillStyle=C.gold;rr(bk.x-5*u,y-16*u+Math.sin(last/300)*2*u,10*u,10*u,2*u);cx.fill()}
  function pop(x,y,txt,col){x=Math.max(46*u,Math.min(W-46*u,x));pops.push({x:x,y:y,t:txt,c:col,a:1})}
  function step(dt){
    spawnT-=dt;if(spawnT<=0){spawn();spawnT=.32+Math.random()*.38}
    if(auto){var best=null;for(var i=0;i<items.length;i++){var it=items[i];if(it.t==='bug'||it.skip)continue;if(!best||it.y>best.y)best=it}
      var tx=best?best.x:W/2;for(var j=0;j<items.length;j++){var b=items[j];if(b.t==='bug'&&b.y>bk.y-120*u&&Math.abs(b.x-tx)<bk.w*.55)tx+=(b.x<tx?1:-1)*bk.w*.75}
      bk.tx=Math.max(bk.w/2,Math.min(W-bk.w/2,tx));
      var sp=260*u*dt,d=bk.tx-bk.x;bk.x+=Math.abs(d)<sp?d:Math.sign(d)*sp}
    else{bk.x+=(bk.tx-bk.x)*Math.min(1,dt*18)}
    if(!auto&&performance.now()-lastInput>4500){auto=true;box.classList.remove('lc-active');}
    bk.bump=Math.max(0,bk.bump-dt*5);bk.shake=Math.max(0,bk.shake-dt);
    for(var k=items.length-1;k>=0;k--){var o=items[k];o.y+=o.vy*dt;o.sw+=dt*2;o.x+=Math.sin(o.sw)*12*u*dt;
      if(o.y+o.r*.6>=bk.y&&o.y-o.r<bk.y+bk.h*.5&&Math.abs(o.x-bk.x)<bk.w/2-4*u){items.splice(k,1);bk.bump=1;
        if(o.t==='coin'){var val=[150,250,400,800][Math.floor(Math.random()*4)];rev+=val;pop(o.x,bk.y,'+₪'+val,C.gold)}
        else if(o.t==='lead'){leads++;pop(o.x,bk.y,he()?'+1 פנייה':'+1 lead',C.teal)}
        else if(o.t==='book'){books++;pop(o.x,bk.y,he()?'+1 תור':'+1 booking',C.brick)}
        else{bk.shake=.35;rev=Math.max(0,rev-200);pop(o.x,bk.y,he()?'באג −₪200':'bug −₪200',C.bug)}
        render()}
      else if(o.y-o.r>H){items.splice(k,1)}}
    for(var p=pops.length-1;p>=0;p--){pops[p].y-=40*u*dt;pops[p].a-=dt*1.1;if(pops[p].a<=0)pops.splice(p,1)}
  }
  function render(){if(elL)elL.textContent=leads;if(elB)elB.textContent=books;if(elR)elR.textContent=rev.toLocaleString('en-US')}
  function draw(){cx.clearRect(0,0,W,H);
    cx.fillStyle=C.line;for(var i=0;i<stars.length;i++){var s=stars[i];cx.globalAlpha=.55;cx.fillRect(s.x*W,s.y*H,s.s*u*1.6,s.s*u*1.6)}cx.globalAlpha=1;
    for(var j=0;j<items.length;j++)drawItem(items[j]);
    drawBasket();
    cx.textAlign='center';cx.textBaseline='middle';cx.font='600 '+(13*u)+'px Manrope,Arial,sans-serif';
    for(var p=0;p<pops.length;p++){cx.globalAlpha=Math.max(0,pops[p].a);cx.fillStyle=pops[p].c;cx.fillText(pops[p].t,pops[p].x,pops[p].y-18*u)}cx.globalAlpha=1}
  function loop(t){if(!running)return;var dt=Math.min(.05,(t-(last||t))/1000);last=t;step(dt);draw();requestAnimationFrame(loop)}
  function start(){if(running||reduce)return;running=true;last=0;requestAnimationFrame(loop)}
  function stop(){running=false}
  function take(clientX){var r=box.getBoundingClientRect();bk.tx=Math.max(bk.w/2,Math.min(W-bk.w/2,clientX-r.left));if(auto){auto=false;box.classList.add('lc-active');}lastInput=performance.now()}
  box.addEventListener('pointermove',function(e){take(e.clientX)});
  box.addEventListener('pointerdown',function(e){take(e.clientX)});
  box.tabIndex=0;box.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();var r=box.getBoundingClientRect();take(r.left+bk.x+(e.key==='ArrowLeft'?-40:40)*u)}});
  if(window.ResizeObserver)new ResizeObserver(function(){size();if(!running)draw()}).observe(box);
  else window.addEventListener('resize',function(){size();if(!running)draw()});
  if('IntersectionObserver'in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;visible&&!document.hidden?start():stop()}).observe(box);
  document.addEventListener('visibilitychange',function(){document.hidden?stop():(visible&&start())});
  size();
  if(reduce){for(var n=0;n<7;n++){spawn();items[n].y=H*(.12+n*.09)}leads=12;books=7;rev=4850;render();draw();if(hint)hint.textContent='';}
  else start();
})();
