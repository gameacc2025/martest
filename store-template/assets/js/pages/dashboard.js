window.Pages=window.Pages||{};
Pages.dashboard=async()=>{
 const T=(n,p)=>Core.tpl(n,p);
 const stats=[['بازدیدکنندگان کل','۱٬۳۴۵٬۲۵۰','eye','primary','۳٫۲۱٪+','up','در مقایسه با (۱٬۴۲۲٬۲۳۲) سال قبل'],['کاربران فعال','۲۳۵٬۸۰۰','users','secondary','۱٫۵٪+','up','در مقایسه با (۱۷۲٬۱۲۱) سال قبل'],['نرخ تبدیل','۱۲٫۵٪','percent','success','۰٫۲۵٪−','down','در مقایسه با (۱۲٫۸٪) سال قبل'],['درآمد کل','۳٫۶۵۰ میلیارد','dollar','warning','۴٫۵٪+','up','در مقایسه با (۳٫۱۵ میلیارد) سال قبل'],['محصولات فروخته‌شده','۱۲٬۹۴۳','box','info','۱٫۵۵٪−','down','در مقایسه با (۱۳٬۲۷۵) سال قبل']];
 $('#stats').innerHTML=stats.map(s=>T('widgets/stat-card',{title:s[0],value:s[1],icon:s[2],color:s[3],trend:s[4],dir:s[5],sub:s[6]})).join('');
 const m=['فرو','ارد','خرد','تیر','مرد','شهر','مهر','آبا','آذر','دی','بهم','اسف'];
 $('#acq').innerHTML=Charts.bars(m,[{c:'#8c7bf7',v:[72,84,56,54,75,34,60,97,35,48,47,28]},{c:'#d9d3fb',v:[45,34,100,97,43,54,56,54,54,32,78,45]}]);
 const tr=[['جستجوی ارگانیک','۴۵٪','search','primary',45],['ترافیک پولی','۲۵٪','dollar','secondary',25],['ارجاعی','۱۵٪','share','success',15],['مستقیم','۱۰٪','home','warning',10],['شبکه‌های اجتماعی','۵٪','phone','info',5],['برترین منبع ترافیک','۵۰٪','globe','danger',50]];
 $('#traffic').innerHTML=tr.map(r=>T('widgets/progress-row',{label:r[0],pct:r[1],icon:r[2],color:r[3],w:r[4]*1.9>100?100:r[4]*1.9})).join('');
 $('#trend').innerHTML=Charts.line([{c:'#8c7bf7',v:[30,34,28,40,38,45,42,55,60,52,65,78]},{c:'#ff5c39',v:[20,22,18,30,26,35,33,40,44,38,48,58]}],{h:150,bars:[4,6,3,7,5,8,6,9,7,8,10,9]});
 const lr=[['درآمد','افزایش ۱۸٫۶۷٪ ','c-success','۱۹٬۷۵۴ هزار','primary'],['سود','افزایش ۳۵٫۴۶٪ ','c-success','۱۶٬۲۳۶ هزار','secondary'],['هزینه‌ها','کاهش ۲۳٫۴۳٪ ','c-danger','۱۲٬۶۴۵ هزار','light']];
 $('#trendList').innerHTML=lr.map(r=>`<div class="d-flex jc-b" style="padding:10px 20px;border-top:1px solid var(--border)"><div><span class="d-flex ai-c gap-1"><i style="width:8px;height:8px;border-radius:50%;background:var(--${r[4]==='light'?'input-border':r[4]})"></i><b>${r[0]}</b></span><small class="muted">${r[1]}</small></div><div class="text-end"><small class="muted">مجموع</small><div><b>${r[3]}</b></div></div></div>`).join('');
 const reg=[['۶٬۵۰۰','تهران','۱۵٪','up'],['۲٬۶۰۰','اصفهان','۱۰٪','up'],['۴٬۲۰۰','مشهد','۸٪','up'],['۱٬۸۰۰','شیراز','۵٪','down']];
 $('#region').innerHTML=reg.map(r=>`<div class="d-flex jc-b ai-c" style="border:1px solid var(--border);border-radius:6px;padding:10px 14px;margin-bottom:10px"><div><b style="font-size:16px">${r[0]}</b><div class="muted fs-12">${r[1]}</div></div><div class="text-end ${r[3]==='up'?'c-success':'c-danger'}">${r[2]} ${r[3]==='up'?'↑':'↓'}<div class="muted fs-12">امسال</div></div></div>`).join('');
 $('#demo').innerHTML=Charts.donut([{v:40,c:'#8c7bf7'},{v:30,c:'#ff5c39'},{v:20,c:'#ffb830'},{v:10,c:'#2fb8ee'}],{size:230,th:26,label:'کل کاربران',value:'۱۲٬۳۴۵'});
 const pg=[['صفحه اصلی','۴۵٬۳۰۰','۳۲٪','primary'],['صفحه جزئیات محصول','۲۳٬۱۵۰','۲۴٪','secondary'],['سبد خرید','۱۸٬۹۰۰','۱۸٪','warning'],['تسویه حساب','۹٬۸۰۰','۱۲٪','success']];
 $('#pages').innerHTML=pg.map(r=>`<div class="d-flex jc-b ai-c" style="padding:12px 14px;border-bottom:1px solid var(--border)"><span class="d-flex ai-c gap-2"><i style="width:8px;height:8px;border-radius:50%;background:var(--${r[3]})"></i><b>${r[0]}</b></span><span>${r[1]}</span><span>${r[2]}</span></div>`).join('');
 const br=[['گوگل کروم','۱۲۰٬۰۰۰','۳۵٪','#ea4335'],['سافاری','۷۵٬۰۰۰','۴۰٪','#2fb8ee'],['فایرفاکس','۴۵٬۰۰۰','۴۲٪','#ff7a45'],['اج','۲۸٬۰۰۰','۳۸٪','#0ac655']];
 $('#browsers').innerHTML=br.map(r=>`<div class="d-flex jc-b ai-c" style="padding:10px 0"><span class="d-flex ai-c gap-2"><span class="avatar" style="background:${r[3]}">${r[0][0]}</span><b>${r[0]}</b></span><span class="text-end"><b>${r[1]}</b><div class="muted fs-12">نرخ پرش: ${r[2]}</div></span></div>`).join('');
 // widget-style blocks from the "widget" references
 const cats=[['لوازم برقی',31,'#8c7bf7'],['مد و پوشاک',26,'#ff5c39'],['مبلمان',18,'#2fb8ee'],['لوازم خانگی',14,'#ffb830'],['گیمینگ',11,'#0ac655']];
 $('#catDonut').innerHTML=Charts.donut(cats.map(c=>({v:c[1],c:c[2]})),{size:200,th:22,label:'کل فروش',value:'۱۰۱۹۰'});
 $('#catLegend').innerHTML=cats.map(c=>T('widgets/legend-row',{label:c[0],pct:fa(c[1])+'٪',c:c[2]})).join('');
 $('#recent').innerHTML=DATA.recent.map(r=>`<tr><td><b>${r.id}</b></td><td><b>${r.pm}</b><div class="muted fs-12">${r.sub}</div></td><td>${UI.tag(r.st)}</td><td><b>${num(r.amt)}</b><div class="muted fs-12">${r.d}</div></td><td><a class="btn sm btn-light" href="orders.html">${icon('eye')}مشاهده</a></td></tr>`).join('');
 $('#social').innerHTML=Charts.hbars([{n:'اینستاگرام',v:760,c:'#2fb8ee'},{n:'تلگرام',v:1500,c:'#8c7bf7'},{n:'ایتا',v:900,c:'#ff5c8d'},{n:'آپارات',v:1100,c:'#ffb830'},{n:'لینکدین',v:1450,c:'#0ac655'},{n:'توییتر',v:1480,c:'#ff3a3a'}],{max:1600});
};
