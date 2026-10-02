/* Hero background: leads, bookings and payments fall and the website cart drives under each one to catch it. */
(function(){
  var box=document.getElementById('lead-catcher'); if(!box) return;
  var cv=document.getElementById('lc-canvas'); if(!cv) return;
  var cx=cv.getContext('2d'); if(!cx) return;
  var cs=getComputedStyle(document.documentElement);
  function v(n,f){var x=cs.getPropertyValue(n).trim();return x||f}
  function he(){return document.documentElement.lang==='he'}
  var C={line:v('--line','#E3E8F0'),text:v('--text','#0B1B33'),muted:v('--muted','#52607A'),blue:v('--accent','#0038B8'),brick:v('--accent-2','#C2410C'),
    gold:v('--gold','#F4B740'),goldInk:v('--gold-ink','#8A5A00'),white:'#FFFFFF',tire:'#0B1B33',farTire:'#3A4A63',hub:'#C9D2DF',panel:'#E6EDFB',panelLine:'#C9D6F2'};
  var W=0,H=0,dpr=1,u=1,VMAX=0,ACC=0,FALL=0;
  var cart={x:0,v:0,w:0,h:0,rN:0,gy:0,lean:0,bump:0,spin:0,bob:0};
  var items=[],pops=[],dust=[],pins=[],plan=null,clock=0,spawnT=.4,last=0,running=false,visible=true;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 'wait' while the loading screen is up, 'intro' while the cart drives in from the left, then 'play'.
  var booting=document.documentElement.classList.contains('boot-on')&&window.__bonimBoot!=='done';
  var phase=reduce?'play':booting?'wait':'intro',introT=0,INTRO=1.8;
  window.addEventListener('bonim:boot-done',function(){if(phase==='wait'){phase='intro';introT=-.2}});

  function lo(){return cart.w/2+22*u}
  function hi(){return W-cart.w/2-22*u}
  function clampX(x){var a=lo(),b=hi();return a>b?W/2:Math.max(a,Math.min(b,x))}
  function topY(){return cart.gy-cart.rN-2*u-cart.h}
  function arrival(o){return clock+Math.max(0,topY()-o.r*.6-o.y)/FALL}
  // Distance the cart can cover from standstill to standstill in t seconds.
  function reach(t){var tc=VMAX/ACC;return t>=2*tc?VMAX*(t-tc):ACC*t*t/4}

  function size(){
    var r=box.getBoundingClientRect(),oldW=W;
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=Math.max(1,Math.round(r.width));
    H=Math.max(1,Math.round(r.height));
    cv.width=Math.round(W*dpr);
    cv.height=Math.round(H*dpr);
    cv.style.width=W+'px';
    cv.style.height=H+'px';
    cx.setTransform(dpr,0,0,dpr,0,0);
    if('direction'in cx) cx.direction='ltr';
    u=Math.max(.75,Math.min(1.25,Math.min(W,H)/440));
    cart.w=132*u; cart.h=50*u; cart.rN=14*u;
    cart.gy=H-Math.max(40*u,H*.1);
    VMAX=170*u; ACC=420*u; FALL=Math.max(70*u,H*.19);
    if(oldW&&oldW!==W){var k=W/oldW;cart.x*=k;for(var i=0;i<items.length;i++)items[i].x=clampX(items[i].x*k)}
    if(phase==='play') cart.x=cart.x?clampX(cart.x):W/2;
    else if(phase==='wait') cart.x=-cart.w*.75;
    for(var j=0;j<items.length;j++)items[j].at=arrival(items[j]);
    plan=items.length?{x:items[items.length-1].x,t:items[items.length-1].at}:null;
  }

  function pick(){var r=Math.random();return r<.36?'coin':r<.68?'lead':'book'}
  // Each item's landing spot is chosen so the cart can get there calmly from the previous catch.
  function spawn(){
    var r=21*u,o={t:pick(),x:0,y:r*1.2+10*u,r:r,sw:Math.random()*6.28,age:0};
    o.at=arrival(o);
    var from=plan||{x:cart.x,t:clock},d=reach(Math.max(0,o.at-from.t)*.75);
    var a=Math.max(lo(),from.x-d),b=Math.min(hi(),from.x+d);
    if(a>b){a=b=clampX(from.x)}
    o.x=a+Math.random()*(b-a);
    items.push(o);
    plan={x:o.x,t:o.at};
  }

  function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
  function drawItem(it){
    var r=it.r;
    cx.save();
    cx.globalAlpha=Math.min(1,it.age/.45);
    cx.translate(it.x+Math.sin(it.sw)*5*u,it.y);
    if(it.t==='coin'){
      cx.fillStyle=C.gold;cx.beginPath();cx.arc(0,0,r,0,Math.PI*2);cx.fill();
      cx.strokeStyle='rgba(11,27,51,.35)';cx.lineWidth=Math.max(1.5,1.8*u);cx.beginPath();cx.arc(0,0,r*.7,0,Math.PI*2);cx.stroke();
      cx.fillStyle=C.text;cx.font='800 '+(r*1.05)+'px Heebo,Arial,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('₪',0,r*.06);
    }else if(it.t==='lead'){
      cx.fillStyle=C.blue;rr(-r,-r*.72,r*2,r*1.44,r*.42);cx.fill();
      cx.beginPath();cx.moveTo(-r*.28,r*.72);cx.lineTo(-r*.52,r*1.08);cx.lineTo(r*.02,r*.72);cx.fill();
      cx.fillStyle=C.white;for(var k=-1;k<2;k++){cx.beginPath();cx.arc(k*r*.36,-r*.04,r*.12,0,Math.PI*2);cx.fill()}
    }else{
      cx.fillStyle=C.brick;rr(-r,-r*.78,r*2,r*1.56,r*.28);cx.fill();
      cx.fillStyle=C.white;cx.fillRect(-r,-r*.78+r*.4,r*2,Math.max(1.5,r*.1));
      cx.fillStyle=C.text;cx.fillRect(-r*.48,-r*1.02,r*.16,r*.36);cx.fillRect(r*.32,-r*1.02,r*.16,r*.36);
      cx.strokeStyle=C.white;cx.lineWidth=Math.max(1.8,2.1*u);cx.lineCap='round';cx.lineJoin='round';
      cx.beginPath();cx.moveTo(-r*.36,r*.22);cx.lineTo(-r*.06,r*.5);cx.lineTo(r*.42,-.02);cx.stroke();
    }
    cx.restore();
  }

  function wheel(x,y,r,col,spokes){
    cx.fillStyle=col;cx.beginPath();cx.arc(x,y,r,0,Math.PI*2);cx.fill();
    cx.fillStyle=C.hub;cx.beginPath();cx.arc(x,y,r*.55,0,Math.PI*2);cx.fill();
    if(spokes){cx.strokeStyle=col;cx.lineWidth=1.8*u;cx.lineCap='round';
      for(var k=0;k<3;k++){var a=cart.spin+k*2.094;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5);cx.stroke()}}
    cx.fillStyle=C.blue;cx.beginPath();cx.arc(x,y,r*.18,0,Math.PI*2);cx.fill();
  }
  function drawCart(){
    var w=cart.w,h=cart.h,x=cart.x,gy=cart.gy,rN=cart.rN,rF=11*u,axN=w*.33,axF=w*.29,farDX=16*u,farDY=-6*u;
    // road, faded out towards both ends of the layer
    var road=cx.createLinearGradient(0,0,W,0);
    road.addColorStop(0,'rgba(227,232,240,0)');road.addColorStop(.15,C.line);road.addColorStop(.85,C.line);road.addColorStop(1,'rgba(227,232,240,0)');
    cx.strokeStyle=road;cx.lineWidth=2*u;cx.beginPath();cx.moveTo(0,gy+.5);cx.lineTo(W,gy+.5);cx.stroke();
    var lane=cx.createLinearGradient(0,0,W,0);
    lane.addColorStop(0,'rgba(201,210,223,0)');lane.addColorStop(.15,C.hub);lane.addColorStop(.85,C.hub);lane.addColorStop(1,'rgba(201,210,223,0)');
    cx.setLineDash([10*u,12*u]);cx.strokeStyle=lane;cx.lineWidth=1.5*u;cx.beginPath();cx.moveTo(0,gy+9*u);cx.lineTo(W,gy+9*u);cx.stroke();cx.setLineDash([]);
    cx.fillStyle='rgba(11,27,51,.10)';cx.beginPath();cx.ellipse(x+farDX/2,gy+1*u,w*.52,4.5*u,0,0,Math.PI*2);cx.fill();
    wheel(x-axF+farDX,gy-rF+farDY,rF,C.farTire,false);
    wheel(x+axF+farDX,gy-rF+farDY,rF,C.farTire,false);
    // body leans against acceleration and bobs on its suspension
    var bottom=gy-rN-2*u+cart.bob+cart.bump*5*u;
    cx.save();cx.translate(x,bottom);cx.rotate(cart.lean);
    cx.fillStyle=C.text;rr(-w/2-4*u,-7*u,w+8*u,7*u,3*u);cx.fill();
    var g=3*u,rad=3*u,bh=(h-7*u-2*g)/3,wall=14*u,fw=(w-g)/2,y0=-7*u-bh;
    cx.fillStyle=C.panel;rr(-w/2+wall-2*u,y0-2*(bh+g),w-2*wall+4*u,2*(bh+g),rad);cx.fill();
    cx.strokeStyle=C.panelLine;cx.lineWidth=1*u;
    for(var m=1;m<4;m++){var lx=-w/2+wall+m*(w-2*wall)/4;cx.beginPath();cx.moveTo(lx,y0-2*(bh+g)+3*u);cx.lineTo(lx,y0-3*u);cx.stroke()}
    cx.fillStyle=C.brick;rr(-w/2,y0,fw,bh,rad);cx.fill();rr(-w/2+fw+g,y0,fw,bh,rad);cx.fill();
    for(var i=1;i<3;i++){var yy=y0-i*(bh+g);
      cx.fillStyle=i===1?C.blue:C.text;rr(-w/2,yy,wall,bh,rad);cx.fill();
      cx.fillStyle=i===1?C.text:C.blue;rr(w/2-wall,yy,wall,bh,rad);cx.fill()}
    cx.fillStyle=C.gold;rr(w/2+1*u,-6*u,5*u,4*u,1.5*u);cx.fill();
    cx.fillStyle=C.brick;rr(-w/2-6*u,-6*u,5*u,4*u,1.5*u);cx.fill();
    cx.fillStyle=C.gold;rr(-5*u,y0-2*(bh+g)-18*u+Math.sin(clock*3.3)*2*u,10*u,10*u,2*u);cx.fill();
    cx.restore();
    wheel(x-axN,gy-rN,rN,C.tire,true);
    wheel(x+axN,gy-rN,rN,C.tire,true);
    cx.fillStyle=C.muted;cx.font='500 '+(11*u)+'px "IBM Plex Mono",monospace';cx.textAlign='center';cx.textBaseline='top';cx.fillText('your-business.co.il',x,gy+14*u);
    var sp=Math.abs(cart.v)/VMAX;
    if(sp>.6){var dir=cart.v>0?-1:1;cx.strokeStyle=C.hub;cx.lineWidth=2*u;cx.lineCap='round';cx.globalAlpha=Math.min(1,(sp-.6)*2.5);
      for(var k=0;k<3;k++){var ly=bottom-12*u-k*11*u,sx=x+dir*(w/2+10*u+k*4*u);cx.beginPath();cx.moveTo(sx,ly);cx.lineTo(sx+dir*(14+k*6)*u,ly);cx.stroke()}
      cx.globalAlpha=1}
  }
  function pop(x,y,txt,col){x=Math.max(46*u,Math.min(W-46*u,x));pops.push({x:x,y:y,t:txt,c:col,a:1})}

  function drive(dt){
    var next=null;for(var i=0;i<items.length;i++){if(!next||items[i].at<next.at)next=items[i]}
    var tx=next?next.x:cart.x,d=tx-cart.x,pv=cart.v;
    var want=(d<0?-1:1)*Math.min(VMAX,Math.sqrt(2*ACC*Math.abs(d))),lim=ACC*dt;
    cart.v+=Math.max(-lim,Math.min(lim,want-cart.v));
    var nx=cart.x+cart.v*dt;
    if((d>0&&nx>=tx)||(d<0&&nx<=tx)||(Math.abs(d)<.5*u&&Math.abs(cart.v)<12*u)){nx=tx;cart.v=0}
    move(nx,pv,dt);
  }
  // Entrance: rolls in from beyond the left edge, brakes onto its spot and drops an "arrived" pin.
  function enter(dt){
    var x0=-cart.w*.75,x1=W/2,pv=cart.v;
    if(phase==='wait'){cart.x=x0;cart.v=0;return}
    introT+=dt;
    var k=Math.max(0,Math.min(1,introT/INTRO)),nx=x0+(x1-x0)*(1-Math.pow(1-k,3));
    cart.v=dt?(nx-cart.x)/dt:0;
    move(nx,pv,dt);
    if(k>=1){phase='play';cart.v=0;cart.bump=1;spawnT=.7;plan=null;pins.push({x:cart.x,y:topY(),a:1,t:0})}
  }
  function move(nx,pv,dt){
    cart.spin+=(nx-cart.x)/cart.rN;cart.x=nx;
    if(!dt) return;
    var tl=Math.max(-.07,Math.min(.07,-(cart.v-pv)/dt/ACC*.06));
    cart.lean+=(tl-cart.lean)*Math.min(1,dt*8);
    cart.bob=Math.abs(cart.v)>20*u?Math.sin(clock*18)*1.2*u:cart.bob*.85;
    if(Math.abs(cart.v)>.45*VMAX&&Math.random()<dt*24){var back=cart.v>0?-1:1;
      dust.push({x:cart.x+back*cart.w*.36,y:cart.gy-2*u,vx:back*(20+Math.random()*30)*u,vy:-(10+Math.random()*20)*u,r:(2+Math.random()*3)*u,a:.6})}
    cart.bump=Math.max(0,cart.bump-dt*5);
  }
  function step(dt){
    clock+=dt;
    if(phase==='play'){spawnT-=dt;if(spawnT<=0){spawn();spawnT=1.3+Math.random()*.6}drive(dt)}
    else enter(dt);
    for(var n=pins.length-1;n>=0;n--){var pn=pins[n];pn.t+=dt;if(pn.t>.9)pn.a-=dt*1.6;if(pn.a<=0)pins.splice(n,1)}
    var top=topY();
    for(var k=items.length-1;k>=0;k--){var o=items[k];o.y+=FALL*dt;o.sw+=dt*2;o.age+=dt;
      if(o.y+o.r*.6>=top&&o.y-o.r<top+cart.h*.5&&Math.abs(o.x-cart.x)<cart.w/2-6*u){items.splice(k,1);cart.bump=1;
        if(o.t==='coin'){var val=[150,250,400,800][Math.floor(Math.random()*4)];pop(o.x,top,'+₪'+val,C.goldInk)}
        else if(o.t==='lead'){pop(o.x,top,he()?'+1 פנייה':'+1 lead',C.blue)}
        else{pop(o.x,top,he()?'+1 תור':'+1 booking',C.brick)}}
      else if(o.y-o.r>H){items.splice(k,1)}}
    for(var p=pops.length-1;p>=0;p--){pops[p].y-=40*u*dt;pops[p].a-=dt*1.1;if(pops[p].a<=0)pops.splice(p,1)}
    for(var q=dust.length-1;q>=0;q--){var d=dust[q];d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=40*u*dt;d.r+=6*u*dt;d.a-=dt*1.4;if(d.a<=0)dust.splice(q,1)}
  }
  function draw(){cx.clearRect(0,0,W,H);
    for(var j=0;j<items.length;j++)drawItem(items[j]);
    for(var q=0;q<dust.length;q++){cx.globalAlpha=Math.max(0,dust[q].a);cx.fillStyle=C.hub;cx.beginPath();cx.arc(dust[q].x,dust[q].y,dust[q].r,0,Math.PI*2);cx.fill()}cx.globalAlpha=1;
    drawCart();
    cx.textAlign='center';cx.textBaseline='middle';cx.font='700 '+(14*u)+'px Heebo,Manrope,Arial,sans-serif';
    for(var p=0;p<pops.length;p++){cx.globalAlpha=Math.max(0,pops[p].a);cx.fillStyle=pops[p].c;cx.fillText(pops[p].t,pops[p].x,pops[p].y-18*u)}cx.globalAlpha=1;
    for(var n=0;n<pins.length;n++)drawPin(pins[n])}
  function drawPin(p){
    var r=9*u,t=p.t,dy=t<.35?-26*u*Math.pow(1-t/.35,2):-Math.abs(Math.sin((t-.35)*9))*4*u*Math.max(0,1-(t-.35)*2.5);
    var x=p.x,y=p.y-46*u+dy;
    cx.globalAlpha=Math.max(0,Math.min(1,p.a,t/.12));
    cx.fillStyle='rgba(0,56,184,.16)';cx.beginPath();cx.ellipse(x,p.y-24*u,r*.9*Math.min(1,t/.35),2.5*u,0,0,Math.PI*2);cx.fill();
    cx.fillStyle=C.blue;cx.beginPath();cx.arc(x,y,r,Math.PI*.82,Math.PI*2.18);cx.lineTo(x,y+r*2.1);cx.closePath();cx.fill();
    cx.fillStyle=C.white;cx.beginPath();cx.arc(x,y,r*.4,0,Math.PI*2);cx.fill();
    cx.globalAlpha=1}
  function loop(t){if(!running)return;var dt=Math.min(.05,(t-(last||t))/1000);last=t;step(dt);draw();requestAnimationFrame(loop)}
  var paused=false;
  function start(){if(running||reduce||paused)return;running=true;last=0;requestAnimationFrame(loop)}
  function stop(){running=false}
  if(window.ResizeObserver)new ResizeObserver(function(){size();if(!running)draw()}).observe(box);
  else window.addEventListener('resize',function(){size();if(!running)draw()});
  if('IntersectionObserver'in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;visible&&!document.hidden?start():stop()}).observe(box);
  document.addEventListener('visibilitychange',function(){document.hidden?stop():(visible&&start())});
  size();
  if(reduce){for(var n=0;n<3;n++){spawn();items[n].age=1;items[n].y=topY()*(.15+n*.25)}draw()}
  else{
    var btn=document.createElement('button');
    btn.type='button';btn.className='a11y-pause lc-pause';
    btn.setAttribute('aria-pressed','false');btn.setAttribute('aria-label','Pause the background animation');
    btn.innerHTML='<svg class="a11y-stop" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg><svg class="a11y-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
    btn.addEventListener('click',function(){
      paused=!paused;btn.setAttribute('aria-pressed',paused?'true':'false');
      if(paused)stop();else if(visible&&!document.hidden)start();
    });
    box.appendChild(btn);
    start();
  }
})();
