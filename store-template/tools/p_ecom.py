from lib import page
E=['pages/ecommerce']
m=[('products','محصولات','فروشگاه|محصولات','Pages.products()'),
('product-details','جزئیات محصول','فروشگاه|جزئیات محصول','Pages.productDetails()'),
('categories','دسته‌بندی‌ها','فروشگاه|دسته‌بندی‌ها','Pages.categories()'),
('inventory','موجودی انبار','فروشگاه|موجودی انبار','Pages.inventory()'),
('cart','سبد خرید','فروشگاه|سبد خرید','Pages.cart()'),
('checkout','تسویه حساب','فروشگاه|تسویه حساب','Pages.checkout()'),
('orders','سفارش‌ها','فروشگاه|سفارش‌ها','Pages.orders()'),
('order-details','جزئیات سفارش','فروشگاه|جزئیات سفارش','Pages.orderDetails()'),
('customers','لیست مشتریان','فروشگاه|لیست مشتریان','Pages.customers()'),
('transactions','تراکنش‌ها','فروشگاه|تراکنش‌ها','Pages.transactions()')]
for f,t,c,i in m: page(f'admin/{f}.html',t,crumbs=c,js=E,init='await '+i)
# storefront
page('shop/products.html','محصولات',crumbs=None,js=E,init='await Pages.products({shop:true})',shell='shop')
page('shop/product.html','جزئیات محصول',js=E,init='await Pages.productDetails({shop:true})',shell='shop')
page('shop/cart.html','سبد خرید',js=E,init='await Pages.cart()',shell='shop')
page('shop/checkout.html','ثبت سفارش',js=E,init='await Pages.checkout()',shell='shop')
home='''<div class="hero"><div><h1 style="font-size:30px;line-height:1.6">هر چه نیاز دارید، یک‌جا و با بهترین قیمت</h1><p style="margin:12px 0 20px;opacity:.9">لوازم برقی، مد، مبلمان و بیشتر؛ با ارسال سریع و ضمانت بازگشت ۳۰ روزه.</p><a class="btn btn-lg lg" href="products.html" style="background:#fff;color:var(--primary)">مشاهده محصولات</a></div><img id="heroImg" alt=""></div>
<div class="grid g-4 mt-3" id="perks"></div>
<div class="d-flex jc-b ai-c mt-3 mb-3"><h2>پرفروش‌ترین‌ها</h2><a href="products.html">مشاهده همه ←</a></div><div class="product-grid" id="home"></div>'''
page('shop/index.html','فروشگاه اینترنتی',home,js=['pages/shop'],init='await Pages.shopHome()',shell='shop')
page('shop/login.html','ورود',js=['pages/auth'],init="await Pages.auth('login')",shell='bare')
page('shop/register.html','ثبت‌نام',js=['pages/auth'],init="await Pages.auth('register')",shell='bare')
page('admin/login.html','ورود',js=['pages/auth'],init="await Pages.auth('login',true)",shell='bare')
page('index.html','میرون',shell='bare',body='<script>location.replace("admin/dashboard.html")</script>',init='')
print('ok')
