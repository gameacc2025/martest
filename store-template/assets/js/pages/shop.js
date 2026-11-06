window.Pages=window.Pages||{};
Pages.shopHome=async()=>{
 $('#heroImg').src=Core.ROOT+'assets/img/products/hero.png';
 $('#perks').innerHTML=[['truck','primary','ارسال سریع','تحویل ۳ تا ۵ روز کاری'],['shield','success','ضمانت اصالت','کالای اصل و تضمین‌شده'],['refresh','warning','بازگشت ۳۰ روزه','بدون سؤال و جواب'],['life','info','پشتیبانی','پاسخ‌گویی هر روز هفته']].map(c=>`<div class="card d-flex gap-2 ai-c" style="padding:16px"><span class="stat-icon bg-${c[1]}">${icon(c[0])}</span><div><b>${c[2]}</b><div class="muted fs-12">${c[3]}</div></div></div>`).join('');
 $('#home').innerHTML=DATA.products.map(p=>Core.tpl('widgets/product-card',{id:p.id,href:'product.html?id='+p.id,img:pimg(p),name:p.name,price:num(p.price),old:num(p.old),stars:'★'.repeat(p.rate)+'☆'.repeat(5-p.rate)})).join('');
 document.addEventListener('click',e=>{const a=e.target.closest('[data-add]');if(a){Cart.add(a.dataset.add);UI.toast('به سبد خرید اضافه شد')}});
};
