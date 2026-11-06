/* Shell behaviour + shared UI helpers */
window.UI={
 shell(){
  const file=location.pathname.split('/').slice(-2).join('/');
  $$('.sidebar a[href]').forEach(a=>{if(a.getAttribute('href').split('/').slice(-2).join('/')===file){a.classList.add('active');const g=a.closest('.sb-group');if(g){g.classList.add('open');$('.sb-link',g)?.classList.add('has-active')}}});
  document.addEventListener('click',e=>{
   const t=e.target.closest('[data-toggle]');
   if(t){const k=t.dataset.toggle;
    if(k==='group'){t.parentElement.classList.toggle('open')}
    else if(k==='dd'){const dd=t.closest('.dd'),was=dd.classList.contains('open');$$('.dd.open').forEach(x=>x.classList.remove('open'));if(!was)dd.classList.add('open')}
    else if(k==='sidebar'){$('.sidebar').classList.toggle('show')}
    else if(k==='theme'){const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('theme',n)}
    else if(k==='fullscreen'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}
    else if(k==='code'){t.closest('.code-panel').classList.toggle('open')}
    else if(k==='collapse'){const b=t.closest('.card').querySelector('.card-body-x');b&&b.classList.toggle('hidden')}
    else if(k==='close'){t.closest('.card,.alert').remove()}
    else if(k==='card-full'){t.closest('.card').classList.toggle('fs-card')}
    return}
   if(!e.target.closest('.dd'))$$('.dd.open').forEach(x=>x.classList.remove('open'));
   const m=e.target.closest('.modal-bg.open');if(m&&e.target===m)m.classList.remove('open');
   const tab=e.target.closest('.tabs button');if(tab&&tab.parentElement.dataset.tabs!=null){$$('button',tab.parentElement).forEach(b=>b.classList.toggle('active',b===tab));const box=document.getElementById(tab.parentElement.dataset.tabs);box&&$$('[data-pane]',box).forEach(p=>p.classList.toggle('hidden',p.dataset.pane!==tab.dataset.tab))}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$$('.dd.open').forEach(x=>x.classList.remove('open'));$$('.modal-bg.open').forEach(x=>x.classList.remove('open'))}});
  this.cartBadge();this.fillDropdowns();
  const hs=$('.h-search input');hs&&hs.addEventListener('keydown',e=>{if(e.key==='Enter'&&hs.value.trim())location.href=Core.ROOT+'admin/products.html?q='+encodeURIComponent(hs.value.trim())});
 },
 cartBadge(){const n=Cart.items().reduce((s,i)=>s+i.q,0);$$('[data-cart-count]').forEach(e=>{e.textContent=fa(n);e.classList.toggle('hidden',!n)});this.fillCartDropdown()},
 fillCartDropdown(){const box=$('#cartDdList');if(!box)return;const l=Cart.detailed();
  box.innerHTML=l.length?l.map((p,i)=>Core.tpl('widgets/cart-item',{mode:'mini',id:p.id,img:pimg(p),name:esc(p.name),brand:p.brand,bc:DATA.cartDropdown[i%3].c,q:fa(p.q),price:num(p.price),total:num(p.price*p.q),stock:'',color:'',size:''})).join(''):'<div class="empty">سبد خرید خالی است</div>';
  const t=$('#cartDdTotal');t&&(t.textContent=money(Cart.totals().sub));const c=$('#cartDdCount');c&&(c.textContent=fa(l.length));
  $$('[data-del-mini]',box).forEach(b=>b.onclick=()=>{Cart.remove(b.dataset.delMini);if(window.onCartChange)onCartChange()})},
 fillDropdowns(){const n=$('#notifList');if(!n)return;n.innerHTML=DATA.notifications.map(x=>`<div class="d-flex gap-2" style="padding:12px 16px;border-bottom:1px solid var(--border)"><span class="stat-icon round bg-${x.c}">${icon(x.i)}</span><div class="grow"><b>${x.t}</b><div class="muted fs-12">${x.s}</div><div class="muted fs-12 d-flex ai-c gap-1">${icon('clock')}${x.w}</div></div><input type="checkbox" ${x.checked?'checked':''} data-n></div>`).join('');
  const upd=()=>{const k=$$('[data-n]:checked',n).length;$('#notifSel').textContent=fa(k)};n.addEventListener('change',upd);upd();
  $('#notifRemove').onclick=e=>{e.preventDefault();$$('[data-n]:checked',n).forEach(c=>c.closest('.d-flex').remove());upd();UI.toast('اعلان‌های انتخاب‌شده حذف شد')}},
 toast(m){let b=$('.toast-box');if(!b){b=document.createElement('div');b.className='toast-box';document.body.append(b)}const t=document.createElement('div');t.className='toast';t.textContent=m;b.append(t);setTimeout(()=>t.remove(),2600)},
 confirm(msg,ok){let m=$('#confirmModal');if(!m){document.body.insertAdjacentHTML('beforeend',Core.tpl('widgets/confirm-modal'));m=$('#confirmModal')}$('#confirmMsg',m).textContent=msg;m.classList.add('open');$('#confirmYes',m).onclick=()=>{m.classList.remove('open');ok()};$('#confirmNo',m).onclick=()=>m.classList.remove('open')},
 tag(s,soft){return `<span class="tag ${soft?'s':'t'}-${statusColor(s)}">${s}</span>`},
 trend(v,up=true){return `<span class="trend ${up?'up':'down'}">${up?'▲':'▼'} ${fa(v)}٪</span>`},
 pager(total,per,cur,id){const n=Math.ceil(total/per);return `<div class="pager" data-pager="${id}"><button data-p="prev">قبلی</button>${Array.from({length:n},(_,i)=>`<button data-p="${i+1}" class="${i+1==cur?'active':''}">${fa(i+1)}</button>`).join('')}<button data-p="next">بعدی</button></div>`},
 validate(form){let ok=true;$$('[data-req]',form).forEach(i=>{$('.err',i.parentElement)?.remove();let m='';const v=i.value.trim();if(!v)m='این فیلد الزامی است';else if(i.type==='email'&&!/^\S+@\S+\.\S+$/.test(v))m='ایمیل معتبر وارد کنید';else if(i.dataset.req==='phone'&&!/^(\+98|0)?9\d{9}$/.test(v.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g,'')))m='شماره موبایل معتبر نیست';else if(i.type==='password'&&v.length<6)m='رمز عبور حداقل ۶ نویسه باشد';i.classList.toggle('invalid',!!m);if(m){ok=false;i.parentElement.insertAdjacentHTML('beforeend',`<div class="err">${m}</div>`)}});return ok}
};
