/* ================= ÉCRU catalog + storefront logic ================= */
const CATALOG = [
  { id:'lime-dress', name:'Lime Satin Column Dress', cat:'Dresses', price:145, imgs:['green'],
    desc:'A liquid-satin column in acid lime, cut close through the body with a fluid drape below the knee. A statement piece that needs nothing else.',
    materials:'92% viscose, 8% elastane. Dry clean only.', fit:'True to size. Model is 176cm wearing S.' },
  { id:'fur-coat', name:'Faux Fur Statement Coat', cat:'Outerwear', price:349, imgs:['fur'],
    desc:'Deep chocolate faux fur with a heavy, luxe hand. Oversized through the shoulder for a wrap-and-go silhouette over everything.',
    materials:'Modacrylic pile, recycled poly lining.', fit:'Oversized. Take your usual size for a relaxed drape.' },
  { id:'power-blazer', name:'Structured Power Blazer', cat:'Tailoring', price:229, imgs:['blazer'],
    desc:'A sharp-shouldered blazer with a defined waist and a leather belt. Tailored to hold its line from desk to evening.',
    materials:'Wool-blend suiting, full lining.', fit:'Slim. Size up if between sizes.' },
  { id:'iridescent-jacket', name:'Iridescent Rain Jacket', cat:'Outerwear', price:135, imgs:['holo','holo2'],
    desc:'A translucent holographic shell that shifts colour in the light. Fully seam-taped with a drawcord hood — function with a festival edge.',
    materials:'Iridescent TPU, taped seams.', fit:'Relaxed. Layers easily over knits.' },
  { id:'chain-bag', name:'Quilted Chain Shoulder Bag', cat:'Bags', price:189, imgs:['bag'],
    desc:'A soft quilted leather shoulder bag on a chunky polished chain. Roomy enough for the everyday, refined enough for the evening.',
    materials:'Full-grain leather, metal hardware.', fit:'One size. 26 × 20 × 9 cm.', sizes:['One Size'] },
  { id:'rib-longsleeve', name:'Soft Rib Long-Sleeve Top', cat:'Loungewear', price:58, imgs:['lounge-ls'],
    desc:'A second-skin ribbed long-sleeve in soft ivory. The quiet foundation layer you reach for on repeat.',
    materials:'95% cotton, 5% elastane.', fit:'Fitted. Stretches with wear.' },
  { id:'linen-cami-set', name:'Linen Cami Jumpsuit', cat:'Sets', price:119, imgs:['cami'],
    desc:'A breezy tailored jumpsuit in washed white linen with a lace-trim neckline. Effortless from summer terrace to studio.',
    materials:'100% washed linen.', fit:'Relaxed through the leg.' },
  { id:'vneck-tee', name:'Pima V-Neck Tee', cat:'Tops', price:39, imgs:['tee'],
    desc:'The perfect black V-neck in long-staple pima cotton — a soft drape that never bags out. Wardrobe infrastructure.',
    materials:'100% pima cotton.', fit:'Classic. True to size.' },
  { id:'gingham-shirt', name:'Gingham Cotton Shirt', cat:'Tops', price:79, imgs:['gingham'],
    desc:'A crisp red gingham shirt with a cinched back detail that nips the waist. Poplin that holds a clean line all day.',
    materials:'100% cotton poplin.', fit:'Oversized with a defined back.' },
  { id:'merino-knit', name:'Merino Boat-Neck Knit', cat:'Knitwear', price:98, imgs:['knit'],
    desc:'A boxy boat-neck in fine merino, dropped at the shoulder. The neutral knit that grounds every look.',
    materials:'100% extra-fine merino wool.', fit:'Boxy. Size down for a closer fit.' },
  { id:'lounge-set', name:'Cotton Fleece Lounge Set', cat:'Loungewear', price:109, imgs:['lounge-set'],
    desc:'A brushed-fleece tee and drawcord short in undyed oat. Weekend uniform, sold as a set.',
    materials:'100% organic cotton fleece.', fit:'Relaxed. Set includes top and short.' },
  { id:'wide-jeans', name:'Wide-Leg Rigid Jeans', cat:'Denim', price:118, imgs:['jeans'],
    desc:'A high-rise, wide-leg jean in rigid mid-wash denim that breaks beautifully with wear. A pure 90s line.',
    materials:'100% cotton rigid denim.', fit:'High-rise, wide-leg. Size up for extra ease.' },
  { id:'lilac-top', name:'Textured Lilac Crop Top', cat:'Tops', price:52, imgs:['lilac'],
    desc:'A shirred-texture crop with balloon sleeves in soft lilac. A pop of colour with a sculptural sleeve.',
    materials:'Crinkle poly-blend.', fit:'Cropped. True to size.' },
];
const DEFAULT_SIZES = ['XS','S','M','L','XL'];
const IMG = s => 'assets/img/'+s+'.jpg';
const money = n => '$'+n.toFixed(0);
const byId = id => CATALOG.find(p=>p.id===id);
const sizesFor = p => p.sizes || DEFAULT_SIZES;

/* ---------- cart (localStorage) ---------- */
const CART_KEY='ecru_cart';
function getCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY))||[]}catch(e){return[]} }
function saveCart(c){ localStorage.setItem(CART_KEY,JSON.stringify(c)); updateCartCount(); }
function cartQty(){ return getCart().reduce((s,i)=>s+i.qty,0); }
function addToCart(id,size,qty=1){
  const cart=getCart();
  const found=cart.find(i=>i.id===id&&i.size===size);
  if(found) found.qty+=qty; else cart.push({id,size,qty});
  saveCart(cart); toast('Added to bag');
}
function updateCartCount(){
  const n=cartQty();
  document.querySelectorAll('.cart-count').forEach(el=>{ el.textContent=n; el.style.display=n?'inline-flex':'none'; });
}
let toastT;
function toast(msg){
  let t=document.querySelector('.toast');
  if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('on');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),1800);
}

/* ---------- shared chrome ---------- */
function header(active){
  return `<div class="marquee"><ul>
    <li>Complimentary shipping over $150</li><li><span>◆</span></li><li>New season — just landed</li><li><span>◆</span></li>
    <li>Extended returns within 30 days</li><li><span>◆</span></li>
    <li>Complimentary shipping over $150</li><li><span>◆</span></li><li>New season — just landed</li><li><span>◆</span></li>
    <li>Extended returns within 30 days</li><li><span>◆</span></li>
  </ul></div>
  <header class="site"><div class="wrap hd">
    <nav class="nav-l">
      <a href="shop.html">Shop</a>
      <a href="shop.html?c=Dresses">Dresses</a>
      <a href="shop.html?c=Outerwear">Outerwear</a>
    </nav>
    <a class="brand" href="index.html">ÉCRU</a>
    <nav class="nav-r">
      <a href="shop.html" class="only-lg">Search</a>
      <a href="cart.html" class="cart-link">Bag<span class="cart-count"></span></a>
      <button class="burger" onclick="location.href='shop.html'">Menu</button>
    </nav>
  </div></header>`;
}
function footer(){
  return `<footer class="site"><div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand"><div class="b">ÉCRU</div>
        <p>Considered essentials and statement pieces in a neutral palette. Made in small runs, meant to last.</p></div>
      <div class="foot-col"><h4>Shop</h4>
        <a href="shop.html">All Products</a><a href="shop.html?c=Dresses">Dresses</a>
        <a href="shop.html?c=Tops">Tops</a><a href="shop.html?c=Outerwear">Outerwear</a>
        <a href="shop.html?c=Knitwear">Knitwear</a></div>
      <div class="foot-col"><h4>Client Care</h4>
        <a href="#">Shipping</a><a href="#">Returns & Exchanges</a><a href="#">Size Guide</a>
        <a href="#">Contact</a><a href="#">FAQ</a></div>
      <div class="foot-col news"><h4>The List</h4>
        <p>First access to new arrivals and private sales.</p>
        <div class="row"><input type="email" placeholder="Email address" aria-label="Email"><button onclick="toast('Thanks — you are on the list')">Join</button></div></div>
    </div>
    <div class="foot-base"><span>© <span id="yr"></span> ÉCRU Studio</span><span>Instagram · TikTok · Pinterest</span></div>
  </div></footer>`;
}
function mountChrome(active){
  const h=document.getElementById('header'); if(h) h.innerHTML=header(active);
  const f=document.getElementById('footer'); if(f) f.innerHTML=footer();
  const yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();
  updateCartCount();
  // reveal
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}}),{threshold:.12});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));
}

/* ---------- product card ---------- */
function card(p,tag){
  const two = p.imgs.length>1;
  return `<a class="pcard rv" href="product.html?id=${p.id}">
    <div class="frame">
      <img src="${IMG(p.imgs[0])}" alt="${p.name}" loading="lazy">
      ${tag?`<span class="tag">${tag}</span>`:''}
      <button class="quick" onclick="event.preventDefault();quickAdd('${p.id}')">Add to bag</button>
    </div>
    <div class="pmeta"><div><div class="nm">${p.name}</div><div class="cat">${p.cat}</div></div>
      <div class="pr">${money(p.price)}</div></div>
  </a>`;
}
function quickAdd(id){ const p=byId(id); addToCart(id, sizesFor(p)[Math.min(1,sizesFor(p).length-1)], 1); }
