from lib import *
body='''
<div class="grid g-5 mb-3" id="stats"></div>
<div class="grid g-dash mb-3" style="grid-template-columns:5fr 3.2fr 3fr">
 <section class="card"><div class="card-h"><h3>جذب کاربر</h3></div><div class="card-b"><div class="d-flex jc-c gap-3 wrap" style="border:1px solid var(--border);border-radius:6px;padding:14px;margin-bottom:14px"><span class="d-flex ai-c gap-2"><span class="stat-icon bg-primary-t">{ic1}</span><span><b style="font-size:20px">۱۲٬۷۵۴</b><div class="muted fs-12">بازدید صفحه</div></span></span><span class="d-flex ai-c gap-2"><span class="stat-icon bg-primary-t">{ic2}</span><span><b style="font-size:20px">۴۵٫۲۲٪</b><div class="muted fs-12">نرخ پرش</div></span></span></div><div id="acq"></div><div class="d-flex jc-c gap-3 fs-12 muted"><span>● نشست‌ها</span><span style="color:#cfc8f9">● نرخ پرش</span></div></div></section>
 <section class="card"><div class="card-h"><h3>ترافیک وب بر اساس منبع</h3></div><div class="card-b" id="traffic"></div><div class="card-f d-flex jc-b ai-c"><b>میانگین مدت نشست</b><span class="badge bg-primary">۴ دقیقه و ۲۰ ثانیه</span></div></section>
 <section class="card" style="overflow:hidden"><div class="card-h"><h3>روند درآمد و سود</h3></div><div id="trend"></div><div id="trendList"></div></section>
</div>
<div class="grid g-4 mb-3">
 <section class="card"><div class="card-h"><h3>درآمد بر اساس منطقه</h3></div><div class="card-b" id="region"></div></section>
 <section class="card"><div class="card-h"><h3>جمعیت‌شناسی کاربران</h3></div><div class="card-b text-center" id="demo"></div></section>
 <section class="card"><div class="card-h"><h3>پربازدیدترین صفحه‌ها</h3></div><div class="card-b" style="padding:0 20px 14px"><div style="border:1px solid var(--border);border-radius:6px" id="pages"></div></div></section>
 <section class="card"><div class="card-h"><h3>استفاده از مرورگرها</h3></div><div class="card-b" id="browsers"></div></section>
</div>
<div class="grid mb-3" style="grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) minmax(0,1fr)">
 <section class="card"><div class="card-h"><h3>پرفروش‌ترین دسته‌ها</h3><span class="chip">این هفته</span></div><div class="card-b d-flex ai-c wrap gap-2 jc-c"><div id="catDonut"></div><div class="grow" id="catLegend" style="min-width:150px"></div></div><div class="d-flex card-f text-center"><div class="grow muted">ماه قبل<b style="display:block;color:var(--text);font-size:17px">۱۳٬۹۶۵</b></div><div class="grow muted">این ماه<b style="display:block;color:var(--text);font-size:17px">۱۵٬۳۶۷</b></div></div></section>
 <section class="card"><div class="card-h"><h3>سفارش‌های اخیر</h3><a href="orders.html">مشاهده همه سفارش‌ها ←</a></div><div class="card-b table-wrap"><table class="table"><thead><tr><th>شناسه سفارش</th><th>روش پرداخت</th><th>وضعیت</th><th>مبلغ (تومان)</th><th>عملیات</th></tr></thead><tbody id="recent"></tbody></table></div></section>
 <section class="card"><div class="card-h"><h3>بازدید شبکه‌های اجتماعی</h3></div><div class="card-b" id="social"></div></section>
</div>'''
from lib import page
import re
body=body.replace('{ic1}','<svg width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>').replace('{ic2}','<svg width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>')
page('admin/dashboard.html','تحلیل و آمار',body,'داشبوردها|تحلیل و آمار',['pages/dashboard'],'await Pages.dashboard()')
print('dashboard written')
