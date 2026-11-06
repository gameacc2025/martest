from lib import page
C=['pages/content']
for f,t,cr,i in [('blog-details','جزئیات وبلاگ','صفحات|وبلاگ|جزئیات وبلاگ','blogDetails'),('blog-create','ایجاد وبلاگ','صفحات|وبلاگ|ایجاد وبلاگ','blogCreate'),('faqs','سوالات متداول','صفحات|سوالات متداول','faqs'),('invoice-list','لیست فاکتورها','صفحات|فاکتور|لیست فاکتورها','invoiceList'),('invoice','جزئیات فاکتور','صفحات|فاکتور|جزئیات فاکتور','invoice'),('plans','قیمت‌گذاری','صفحات|قیمت‌گذاری','plans'),('profile','پروفایل','صفحات|پروفایل','profile'),('roles','نقش‌ها','امنیت|نقش‌ها','roles'),('security','مرکز امنیت','امنیت|مرکز امنیت','security'),('reports','گزارش‌ها','داشبوردها|گزارش‌ها','reports'),('settings','تنظیمات فروشگاه','فروشگاه|تنظیمات','settings')]:
    page(f'admin/{f}.html',t,crumbs=cr,js=C,init=f'await Pages.{i}()')
for f,t,i in [('chat','گفتگو','chat'),('mail','ایمیل','mail')]:
    page(f'admin/{f}.html',t,crumbs=f'برنامه‌ها|{t}',js=['pages/apps'],init=f'await Pages.{i}()')
for f,t,i in [('alerts','هشدارها','alerts'),('badges','نشان‌ها','badges'),('buttons','دکمه‌ها','buttons'),('cards','کارت‌ها','cards'),('ribbons','روبان‌ها','ribbons'),('tooltips','ابزارنما','tooltips'),('colors','رنگ‌ها','colors'),('widgets','ویجت‌ها','widgets')]:
    page(f'admin/ui/{f}.html',t,crumbs=f'المان‌ها|{t}',js=['pages/uikit'],init=f'await Pages.{i}()')
print('ok')
