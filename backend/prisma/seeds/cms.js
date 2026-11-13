const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { hashPassword } = require('../../src/utils/password');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  })
});

const DEMO_USER_EMAIL = 'demo-cms-author@example.test';

async function getOrCreateDemoAuthor() {
  let user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEMO_USER_EMAIL,
        phone: '09120000099',
        passwordHash: await hashPassword('DemoPass123!'),
        status: 'ACTIVE',
        profile: { create: { firstName: 'نویسنده', lastName: 'نمونه' } },
        accessProfile: { create: { type: 'STAFF', isActive: true } },
      },
    });
  }
  return user;
}

async function seedCategories() {
  const categories = [
    { name: 'فیبر نوری', slug: 'fiber-optic', sortOrder: 1, isActive: true },
    { name: 'تجهیزات تست', slug: 'test-equipment', sortOrder: 2, isActive: true },
    { name: 'تجهیزات شبکه', slug: 'network-equipment', sortOrder: 3, isActive: true },
    { name: 'دیتاسنتر', slug: 'datacenter', sortOrder: 4, isActive: true },
    { name: 'مخابرات', slug: 'telecom', sortOrder: 5, isActive: true },
  ];

  for (const cat of categories) {
    await prisma.articleCategory.upsert({
      where: { slug: cat.slug },
      update: { ...cat, isActive: true },
      create: cat,
    });
  }
  return prisma.articleCategory.findMany({ where: { slug: { in: categories.map(c => c.slug) } } });
}

async function seedTags() {
  const tags = [
    { name: 'OTDR', slug: 'otdr' },
    { name: 'پاور متر', slug: 'power-meter' },
    { name: 'سوئیچ', slug: 'switch' },
    { name: 'روتر', slug: 'router' },
    { name: 'کابل فیبر', slug: 'fiber-cable' },
    { name: 'دیتاسنتر', slug: 'datacenter-tag' },
    { name: 'موسیعی', slug: 'municipal' },
    { name: 'چک‌لیست', slug: 'checklist' },
    { name: 'راهنمای خرید', slug: 'buying-guide' },
    { name: 'آموزش فنی', slug: 'technical-tutorial' },
  ];

  for (const tag of tags) {
    await prisma.articleTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  return prisma.articleTag.findMany({ where: { slug: { in: tags.map(t => t.slug) } } });
}

async function seedArticles(authorId, categories, tags) {
  const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));
  const tagMap = Object.fromEntries(tags.map(t => [t.slug, t.id]));

  const articles = [
    {
      title: 'راهنمای انتخاب کابل فیبر نوری؛ از ساختار تا کاربرد',
      slug: 'fiber-optic-cable-guide',
      excerpt: 'برای انتخاب کابل مناسب پروژه، باید نوع فیبر، تعداد کور، ساختار حفاظتی و شرایط نصب را کنار هم بررسی کنید.',
      content: `<p>انتخاب کابل فیبر نوری فقط به تعداد کور محدود نمی‌شود. مسیر نصب، محیط بهره‌برداری، میزان رطوبت، فشار مکانیکی و شعاع خمش، همگی در انتخاب نهایی نقش دارند.</p><p>برای مسیرهای بیرونی، کابل باید متناسب با شرایط محیطی و روش نصب انتخاب شود. در مسیرهای داخلی، ابعاد، انعطاف‌پذیری و استانداردهای ایمنی ساختمان اهمیت بیشتری پیدا می‌کنند.</p><p>پیش از خرید، تعداد کور موردنیاز فعلی و ظرفیت توسعه آینده را مشخص کنید؛ سپس نوع فیبر، ساختار کابل و تجهیزات جانبی سازگار را با مشخصات فنی پروژه تطبیق دهید.</p>`,
      contentFormat: 'HTML',
      type: 'GUIDE',
      status: 'PUBLISHED',
      coverImageKey: null,
      metaTitle: 'راهنمای انتخاب کابل فیبر نوری | مجله مخابرات',
      metaDescription: 'راهنمای کامل انتخاب کابل فیبر نوری برای پروژه‌های مخابراتی و شبکه. نوع فیبر، تعداد کور، ساختار و شرایط نصب.',
      canonicalUrl: null,
      isIndexable: true,
      publishedAt: new Date('2026-10-15T10:00:00Z'),
      categories: [{ categoryId: categoryMap['fiber-optic'], sortOrder: 1 }],
      tagIds: [tagMap['fiber-cable'], tagMap['buying-guide']],
    },
    {
      title: 'هنگام خرید OTDR به چه مشخصاتی توجه کنیم؟',
      slug: 'otdr-buying-guide',
      excerpt: 'برد دینامیکی، ناحیه مرده، طول موج و دقت اندازه‌گیری را متناسب با شبکه خود مقایسه کنید.',
      content: `<p>OTDR یکی از ابزارهای اصلی عیب‌یابی لینک‌های فیبر نوری است؛ اما انتخاب مدل مناسب باید بر اساس نوع شبکه و سناریوی اندازه‌گیری انجام شود.</p><p>برد دینامیکی، ناحیه مرده رویداد و تضعیف، طول موج‌های پشتیبانی‌شده و امکان ذخیره و تحلیل گزارش از مشخصات مهم دستگاه هستند.</p><p>پیش از نهایی‌کردن خرید، سازگاری کانکتورها، اقلام همراه، خدمات کالیبراسیون و آموزش کاربری را نیز بررسی کنید.</p>`,
      contentFormat: 'HTML',
      type: 'GUIDE',
      status: 'PUBLISHED',
      coverImageKey: null,
      metaTitle: 'راهنمای خرید OTDR | تجهیزات تست فیبر نوری',
      metaDescription: 'بررسی مشخصات فنی مهم برای خرید OTDR مناسب. برد دینامیکی، ناحیه مرده، طول موج و دقت اندازه‌گیری.',
      canonicalUrl: null,
      isIndexable: true,
      publishedAt: new Date('2026-10-20T10:00:00Z'),
      categories: [{ categoryId: categoryMap['test-equipment'], sortOrder: 1 }],
      tagIds: [tagMap['otdr'], tagMap['buying-guide']],
    },
  {
      title: 'چطور سوئیچ شبکه مناسب پروژه سازمانی را انتخاب کنیم؟',
      slug: 'network-switch-selection',
      excerpt: 'تعداد پورت، سرعت uplink، قابلیت مدیریتی و توان PoE را با نیاز واقعی شبکه تطبیق دهید.',
      content: `<p>در انتخاب سوئیچ سازمانی، ابتدا تعداد کاربران و تجهیزات متصل را به همراه رشد احتمالی شبکه برآورد کنید.</p><p>سرعت پورت‌ها، ظرفیت uplink، قابلیت‌های لایه ۲ و ۳، VLAN، افزونگی و توان PoE باید با طراحی شبکه هماهنگ باشند.</p><p>برای مقایسه پیشنهادها، مدل دقیق، نسخه نرم‌افزار، لایسنس‌ها، گارانتی و اقلام همراه را در یک جدول یکسان ثبت کنید.</p>`,
      contentFormat: 'HTML',
      type: 'ARTICLE',
      status: 'PUBLISHED',
      coverImageKey: null,
      metaTitle: 'انتخاب سوئیچ شبکه سازمانی | راهنمای خرید',
      metaDescription: 'راهنمای انتخاب سوئیچ شبکه برای پروژه‌های سازمانی. پورت، سرعت uplink، PoE، لایه ۲/۳ و VLAN.',
      canonicalUrl: null,
      isIndexable: true,
      publishedAt: new Date('2026-10-25T10:00:00Z'),
      categories: [{ categoryId: categoryMap['network-equipment'], sortOrder: 1 }],
      tagIds: [tagMap['switch'], tagMap['technical-tutorial']],
    },
    {
      title: 'محاسبه توان PoE پیش از خرید سوئیچ',
      slug: 'poe-switch-planning',
      excerpt: 'بودجه توان کل، کلاس مصرف‌کننده‌ها و ظرفیت توسعه را قبل از انتخاب مدل محاسبه کنید.',
      content: `<p>برای طراحی درست PoE، تنها جمع‌زدن تعداد پورت‌ها کافی نیست. توان موردنیاز هر مصرف‌کننده و بودجه توان کل دستگاه را بررسی کنید.</p><p>دوربین‌ها، تلفن‌های IP و اکسس‌پوینت‌ها ممکن است در شرایط کاری مختلف مصرف متفاوتی داشته باشند.</p><p>همیشه مقداری ظرفیت برای توسعه آینده در نظر بگیرید و محدودیت توان منبع تغذیه و دمای محیط را هم بسنجید.</p>`,
      contentFormat: 'HTML',
      type: 'ARTICLE',
      status: 'PUBLISHED',
      coverImageKey: null,
      metaTitle: 'محاسبه توان PoE برای سوئیچ شبکه',
      metaDescription: 'راهنمای محاسبه بودجه توان PoE پیش از خرید سوئیچ شبکه. کلاس مصرف‌کننده‌ها و ظرفیت توسعه.',
      canonicalUrl: null,
      isIndexable: true,
      publishedAt: new Date('2026-10-28T10:00:00Z'),
      categories: [{ categoryId: categoryMap['network-equipment'], sortOrder: 2 }],
      tagIds: [tagMap['switch'], tagMap['technical-tutorial']],
    },
    {
      title: 'چک‌لیست تجهیزات جانبی اجرای پروژه فیبر نوری',
      slug: 'fiber-accessories-checklist',
      excerpt: 'از پیگتیل و آداپتور تا پچ‌کورد، کاست و متعلقات مدیریت کابل؛ اقلام ضروری را فراموش نکنید.',
      content: `<p>در برآورد پروژه فیبر نوری، اقلام جانبی باید از ابتدا در کنار کابل و تجهیزات فعال دیده شوند.</p><p>نوع کانکتور، پولیش، تعداد پیگتیل، پچ‌کورد، کاست، تایع و ابزارهای اتصال و تست باید در لیست خرید گنجانده شوند.</p><p>عدم توجه به اقلام جزئی می‌تواند اجرای پروژه را روزها متوقف کند. این چک‌لیست کمک می‌کند هیچ موردی فراموش نشود.</p>`,
      contentFormat: 'HTML',
      type: 'GUIDE',
      status: 'PUBLISHED',
      coverImageKey: null,
      metaTitle: 'چک‌لیست تجهیزات جانبی پروژه فیبر نوری',
      metaDescription: 'لیست کامل تجهیزات جانبی مورد نیاز برای اجرای پروژه فیبر نوری. پیگتیل، آداپتور، پچ‌کورد و مدیریت کابل.',
      canonicalUrl: null,
      isIndexable: true,
      publishedAt: new Date('2026-11-01T10:00:00Z'),
      categories: [{ categoryId: categoryMap['fiber-optic'], sortOrder: 2 }],
      tagIds: [tagMap['fiber-cable'], tagMap['checklist']],
    },

{
      title: 'معماری شبکه دیتاسنتر مدرن؛ از Leaf-Spine تا EVPN',
      slug: 'datacenter-network-architecture',
      excerpt: 'معماری Leaf-Spine، EVPN/VXLAN و اتوماسیون شبکه در دیتاسنترهای نسل جدید.',
      content: `<p>معماری سنتی سه لایه (Core/Aggregation/Access) در دیتاسنترهای مقیاس‌پذیر جایگزین شده با معماری Leaf-Spine.</p><p>این معماری تأخیر ثابت، پهنای باند بالا و مسیریابی ECMP را فراهم می‌کند. ترکیب با EVPN/VXLAN امکان چندمستأجری و افزودنی بودن را می‌دهد.</p><p>ابزارهای اتوماسیون مانند Ansible و Terraform برای مدیریت پیکربندی در مقیاس بزرگ ضروری شده‌اند.</p>`,
      contentFormat: 'HTML',
      type: 'ARTICLE',
      status: 'PUBLISHED',
      coverImageKey: null,
      metaTitle: 'معماری شبکه دیتاسنتر مدرن | Leaf-Spine و EVPN',
      metaDescription: 'بررسی معماری Leaf-Spine، EVPN/VXLAN و اتوماسیون در دیتاسنترهای نسل جدید.',
      canonicalUrl: null,
      isIndexable: true,
      publishedAt: new Date('2026-11-05T10:00:00Z'),
      categories: [{ categoryId: categoryMap['datacenter'], sortOrder: 1 }],
      tagIds: [tagMap['datacenter-tag'], tagMap['technical-tutorial']],
    },
    {
      title: 'اخبار صنعت: انتشار استانداردهای جدید فیبر نوری در ۱۴۰۳',
      slug: 'fiber-standards-2026',
      excerpt: 'سازمان استانداردهای مخابراتی ایران استانداردهای جدید فیبر نوری را منتشر کرد.',
      content: `<p>سازمان تنظیم مقررات و ارتباطات رادیویی استانداردهای به‌روزرسانی شده برای کابل‌های فیبر نوری را منتشر کرد که شامل مشخصات مکانیکی، محیطی و انتقالی جدید است.</p><p>این استانداردها با مراجعه به IEC 60794 و ITU-T G.652/G.657 هماهنگ شده و برای پروژه‌های ملی الزامی خواهند بود.</p><p>تولیدکنندگان و مجریان پروژه‌ها باید تا تاریخ ۱۴۰۳/۱۲/۲۹ محصولات و طرح‌های خود را با استانداردهای جدید تطبیق دهند.</p>`,
      contentFormat: 'HTML',
      type: 'NEWS',
      status: 'PUBLISHED',
      coverImageKey: null,
      metaTitle: 'استانداردهای جدید فیبر نوری ۱۴۰۳ | اخبار مخابرات',
      metaDescription: 'انتشار استانداردهای به‌روزرسانی شده فیبر نوری توسط سازمان تنظیم مقررات و ارتباطات رادیویی.',
      canonicalUrl: null,
      isIndexable: true,
      publishedAt: new Date('2026-11-08T10:00:00Z'),
      categories: [{ categoryId: categoryMap['telecom'], sortOrder: 1 }],
      tagIds: [tagMap['fiber-cable'], tagMap['municipal']],
    },
    {
      title: 'پیش‌نویس: مقایسه برندهای معروف OTDR در بازار ایران',
      slug: 'otdr-brands-comparison-draft',
      excerpt: 'مقایسه مدل‌های مختلف OTDR از برندهای EXFO، VIAVI، Yokogawa و برندهای چینی.',
      content: `<p>این مقاله در حال نگارش است و به‌صورت پیش‌نویس ذخیره شده است.</p><p>مقایسه بر اساس برد دینامیکی، دقت، وزن، قیمت و خدمات پس از فروش انجام خواهد شد.</p>`,
      contentFormat: 'HTML',
      type: 'ARTICLE',
      status: 'DRAFT',
      coverImageKey: null,
      metaTitle: 'مقایسه برندهای OTDR در بازار ایران (پیش‌نویس)',
      metaDescription: 'مقایسه مدل‌های OTDR برندهای معروف در بازار ایران (پیش‌نویس).',
      canonicalUrl: null,
      isIndexable: false,
      publishedAt: null,
      categories: [{ categoryId: categoryMap['test-equipment'], sortOrder: 3 }],
      tagIds: [tagMap['otdr']],
    },
    {
      title: 'برنامه‌ریزی شبکه برای پروژه‌های فایبر به خانه (FTTH)',
      slug: 'ftth-network-planning',
      excerpt: 'معماری GPON/XGS-PON، تقسیم باند، OLT/ONU و مدیریت جداسازی در FTTH.',
      content: `<p>معماری GPON و XGS-PON برای ارائه خدمات پهنای باند بالا به منزل (FTTH) استاندارد إنداستریال شده‌اند.</p><p>نسبت تقسیم (Split Ratio)، قدرت görünüş OLT، حساسیت گیرنده ONU و ضایعات لینک باید در طراحی دقیق محاسبه شوند.</p><p>مدیریت جداسازی (Splitter Management) در کابینت‌های توزیع و 챔برهای زیرزمینی نقش حیاتی در عملیات و نگهداری دارد.</p>`,
      contentFormat: 'HTML',
      type: 'GUIDE',
      status: 'SCHEDULED',
      coverImageKey: null,
      metaTitle: 'برنامه‌ریزی شبکه FTTH | GPON و XGS-PON',
      metaDescription: 'راهنمای طراحی شبکه فیبر به خانه (FTTH) با معماری GPON/XGS-PON.',
      canonicalUrl: null,
      isIndexable: true,
      scheduledAt: new Date('2026-11-20T10:00:00Z'),
      categories: [{ categoryId: categoryMap['telecom'], sortOrder: 2 }],
      tagIds: [tagMap['fiber-cable'], tagMap['technical-tutorial']],
    },
  ];

  for (const article of articles) {
    const { tagIds, categories: articleCategories, ...articleData } = article;
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        ...articleData,
        authorUserId: authorId,
        categories: { deleteMany: {}, create: articleCategories },
        tags: { deleteMany: {}, create: tagIds.map(tagId => ({ tagId })) },
      },
      create: {
        ...articleData,
        authorUserId: authorId,
        categories: { create: articleCategories },
        tags: { create: tagIds.map(tagId => ({ tagId })) },
      },
    });
  }
}
async function seedFaqs() {
  const faqs = [
    {
      question: 'بازارگاه مخابرات چه خدماتی ارائه می‌کند؟',
      answer: 'این سامانه یک بازارگاه B2B برای پیدا کردن تجهیزات مخابراتی و شبکه، بررسی اطلاعات محصولات منتشرشده و ارتباط با تأمین‌کنندگان از طریق فرایند استعلام است.',
      category: 'عمومی',
      sortOrder: 1,
      isActive: true,
    },
    {
      question: 'چه کسی می‌تواند درخواست استعلام ثبت کند؟',
      answer: 'ثبت درخواست استعلام برای همه کاربران به‌صورت خودکار فعال نیست. حساب شما باید دسترسی لازم را داشته باشد و محدودیت‌ها یا سهمیه اشتراک مربوطه نیز باید اجازه ثبت درخواست را بدهند.',
      category: 'استعلام',
      sortOrder: 2,
      isActive: true,
    },
    {
      question: 'چه کسی می‌تواند به استعلام پاسخ بدهد؟',
      answer: 'پاسخ‌دهی از سوی کاربران شرکتیِ دارای مجوز مربوطه انجام می‌شود. دسترسی و سهمیه پاسخ‌دهی در سمت سامانه بررسی می‌شوند؛ داشتن حساب کاربری به‌تنهایی به معنی داشتن این دسترسی نیست.',
      category: 'استعلام',
      sortOrder: 3,
      isActive: true,
    },
    {
      question: 'اگر قیمت محصول نمایش داده نشود، چه کار کنم؟',
      answer: 'ممکن است قیمت در اطلاعات عمومی محصول ثبت نشده باشد یا لازم باشد شرایط تأمین مشخص شود. اگر دسترسی لازم را داشته باشید، گزینه ثبت استعلام قیمت در صفحه جزئیات محصول در دسترس خواهد بود.',
      category: 'محصولات',
      sortOrder: 4,
      isActive: true,
    },
    {
      question: 'پس از ثبت‌نام شرکت، حساب چه زمانی فعال می‌شود؟',
      answer: 'ثبت‌نام شرکت به‌تنهایی به معنی فعال‌شدن فوری حساب نیست. اطلاعات شرکت باید طبق فرایند بررسی و تأیید سامانه تأیید شود؛ وضعیت حساب را از پیام‌های سامانه یا پشتیبانی پیگیری کنید.',
      category: 'شرکت‌ها',
      sortOrder: 5,
      isActive: true,
    },
    {
      question: 'چرا محصولی که ثبت کرده‌یم هنوز در کاتالوگ عمومی نیست؟',
      answer: 'محصول باید اطلاعات لازم را داشته باشد، برای بررسی ارسال شود، توسط تیم مسئول تأیید شود و سپس شرکت آن را منتشر کند. محصول پیش‌نویس یا در انتظار بررسی در کاتالوگ عمومی نمایش داده نمی‌شود.',
      category: 'محصولات',
      sortOrder: 6,
      isActive: true,
    },
    {
      question: 'آیا برای همه محصولات امکان خرید مستقیم و پرداخت آنلاین وجود دارد؟',
      answer: 'نسخه فعلی بر فرایند B2B و استعلام متمرکز است؛ بنابراین وجود صفحه محصول به معنی فعال‌بودن خرید مستقیم یا پرداخت آنلاین برای آن محصول نیست. برای شرایط تأمین، از اطلاعات محصول و فرایند استعلام استفاده کنید.',
      category: 'محصولات',
      sortOrder: 7,
      isActive: true,
    },
    {
      question: 'چطور با پشتیبانی تماس بگیرم؟',
      answer: 'برای پرسش‌هایی که در این صفحه پاسخ داده نشده‌اند، از صفحه تماس با ما استفاده کنید و شرح مسئله را برای تیم پشتیبانی ارسال کنید.',
      category: 'پشتیبانی',
      sortOrder: 8,
      isActive: true,
    },
    {
      question: 'چگونه می‌توانم مقاله بنویسم و در مجله منتشر کنم؟',
      answer: 'نشر مقاله در مجله مختص کاربران با دسترسی ویرایش محتوا (STAFF) است. در صورت داشتن دسترسی، از پنل مدیریت می‌توانید مقاله جدید ایجاد، ویرایش و منتشر کنید.',
      category: 'مجله',
      sortOrder: 9,
      isActive: true,
    },
    {
      question: 'تفاوت مقاله، خبر و راهنما در مجله چیست؟',
      answer: 'مقاله: محتوای تحلیلی و تخصصی. خبر: اطلاع‌رسانی رویدادها و اتفاقات جاری. راهنما: محتوای آموزشی و Instructional برای انجام کارها.',
      category: 'مجله',
      sortOrder: 10,
      isActive: true,
    },
  ];

  for (const faq of faqs) {
    await prisma.faq.upsert({
      where: { question: faq.question },
      update: faq,
      create: faq,
    });
  }
}

async function seedPages() {
  const pages = [
    {
      slug: 'about',
      title: 'درباره ما',
      content: `<h2>تأمین تجهیزات مخابراتی؛ ساده‌تر و شفاف‌تر</h2><p>بازارگاه مخابرات بستری برای پیدا کردن تجهیزات، آشنایی با تأمین‌کنندگان و مقایسه پیشنهادها در زنجیره تأمین مخابرات و شبکه است.</p><h3>مهمه ما</h3><p>ما با ایجاد یک بازارگاه دیجیتال شفاف، فرآیند تأمین تجهیزات مخابراتی را برای خریداران سازمانی و تأمین‌کنندگان آسان‌تر کرده‌ایم.</p><h3>ارزش‌ها</h3><ul><li><strong>اعتماد و بررسی:</strong> فرآیندهای بررسی شرکت‌ها و محصولات به ایجاد یک فضای تجاری قابل اتکاتر کمک می‌کنند.</li><li><strong>تأمین تخصصی:</strong> دسته‌بندی تجهیزات مخابراتی و شبکه، پیدا کردن محصولات متناسب با نیاز سازمان را ساده‌تر می‌کند.</li><li><strong>ارتباط مستقیم:</strong> درخواست استعلام به خریداران واجد دسترسی کمک می‌کند پیشنهادهای تأمین‌کنندگان را دریافت و مقایسه کنند.</li><li><strong>شفافیت در تصمیم‌گیری:</strong> اطلاعات محصول و پیشنهادهای موجود، پایه‌ای برای مقایسه و انتخاب آگاهانه فراهم می‌کنند.</li></ul>`,
      contentFormat: 'HTML',
      metaTitle: 'درباره بازارگاه مخابرات | Telekom Market',
      metaDescription: 'بازارگاه B2B تجهیزات مخابراتی و شبکه. یافتن تجهیزات، آشنایی با تأمین‌کنندگان و مقایسه پیشنهادها.',
      canonicalUrl: null,
      isIndexable: true,
      isActive: true,
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
  }
}
async function main() {
  console.log('🌱 Starting CMS seed...');

  if (process.env.NODE_ENV === 'production' && !process.env.FORCE_SEED) {
    console.error('❌ Seed refused: production environment detected. Set FORCE_SEED=1 to override.');
    process.exit(1);
  }

  try {
    const author = await getOrCreateDemoAuthor();
    console.log(`✅ Demo author: ${author.email} (ID: ${author.id})`);

    const categories = await seedCategories();
    console.log(`✅ Seeded ${categories.length} categories`);

    const tags = await seedTags();
    console.log(`✅ Seeded ${tags.length} tags`);

    await seedArticles(author.id, categories, tags);
    console.log('✅ Seeded articles');

    await seedFaqs();
    console.log('✅ Seeded FAQs');

    await seedPages();
    console.log('✅ Seeded static pages');

    console.log('🎉 CMS seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

module.exports = { seedCms: main };