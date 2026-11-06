window.Pages=window.Pages||{};
const T=(n,p)=>Core.tpl(n,p),Q=new URLSearchParams(location.search);
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
const delTag=s=>`<span class="tag s-${statusColor(s)}">${s}</span>`;
const payCls=s=>({'موفق':'c-success','در انتظار':'c-primary','ناموفق':'c-danger','مرجوع':'c-warning','لغو':'c-danger'}[s]||'');
const pageBase=shop=>shop?'':'';
/* ---------- Products (admin + shop) ---------- */
Pages.products=async(o={})=>{
 const shop=!!o.shop,list=DATA.products,st={cats:new Set(),brands:new Set(),colors:new Set(),q:Q.get('q')||'',sort:'',min:0,max:40};
 $('#page').innerHTML=`<div class="card d-flex jc-b ai-c wrap gap-2 mb-3" style="padding:16px 20px"><div>نمایش <b class="c-primary" id="cnt"></b> محصول یافت شد.</div><div class="input-group" style="width:min(420px,100%)"><input id="q" placeholder="جستجوی محصول..." value="${esc(st.q)}" aria-label="جستجوی محصول"><button class="btn btn-primary" id="qb">جستجو</button></div><select id="sort" style="width:170px" aria-label="مرتب‌سازی"><option value="">مرتب‌سازی</option><option value="lo">ارزان‌ترین</option><option value="hi">گران‌ترین</option><option value="rate">بیشترین امتیاز</option></select></div>
 <div class="shop-layout"><div data-component="widgets/filter-panel"></div><div><div class="product-grid" id="grid"></div></div></div>`;
 await Core.mount();
 $('#fCats').innerHTML=DATA.categories.map(c=>`<label class="check-row"><span>${c.n} <small>(${num(c.c)})</small></span><input type="checkbox" data-cat="${c.n}"></label>`).join('');
 $('#fBrands').innerHTML=DATA.brands.map(c=>`<label class="check-row"><span>${c.n} <small>(${num(c.c)})</small></span><input type="checkbox" data-brand="${c.n}"></label>`).join('');
 $('#fColors').innerHTML=COLORS.slice(0,5).map(c=>`<span class="swatch-dot" style="--c:${c}" data-color="${c}" role="checkbox" tabindex="0" aria-label="رنگ"></span>`).join('');
 const draw=()=>{
  let r=list.filter(p=>(!st.cats.size||st.cats.has(p.cat))&&(!st.brands.size||st.brands.has(p.brand))&&(!st.colors.size||st.colors.has(p.color))&&p.price>=st.min*1e6&&p.price<=st.max*1e6&&(!st.q||p.name.includes(st.q)||p.brand.includes(st.q)));
  if(st.sort==='lo')r=[...r].sort((a,b)=>a.price-b.price);if(st.sort==='hi')r=[...r].sort((a,b)=>b.price-a.price);if(st.sort==='rate')r=[...r].sort((a,b)=>b.rate-a.rate);
  $('#cnt').textContent=fa(r.length);$('#pLabel').textContent=`${num(st.min)} میلیون -- ${num(st.max)} میلیون تومان`;
  $('#grid').innerHTML=r.length?r.map(p=>T('widgets/product-card',{id:p.id,href:(shop?'product.html':'product-details.html')+'?id='+p.id,img:pimg(p),name:p.name,price:num(p.price),old:num(p.old),stars:stars(p.rate)})).join(''):'<div class="empty card" style="grid-column:1/-1">محصولی با این فیلترها پیدا نشد</div>';
 };
 document.addEventListener('change',e=>{const t=e.target;if(t.dataset.cat)st.cats[t.checked?'add':'delete'](t.dataset.cat);if(t.dataset.brand)st.brands[t.checked?'add':'delete'](t.dataset.brand);if(t.id==='pMin'||t.id==='pMax'){st.min=+$('#pMin').value||0;st.max=+$('#pMax').value||0}if(t.id==='sort')st.sort=t.value;draw()});
 document.addEventListener('click',e=>{const d=e.target.closest('[data-color]');if(d){const c=d.dataset.color;st.colors.has(c)?st.colors.delete(c):st.colors.add(c);d.classList.toggle('on');draw()}
  const a=e.target.closest('[data-add]');if(a){Cart.add(a.dataset.add);UI.toast('به سبد خرید اضافه شد')}
  if(e.target.id==='qb'){st.q=$('#q').value.trim();draw()}if(e.target.id==='clearFilter'){st.q='';$('#q').value='';st.cats.clear();st.brands.clear();st.colors.clear();st.min=0;st.max=40;$('#pMin').value=0;$('#pMax').value=40;$$('#filterPanel input[type=checkbox]').forEach(c=>c.checked=false);$$('.swatch-dot.on').forEach(c=>c.classList.remove('on'));draw()}});
 $('#q').addEventListener('keydown',e=>{if(e.key==='Enter'){st.q=e.target.value.trim();draw()}});
 draw();
};
/* ---------- Product details ---------- */
Pages.productDetails=async(o={})=>{
 const p=DATA.products.find(x=>x.id==Q.get('id'))||DATA.products[3],shop=!!o.shop,img=p.id===4?Core.ROOT+'assets/img/products/hero.png':pimg(p);let qty=1,size='۴۲',col=0;
 $('#page').innerHTML=`<div class="card" style="padding:20px"><div class="detail"><div><div class="gallery-main"><img id="mainImg" src="${img}" alt="${p.name}"></div><div class="thumbs">${(p.id===4?['hero','t2','t3','t4','t5','t6']:[p.img,p.img,p.img]).map((n,i)=>`<img src="${Core.ROOT}assets/img/products/${n}.png" class="${i==0?'on':''}" alt="">`).join('')}</div></div>
 <div><h2 style="font-size:19px;line-height:1.7">${p.name}: انتخاب هوشمندانه برای استفاده‌ی روزمره</h2><div class="d-flex ai-c gap-2" style="margin:8px 0"><span class="stars">${stars(p.rate)}</span><small class="muted">${fa(p.rate)}٫۵ (۲٫۴ هزار نظر)</small></div>
 <div class="d-flex jc-b wrap gap-2"><div><span class="c-success fs-12">پیشنهاد ویژه</span><div><b style="font-size:24px">${num(p.price)}</b> <small>تومان</small> <span class="badge bg-success-t">۵۰٪ تخفیف</span></div><s class="muted fs-12">قیمت اصلی: ${num(p.old)}</s></div>
 <div><b>تعداد:</b><div class="qty" style="margin-inline-start:10px"><button id="dq" aria-label="کم">−</button><span id="qv">۱</span><button id="iq" aria-label="زیاد">+</button></div></div></div>
 <p class="muted" style="margin:14px 0"><b style="color:var(--text)">توضیحات:</b> این محصول با کیفیت ساخت بالا و طراحی راحت برای استفاده طولانی‌مدت ساخته شده است. مواد اولیه مرغوب و دوام بالا، آن را به انتخابی مطمئن برای هر روز تبدیل می‌کند.</p>
 <div class="d-flex gap-2 wrap" style="margin-bottom:14px">${['۴۵٪ تخفیف اولین خرید','ارسال رایگان','لغو آسان','تحویل به‌موقع'].map(t=>`<span class="chip bg-light-t" style="border:1px solid var(--border)">✓ ${t}</span>`).join('')}</div>
 <div class="d-flex ai-c gap-2" style="margin-bottom:12px"><b>رنگ‌ها:</b>${COLORS.slice(0,5).map((c,i)=>`<span class="swatch-dot ${i==0?'on':''}" style="--c:${c}" data-col="${i}"></span>`).join('')}</div>
 <div class="d-flex ai-c gap-2 wrap" style="margin-bottom:16px"><b>سایز:</b>${['۳۸','۴۰','۴۲','۴۴','۴۶'].map(s=>`<button class="size-btn ${s==='۴۲'?'on':''}" data-size="${s}">${s}</button>`).join('')}</div>
 <div class="form-row"><button class="btn btn-primary-t lg" id="addBtn" ${p.stock?'':'disabled'}>${icon('cart')}${p.stock?'افزودن به سبد':'ناموجود'}</button><button class="btn btn-light lg" id="buyBtn" ${p.stock?'':'disabled'} style="border:1px solid var(--border)">خرید فوری</button></div>
 <p class="c-success fs-12" style="margin-top:12px">✓ ۳۰ روز ضمانت بازگشت کالا؛ اگر راضی نبودید، وجه شما بازگردانده می‌شود.</p></div></div></div>
 <div class="grid g-3 mt-3">${[['truck','primary','ارسال و بازگشت رایگان','در صورت نارضایتی تا ۳۰ روز می‌توانید کالا را برگردانید.'],['shield','secondary','تضمین کیفیت','همه‌ی محصولات پیش از ارسال کنترل کیفی می‌شوند.'],['gift','success','ارسال سریع','سفارش‌های بالای ۵ میلیون تومان رایگان و در ۳ تا ۵ روز کاری ارسال می‌شود.']].map(c=>`<div class="card d-flex gap-2" style="padding:16px"><span class="stat-icon bg-${c[1]}-t" style="background:var(--${c[1]}-t);color:var(--${c[1]})">${icon(c[0])}</span><div><b>${c[2]}</b><p class="muted fs-12">${c[3]}</p></div></div>`).join('')}</div>`;
 document.addEventListener('click',e=>{const t=e.target;
  if(t.id==='iq')$('#qv').textContent=fa(++qty);if(t.id==='dq'&&qty>1)$('#qv').textContent=fa(--qty);
  if(t.dataset.size){size=t.dataset.size;$$('.size-btn').forEach(b=>b.classList.toggle('on',b===t))}
  if(t.dataset.col!=null){$$('[data-col]').forEach(b=>b.classList.toggle('on',b===t))}
  if(t.closest('.thumbs')&&t.tagName==='IMG'){$$('.thumbs img').forEach(i=>i.classList.toggle('on',i===t));$('#mainImg').src=t.src}
  if(t.closest('#addBtn')){Cart.add(p.id,qty);UI.toast('به سبد خرید اضافه شد')}
  if(t.closest('#buyBtn')){Cart.add(p.id,qty);location.href=(shop?'':'')+'checkout.html'}});
};
/* ---------- Cart (admin + shop) ---------- */
Pages.cart=async()=>{
 $('#page').innerHTML=`<div class="grid g-main"><section class="card" style="padding:20px"><h3 style="margin-bottom:6px">سبد خرید</h3><div id="rows"></div></section><div data-component="widgets/order-summary"><a class="btn btn-primary block lg" id="goCheckout" href="checkout.html" style="margin-top:14px">ادامه تا تسویه حساب ←</a></div></div>`;
 await Core.mount();
 const draw=()=>{const l=Cart.detailed();
  $('#rows').innerHTML=l.length?l.map(p=>T('widgets/cart-item',{mode:'full',id:p.id,img:pimg(p),name:p.name,brand:p.brand,bc:p.color,q:fa(p.q),price:num(p.price),total:num(p.price*p.q),color:'برند: '+p.brand,size:'',stock:p.stock?'<span class="tag s-success">موجود</span>':'<span class="tag s-danger">ناموجود</span>'})).join(''):'<div class="empty">سبد خرید شما خالی است. <a href="'+(location.pathname.includes('shop')?'products.html':'products.html')+'">ادامه خرید</a></div>';
  const t=Cart.totals(),row=(l,v,s='',c='')=>T('widgets/price-row',{label:l,value:v,style:s,cls:c});
  $('#sumRows').innerHTML=`<h4 style="margin-bottom:6px">جزئیات قیمت:</h4>`+row('جمع کل',money(t.sub))+row('تخفیف (۱۰٪)',t.disc?'− '+money(t.disc):'—')+row('مالیات',money(t.tax))+row('هزینه ارسال',t.ship?money(t.ship):'<span class="c-success">رایگان</span>')+row('<b>مبلغ نهایی</b>','<b>'+money(t.total)+'</b>','border-top:1px dashed var(--input-border);margin-top:6px;padding-top:12px');
  $('#goCheckout').style.pointerEvents=l.length?'':'none';$('#goCheckout').style.opacity=l.length?1:.5;window.onCartChange=draw};
 document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
  if(t.dataset.inc){const i=Cart.items().find(x=>x.id==t.dataset.inc);Cart.setQty(t.dataset.inc,i.q+1);draw()}
  if(t.dataset.dec){const i=Cart.items().find(x=>x.id==t.dataset.dec);Cart.setQty(t.dataset.dec,i.q-1);draw()}
  if(t.dataset.del){UI.confirm('این کالا از سبد خرید حذف شود؟',()=>{Cart.remove(t.dataset.del);draw();UI.toast('کالا حذف شد')})}
  if(t.dataset.later){UI.toast('در فهرست ذخیره‌شده‌ها قرار گرفت')}
  if(t.id==='applyCoupon'){const v=$('#coupon').value.trim().toUpperCase();if(v==='OFF10'){Store.set('coupon',v);UI.toast('کد تخفیف اعمال شد');draw()}else UI.toast('کد تخفیف معتبر نیست (نمونه: OFF10)')}});
 draw();
};
/* ---------- Checkout ---------- */
Pages.checkout=async()=>{
 const f=(id,l,t='text',req=1,extra='')=>`<div class="form-group"><label for="${id}">${l}</label><input id="${id}" type="${t}" ${req?'data-req="'+(extra||1)+'"':''} autocomplete="off"></div>`;
 $('#page').innerHTML=`<div class="grid g-main"><form class="card" id="coForm" style="padding:22px" novalidate><h3 style="margin-bottom:14px">ثبت سفارش</h3><h4 style="margin-bottom:10px">اطلاعات شخصی:</h4><div class="form-row">${f('fn','نام')}${f('ln','نام خانوادگی')}${f('em','ایمیل','email')}${f('mb','شماره موبایل','tel',1,'phone')}</div>
 <div class="d-flex jc-b ai-c" style="margin:6px 0 10px"><h4>آدرس ارسال:</h4><a href="#">انتخاب از دفترچه آدرس</a></div>${f('full','نام گیرنده')}<div class="form-row">${f('a1','آدرس ۱')}${f('a2','آدرس ۲',  'text',0)}${f('lm','نشانه',  'text',0)}${f('zip','کدپستی')}${f('city','شهر')}${f('state','استان')}</div>
 <div class="form-group"><label>توضیحات تحویل</label><textarea rows="3"></textarea></div>
 <h4 style="margin-bottom:10px">روش ارسال:</h4><div class="grid g-3 mb-3">${[['۹۰٬۰۰۰ تومان','تحویل فردا','post'],['۱۵۰٬۰۰۰ تومان','تحویل امروز','today'],['رایگان','تحویل ۳ تا ۴ روز','free']].map((s,i)=>`<label class="card" style="padding:12px;border:1px solid var(--input-border);display:flex;gap:10px;align-items:center"><input type="radio" name="ship" ${i==2?'checked':''}><span><b>${s[0]}</b><div class="muted fs-12">${s[1]}</div></span></label>`).join('')}</div>
 <h4 style="margin-bottom:10px">روش پرداخت:</h4><div class="d-flex gap-3 wrap mb-3">${[['درگاه بانکی',1],['کیف پول',0],['پرداخت در محل',0]].map(p=>`<label class="d-flex ai-c gap-1"><input type="radio" name="pay" ${p[1]?'checked':''}>${p[0]}</label>`).join('')}</div>
 <div class="alert a-warning">${icon('info')}پرداخت در این قالب نمایشی است و هیچ تراکنش واقعی انجام نمی‌شود.</div><button class="btn btn-primary lg" type="submit">ثبت سفارش و پرداخت نمایشی</button></form>
 <aside class="card" style="padding:20px"><div class="d-flex jc-b mb-3"><h3>جزئیات قیمت</h3><span class="badge bg-primary-t" id="itemCnt"></span></div><div id="coItems"></div><div id="coRows" style="margin-top:10px"></div></aside></div>
 <div class="modal-bg" id="okModal"><div class="modal text-center"><div class="stat-icon round bg-success" style="margin:0 auto 12px;width:56px;height:56px">${icon('check')}</div><h3>سفارش شما ثبت شد</h3><p class="muted" id="okMsg"></p><div class="timeline-st" id="okSt"><div class="done">ثبت‌شده</div><div class="done">پرداخت (نمایشی)</div><div>آماده‌سازی</div><div>ارسال</div></div><div class="acts" style="justify-content:center"><a class="btn btn-primary" href="orders.html">مشاهده سفارش‌ها</a></div></div></div>`;
 const l=Cart.detailed(),t=Cart.totals();$('#itemCnt').textContent=fa(l.length)+' کالا';
 $('#coItems').innerHTML=l.map(p=>`<div class="d-flex gap-2 ai-c" style="padding:8px 0"><img src="${pimg(p)}" style="width:54px;border-radius:6px;background:var(--light)" alt=""><div class="grow"><b class="fs-12">${p.name}</b><div class="muted fs-12">تعداد: ${fa(p.q)} × ${num(p.price)}</div></div><b>${num(p.price*p.q)}</b></div>`).join('')||'<div class="empty">سبد خرید خالی است</div>';
 const row=(a,b,s)=>T('widgets/price-row',{label:a,value:b,style:s||'',cls:''});
 $('#coRows').innerHTML=row('جمع کل',money(t.sub))+row('تخفیف',t.disc?'− '+money(t.disc):'—')+row('هزینه ارسال',t.ship?money(t.ship):'رایگان')+row('<b>مبلغ نهایی</b>','<b>'+money(t.total)+'</b>','border-top:1px dashed var(--input-border);padding-top:12px');
 $('#coForm').addEventListener('submit',e=>{e.preventDefault();if(!l.length){UI.toast('سبد خرید خالی است');return}if(!UI.validate(e.target)){UI.toast('لطفاً فیلدهای الزامی را تکمیل کنید');return}
  const id='SPK'+String(Date.now()).slice(-5),n=Store.get('newOrders',[]);n.unshift({id,cust:$('#fn').value+' '+$('#ln').value,email:$('#em').value,price:t.total,del:'در انتظار',pay:'درگاه بانکی',ps:'در انتظار',date:'امروز'});Store.set('newOrders',n);Store.set('coupon','');Cart.clear();
  $('#okMsg').textContent='شماره سفارش: '+id+' — وضعیت: در انتظار پردازش';$('#okModal').classList.add('open')});
};
/* ---------- Orders ---------- */
Pages.orders=async()=>{
 const all=()=>[...Store.get('newOrders',[]),...DATA.orders];
 const tint=[['کل سفارش‌ها','۲٬۴۵۰','box','primary','↑ ۱۶٫۶۷٪'],['در انتظار','۳۰۰','clock','secondary','↓ ۱٫۲۳٪'],['تحویل‌شده','۱٬۸۰۰','truck','success','↑ ۰٫۵۴٪'],['لغوشده','۵۲۵','x','warning','↓ ۰٫۱۶٪'],['مرجوعی','۴۳۵','refresh','info','↑ ۰٫۲۹٪']];
 $('#page').innerHTML=`<div class="grid g-5 mb-3">${tint.map(s=>T('widgets/stat-card-tint',{title:s[0],value:s[1],icon:s[2],color:s[3],trend:s[4]})).join('')}</div>
 <section class="card"><div data-component="widgets/toolbar"><input id="oq" placeholder="جستجوی سفارش یا مشتری" style="width:230px" aria-label="جستجو"><div class="d-flex gap-2 wrap"><button class="btn btn-primary-t" id="exp">${icon('upload')}خروجی</button><select id="fp" style="width:170px"><option value="">وضعیت پرداخت</option><option>موفق</option><option>در انتظار</option><option>ناموفق</option><option>مرجوع</option><option>لغو</option></select><select id="fd" style="width:170px"><option value="">وضعیت تحویل</option><option>در انتظار</option><option>ارسال‌شده</option><option>تحویل‌شده</option><option>لغوشده</option></select></div></div>
 <div class="card-b table-wrap" style="padding-top:0"><table class="table"><thead><tr><th><input type="checkbox" id="all" aria-label="همه"></th><th>شناسه</th><th>مشتری</th><th>مبلغ</th><th>وضعیت تحویل</th><th>روش پرداخت</th><th>وضعیت پرداخت</th><th>تاریخ سفارش</th><th>عملیات</th></tr></thead><tbody id="ob"></tbody></table></div><div class="card-f d-flex jc-b ai-c"><span class="muted" id="oc"></span><div id="op"></div></div></section>`;
 await Core.mount();let page=1;const per=8;
 const draw=()=>{const q=$('#oq').value.trim(),a=$('#fp').value,b=$('#fd').value;const r=all().filter(o=>(!q||(o.cust+o.id+o.email).includes(q))&&(!a||o.ps===a)&&(!b||o.del===b));const s=(page-1)*per;
  $('#ob').innerHTML=r.slice(s,s+per).map((o,i)=>`<tr><td><input type="checkbox" aria-label="انتخاب"></td><td><a href="order-details.html">#${o.id}</a></td><td>${T('widgets/customer-cell',{av:avatar(o.cust,i),name:o.cust,sub:o.email})}</td><td>${money(o.price)}</td><td>${delTag(o.del)}</td><td>${o.pay}</td><td class="${payCls(o.ps)}">${o.ps}</td><td>${o.date}</td><td><div class="d-flex gap-1"><a class="btn btn-sq bg-primary-t" href="order-details.html" aria-label="ویرایش">${icon('edit')}</a><button class="btn btn-sq bg-danger-t" data-del="${o.id}" aria-label="حذف">${icon('trash')}</button></div></td></tr>`).join('')||'<tr><td colspan="9" class="empty">سفارشی یافت نشد</td></tr>';
  $('#oc').textContent=`نمایش ${fa(Math.min(r.length,per))} از ${fa(r.length)} سفارش`;$('#op').innerHTML=UI.pager(r.length,per,page,'o')};
 document.addEventListener('input',e=>{if(['oq'].includes(e.target.id)){page=1;draw()}});document.addEventListener('change',e=>{if(['fp','fd'].includes(e.target.id)){page=1;draw()}if(e.target.id==='all')$$('#ob input[type=checkbox]').forEach(c=>c.checked=e.target.checked)});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b){const n=Math.ceil(all().length/per);page=b.dataset.p==='prev'?Math.max(1,page-1):b.dataset.p==='next'?Math.min(n,page+1):+b.dataset.p;draw()}
  const d=e.target.closest('[data-del]');if(d)UI.confirm('سفارش '+d.dataset.del+' حذف شود؟',()=>{const n=Store.get('newOrders',[]).filter(o=>o.id!==d.dataset.del);Store.set('newOrders',n);const k=DATA.orders.findIndex(o=>o.id===d.dataset.del);if(k>-1)DATA.orders.splice(k,1);draw();UI.toast('سفارش حذف شد')});
  if(e.target.closest('#exp'))UI.toast('خروجی CSV آماده شد (نمایشی)')});
 draw();
};
/* ---------- Order details ---------- */
Pages.orderDetails=async()=>{
 const items=[DATA.products[1],DATA.products[3],DATA.products[0]],q=[2,1,1],tot=items.reduce((s,p,i)=>s+p.price*q[i],0);
 $('#page').innerHTML=`<div class="grid g-main"><div><section class="card" style="padding:20px"><div class="d-flex jc-b ai-c mb-3"><h3 class="c-primary">محصولات سفارش‌شده</h3><div class="input-group" style="width:260px"><input placeholder="جستجوی اینجا" aria-label="جستجو"><button class="btn btn-primary">مرتب‌سازی</button></div></div>
 ${items.map((p,i)=>`<div class="d-flex gap-2 ai-c" style="padding:12px 0;border-bottom:1px solid var(--border)"><img src="${pimg(p)}" style="width:80px;border-radius:6px;background:var(--light)" alt=""><div class="grow"><small style="color:${p.color}">${p.brand}</small><div><b>${p.name}</b></div><small class="muted">رنگ: خاکستری | تعداد: ${fa(q[i])}</small></div><div class="text-end"><b>${money(p.price*q[i])}</b><div class="muted fs-12">کد: SKU-${fa(1000+p.id)}</div></div></div>`).join('')}
 <div style="max-width:320px;margin-inline-start:auto;margin-top:14px">${[['جمع جزء',money(tot)],['تخفیف',money(-Math.round(tot*.05))],['کد تخفیف',money(-120000)],['مالیات',money(Math.round(tot*.03))]].map(r=>T('widgets/price-row',{label:r[0],value:r[1],style:'',cls:''})).join('')}<div class="d-flex jc-b" style="border-top:1px dashed var(--input-border);padding-top:10px"><b>مبلغ کل</b><b>${money(Math.round(tot*.98)-120000)}</b></div></div>
 <div class="d-flex jc-b mt-3"><button class="btn btn-light" onclick="print()">${icon('print')}چاپ</button><button class="btn btn-primary" onclick="UI.toast('پیوند اشتراک کپی شد')">${icon('share')}اشتراک‌گذاری</button></div></section>
 <section class="card mt-3" style="padding:20px"><div class="d-flex jc-b"><h3>وضعیت سفارش:</h3><span>شناسه سفارش: <b class="c-secondary">#SPK2501</b></span></div><div class="timeline-st"><div class="done">ثبت‌شده</div><div class="done">پرداخت‌شده</div><div class="done">آماده‌سازی</div><div>ارسال</div><div>تحویل</div></div><p class="muted">تاریخ تحویل تخمینی: <b style="color:var(--text)">دوشنبه ۳۰ خرداد</b></p></section></div>
 <aside class="card text-center" style="padding:22px">${avatar('تامسون',2,84)}<h3 style="margin-top:10px">تامسون فیلیپ</h3><div class="muted fs-12" style="direction:ltr">tomphillip23@gmail.com</div><span class="chip" style="margin:8px 0">مشتری ویژه</span><div style="text-align:start;margin-top:12px">${[['شناسه مشتری','#SPK202501'],['تلفن','۰۹۱۲-۱۲۳-۴۵۶۷'],['آدرس','تهران، خیابان ولیعصر، پلاک ۱۲۳۴'],['وضعیت','<span class="tag t-success">فعال</span>'],['کل سفارش‌ها','۱۳ سفارش'],['تاریخ عضویت','۱۳ اردیبهشت ۱۴۰۴'],['کد معرف','TOM1265']].map(r=>`<div class="d-flex jc-b" style="padding:8px 0;border-bottom:1px solid var(--border)"><span class="muted">${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div><div class="card-b mt-3" style="background:var(--secondary-t);border-radius:8px"><b>سفارش‌های شما در راه است!</b></div></aside></div>`;
};
/* ---------- Customers ---------- */
Pages.customers=async()=>{
 const tint=[['کل مشتریان','۱۲٬۷۵۴','users','primary','↑ ۳٫۱۶٪'],['مشتریان فعال','۸۹۵','user','secondary','↑ ۱٫۲۳٪'],['مشتریان مسدود','۳۲٬۸۵۴','shield','success','↑ ۰٫۵۴٪'],['کل سفارش‌ها','۵۲٬۶۷۵','box','warning','↓ ۰٫۱۶٪'],['کل فروشندگان','۴۳۵','cart','info','↑ ۰٫۲۹٪']];
 $('#page').innerHTML=`<div class="grid g-5 mb-3">${tint.map(s=>T('widgets/stat-card-tint',{title:s[0],value:s[1],icon:s[2],color:s[3],trend:s[4]})).join('')}</div><section class="card"><div data-component="widgets/toolbar"><input id="cq" placeholder="جستجوی مشتری" style="width:230px" aria-label="جستجو"><div class="d-flex gap-2"><select id="cs" style="width:140px"><option value="">همه</option><option>فعال</option><option>غیرفعال</option></select><button class="btn btn-primary" id="addC">${icon('plus')}مشتری جدید</button></div></div><div class="card-b table-wrap" style="padding-top:0"><table class="table"><thead><tr><th>#</th><th>شناسه</th><th>نام مشتری</th><th>وضعیت</th><th>تلفن</th><th>تاریخ عضویت</th><th>عملیات</th></tr></thead><tbody id="cb"></tbody></table></div><div class="card-f d-flex jc-b ai-c"><span class="muted" id="cc"></span><div id="cp"></div></div></section>
 <div class="modal-bg" id="cm"><form class="modal" id="cf" novalidate><h3 style="margin-bottom:14px">افزودن مشتری</h3><div class="form-group"><label>نام و نام خانوادگی</label><input id="cn" data-req="1"></div><div class="form-group"><label>شماره موبایل</label><input id="cph" data-req="phone"></div><div class="form-group"><label>شهر</label><input id="cci" data-req="1"></div><div class="acts"><button type="button" class="btn btn-light" id="cx">انصراف</button><button class="btn btn-primary">ذخیره</button></div></form></div>`;
 await Core.mount();let page=1;const per=6,get=()=>[...Store.get('newCust',[]),...DATA.customers];
 const draw=()=>{const q=$('#cq').value.trim(),s=$('#cs').value,r=get().filter(c=>(!q||(c.name+c.id+c.phone).includes(q))&&(!s||c.status===s)),a=(page-1)*per;
  $('#cb').innerHTML=r.slice(a,a+per).map((c,i)=>`<tr><td><input type="checkbox" aria-label="انتخاب"></td><td>${c.id}</td><td>${T('widgets/customer-cell',{av:avatar(c.name,i),name:c.name,sub:c.country})}</td><td>${UI.tag(c.status)}</td><td style="direction:ltr;text-align:end">${c.phone}</td><td>${c.date}</td><td><div class="d-flex gap-1"><button class="btn btn-sq bg-primary-t" aria-label="ویرایش">${icon('edit')}</button><button class="btn btn-sq bg-danger-t" data-del="${c.id}" aria-label="حذف">${icon('trash')}</button></div></td></tr>`).join('')||'<tr><td colspan="7" class="empty">مشتری یافت نشد</td></tr>';
  $('#cc').textContent=`نمایش ${fa(Math.min(per,r.length-a>0?r.length-a:0))} از ${fa(r.length)} مورد`;$('#cp').innerHTML=UI.pager(r.length,per,page,'c')};
 document.addEventListener('input',e=>{if(e.target.id==='cq'){page=1;draw()}});document.addEventListener('change',e=>{if(e.target.id==='cs'){page=1;draw()}});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(b){const n=Math.ceil(get().length/per);page=b.dataset.p==='prev'?Math.max(1,page-1):b.dataset.p==='next'?Math.min(n,page+1):+b.dataset.p;draw()}
  const d=e.target.closest('[data-del]');if(d)UI.confirm('این مشتری حذف شود؟',()=>{Store.set('newCust',Store.get('newCust',[]).filter(c=>c.id!==d.dataset.del));const k=DATA.customers.findIndex(c=>c.id===d.dataset.del);if(k>-1)DATA.customers.splice(k,1);draw()});
  if(e.target.closest('#addC'))$('#cm').classList.add('open');if(e.target.id==='cx')$('#cm').classList.remove('open')});
 $('#cf').addEventListener('submit',e=>{e.preventDefault();if(!UI.validate(e.target))return;const n=Store.get('newCust',[]);n.unshift({id:'SPK'+String(Date.now()).slice(-3),name:$('#cn').value,country:$('#cci').value,status:'فعال',phone:$('#cph').value,date:'امروز'});Store.set('newCust',n);$('#cm').classList.remove('open');e.target.reset();draw();UI.toast('مشتری اضافه شد')});
 draw();
};
/* ---------- Categories ---------- */
Pages.categories=async()=>{
 $('#page').innerHTML=`<section class="card"><div data-component="widgets/toolbar"><h3>مدیریت دسته‌بندی‌ها</h3><form class="input-group" id="catF" style="width:min(380px,100%)" novalidate><input id="catN" placeholder="نام دسته‌بندی جدید" data-req="1" aria-label="نام دسته"><button class="btn btn-primary">${icon('plus')}افزودن</button></form></div><div class="card-b table-wrap" style="padding-top:0"><table class="table"><thead><tr><th>#</th><th>نام دسته‌بندی</th><th>تعداد محصول</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody id="catB"></tbody></table></div></section>`;await Core.mount();
 const get=()=>Store.get('cats',DATA.categories.map(c=>({n:c.n,c:c.c,on:1}))),draw=()=>{$('#catB').innerHTML=get().map((c,i)=>`<tr><td>${fa(i+1)}</td><td><b>${esc(c.n)}</b></td><td>${num(c.c)}</td><td><label class="switch"><input type="checkbox" data-on="${i}" ${c.on?'checked':''} aria-label="وضعیت"><i></i></label></td><td><button class="btn btn-sq bg-danger-t" data-del="${i}" aria-label="حذف">${icon('trash')}</button></td></tr>`).join('')};
 document.addEventListener('change',e=>{if(e.target.dataset.on!=null){const c=get();c[e.target.dataset.on].on=e.target.checked?1:0;Store.set('cats',c)}});
 document.addEventListener('click',e=>{const d=e.target.closest('[data-del]');if(d)UI.confirm('دسته‌بندی حذف شود؟',()=>{const c=get();c.splice(d.dataset.del,1);Store.set('cats',c);draw()})});
 $('#catF').addEventListener('submit',e=>{e.preventDefault();if(!UI.validate(e.target))return;const c=get();c.unshift({n:$('#catN').value.trim(),c:0,on:1});Store.set('cats',c);e.target.reset();draw();UI.toast('دسته‌بندی اضافه شد')});draw();
};
/* ---------- Inventory ---------- */
Pages.inventory=async()=>{
 const stock=()=>Store.get('stock',Object.fromEntries(DATA.products.map(p=>[p.id,p.stock])));
 $('#page').innerHTML=`<div class="grid g-4 mb-3" id="invStats"></div><section class="card"><div class="card-h"><h3>وضعیت موجودی انبار</h3></div><div class="card-b table-wrap" style="padding-top:0"><table class="table"><thead><tr><th>محصول</th><th>برند</th><th>دسته</th><th>موجودی</th><th>وضعیت</th><th>تنظیم موجودی</th></tr></thead><tbody id="invB"></tbody></table></div></section>`;
 const draw=()=>{const s=stock(),st=n=>n===0?['ناموجود','danger']:n<10?['رو به اتمام','warning']:['موجود','success'];
  $('#invStats').innerHTML=[['کل محصولات',DATA.products.length,'box','primary'],['موجود',DATA.products.filter(p=>s[p.id]>=10).length,'check','success'],['رو به اتمام',DATA.products.filter(p=>s[p.id]>0&&s[p.id]<10).length,'alert','warning'],['ناموجود',DATA.products.filter(p=>s[p.id]===0).length,'x','danger']].map(x=>T('widgets/stat-card-tint',{title:x[0],value:fa(x[1]),icon:x[2],color:x[3],trend:''})).join('');
  $('#invB').innerHTML=DATA.products.map(p=>{const n=s[p.id],t=st(n);return`<tr><td><div class="cell-user"><img src="${pimg(p)}" style="width:44px;border-radius:6px;background:var(--light)" alt=""><b>${p.name}</b></div></td><td>${p.brand}</td><td>${p.cat}</td><td style="min-width:140px"><b>${fa(n)}</b><div class="progress" style="--c:var(--${t[1]});margin-top:4px"><i style="width:${Math.min(100,n)}%"></i></div></td><td><span class="tag s-${t[1]}">${t[0]}</span></td><td><div class="qty"><button data-s="${p.id}" data-d="-1" aria-label="کم">−</button><span>${fa(n)}</span><button data-s="${p.id}" data-d="1" aria-label="زیاد">+</button></div></td></tr>`}).join('')};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(b){const s=stock();s[b.dataset.s]=Math.max(0,s[b.dataset.s]+ +b.dataset.d);Store.set('stock',s);draw()}});draw();
};
/* ---------- Transactions ---------- */
Pages.transactions=async()=>{
 const s=[['کل تراکنش‌ها','۲٬۳۴۱','wallet','primary','up','۴٫۲٪+'],['پرداخت موفق','۲٬۰۸۷','check','success','up','۲٫۱٪+'],['ناموفق','۱۹۲','x','danger','down','۰٫۸٪−'],['بازگشت وجه','۶۲','refresh','warning','down','۰٫۳٪−']];
 $('#page').innerHTML=`<div class="grid g-4 mb-3">${s.map(x=>T('widgets/stat-card-icon',{title:x[0],value:x[1],icon:x[2],color:x[3],dir:x[4],trend:x[5]})).join('')}</div><section class="card"><div data-component="widgets/toolbar"><h3>تراکنش‌ها و پرداخت‌ها</h3><select id="ts" style="width:160px"><option value="">همه وضعیت‌ها</option><option>موفق</option><option>در انتظار</option><option>ناموفق</option><option>بازگشت وجه</option></select></div><div class="card-b table-wrap" style="padding-top:0"><table class="table"><thead><tr><th>شناسه تراکنش</th><th>پرداخت‌کننده</th><th>مبلغ</th><th>روش</th><th>وضعیت</th><th>تاریخ</th></tr></thead><tbody id="tb"></tbody></table></div></section>`;await Core.mount();
 const draw=()=>{const v=$('#ts').value;$('#tb').innerHTML=DATA.transactions.filter(t=>!v||t.st===v).map(t=>`<tr><td><b>${t.id}</b></td><td>${t.who}</td><td>${money(t.amt)}</td><td>${t.m}</td><td>${delTag(t.st)}</td><td>${t.d}</td></tr>`).join('')};
 $('#ts').onchange=draw;draw();
};
