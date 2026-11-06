// Development-only, repeatable marketplace fixtures. Prices are indicative IRR values.
const DEMO_COMPANIES = [
  { name: 'آرمان شبکه پارس', type: 'MANUFACTURER' },
  { name: 'پارس فیبر ایرانیان', type: 'MANUFACTURER' },
  { name: 'فناوران ارتباطات شرق', type: 'MANUFACTURER' },
  { name: 'توسعه زیرساخت هوشمند', type: 'MANUFACTURER' },
  { name: 'تجهیزات شبکه آریا', type: 'IMPORTER' },
  { name: 'پیشگامان مخابرات خاورمیانه', type: 'IMPORTER' },
  { name: 'بازرگانی موج نو', type: 'IMPORTER' },
  { name: 'راهکارهای ارتباطی سپهر', type: 'TELECOM_OPERATOR' },
  { name: 'شبکه گستران ایران', type: 'TELECOM_OPERATOR' },
  { name: 'ارتباطات پایدار البرز', type: 'TELECOM_OPERATOR' },
];
const DEMO_CUSTOMERS = [['مهدی','احمدی'],['سارا','محمدی'],['علی','رضایی'],['نگار','حسینی'],['رضا','کریمی']];

// Five manufacturer/model references in each of the 15 marketplace categories.
// Every model is intentionally listed by two different demo suppliers.
const CATALOG = [
 {category:'wireline-copper-fiber',subcategory:'cable',items:[
 ['Corning','ALTOS Loose Tube 144F','کابل فیبر نوری بیرونی ۱۴۴ کور، loose-tube','fiber','144F','G.652.D','متر',185000],
 ['Prysmian','Sirocco HD 96F','کابل میکرو‌داکت ۹۶ کور برای شبکه FTTH','fiber','96F','G.657.A2','متر',210000],
 ['OFS','AccuTube+ 48F','کابل فیبر نوری ۴۸ کور برای شبکه دسترسی','fiber','48F','G.652.D','متر',142000],
 ['Fujikura','SWR/RTS 12F Drop','کابل دراپ فیبر نوری برای اتصال مشترک FTTH','drop','12F','G.657.A2','متر',42000],
 ['CommScope','FOSC-400B4','محفظه اتصال و حفاظت شبکه فیبر نوری بیرونی','closure','96 ports','IP68','عدد',98000000]]},
 {category:'network-it-equipment',subcategory:'switching-routing',items:[
 ['Cisco','Catalyst C9300-48P','سوئیچ مدیریتی لایه ۳ با ۴۸ پورت گیگابیت PoE+','switch','48x1G PoE+','StackWise','عدد',1850000000],
 ['HPE Aruba','6300M JL658A','سوئیچ سازمانی لایه ۳ با uplink ده‌گیگابیتی','switch','48x1G','10/25GbE','عدد',1420000000],
 ['Juniper','EX4400-48MP','سوئیچ دسترسی چندگیگابیتی با PoE و Virtual Chassis','switch','48 ports','PoE++ / 10GbE','عدد',2150000000],
 ['MikroTik','CCR2004-1G-12S+2XS','روتر تجمیع با پورت‌های +SFP و XSFP','router','12x10G SFP+','2x25G SFP28','عدد',385000000],
 ['Huawei','S5735-L48T4X-A1','سوئیچ دسترسی ۴۸ پورت گیگابیت با چهار uplink ده‌گیگابیت','switch','48x1G','4x10G SFP+','عدد',520000000]]},
 {category:'mobile-network',subcategory:'radio-access-units',items:[
 ['Nokia','AirScale AEQE','واحد رادیویی چندبانده برای شبکه دسترسی LTE/5G','RRU','Multi-band','LTE / NR','عدد',7800000000],
 ['Ericsson','Radio 4490','واحد رادیویی دوردست چندبانده برای سایت ماکرو 5G','RRU','4T4R','LTE / NR','عدد',6900000000],
 ['Huawei','RRU5901','واحد رادیویی باند میانی برای شبکه LTE و NR','RRU','4T4R','FDD/TDD variants','عدد',5200000000],
 ['Samsung','Massive MIMO 64T64R','واحد آنتن فعال Massive MIMO برای شبکه 5G NR','AAU','64T64R','5G NR','عدد',9800000000],
 ['Comba','RDU3680','واحد رادیویی توزیع‌شده برای پوشش داخل ساختمان','RU','Multi-band','DAS / IBS','عدد',1250000000]]},
 {category:'transmission',subcategory:'transport-platforms',items:[
 ['Nokia','1830 PSS-8','پلتفرم انتقال نوری packet/OTN برای شبکه اپراتوری','OTN','Modular chassis','OTN / DWDM','عدد',12500000000],
 ['Ciena','6500 Packet-Optical','سامانه انتقال packet-optical برای شبکه مترو و backbone','Optical transport','Modular','OTN / WDM','عدد',14800000000],
 ['Huawei','OptiX OSN 9800','پلتفرم انتقال نوری پرظرفیت برای backbone و دیتاسنتر','OTN','Terabit-class','OTN / DWDM','عدد',13800000000],
 ['Infinera','GX Series','سامانه انتقال نوری همگرا برای شبکه long-haul و metro','Optical transport','Modular','Coherent optics','عدد',16200000000],
 ['Ceragon','IP-50C','رادیو انتقال packet microwave برای backhaul','Microwave radio','Split-mount','E-band / microwave','عدد',2150000000]]},
 {category:'satellite-vsat',subcategory:'satellite-modems',items:[
 ['Hughes','JUPITER HT1300','مودم ماهواره‌ای باند Ka برای ترمینال VSAT','Satellite modem','Ka-band','DVB-S2X','عدد',185000000],
 ['ST Engineering iDirect','X7','مودم ماهواره‌ای حرفه‌ای برای شبکه VSAT و خدمات IP','Satellite modem','High-throughput','DVB-S2X','عدد',265000000],
 ['Gilat','SkyEdge II-c Capricorn','ترمینال کاربر برای شبکه ماهواره‌ای چندسرویسی','Satellite terminal','Broadband VSAT','TDMA / DVB-S2X','عدد',210000000],
 ['Comtech','CDM-625A','مودم ماهواره‌ای تطبیقی برای لینک‌های حرفه‌ای','Satellite modem','L-band IF','DVB-S2 / ACM','عدد',325000000],
 ['Newtec','MDM3310','مودم ماهواره‌ای broadband برای شبکه HTS','Satellite modem','High-throughput','DVB-S2X','عدد',245000000]]},
 {category:'rf-antenna',subcategory:'antennas',items:[
 ['CommScope','HBXX-6517DS-VTM','آنتن پنلی چندبانده سکتور برای شبکه سلولی','Panel antenna','Multi-band','RET compatible','عدد',680000000],
 ['Kathrein','80010621','آنتن سکتور چندبانده برای ایستگاه پایه موبایل','Panel antenna','Multi-band','±45° polarization','عدد',590000000],
 ['RFS','APXVSPP18','آنتن پنلی سکتور با قابلیت تنظیم الکتریکی شیب','Panel antenna','Multi-band','RET','عدد',625000000],
 ['Huawei','AAU5613','واحد آنتن فعال برای شبکه 5G با آرایه مجتمع','Active antenna','Massive MIMO','5G NR','عدد',7200000000],
 ['Amphenol','Tri-band Sector Antenna','آنتن سکتور چندبانده برای سایت ماکرو','Panel antenna','Tri-band','2x2 / 4x4 MIMO','عدد',545000000]]},
 {category:'tower-structure-grounding',subcategory:'towers-structures',items:[
 ['Valmont','Self-Supporting Tower 45m','دکل خودایستا فولادی گالوانیزه گرم با طراحی ماژولار','Tower','45 m','Hot-dip galvanized steel','دستگاه',4850000000],
 ['Rohn','65G Tower Section','سکشن دکل مشبک برای سازه مخابراتی','Tower section','10 ft section','Galvanized steel','سکشن',185000000],
 ['Sabre','Monopole 30m','دکل مونوپل فولادی چندوجهی برای نصب تجهیزات رادیویی','Monopole','30 m','Hot-dip galvanized','دستگاه',3250000000],
 ['Kavosh','Guyed Mast 60m','دکل مهاری مخابراتی با مهارهای چندتراز','Guyed mast','60 m','Steel lattice','دستگاه',1950000000],
 ['Andrew','Base Station Mounting Frame','فریم نصب آنتن و تجهیزات روی دکل مخابراتی','Mounting frame','Multi-sector','Galvanized steel','ست',285000000]]},
 {category:'power-energy',subcategory:'rectifiers-chargers',items:[
 ['Eltek','Flatpack2 48/3000 HE','ماژول یکسوساز مخابراتی ۴۸ ولت با توان ۳ کیلووات','Rectifier','48 VDC / 3000 W','Hot-plug','عدد',185000000],
 ['Delta','DPR 2900B','ماژول یکسوساز ۲۹۰۰ وات برای تغذیه DC مخابراتی','Rectifier','48 VDC / 2900 W','Hot-swap','عدد',148000000],
 ['Huawei','ETP48100-B1','سامانه تغذیه DC مخابراتی با کنترلر و یکسوساز','Power system','-48 VDC','Battery management','دستگاه',625000000],
 ['Vertiv','NetSure 7100','سامانه توزیع و یکسوسازی DC برای سایت شبکه','Power system','-48 VDC','Modular rectifiers','دستگاه',1850000000],
 ['Eaton','93PM 30 kVA','UPS آنلاین سه‌فاز برای حفاظت تغذیه تجهیزات حیاتی','UPS','30 kVA','Double-conversion','دستگاه',2450000000]]},
 {category:'shelter-outdoor-cabinet',subcategory:'shelters-cabinets',items:[
 ['Vertiv','XTE 401','کابینت بیرونی مخابراتی با مدیریت حرارتی و حفاظت محیطی','Outdoor cabinet','Telecom enclosure','Thermal management','دستگاه',1480000000],
 ['Huawei','TBC300','کابینت outdoor برای تجهیزات دسترسی و تغذیه مخابراتی','Outdoor cabinet','Telecom site','IP-rated enclosure','دستگاه',1250000000],
 ['Schneider Electric','NetShelter CX','رک محصور و کم‌صدا برای تجهیزات شبکه و سرور','Enclosed rack','19-inch','Ventilation','دستگاه',985000000],
 ['Rittal','TS IT 4825.500','کابینت رک دیتاسنتری با ساختار ماژولار','IT enclosure','19-inch','Modular frame','دستگاه',425000000],
 ['nVent HOFFMAN','ProLine G2','محفظه صنعتی ماژولار برای تجهیزات کنترلی و مخابراتی','Industrial enclosure','Modular','NEMA/IP options','دستگاه',365000000]]},
 {category:'rack-datacenter-infra',subcategory:'racks-cabinets',items:[
 ['APC','NetShelter SX AR3100','رک سرور ۴۲ یونیت با عرض ۶۰۰ و عمق ۱۰۷۰ میلی‌متر','Server rack','42U','19-inch / 600x1070 mm','دستگاه',385000000],
 ['Rittal','VX IT 42U','رک دیتاسنتری ۴۲ یونیت برای تجهیزات IT و شبکه','Server rack','42U','19-inch','دستگاه',425000000],
 ['Chatsworth Products','GlobalFrame GF-Series','رک باز دیتاسنتری برای نصب سرور و تجهیزات شبکه','Open frame rack','45U variants','High-density','دستگاه',295000000],
 ['Vertiv','VR Rack 42U','رک سرور با قابلیت مدیریت جریان هوا و کابل‌کشی','Server rack','42U','19-inch','دستگاه',325000000],
 ['Eaton','RS Enclosure 42U','رک ایستاده تجهیزات شبکه و دیتاسنتر با درب مشبک','Server rack','42U','Perforated doors','دستگاه',310000000]]},
 {category:'servers-storage',subcategory:'servers',items:[
 ['Dell','PowerEdge R760','سرور رکمونت دوپردازنده‌ای برای مجازی‌سازی و بار سازمانی','Rack server','2U','Intel Xeon Scalable','دستگاه',4850000000],
 ['HPE','ProLiant DL380 Gen11','سرور سازمانی دو یونیت با حافظه DDR5 و PCIe Gen5','Rack server','2U','DDR5 / PCIe Gen5','دستگاه',5250000000],
 ['Lenovo','ThinkSystem SR650 V3','سرور رکمونت دوپردازنده‌ای برای دیتاسنتر','Rack server','2U','Intel Xeon Scalable','دستگاه',4650000000],
 ['Supermicro','SYS-621C-TN12R','سرور 2U با ذخیره‌سازی hot-swap','Rack server','2U','Hot-swap drive bays','دستگاه',3950000000],
 ['Cisco','UCS C240 M7','سرور رکمونت دو یونیت برای زیرساخت محاسباتی','Rack server','2U','Cisco UCS management','دستگاه',5100000000]]},
 {category:'network-security',subcategory:'firewalls-security-gateways',items:[
 ['Fortinet','FortiGate 200F','فایروال نسل جدید برای شعب و شبکه سازمانی','NGFW','Enterprise branch','IPS / VPN / SD-WAN','عدد',1850000000],
 ['Palo Alto Networks','PA-3220','فایروال نسل جدید با بازرسی ترافیک لایه کاربرد','NGFW','Mid-range','App-ID / Threat Prevention','عدد',2250000000],
 ['Cisco','Firepower 1120','فایروال شعب با قابلیت IPS و کنترل دسترسی','NGFW','Branch','Snort IPS','عدد',785000000],
 ['Check Point','Quantum 6200','درگاه امنیتی سازمانی برای حفاظت شبکه','Security gateway','Enterprise','Threat Prevention','عدد',1650000000],
 ['Sophos','XGS 3300','فایروال XGS برای پردازش چندلایه تهدید','NGFW','Mid-range','Xstream architecture','عدد',1250000000]]},
 {category:'voip-telephony',subcategory:'pbx-systems',items:[
 ['Cisco','Unified Communications Manager 14','سامانه مدیریت تماس و ارتباطات یکپارچه سازمانی','IP PBX','Enterprise','SIP / VoIP','لایسنس',1850000000],
 ['Avaya','IP Office 500 V2','مرکز تلفن IP برای کسب‌وکارهای کوچک و متوسط','IP PBX','Hybrid telephony','SIP / analog extensions','دستگاه',485000000],
 ['Yeastar','P-Series P560','مرکز تلفن IP برای ارتباطات یکپارچه سازمانی','IP PBX','Configuration dependent','SIP','دستگاه',285000000],
 ['Grandstream','UCM6302','مرکز تلفن IP با قابلیت ارتباط صوتی و تصویری','IP PBX','2 FXO / 2 FXS','SIP / WebRTC','دستگاه',185000000],
 ['3CX','Enterprise v20','نرم‌افزار مرکز تلفن IP برای ارتباطات سازمانی','Software PBX','Software license','SIP / Web client','لایسنس',125000000]]},
 {category:'iot-smart-devices',subcategory:'iot-gateways',items:[
 ['Cisco','IR1101','روتر صنعتی ماژولار برای اتصال امن تجهیزات صنعتی','Industrial router','Modular WAN','LTE / Ethernet','عدد',685000000],
 ['Siemens','SCALANCE MUM856-1','روتر صنعتی موبایل برای ارتباطات امن و دسترسی راه دور','Industrial router','5G capable','VPN / Industrial networking','عدد',785000000],
 ['Advantech','ECU-150','گیت‌وی ارتباطی صنعتی برای جمع‌آوری داده','IoT gateway','Industrial edge','Modbus / Ethernet','عدد',385000000],
 ['Teltonika','RUTX11','روتر صنعتی LTE با Wi-Fi و چند درگاه اترنت','Industrial router','LTE Cat 6','Wi-Fi / VPN','عدد',185000000],
 ['Moxa','UC-8200','رایانه تعبیه‌شده صنعتی برای کاربردهای edge و gateway','Embedded computer','ARM-based','Linux / serial / Ethernet','عدد',425000000]]},
 {category:'test-measurement',subcategory:'optical-test-equipment',items:[
 ['EXFO','MaxTester 730C','OTDR چندطول‌موج برای تست و عیب‌یابی فیبر نوری','OTDR','Field tester','1310/1550 nm variants','عدد',985000000],
 ['VIAVI','SmartOTDR','دستگاه OTDR قابل‌حمل برای نصب و نگهداری فیبر','OTDR','Access network testing','1310/1550 nm variants','عدد',825000000],
 ['Anritsu','MT9085 Series','OTDR دستی برای تست شبکه دسترسی فیبر','OTDR','Field tester','SM / MM variants','عدد',765000000],
 ['Fluke Networks','DSX2-8000','تستر کابل مسی برای گواهی‌سنجی لینک‌های ساخت‌یافته','Cable certifier','Copper cabling','Permanent link / channel','عدد',1250000000],
 ['Yokogawa','AQ1210','OTDR دستی برای تست و نگهداری شبکه فیبر نوری','OTDR','Field tester','SM / MM variants','عدد',725000000]]},
];

function normalizeCode(value) {
  return String(value).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function upsertDemoUser(prisma, { phone, passwordHash, role, companyId = null, customer = null }) {
  const user = await prisma.user.upsert({
    where: { phone },
    update: { passwordHash, status: 'ACTIVE' },
    create: { phone, passwordHash, status: 'ACTIVE' },
  });
  if (companyId) {
    await prisma.accessProfile.upsert({
      where: { userId: user.id },
      update: { type: 'COMPANY', companyId, isActive: true },
      create: { userId: user.id, type: 'COMPANY', companyId, isActive: true },
    });
  } else if (customer) {
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: { firstName: customer[0], lastName: customer[1] },
      create: { userId: user.id, firstName: customer[0], lastName: customer[1] },
    });
  }
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  return user;
}

async function seedDemoMarketplace(prisma, { permissionByName }) {
  if (process.env.NODE_ENV === 'production' || process.env.SEED_DEMO_DATA === 'false') {
    console.log('Skipping demo marketplace data outside development.');
    return { companies: 0, users: 0, products: 0 };
  }
  const demoPassword = process.env.DEMO_USER_PASSWORD || 'A123@456';
  const passwordHash = await require('../../src/utils/password').hashPassword(demoPassword);
  const roleDefinitions = [
    {
      name: 'DEMO_CATALOG_MANAGER', label: 'مدیر کاتالوگ آزمایشی',
      description: 'مدیریت محصولات و مدارک کاتالوگ شرکت آزمایشی.', scope: 'COMPANY',
      permissions: ['dashboard.read','company_profile.read','products.create','products.read','products.update','products.submit_review','product_images.create','product_images.update','product_documents.create','product_documents.update','media.upload','media.read','notifications.read'],
    },
    {
      name: 'DEMO_SALES_MANAGER', label: 'کارشناس فروش آزمایشی',
      description: 'رسیدگی به استعلام‌ها، پاسخ‌ها و پیگیری مشتریان شرکت آزمایشی.', scope: 'COMPANY',
      permissions: ['dashboard.read','company_profile.read','leads.read','leads.update','inquiries.read','inquiries.respond','notifications.read','tickets.create','tickets.read','tickets.reply'],
    },
  ];
  const roles = {};
  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: definition.name },
      update: { label: definition.label, description: definition.description, scope: definition.scope, isSystem: true },
      create: { name: definition.name, label: definition.label, description: definition.description, scope: definition.scope, isSystem: true },
    });
    roles[definition.name] = role;
    for (const permissionName of definition.permissions) {
      const permission = permissionByName[permissionName];
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {}, create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  const managerRole = await prisma.role.findUnique({ where: { name: 'COMPANY_MANAGER' } });
  const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER_USER' } });
  const companyRows = [];
  const companyUsers = new Map();

  for (let i = 0; i < DEMO_COMPANIES.length; i++) {
    const definition = DEMO_COMPANIES[i];
    const company = await prisma.company.upsert({
      where: { name: definition.name },
      update: { type: definition.type, status: 'ACTIVE', isVerified: true },
      create: { name: definition.name, type: definition.type, status: 'ACTIVE', isVerified: true,
        description: 'شرکت آزمایشی برای ارزیابی فرایندهای بازارگاه تجهیزات مخابراتی.' },
    });
    companyRows.push(company);
    const users = [];
    const assignedRoles = [managerRole, roles.DEMO_CATALOG_MANAGER, roles.DEMO_SALES_MANAGER];
    for (let j = 0; j < assignedRoles.length; j++) {
      const phone = '099110' + String(i * 3 + j + 1).padStart(5, '0');
      users.push(await upsertDemoUser(prisma, {
        phone, passwordHash, role: assignedRoles[j], companyId: company.id,
      }));
    }
    companyUsers.set(company.id, users);
  }
  for (let i = 0; i < DEMO_CUSTOMERS.length; i++) {
    const phone = '099120' + String(i + 1).padStart(5, '0');
    await upsertDemoUser(prisma, { phone, passwordHash, role: customerRole, customer: DEMO_CUSTOMERS[i] });
  }

  const categories = await prisma.category.findMany({ where: { status: 'ACTIVE' } });
  const subcategories = await prisma.subcategory.findMany({ where: { status: 'ACTIVE' } });
  const categoryBySlug = new Map(categories.map((item) => [item.slug, item]));
  const subcategoryBySlug = new Map(subcategories.map((item) => [item.slug, item]));
  let productCount = 0;
  for (const [categoryIndex, family] of CATALOG.entries()) {
    const category = categoryBySlug.get(family.category);
    const subcategory = subcategoryBySlug.get(family.subcategory);
    if (!category || !subcategory) {
      console.warn('Skipping demo category with missing taxonomy:', family.category, family.subcategory);
      continue;
    }
    for (const [productIndex, item] of family.items.entries()) {
      const [brand, model, description, equipmentType, capacity, interfaceType, unit, price] = item;
      const catalogCode = 'TEL-' + normalizeCode(brand) + '-' + normalizeCode(model);
      for (let supplierIndex = 0; supplierIndex < 2; supplierIndex++) {
        const companyIndex = (productIndex + supplierIndex * 5 + categoryIndex) % companyRows.length;
        const company = companyRows[companyIndex];
        const catalogUser = companyUsers.get(company.id)[1];
        const slug = 'demo-' + company.id + '-' + normalizeCode(family.category) + '-' + (productIndex + 1);
        const productData = {
          title: brand + ' ' + model, slug,
          shortDescription: description,
          description: description + ' این رکورد مرجع آزمایشی است؛ پیش از عرضه تجاری باید با دیتاشیت سازنده و شرایط تأمین‌کننده تطبیق داده شود.',
          sku: 'SKU-' + String(company.id).padStart(4, '0') + '-' + normalizeCode(model),
          brand, model, catalogCode,
          specifications: {
            manufacturer: brand, model, equipmentType, capacity,
            interface: interfaceType, deployment: 'Telecom / Enterprise',
            productDataStatus: 'DEMO_REFERENCE_VERIFY_DATASHEET',
          },
          status: 'PUBLISHED', visibility: 'PUBLIC',
          companyId: company.id, categoryId: category.id,
          subcategoryId: subcategory.id, createdByUserId: catalogUser.id,
        };
        const product = await prisma.product.upsert({
          where: { slug }, update: productData, create: productData,
        });
        const tier = await prisma.productPriceTier.findFirst({
          where: { productId: product.id, minQuantity: 1 },
        });
        if (tier) {
          await prisma.productPriceTier.update({
            where: { id: tier.id },
            data: { maxQuantity: null, price, unit, validFrom: new Date(), validTo: null },
          });
        } else {
          await prisma.productPriceTier.create({
            data: { productId: product.id, minQuantity: 1, maxQuantity: null, price, unit, validFrom: new Date() },
          });
        }
        productCount++;
      }
    }
  }
  console.log('Demo marketplace: 10 companies, 30 company users, 5 customers, ' + productCount + ' product listings.');
  console.log('Demo account password: ' + demoPassword);
  return { companies: companyRows.length, users: 35, products: productCount };
}

module.exports = { seedDemoMarketplace, DEMO_COMPANIES, DEMO_CUSTOMERS, CATALOG };
