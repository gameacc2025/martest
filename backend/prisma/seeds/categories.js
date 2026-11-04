// =============================================================
// Marketplace Categories Seed — v2 (coarse-grained)
//
// Two-level taxonomy:
//   Category (parent)  →  Subcategory (child)  →  examples[] (UI hints)
//
// Each product belongs to exactly one Subcategory (and its Category).
// `includes` items become SubcategoryExample rows (search tags / UI hints).
// Slugs are provided; if missing they are generated from name_en.
// =============================================================

const MARKETPLACE_CATEGORIES = [
  {
    slug: 'wireline-copper-fiber',
    nameFa: 'شبکه‌های سیمی - مسی و فیبر نوری',
    nameEn: 'Wireline Networks: Copper & Fiber',
    subcategories: [
      {
        slug: 'cable',
        nameFa: 'کابل',
        nameEn: 'Cable',
        includes: ['کابل فیبر نوری (Indoor/Outdoor/Armored)', 'کابل مسی مخابراتی (هوایی/دفنی/داخلی)', 'کابل ADSS هوایی خودنگهدار', 'Drop Cable'],
      },
      {
        slug: 'connectors-terminations',
        nameFa: 'کانکتور و اتصالات',
        nameEn: 'Connectors & Terminations',
        includes: ['کانکتور فیبر (SC/LC/FC/ST)', 'آداپتور فیبر', 'پیگتیل', 'پچ‌کورد فیبر و مسی', 'کانکتور مسی'],
      },
      {
        slug: 'splicing-permanent-joints',
        nameFa: 'اسپلایس و اتصال دائم',
        nameEn: 'Splicing & Permanent Joints',
        includes: ['اسپلایس مکانیکی/فیوژن', 'اسپلایس پروتکتور', 'کلوژر فیبر و مسی', 'کیت اتصال کابل مسی', 'بلوک پانچ‌داون/کرون'],
      },
      {
        slug: 'distribution-boxes-panels',
        nameFa: 'جعبه و پنل توزیع',
        nameEn: 'Distribution Boxes & Panels',
        includes: ['ODF', 'پچ پنل فیبر', 'Fiber Distribution Box (FDB)', 'FAT', 'پدستال مسی', 'کراس‌کانکت کابینت'],
      },
      {
        slug: 'passive-optical-components',
        nameFa: 'قطعات پسیو نوری',
        nameEn: 'Passive Optical Components',
        includes: ['Optical Splitter (PLC/FBT)', 'WDM/CWDM/DWDM (Passive)', 'آتنویتور نوری', 'Media Converter'],
      },
      {
        slug: 'microduct-ducting',
        nameFa: 'میکروداکت و لوله‌کشی',
        nameEn: 'Microduct & Ducting',
        includes: ['میکروداکت (لوله)', 'باندل میکروداکت', 'کوپلر و فیتینگ میکروداکت', 'Branching Unit/T-Connector', 'End Cap/End Plug', 'لوله HDPE/ساب‌داکت', 'لوازم آب‌بندی داکت'],
      },
      {
        slug: 'underground-aerial-infrastructure',
        nameFa: 'زیرساخت زیرزمینی و هوایی',
        nameEn: 'Underground & Aerial Infrastructure',
        includes: ['چاهک/هندهول (Manhole/Handhole)', 'اتاقک کابل', 'تیر مخابراتی (بتنی/فلزی/چوبی)', 'سیم مسنجر (Messenger Wire/Strand)', 'کلمپ تعلیق و کشش', 'مهار و انکر (Guy Wire, Anchor)', 'براکت و یراق‌آلات هوایی', 'مارکر و تابلوی مسیر کابل', 'نوار هشدار دفن مستقیم'],
      },
      {
        slug: 'ftth-gpon-active-equipment',
        nameFa: 'تجهیزات فعال FTTH/GPON/EPON',
        nameEn: 'FTTH/GPON/EPON Active Equipment',
        includes: ['OLT', 'ONU', 'ONT', 'فیس‌پلیت', 'Fiber Socket/Rosette'],
      },
      {
        slug: 'installation-tools',
        nameFa: 'ابزار و تجهیزات نصب',
        nameEn: 'Installation Tools & Equipment',
        includes: ['کاتر و استریپر فیبر', 'کلیور (Cleaver)', 'وینچ کابل', 'دستگاه بلوئینگ فیبر', 'داکت رودر'],
      },
    ],
  },
  {
    slug: 'network-it-equipment',
    nameFa: 'تجهیزات شبکه دیتا',
    nameEn: 'Network / IT Equipment',
    subcategories: [
      {
        slug: 'switching-routing',
        nameFa: 'سوئیچینگ و روتینگ',
        nameEn: 'Switching & Routing',
        includes: ['سوئیچ شبکه', 'روتر', 'Gateway', 'Load Balancer'],
      },
      {
        slug: 'wireless-networking',
        nameFa: 'شبکه بی‌سیم',
        nameEn: 'Wireless Networking',
        includes: ['اکسس پوینت', 'کنترلر وایرلس'],
      },
      {
        slug: 'modules-transceivers',
        nameFa: 'ماژول و ترنسیور',
        nameEn: 'Modules & Transceivers',
        includes: ['SFP', 'SFP+', 'QSFP'],
      },
      {
        slug: 'modem-poe',
        nameFa: 'مودم و PoE',
        nameEn: 'Modem & PoE',
        includes: ['مودم', 'PoE Injector', 'PoE Switch'],
      },
      {
        slug: 'structured-lan-cabling',
        nameFa: 'کابل‌کشی ساختاریافته LAN',
        nameEn: 'Structured LAN Cabling',
        includes: ['کابل شبکه (Cat5e/6/6a/7)', 'کیستون', 'فیس‌پلیت LAN', 'پچ پنل مسی LAN'],
      },
    ],
  },
  {
    slug: 'mobile-network',
    nameFa: 'تجهیزات شبکه موبایل',
    nameEn: 'Mobile Network (RAN & Core)',
    subcategories: [
      {
        slug: 'radio-access-units',
        nameFa: 'واحدهای رادیویی دسترسی',
        nameEn: 'Radio Access Units',
        includes: ['BTS', 'eNodeB', 'gNodeB', 'Small Cell', 'RRU', 'BBU', 'DU', 'CU'],
      },
      {
        slug: 'backhaul-microwave',
        nameFa: 'بک‌هال و مایکروویو',
        nameEn: 'Backhaul & Microwave',
        includes: ['Microwave Radio', 'Backhaul Equipment'],
      },
      {
        slug: 'core-synchronization',
        nameFa: 'هسته شبکه و سنکرونایزیشن',
        nameEn: 'Core Network & Synchronization',
        includes: ['Mobile Core Equipment (EPC/5GC)', 'Synchronization Equipment (GPS/PTP/NTP)'],
      },
    ],
  },
  {
    slug: 'transmission',
    nameFa: 'تجهیزات انتقال مخابراتی',
    nameEn: 'Transmission Equipment',
    subcategories: [
      {
        slug: 'transport-platforms',
        nameFa: 'پلتفرم‌های ترانسپورت',
        nameEn: 'Transport Platforms',
        includes: ['SDH', 'PDH', 'OTN', 'DWDM Platform', 'CWDM Platform', 'Packet Transport', 'Ethernet Transport', 'MPLS', 'IP-MPLS'],
      },
      {
        slug: 'microwave-transmission',
        nameFa: 'مایکروویو ترانسمیشن',
        nameEn: 'Microwave Transmission',
        includes: ['Microwave Transmission Equipment'],
      },
    ],
  },
  {
    slug: 'satellite-vsat',
    nameFa: 'ارتباطات ماهواره‌ای',
    nameEn: 'Satellite / VSAT',
    subcategories: [
      {
        slug: 'vsat-satellite-terminals',
        nameFa: 'ترمینال و آنتن ماهواره‌ای',
        nameEn: 'VSAT & Satellite Terminals',
        includes: ['VSAT Terminal', 'آنتن ماهواره‌ای (Ku/C/Ka Band)', 'BUC', 'LNB'],
      },
      {
        slug: 'satellite-modems',
        nameFa: 'مودم ماهواره‌ای',
        nameEn: 'Satellite Modems/Routers',
        includes: ['Satellite Modem', 'Satellite Router'],
      },
    ],
  },
  {
    slug: 'rf-antenna',
    nameFa: 'تجهیزات رادیویی و آنتن',
    nameEn: 'RF & Antenna',
    subcategories: [
      {
        slug: 'antennas',
        nameFa: 'آنتن‌ها',
        nameEn: 'Antennas',
        includes: ['آنتن سکتور', 'آنتن امنی', 'آنتن دیش/پارابولیک', 'آنتن داخلی', 'آنتن Outdoor'],
      },
      {
        slug: 'rf-cable-connectors',
        nameFa: 'کابل و کانکتور RF',
        nameEn: 'RF Cable & Connectors',
        includes: ['RF Cable', 'Feeder Cable', 'RF Connector', 'Jumper Cable'],
      },
      {
        slug: 'signal-combining-splitting',
        nameFa: 'ترکیب و تقسیم سیگنال',
        nameEn: 'Signal Combining & Splitting',
        includes: ['Duplexer', 'Combiner', 'RF Splitter'],
      },
      {
        slug: 'rf-amplifiers',
        nameFa: 'آمپلی‌فایر RF',
        nameEn: 'RF Amplifiers',
        includes: ['RF Amplifier'],
      },
    ],
  },
  {
    slug: 'tower-structure-grounding',
    nameFa: 'دکل، سازه و ارتینگ',
    nameEn: 'Tower, Structure & Grounding',
    subcategories: [
      {
        slug: 'towers-structures',
        nameFa: 'دکل و سازه',
        nameEn: 'Towers & Structures',
        includes: ['دکل مخابراتی (Lattice Tower)', 'مونوپل', 'سازه نصب آنتن (Pole Mount)'],
      },
      {
        slug: 'grounding-lightning-protection',
        nameFa: 'ارتینگ و صاعقه‌گیر',
        nameEn: 'Grounding & Lightning Protection',
        includes: ['سیستم ارتینگ (Grounding Kit)', 'صاعقه‌گیر (Lightning Protector)'],
      },
      {
        slug: 'cable-support-structures',
        nameFa: 'سازه‌های نگهدارنده کابل',
        nameEn: 'Cable Support Structures',
        includes: ['نردبان کابل / کیبل بریج (Cable Ladder/Bridge)'],
      },
    ],
  },
  {
    slug: 'power-energy',
    nameFa: 'برق و انرژی مخابرات',
    nameEn: 'Power & Energy',
    subcategories: [
      {
        slug: 'rectifiers-chargers',
        nameFa: 'رکتیفایر و شارژر',
        nameEn: 'Rectifiers & Chargers',
        includes: ['رکتیفایر', 'شارژر صنعتی'],
      },
      {
        slug: 'backup-power',
        nameFa: 'پشتیبان برق',
        nameEn: 'Backup Power',
        includes: ['UPS', 'اینورتر'],
      },
      {
        slug: 'batteries',
        nameFa: 'باتری',
        nameEn: 'Batteries',
        includes: ['باتری (VRLA/Li-ion)', 'Battery Cabinet'],
      },
      {
        slug: 'power-distribution',
        nameFa: 'توزیع برق',
        nameEn: 'Power Distribution',
        includes: ['Power Distribution Unit (PDU)', 'DC Power System', 'AC Distribution'],
      },
      {
        slug: 'energy-monitoring',
        nameFa: 'مانیتورینگ انرژی',
        nameEn: 'Energy Monitoring',
        includes: ['Remote Energy Monitoring System'],
      },
    ],
  },
  {
    slug: 'shelter-outdoor-cabinet',
    nameFa: 'شلتر و کابینت Outdoor',
    nameEn: 'Shelter & Outdoor Cabinet',
    subcategories: [
      {
        slug: 'shelters-cabinets',
        nameFa: 'شلتر و کابینت',
        nameEn: 'Shelters & Cabinets',
        includes: ['شلتر مخابراتی', 'کابینت Outdoor'],
      },
      {
        slug: 'cabinet-cooling-monitoring',
        nameFa: 'تهویه و مانیتورینگ کابینت',
        nameEn: 'Cabinet Cooling & Monitoring',
        includes: ['سیستم تهویه/کولینگ کابینت', 'Environmental Monitoring (دما/رطوبت/نفوذ آب)'],
      },
    ],
  },
  {
    slug: 'rack-datacenter-infra',
    nameFa: 'رک و زیرساخت دیتاسنتر',
    nameEn: 'Rack & Data Center Infrastructure',
    subcategories: [
      {
        slug: 'racks-cabinets',
        nameFa: 'رک و کابینت',
        nameEn: 'Racks & Cabinets',
        includes: ['رک ایستاده', 'رک دیواری', 'Server Cabinet', 'Rack Accessories'],
      },
      {
        slug: 'cable-management',
        nameFa: 'مدیریت کابل',
        nameEn: 'Cable Management',
        includes: ['Cable Manager'],
      },
      {
        slug: 'datacenter-power-cooling',
        nameFa: 'برق و خنک‌کنندگی دیتاسنتر',
        nameEn: 'Data Center Power & Cooling',
        includes: ['PDU Rack', 'Cooling Equipment (CRAC/In-row)', 'Raised Floor'],
      },
      {
        slug: 'kvm',
        nameFa: 'KVM',
        nameEn: 'KVM',
        includes: ['KVM Switch'],
      },
    ],
  },
  {
    slug: 'servers-storage',
    nameFa: 'سرور و ذخیره‌سازی',
    nameEn: 'Servers & Storage',
    subcategories: [
      {
        slug: 'servers',
        nameFa: 'سرورها',
        nameEn: 'Servers',
        includes: ['Rack Server', 'Blade Server', 'Tower Server'],
      },
      {
        slug: 'storage',
        nameFa: 'ذخیره‌سازی',
        nameEn: 'Storage',
        includes: ['NAS', 'SAN', 'Storage Array', 'Enterprise SSD', 'Enterprise HDD', 'RAID Controller'],
      },
    ],
  },
  {
    slug: 'network-security',
    nameFa: 'امنیت شبکه',
    nameEn: 'Network Security',
    subcategories: [
      {
        slug: 'firewalls-security-gateways',
        nameFa: 'فایروال و گیت‌وی امنیتی',
        nameEn: 'Firewalls & Security Gateways',
        includes: ['Firewall Appliance', 'VPN Gateway'],
      },
      {
        slug: 'intrusion-detection-prevention',
        nameFa: 'تشخیص و پیشگیری نفوذ',
        nameEn: 'Intrusion Detection & Prevention',
        includes: ['IDS', 'IPS'],
      },
      {
        slug: 'access-control-auth',
        nameFa: 'کنترل دسترسی و احراز هویت',
        nameEn: 'Access Control & Authentication',
        includes: ['NAC', 'WAF', 'Authentication Server'],
      },
    ],
  },
  {
    slug: 'voip-telephony',
    nameFa: 'تلفنی و VoIP',
    nameEn: 'VoIP & Telephony',
    subcategories: [
      {
        slug: 'pbx-systems',
        nameFa: 'سیستم‌های PBX',
        nameEn: 'PBX Systems',
        includes: ['PBX', 'IP-PBX', 'Session Border Controller (SBC)'],
      },
      {
        slug: 'voice-devices',
        nameFa: 'دستگاه‌های صوتی',
        nameEn: 'Voice Devices',
        includes: ['Voice Gateway', 'IP Phone'],
      },
    ],
  },
  {
    slug: 'iot-smart-devices',
    nameFa: 'اینترنت اشیا',
    nameEn: 'IoT (Internet of Things)',
    subcategories: [
      {
        slug: 'iot-gateways',
        nameFa: 'گیت‌وی‌های IoT',
        nameEn: 'IoT Gateways',
        includes: ['IoT Gateway', 'Edge Gateway', 'LoRa Gateway'],
      },
      {
        slug: 'iot-sensors-devices',
        nameFa: 'سنسور و دستگاه‌های IoT',
        nameEn: 'IoT Sensors & Devices',
        includes: ['IoT Sensor', 'Smart Meter', 'NB-IoT Device', 'Industrial IoT'],
      },
    ],
  },
  {
    slug: 'test-measurement',
    nameFa: 'تجهیزات تست و اندازه‌گیری',
    nameEn: 'Test & Measurement',
    subcategories: [
      {
        slug: 'optical-test-equipment',
        nameFa: 'تست نوری',
        nameEn: 'Optical Test Equipment',
        includes: ['OTDR', 'Optical Power Meter', 'Light Source', 'Fusion Splicer', 'Fiber Identifier'],
      },
      {
        slug: 'rf-network-test-equipment',
        nameFa: 'تست RF و شبکه',
        nameEn: 'RF & Network Test Equipment',
        includes: ['Spectrum Analyzer', 'Network Analyzer', 'Cable Tester', 'LAN Tester', 'RF Tester'],
      },
    ],
  },
];

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function countTaxonomy(categories = MARKETPLACE_CATEGORIES) {
  let subcategories = 0;
  for (const category of categories) {
    subcategories += category.subcategories.length;
  }
  return { categories: categories.length, subcategories };
}

async function seedMarketplaceCategories(prisma) {
  const categoriesBySlug = new Map();
  const subcategoriesBySlug = new Map();

  for (const [categoryIndex, category] of MARKETPLACE_CATEGORIES.entries()) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        nameFa: category.nameFa,
        nameEn: category.nameEn,
        status: 'ACTIVE',
        showInMenu: true,
        sortOrder: categoryIndex + 1,
      },
      create: {
        slug: category.slug,
        nameFa: category.nameFa,
        nameEn: category.nameEn,
        status: 'ACTIVE',
        showInMenu: true,
        sortOrder: categoryIndex + 1,
      },
    });
    categoriesBySlug.set(category.slug, savedCategory);

    for (const [subIndex, sub] of category.subcategories.entries()) {
      const subSlug = sub.slug || slugify(sub.nameEn);
      const savedSub = await prisma.subcategory.upsert({
        where: { slug: subSlug },
        update: {
          categoryId: savedCategory.id,
          nameFa: sub.nameFa,
          nameEn: sub.nameEn,
          status: 'ACTIVE',
          sortOrder: subIndex + 1,
        },
        create: {
          slug: subSlug,
          categoryId: savedCategory.id,
          nameFa: sub.nameFa,
          nameEn: sub.nameEn,
          status: 'ACTIVE',
          sortOrder: subIndex + 1,
        },
      });
      subcategoriesBySlug.set(subSlug, savedSub);
    }
  }

  return { categoriesBySlug, subcategoriesBySlug };
}

module.exports = {
  MARKETPLACE_CATEGORIES,
  slugify,
  countTaxonomy,
  seedMarketplaceCategories,
};
