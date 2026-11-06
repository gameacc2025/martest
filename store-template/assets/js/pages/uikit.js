window.Pages=window.Pages||{};
(()=>{
const T=(n,p)=>Core.tpl(n,p),C=['primary','secondary','success','danger','warning','info','light','dark'],L={primary:'اصلی',secondary:'ثانویه',success:'موفقیت',danger:'خطر',warning:'هشدار',info:'اطلاعات',light:'روشن',dark:'تیره',orange:'نارنجی',purple:'بنفش',teal:'سبز آبی'};
const panel=(t,h)=>T('ui/code-panel',{title:t,slot:h,code:esc(h.replace(/\s{2,}/g,' ').trim())});
const out=h=>{$('#page').innerHTML=h};
const wrap=(h)=>`<div class="d-flex gap-2 wrap" style="margin-top:6px">${h}</div>`;
Pages.alerts=async()=>{
 const a=(c,x='',t)=>T('ui/alert',{c,extra:x,text:t||`یک هشدار ساده ${L[c]} — آن را بررسی کنید.`});
 const ic={primary:'info',success:'check',warning:'alert',danger:'alert'};
 out(panel('هشدارهای پیش‌فرض با سایه‌های مختلف',['primary','secondary'].map(c=>['sh-sm','sh-md','sh-lg'].map(s=>a(c,s,`یک هشدار ${L[c]} با سایه ${s.slice(3)==='sm'?'کوچک':s.slice(3)==='md'?'معمولی':'بزرگ'} — بررسی کنید.`)).join('')).join(''))
 +panel('هشدارهای پیش‌فرض',C.map(c=>a(c)).join(''))
 +panel('هشدار با پیوند',C.map(c=>a(c,'','یک هشدار ساده با <a href="#"><u>پیوند نمونه</u></a> — روی آن کلیک کنید.')).join(''))
 +panel('هشدار با آیکن',Object.entries(ic).map(([c,i])=>T('ui/alert-icon',{c,i,text:`یک هشدار ${L[c]} با آیکن`})).join(''))
 +panel('هشدار با تصویر',C.map((c,i)=>T('ui/alert-image',{c,bg:COLORS[i%7],ch:L[c][0],text:`یک هشدار ${L[c]} با تصویر — بررسی کنید.`})).join(''))
 +panel('هشدارهای گرد با دکمه‌ی بستن سفارشی',['primary','secondary','warning','danger'].map(c=>T('ui/alert-round',{c,text:`یک هشدار گرد ${L[c]} — بررسی کنید.`})).join(''))
 +panel('هشدارهای سفارشی با SVG',[['primary','info'],['success','check'],['warning','alert'],['danger','alert']].map(([c,i])=>T('ui/alert-svg',{c,i,text:`یک هشدار سفارشی ${L[c]} با آیکن`})).join('')));
};
Pages.badges=async()=>{
 const b=(cls,list=C)=>wrap(list.map(c=>T('ui/badge',{cls:cls.replace('%',c),text:L[c]})).join(''));
 const G=['primary','secondary','success','danger','warning','info'];
 out(panel('نشان‌های گرد',b('pill b-%'))+panel('نشان‌های گرد روشن',wrap(G.map(c=>T('ui/badge',{cls:`pill bg-${c}-t`,text:L[c]})).join('')))
 +panel('نشان‌های گرادیان',wrap(G.map(c=>T('ui/badge',{cls:`bg-${c}-g`,text:L[c]})).join('')))+panel('نشان‌های گرادیان گرد',wrap(G.map(c=>T('ui/badge',{cls:`pill bg-${c}-g`,text:L[c]})).join('')))
 +panel('نشان‌های بدون پر',b('outline o-%'))+panel('نشان‌های بدون پر گرد',b('pill outline o-%'))
 +panel('نشان اعلان روی دکمه‌ها',wrap(['primary','secondary','success','info'].map((c,i)=>`<button class="btn btn-o-${c}">اعلان‌ها <span class="badge b-${c}">${fa(i*2+4)}</span></button>`).join(''))));
};
Pages.buttons=async()=>{
 const bt=(pre,list,extra='')=>wrap(list.map(c=>T('ui/button',{cls:`${pre}${c} ${extra}`,text:L[c]||c,attr:''})).join(''));
 const X=['primary','secondary','success','danger','warning','info','orange','purple','teal'];
 out(panel('برچسب‌های دکمه',wrap(['primary','secondary','info','warning','success'].map((c,i)=>T('ui/button',{cls:'btn-'+c,text:['پیوند','دکمه','ورودی','ارسال','بازنشانی'][i],attr:''})).join('')))
 +panel('حالت غیرفعال',wrap(['btn-primary','btn-secondary','btn-o-primary','btn-light'].map((c,i)=>T('ui/button',{cls:c+' disabled',text:['دکمه اصلی','دکمه','دکمه اصلی','دکمه'][i],attr:'disabled'})).join('')))
 +panel('دکمه‌های تمام‌رنگ',bt('btn-',['primary','secondary','success','danger','warning','info','light','dark']))
 +panel('دکمه‌های گرد',bt('btn-',['primary','secondary','success','danger','warning','info'],'rounded'))
 +panel('دکمه‌های بدون پر',bt('btn-o-',['primary','secondary','success','danger','warning','info','light','dark']))
 +panel('دکمه‌های بدون پر گرد',bt('btn-o-',['primary','secondary','success','danger','warning','info','light','dark'],'rounded'))
 +panel('دکمه‌های گرادیان',bt('btn-g-',X))+panel('دکمه‌های گرادیان گرد',bt('btn-g-',X,'rounded'))
 +panel('دکمه‌های Ghost',bt('btn-o-',X))
 +panel('دکمه‌های بارگذاری',wrap(['primary','secondary','info','warning','success'].map(c=>`<button class="btn btn-${c}" data-load>${L[c]}<span class="spin"></span></button>`).join('')))
 +panel('دکمه‌های آیکن‌دار',wrap(['download','send','trash','heart','cart'].map((i,k)=>`<button class="btn btn-${C[k]}">${icon(i)}دکمه</button>`).join(''))));
 document.addEventListener('click',e=>{const b=e.target.closest('[data-load]');if(b){b.classList.add('disabled');setTimeout(()=>b.classList.remove('disabled'),1500)}});
};
Pages.cards=async()=>{
 const G=['primary','secondary','warning','info','danger','success'],names=['طراحی صفحه اصلی','طراحی لندینگ','به‌روزرسانی پروژه','بحث پروژه جدید','تست پروژه‌های اخیر','بازطراحی درباره ما'];
 const av=i=>[0,1,2].map(k=>avatar(names[i],i+k)).join('');
 out(panel('کارت‌های دارای حاشیه رنگی',`<div class="grid g-3">${G.map((c,i)=>T('ui/card-border',{c,title:names[i],tags:'فرانت • جاوا',av:av(i)})).join('')}</div>`)
 +panel('کارت‌های دارای عملکرد',`<div class="grid g-3">${T('ui/card-actions',{title:'کارت با دکمه جمع‌شدن',act:'collapse',i:'chev',text:'تکه‌ای از متن نمونه برای نمایش کارت؛ با دکمه‌ی بالا می‌توانید آن را جمع کنید.'})+T('ui/card-actions',{title:'کارت با دکمه بستن',act:'close',i:'x',text:'با زدن دکمه بستن، کارت از صفحه حذف می‌شود.'})+T('ui/card-actions',{title:'کارت تمام‌صفحه',act:'card-full',i:'expand',text:'با دکمه‌ی تمام‌صفحه کارت را بزرگ و کوچک کنید.'})}</div>`));
};
Pages.ribbons=async()=>{
 const R=(c,k,l,s)=>T('ui/ribbon-card',{c,kind:k,label:l,side:s});
 out(panel('روبان ساده',`<div class="grid g-2">${R('primary','','تبریک','روبان سمت راست')+R('success','end','تبریک','روبان سمت چپ')}</div>`)
 +panel('روبان سبک ۳',`<div class="grid g-4">${['primary','secondary','warning','info'].map((c,i)=>R(c,'corner','★',i%2?'بالا چپ':'بالا راست')).join('')}</div>`)
 +panel('روبان سبک ۴',`<div class="grid g-2">${R('primary','','جدید','بالا راست')+R('secondary','end','۵۰٪','بالا چپ')}</div>`)
 +panel('روبان سبک ۵ (مورب)',`<div class="grid g-4">${['primary','secondary','success','warning'].map(c=>R(c,'diag','ویژه','روبان مورب')).join('')}</div>`));
};
Pages.tooltips=async()=>{
 const t=(c,p,l)=>T('ui/tooltip',{c,pos:p,text:l,label:l});
 out(panel('جهت‌های ابزارنما',wrap([['primary','top','بالا'],['primary','right','راست'],['primary','bottom','پایین'],['primary','left','چپ']].map(x=>t(x[0],x[1],'ابزارنما '+x[2])).join('')))
 +panel('ابزارنماهای رنگی',wrap(C.map(c=>t(c,'top',L[c])).join('')))
 +panel('ابزارنما روی پیوند',`<p class="muted">روی <a href="#" class="tip top t-primary" data-tip="ابزارنما نمونه">این پیوند</a> نگه دارید تا ابزارنما را ببینید.</p>`)
 +panel('ابزارنما با SVG',wrap(['home','mail','users','send','more'].map(i=>`<span class="icon-btn tip top" data-tip="${i}" tabindex="0">${icon(i)}</span>`).join('')))
 +panel('ابزارنما روی تصویر',`<div class="avatars" style="padding:10px">${[0,1,2].map(i=>`<span class="tip top" data-tip="کاربر ${fa(i+1)}">${avatar('کاربر',i,40)}</span>`).join(' ')}</div>`));
};
Pages.colors=async()=>{
 const sw=(pre,sfx='',style)=>`<div class="grid g-6" style="grid-template-columns:repeat(8,1fr)">${C.map(c=>T('ui/swatch',{cls:`${pre}${c}${sfx}`,style:''})).join('')}</div>`;
 out(panel('رنگ‌های پس‌زمینه',sw('bg-'))+panel('گرادیان‌ها',sw('bg-','-g'))+panel('رنگ‌های نیمه‌شفاف',sw('bg-','-t'))
 +panel('رنگ‌های حاشیه‌ای',`<div class="grid g-6" style="grid-template-columns:repeat(8,1fr)">${C.map(c=>`<div class="swatch"><i style="border:2px solid var(--${c==='dark'?'text':c==='light'?'input-border':c})"></i><span>outline-${c}</span></div>`).join('')}</div>`));
};
Pages.widgets=async()=>{
 const T2=(n,p)=>T(n,p),sp=(v,c)=>Charts.line([{c,v}],{h:36,fill:true});
 const top=[['کل سفارش‌ها','۱۳۴٬۲۳۲','box','primary','+۱۴٫۵۴٪','success',[3,5,4,7,6,8,7,9]],['کل درآمد','۶۹۳٬۷۶۶','dollar','secondary','−۲۹٫۷۶٪','danger',[8,6,7,5,6,4,5,3]],['کل محصولات','۳۱٬۸۵۴','cart','success','+۱۰٫۰۱٪','success',[2,4,3,6,5,7,6,8]],['کل مشتریان','۶۵٬۷۵۲','users','warning','−۶٫۱۱٪','danger',[6,7,5,6,4,5,3,4]]];
 const mid=[['کل فروش','۵۴٬۳۲۰','wallet','primary','+۰٫۵۴٪','success'],['کل محصولات','۱٬۳۲۰','box','secondary','−۰٫۳۰٪','danger'],['سفارش‌های معلق','۲۴۰','clock','warning','+۳٫۱۳٪','success'],['تحویل‌شده','۱٬۰۵۰','truck','info','+۱٫۸۵٪','success'],['مرجوعی','۸۰','refresh','success','−۰٫۴۳٪','danger'],['مشتریان','۱٬۵۴۰','users','danger','+۰٫۱۲٪','success']];
 const edge=[['کل کارمندان','۱٬۷۵۴','users','primary','+۱٫۰۴٪ این ماه'],['کارمندان در مرخصی','۲۳۴','user','secondary','+۰٫۳۶٪ این ماه'],['کل مشتریان','۶۶۴','cart','warning','−۱٫۲۸٪ این ماه'],['سرنخ‌های جدید','۸۵۵','file','success','+۲٫۲۵٪ این ماه'],['کل معاملات','۳۲۵','file','info','−۵٫۹۶٪ این ماه']];
 const circ=[['کل محصولات','۴۵٬۲۸۰','box','primary','up','۱٫۳۱٪'],['کل فروش','۱۰٬۵۰۰','zap','secondary','down','۱٫۱۴٪'],['درآمد','۶۹٬۲۷۰','wallet','success','up','۲٫۵۸٪'],['کل سفارش‌ها','۱۲٬۰۸۸','box','warning','up','۱۲٫۰۵٪']];
 const rev=[['خرید','۱۵۰٬۰۰۰','success'],['موفق','۷۵٬۰۰۰','warning'],['پرداخت‌شده','۲۵۰٬۰۰۰','success'],['ناموفق','۶۰٬۰۰۰','danger']];
 out(`<div class="grid g-4 mb-3">${top.map(t=>T('widgets/stat-gradient',{title:t[0],value:t[1],icon:t[2],color:t[3],trend:t[4],dir:t[5],dc:t[5],slot:sp(t[6],'var(--'+t[3]+')')})).join('')}</div>
 <section class="card mb-3"><div class="grid" style="grid-template-columns:repeat(6,1fr)">${mid.map(m=>T('widgets/stat-center',{title:m[0],value:m[1],icon:m[2],color:m[3],trend:m[4],dc:m[5]})).join('')}</div></section>
 <div class="grid g-5 mb-3">${edge.map(m=>T('widgets/stat-card-edge',{title:m[0],value:m[1],icon:m[2],color:m[3],badge:m[4]})).join('')}</div>
 <div class="grid g-4 mb-3">${circ.map(m=>T('widgets/stat-card-icon',{title:m[0],value:m[1],icon:m[2],color:m[3],dir:m[4],trend:m[5]})).join('')}</div>
 <div class="grid g-2 mb-3">${T('widgets/tracking-card',{title:'پیگیری مصرف آب',points:'۸۷ امتیاز',value:'۸٫۱',unit:'لیتر',goal:'۰٫۹ لیتر تا هدف',icon:'drop',color:'primary',slot:Charts.steps([4,5,4,8,6,7,5,9],'#8c7bf7')})}${T('widgets/tracking-card',{title:'پیگیری خواب',points:'۵۴ امتیاز',value:'۵٫۲',unit:'ساعت',goal:'۲٫۸ ساعت تا هدف',icon:'clock',color:'success',slot:Charts.steps([8,5,6,4,7,5,4,6],'#0ac655')})}</div>
 <section class="card" style="padding:16px"><h3 class="mb-3">تراکنش‌های اخیر</h3>${rev.map(r=>`<div class="d-flex jc-b ai-c" style="padding:10px 0;border-bottom:1px solid var(--border)"><span>${r[0]}</span><span class="tag s-${r[2]}">${r[1]}</span></div>`).join('')}</section>`);
};
})();
