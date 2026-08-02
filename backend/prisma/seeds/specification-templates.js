// =============================================================
// Specification Template Seeder
//
// For each Subcategory, creates:
//   1. A SpecificationTemplate (1:1 with subcategory)
//   2. SpecificationField records linked to that template
//
// Fields are defined locally (not referencing SpecificationLibraryField)
// with their own name/key/type/unit. Shared fields like "brand" or
// "weight" are repeated across templates — this is intentional so
// each template is self-contained.
//
// Idempotent: upserts on (subcategoryId) for template,
//             upserts on (templateId, key) for fields.
// =============================================================

// Common field definitions reused across templates.
// Each function returns an array of field descriptors.
const commonFields = {
  identification: () => [
    { name: 'برند', key: 'brand', type: 'TEXT', isRequired: true, sortOrder: 0 },
    { name: 'مدل', key: 'model', type: 'TEXT', isRequired: true, sortOrder: 1 },
    { name: 'کشور مبدأ', key: 'origin', type: 'SELECT', isRequired: false, sortOrder: 2, options: ['ایران', 'چین', 'آمریکا', 'آلمان', 'ژاپن', 'کره جنوبی', 'تایوان', 'سوئیس', 'سوئد', 'فرانسه', 'انگلیس', 'هند', 'ترکیه'] },
  ],
  physical: () => [
    { name: 'ابعاد', key: 'dimensions', type: 'TEXT', isRequired: false, sortOrder: 10, unit: 'میلی‌متر' },
    { name: 'وزن', key: 'weight', type: 'NUMBER', isRequired: false, sortOrder: 11, unit: 'کیلوگرم' },
    { name: 'رنگ', key: 'color', type: 'SELECT', isRequired: false, sortOrder: 12, options: ['مشکی', 'سفید', 'طوسی', 'سرمه‌ای', 'نقره‌ای'] },
    { name: 'جنس بدنه', key: 'body_material', type: 'SELECT', isRequired: false, sortOrder: 13, options: ['فلز', 'پلاستیک', 'آلومینیوم', 'استیل', 'ترکیبی'] },
  ],
  environmental: () => [
    { name: 'دمای کاری', key: 'operating_temperature', type: 'TEXT', isRequired: false, sortOrder: 20, unit: '°C' },
    { name: 'رطوبت مجاز', key: 'humidity', type: 'TEXT', isRequired: false, sortOrder: 21, unit: '%' },
    { name: 'درجه حفاظت IP', key: 'ip_rating', type: 'SELECT', isRequired: false, sortOrder: 22, options: ['IP20', 'IP54', 'IP55', 'IP65', 'IP66', 'IP67', 'IP68'] },
  ],
  electrical: () => [
    { name: 'توان مصرفی', key: 'power_consumption', type: 'NUMBER', isRequired: false, sortOrder: 30, unit: 'وات' },
    { name: 'ولتاژ ورودی', key: 'input_voltage', type: 'TEXT', isRequired: false, sortOrder: 31, unit: 'ولت' },
  ],
  general: () => [
    { name: 'استانداردها', key: 'standards', type: 'TEXT', isRequired: false, sortOrder: 40 },
    { name: 'گارانتی', key: 'warranty', type: 'TEXT', isRequired: false, sortOrder: 41 },
  ],
};

// ── Per-subcategory field definitions ─────────────────────────
// Key = subcategory slug, value = array of field descriptors.
// Fields from common groups are spread in at the start; domain-
// specific fields follow with higher sortOrder values.

const SUBCATEGORY_TEMPLATES = {
  // ── Wireline: Cable ────────────────────────────────────────
  'cable': {
    name: 'مشخصات فنی کابل',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع کابل', key: 'cable_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['فیبر نوری', 'مسی', 'کواکسیال', 'زوج به هم تابیده'] },
      { name: 'تعداد کور/زوج', key: 'fiber_or_pair_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'قطر کابل', key: 'cable_diameter', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'میلی‌متر' },
      { name: 'نوع روکش', key: 'jacket_type', type: 'SELECT', isRequired: false, sortOrder: 8, options: ['PVC', 'LSZH', 'PE', 'MDPE', 'HDPE'] },
      { name: 'نوع نصب', key: 'installation_type', type: 'SELECT', isRequired: false, sortOrder: 9, options: ['هوایی', 'زیرزمینی', 'داخلی', 'زیرآبی'] },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Wireline: Connectors ───────────────────────────────────
  'connectors-terminations': {
    name: 'مشخصات فنی کانکتور و اتصالات',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع کانکتور', key: 'connector_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['SC/APC', 'SC/UPC', 'LC/APC', 'LC/UPC', 'FC/APC', 'FC/UPC', 'ST', 'MPO', 'RJ45', 'N-Type', 'BNC'] },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'نوع فیبر', key: 'fiber_type', type: 'SELECT', isRequired: false, sortOrder: 7, options: ['SM (G.652D)', 'SM (G.657A)', 'MM (OM3)', 'MM (OM4)'] },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Wireline: Splicing ─────────────────────────────────────
  'splicing-permanent-joints': {
    name: 'مشخصات فنی اسپلایس و اتصال دائم',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع اتصال', key: 'splice_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['فیوژن', 'مکانیکی', 'Pre-polished'] },
      { name: 'تعداد اسلایس', key: 'splice_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'تعداد فیبر', key: 'fiber_count', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Wireline: Distribution ─────────────────────────────────
  'distribution-boxes-panels': {
    name: 'مشخصات فنی جعبه و پنل توزیع',
    fields: [
      ...commonFields.identification(),
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 5 },
      { name: 'نوع پچ پنل', key: 'patch_panel_type', type: 'SELECT', isRequired: false, sortOrder: 6, options: ['فیبر', 'مسی', 'ترکیبی'] },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Wireline: Passive Optical ──────────────────────────────
  'passive-optical-components': {
    name: 'مشخصات فنی قطعات پسیو نوری',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع قطعه', key: 'component_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Splitters', 'WDM', 'آتننویتور', 'Media Converter'] },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'نوع تقسیم', key: 'split_ratio', type: 'SELECT', isRequired: false, sortOrder: 7, options: ['1×2', '1×4', '1×8', '1×16', '1×32', '1×64'] },
      { name: 'نوع فیبر', key: 'fiber_type', type: 'SELECT', isRequired: false, sortOrder: 8, options: ['SM', 'MM'] },
      { name: 'افت تضعیف', key: 'insertion_loss', type: 'NUMBER', isRequired: false, sortOrder: 9, unit: 'dB' },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Wireline: Microduct ────────────────────────────────────
  'microduct-ducting': {
    name: 'مشخصات فنی میکروداکت و لوله‌کشی',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع لوله', key: 'duct_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['میکروداکت', 'باندل', 'HDPE', 'ساب‌داکت'] },
      { name: 'قطر داخلی', key: 'inner_diameter', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'میلی‌متر' },
      { name: 'قطر خارجی', key: 'outer_diameter', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'میلی‌متر' },
      { name: 'طول', key: 'length', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'متر' },
      { name: 'نوع روکش', key: 'jacket_type', type: 'SELECT', isRequired: false, sortOrder: 9, options: ['HDPE', 'PVC', 'MDPE'] },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Wireline: Underground/Aerial ───────────────────────────
  'underground-aerial-infrastructure': {
    name: 'مشخصات فنی زیرساخت زیرزمینی و هوایی',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['چاهک', 'اتاقک کابل', 'تیر', 'سیم مسنجر', 'کلمپ', 'انکر', 'براکت'] },
      { name: 'ارتفاع/طول', key: 'height_or_length', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'متر' },
      { name: 'بار باد', key: 'wind_load', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'kg/m²' },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Wireline: FTTH/GPON ────────────────────────────────────
  'ftth-gpon-active-equipment': {
    name: 'مشخصات فنی تجهیزات FTTH/GPON/EPON',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['OLT', 'ONU', 'ONT', 'فیس‌پلیت', 'Fiber Socket'] },
      { name: 'تعداد پورت PON', key: 'pon_port_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'پهنای باند', key: 'bandwidth', type: 'TEXT', isRequired: false, sortOrder: 7, unit: 'Gbps' },
      { name: 'پورت اترنت', key: 'ethernet_ports', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      { name: 'PoE', key: 'poe_support', type: 'SELECT', isRequired: false, sortOrder: 9, options: ['ندارد', 'PoE', 'PoE+', 'PoE++'] },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Wireline: Installation Tools ───────────────────────────
  'installation-tools': {
    name: 'مشخصات فنی ابزار و تجهیزات نصب',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع ابزار', key: 'tool_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['کاتر', 'استریپر', 'کلیور', 'وینچ', 'بلوئینگ', 'داکت رودر'] },
      { name: 'نوع فیبر سازگار', key: 'compatible_fiber', type: 'SELECT', isRequired: false, sortOrder: 6, options: ['SM', 'MM', 'هر دو'] },
      ...commonFields.physical(),
      ...commonFields.electrical(),
      ...commonFields.general(),
    ],
  },

  // ── Network: Switching/Routing ─────────────────────────────
  'switching-routing': {
    name: 'مشخصات فنی سوئیچ و روتر',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['سوئیچ', 'روتر', 'Gateway', 'Load Balancer'] },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'سرعت پورت', key: 'port_speed', type: 'SELECT', isRequired: false, sortOrder: 7, options: ['10/100 Mbps', '100/1000 Mbps', '1 Gbps', '10 Gbps', '25 Gbps', '40 Gbps', '100 Gbps'] },
      { name: 'ظرفیت سوئیچینگ', key: 'switching_capacity', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'Gbps' },
      { name: 'PoE', key: 'poe_support', type: 'SELECT', isRequired: false, sortOrder: 9, options: ['ندارد', 'PoE', 'PoE+', 'PoE++'] },
      { name: 'RAM', key: 'ram', type: 'NUMBER', isRequired: false, sortOrder: 10, unit: 'GB' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Network: Wireless ──────────────────────────────────────
  'wireless-networking': {
    name: 'مشخصات فنی شبکه بی‌سیم',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['اکسس پوینت', 'کنترلر وایرلس'] },
      { name: 'استاندارد بی‌سیم', key: 'wireless_standard', type: 'SELECT', isRequired: false, sortOrder: 6, options: ['Wi-Fi 4', 'Wi-Fi 5', 'Wi-Fi 6', 'Wi-Fi 6E', 'Wi-Fi 7'] },
      { name: 'فرکانس', key: 'frequency_bands', type: 'MULTI_SELECT', isRequired: false, sortOrder: 7, options: ['2.4 GHz', '5 GHz', '6 GHz'] },
      { name: 'حداکثر کاربر', key: 'max_clients', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      { name: 'پورت اترنت', key: 'ethernet_ports', type: 'NUMBER', isRequired: false, sortOrder: 9 },
      { name: 'PoE', key: 'poe_support', type: 'SELECT', isRequired: false, sortOrder: 10, options: ['ندارد', 'PoE', 'PoE+', 'PoE++'] },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Network: Modules ───────────────────────────────────────
  'modules-transceivers': {
    name: 'مشخصات فنی ماژول و ترنسیور',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع ماژول', key: 'module_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['SFP', 'SFP+', 'SFP28', 'QSFP+', 'QSFP28', 'QSFP-DD', 'XFP', 'CFP'] },
      { name: 'نوع فیبر', key: 'fiber_type', type: 'SELECT', isRequired: false, sortOrder: 6, options: ['SMF', 'MMF', 'هر دو'] },
      { name: 'سرعت انتقال', key: 'transfer_speed', type: 'SELECT', isRequired: false, sortOrder: 7, options: ['1 Gbps', '10 Gbps', '25 Gbps', '40 Gbps', '100 Gbps'] },
      { name: 'طول موج', key: 'wavelength', type: 'TEXT', isRequired: false, sortOrder: 8, unit: 'nm' },
      { name: 'حداکثر برد', key: 'max_distance', type: 'TEXT', isRequired: false, sortOrder: 9 },
      { name: 'DDM/DOM', key: 'ddm_support', type: 'BOOLEAN', isRequired: false, sortOrder: 10 },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Network: Modem/PoE ─────────────────────────────────────
  'modem-poe': {
    name: 'مشخصات فنی مودم و PoE',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['مودم', 'PoE Injector', 'PoE Switch'] },
      { name: 'توان PoE خروجی', key: 'poe_output_power', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'وات' },
      { name: 'تعداد پورت PoE', key: 'poe_port_count', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Network: Structured LAN ────────────────────────────────
  'structured-lan-cabling': {
    name: 'مشخصات فنی کابل‌کشی ساختاریافته LAN',
    fields: [
      ...commonFields.identification(),
      { name: 'دسته کابل', key: 'cable_category', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Cat5e', 'Cat6', 'Cat6a', 'Cat7', 'Cat8'] },
      { name: 'نوع کانکتور', key: 'connector_type', type: 'SELECT', isRequired: false, sortOrder: 6, options: ['RJ45', 'Keystone'] },
      { name: 'طول کابل', key: 'cable_length', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'متر' },
      { name: 'نوع روکش', key: 'jacket_type', type: 'SELECT', isRequired: false, sortOrder: 8, options: ['PVC', 'LSZH', 'CM', 'CMP'] },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Mobile: Radio Access ───────────────────────────────────
  'radio-access-units': {
    name: 'مشخصات فنی واحدهای رادیویی دسترسی',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['BTS', 'eNodeB', 'gNodeB', 'Small Cell', 'RRU', 'BBU', 'DU', 'CU'] },
      { name: 'فرکانس کاری', key: 'operating_frequency', type: 'TEXT', isRequired: false, sortOrder: 6, unit: 'MHz' },
      { name: 'پهنای باند', key: 'bandwidth', type: 'TEXT', isRequired: false, sortOrder: 7, unit: 'MHz' },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      { name: 'توان خروجی', key: 'output_power', type: 'NUMBER', isRequired: false, sortOrder: 9, unit: 'وات' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Mobile: Backhaul ───────────────────────────────────────
  'backhaul-microwave': {
    name: 'مشخصات فنی بک‌هال و مایکروویو',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Microwave Radio', 'Backhaul Equipment'] },
      { name: 'فرکانس کاری', key: 'operating_frequency', type: 'TEXT', isRequired: false, sortOrder: 6, unit: 'GHz' },
      { name: 'ظرفیت کانال', key: 'channel_capacity', type: 'TEXT', isRequired: false, sortOrder: 7, unit: 'Mbps' },
      { name: 'تعداد کانال', key: 'channel_count', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      { name: 'Modulation', key: 'modulation', type: 'TEXT', isRequired: false, sortOrder: 9 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Mobile: Core ───────────────────────────────────────────
  'core-synchronization': {
    name: 'مشخصات فنی هسته شبکه و سنکرونایزیشن',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Mobile Core', 'Synchronization'] },
      { name: 'پروتکل سنکرونایزیشن', key: 'sync_protocol', type: 'MULTI_SELECT', isRequired: false, sortOrder: 6, options: ['GPS', 'PTP', 'NTP', 'SyncE'] },
      { name: 'پورت اترنت', key: 'ethernet_ports', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      { name: 'ظرفیت', key: 'capacity', type: 'TEXT', isRequired: false, sortOrder: 8 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Transmission: Transport ────────────────────────────────
  'transport-platforms': {
    name: 'مشخصات فنی پلتفرم‌های ترانسپورت',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع پلتفرم', key: 'platform_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['SDH', 'PDH', 'OTN', 'DWDM', 'CWDM', 'Packet Transport', 'Ethernet Transport', 'MPLS', 'IP-MPLS'] },
      { name: 'ظرفیت انتقال', key: 'transmission_capacity', type: 'TEXT', isRequired: false, sortOrder: 6 },
      { name: 'تعداد کانال', key: 'channel_count', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      { name: 'تعداد درگاه سرویس', key: 'service_port_count', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Transmission: Microwave ────────────────────────────────
  'microwave-transmission': {
    name: 'مشخصات فنی مایکروویو ترانسمیشن',
    fields: [
      ...commonFields.identification(),
      { name: 'فرکانس کاری', key: 'operating_frequency', type: 'TEXT', isRequired: false, sortOrder: 5, unit: 'GHz' },
      { name: 'ظرفیت', key: 'capacity', type: 'TEXT', isRequired: false, sortOrder: 6, unit: 'Mbps' },
      { name: 'Modulation', key: 'modulation', type: 'TEXT', isRequired: false, sortOrder: 7 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Satellite: VSAT ────────────────────────────────────────
  'vsat-satellite-terminals': {
    name: 'مشخصات فنی ترمینال و آنتن ماهواره‌ای',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['VSAT Terminal', 'آنتن ماهواره‌ای', 'BUC', 'LNB'] },
      { name: 'قطر آنتن', key: 'antenna_diameter', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'سانتی‌متر' },
      { name: 'باند فرکانسی', key: 'frequency_band', type: 'SELECT', isRequired: false, sortOrder: 7, options: ['Ku Band', 'C Band', 'Ka Band', 'X Band'] },
      { name: 'بهره آنتن', key: 'antenna_gain', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'dBi' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Satellite: Modems ──────────────────────────────────────
  'satellite-modems': {
    name: 'مشخصات فنی مودم ماهواره‌ای',
    fields: [
      ...commonFields.identification(),
      { name: 'سرعت دانلود', key: 'download_speed', type: 'TEXT', isRequired: false, sortOrder: 5, unit: 'Mbps' },
      { name: 'سرعت آپلود', key: 'upload_speed', type: 'TEXT', isRequired: false, sortOrder: 6, unit: 'Mbps' },
      { name: 'پورت اترنت', key: 'ethernet_ports', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── RF: Antennas ───────────────────────────────────────────
  'antennas': {
    name: 'مشخصات فنی آنتن‌ها',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع آنتن', key: 'antenna_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['سکتور', 'اومنی', 'دیش', 'پارابولیک', 'داخلی', 'Outdoor'] },
      { name: 'بهره', key: 'gain', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'dBi' },
      { name: 'فرکانس کاری', key: 'operating_frequency', type: 'TEXT', isRequired: false, sortOrder: 7, unit: 'MHz' },
      { name: 'پهنای باند', key: 'bandwidth', type: 'TEXT', isRequired: false, sortOrder: 8, unit: 'MHz' },
      { name: 'پلاریزاسیون', key: 'polarization', type: 'SELECT', isRequired: false, sortOrder: 9, options: ['خطی عمودی', 'خطی افقی', 'دایروی', 'بیضوی'] },
      { name: 'VSWR', key: 'vswr', type: 'NUMBER', isRequired: false, sortOrder: 10 },
      { name: 'زاویه پرتو', key: 'beamwidth', type: 'NUMBER', isRequired: false, sortOrder: 11, unit: 'درجه' },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── RF: Cable/Connectors ───────────────────────────────────
  'rf-cable-connectors': {
    name: 'مشخصات فنی کابل و کانکتور RF',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع کانکتور', key: 'connector_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['N-Type', 'BNC', 'SMA', 'TNC', '7/16 DIN', '4.3-10'] },
      { name: 'نوع کابل', key: 'cable_type', type: 'SELECT', isRequired: false, sortOrder: 6, options: ['Feeder', 'Jumper', 'LMR'] },
      { name: 'قطر کابل', key: 'cable_diameter', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'اینچ' },
      { name: 'طول', key: 'length', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'متر' },
      { name: 'افت تضعیف', key: 'insertion_loss', type: 'NUMBER', isRequired: false, sortOrder: 9, unit: 'dB' },
      { name: 'VSWR', key: 'vswr', type: 'NUMBER', isRequired: false, sortOrder: 10 },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── RF: Signal Combining/Splitting ─────────────────────────
  'signal-combining-splitting': {
    name: 'مشخصات فنی ترکیب و تقسیم سیگنال',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Duplexer', 'Combiner', 'Splitter'] },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'فرکانس کاری', key: 'operating_frequency', type: 'TEXT', isRequired: false, sortOrder: 7, unit: 'MHz' },
      { name: 'افت تضعیف', key: 'insertion_loss', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'dB' },
      { name: 'جداسازی', key: 'isolation', type: 'NUMBER', isRequired: false, sortOrder: 9, unit: 'dB' },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── RF: Amplifiers ─────────────────────────────────────────
  'rf-amplifiers': {
    name: 'مشخصات فنی آمپلی‌فایر RF',
    fields: [
      ...commonFields.identification(),
      { name: 'فرکانس کاری', key: 'operating_frequency', type: 'TEXT', isRequired: false, sortOrder: 5, unit: 'MHz' },
      { name: 'توان خروجی', key: 'output_power', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'وات' },
      { name: 'بهره', key: 'gain', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'dB' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Tower: Structures ──────────────────────────────────────
  'towers-structures': {
    name: 'مشخصات فنی دکل و سازه',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع سازه', key: 'structure_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Lattice Tower', 'Monopole', 'Pole Mount', 'Self-supporting'] },
      { name: 'ارتفاع', key: 'height', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'متر' },
      { name: 'بار باد', key: 'wind_load', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'kg/m²' },
      { name: 'بار یخ', key: 'ice_load', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'mm' },
      { name: 'ظرفیت بار', key: 'load_capacity', type: 'NUMBER', isRequired: false, sortOrder: 9, unit: 'kg' },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Tower: Grounding ───────────────────────────────────────
  'grounding-lightning-protection': {
    name: 'مشخصات فنی ارتینگ و صاعقه‌گیر',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['سیستم ارتینگ', 'صاعقه‌گیر'] },
      { name: 'مقاومت ارتینگ', key: 'grounding_resistance', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'اهم' },
      { name: 'جریان تخلیه', key: 'discharge_current', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'kA' },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Tower: Cable Support ───────────────────────────────────
  'cable-support-structures': {
    name: 'مشخصات فنی سازه‌های نگهدارنده کابل',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع سازه', key: 'structure_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Cable Ladder', 'Cable Tray', 'Cable Bridge'] },
      { name: 'عرض', key: 'width', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'میلی‌متر' },
      { name: 'طول', key: 'length', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'متر' },
      { name: 'جنس', key: 'material', type: 'SELECT', isRequired: false, sortOrder: 8, options: ['گالوانیزه', 'استیل', 'آلومینیوم'] },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Power: Rectifiers ──────────────────────────────────────
  'rectifiers-chargers': {
    name: 'مشخصات فنی رکتیفایر و شارژر',
    fields: [
      ...commonFields.identification(),
      { name: 'توان خروجی', key: 'output_power', type: 'NUMBER', isRequired: false, sortOrder: 5, unit: 'وات' },
      { name: 'ولتاژ خروجی', key: 'output_voltage', type: 'TEXT', isRequired: false, sortOrder: 6, unit: 'ولت' },
      { name: 'جریان خروجی', key: 'output_current', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'آمپر' },
      { name: 'تعداد ماژول', key: 'module_count', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      { name: 'بهره‌وری', key: 'efficiency', type: 'NUMBER', isRequired: false, sortOrder: 9, unit: '%' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Power: Backup ──────────────────────────────────────────
  'backup-power': {
    name: 'مشخصات فنی پشتیبان برق',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع UPS', key: 'ups_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Offline', 'Line-Interactive', 'Online'] },
      { name: 'توان خروجی', key: 'output_volt_ampere', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'VA' },
      { name: 'زمان پشتیبانی', key: 'backup_time', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'ساعت' },
      { name: 'تعداد خروجی', key: 'output_count', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      { name: 'زمان سوئیچ', key: 'switch_time', type: 'NUMBER', isRequired: false, sortOrder: 9, unit: 'ms' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Power: Batteries ───────────────────────────────────────
  'batteries': {
    name: 'مشخصات فنی باتری',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع باتری', key: 'battery_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['VRLA', 'Li-ion', 'LiFePO4', 'NiMH'] },
      { name: 'ظرفیت', key: 'capacity', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'Ah' },
      { name: 'ولتاژ', key: 'voltage', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'ولت' },
      { name: 'عمر مفید', key: 'lifespan', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'سال' },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Power: Distribution ────────────────────────────────────
  'power-distribution': {
    name: 'مشخصات فنی توزیع برق',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['PDU', 'DC Power System', 'AC Distribution'] },
      { name: 'تعداد خروجی', key: 'output_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'توان کل', key: 'total_power', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'وات' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Power: Monitoring ──────────────────────────────────────
  'energy-monitoring': {
    name: 'مشخصات فنی مانیتورینگ انرژی',
    fields: [
      ...commonFields.identification(),
      { name: 'تعداد کانال', key: 'channel_count', type: 'NUMBER', isRequired: false, sortOrder: 5 },
      { name: 'دقت اندازه‌گیری', key: 'accuracy', type: 'TEXT', isRequired: false, sortOrder: 6, unit: '%' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Shelter: Cabinets ──────────────────────────────────────
  'shelters-cabinets': {
    name: 'مشخصات فنی شلتر و کابینت',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['شلتر مخابراتی', 'کابینت Outdoor'] },
      { name: 'اندازه رک', key: 'rack_size', type: 'TEXT', isRequired: false, sortOrder: 6, unit: 'U' },
      { name: 'عمق', key: 'depth', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'میلی‌متر' },
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Shelter: Cooling ───────────────────────────────────────
  'cabinet-cooling-monitoring': {
    name: 'مشخصات فنی تهویه و مانیتورینگ کابینت',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع خنک‌کننده', key: 'cooling_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['فن', 'کولر', 'Heat Exchanger'] },
      { name: 'ظرفیت خنک‌کننده', key: 'cooling_capacity', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'BTU' },
      { name: 'سنسورها', key: 'sensors', type: 'MULTI_SELECT', isRequired: false, sortOrder: 7, options: ['دما', 'رطوبت', 'نفوذ آب', 'دود'] },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Rack: Cabinets ─────────────────────────────────────────
  'racks-cabinets': {
    name: 'مشخصات فنی رک و کابینت',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع رک', key: 'rack_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['ایستاده', 'دیواری', 'Server Cabinet'] },
      { name: 'ارتفاع', key: 'height', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'U' },
      { name: 'عرض', key: 'width', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'میلی‌متر' },
      { name: 'عمق', key: 'depth', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'میلی‌متر' },
      { name: 'حداکثر بار', key: 'max_load', type: 'NUMBER', isRequired: false, sortOrder: 9, unit: 'kg' },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Rack: Cable Management ─────────────────────────────────
  'cable-management': {
    name: 'مشخصات فنی مدیریت کابل',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع', key: 'product_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Cable Manager', 'Patch Panel', 'Cable Ring'] },
      { name: 'طول', key: 'length', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'میلی‌متر' },
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Rack: Datacenter Power/Cooling ─────────────────────────
  'datacenter-power-cooling': {
    name: 'مشخصات فنی برق و خنک‌کنندگی دیتاسنتر',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['PDU Rack', 'CRAC', 'Raised Floor'] },
      { name: 'توان کل', key: 'total_power', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'kW' },
      { name: 'تعداد خروجی', key: 'output_count', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Rack: KVM ──────────────────────────────────────────────
  'kvm': {
    name: 'مشخصات فنی KVM',
    fields: [
      ...commonFields.identification(),
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 5 },
      { name: 'تعداد کاربر', key: 'user_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'نوع اتصال', key: 'connection_type', type: 'SELECT', isRequired: false, sortOrder: 7, options: ['Cat5', 'Cat6', 'Direct'] },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Servers ────────────────────────────────────────────────
  'servers': {
    name: 'مشخصات فنی سرورها',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع سرور', key: 'server_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Rack Server', 'Blade Server', 'Tower Server'] },
      { name: 'پردازنده', key: 'processor', type: 'TEXT', isRequired: false, sortOrder: 6 },
      { name: 'تعداد سوکت', key: 'socket_count', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      { name: ' RAM', key: 'ram', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'GB' },
      { name: 'تعداد درایو', key: 'drive_bays', type: 'NUMBER', isRequired: false, sortOrder: 9 },
      { name: 'تعداد پورت شبکه', key: 'network_ports', type: 'NUMBER', isRequired: false, sortOrder: 10 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Storage ────────────────────────────────────────────────
  'storage': {
    name: 'مشخصات فنی ذخیره‌سازی',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع ذخیره‌سازی', key: 'storage_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['NAS', 'SAN', 'Storage Array', 'SSD', 'HDD', 'RAID Controller'] },
      { name: 'ظرفیت کل', key: 'total_capacity', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'TB' },
      { name: 'تعداد درایو', key: 'drive_bays', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      { name: 'RAID', key: 'raid_levels', type: 'MULTI_SELECT', isRequired: false, sortOrder: 8, options: ['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10'] },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 9 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Security: Firewalls ────────────────────────────────────
  'firewalls-security-gateways': {
    name: 'مشخصات فنی فایروال و گیت‌وی امنیتی',
    fields: [
      ...commonFields.identification(),
      { name: 'THROUGHPUT فایروال', key: 'firewall_throughput', type: 'NUMBER', isRequired: false, sortOrder: 5, unit: 'Gbps' },
      { name: 'THROUGHPUT IPS', key: 'ips_throughput', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'Gbps' },
      { name: 'حداکثر VPN', key: 'max_vpn_tunnels', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      { name: 'حداکثر اتصال', key: 'max_connections', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 9 },
      { name: 'پروتکل VPN', key: 'vpn_protocols', type: 'MULTI_SELECT', isRequired: false, sortOrder: 10, options: ['IPSec', 'SSL', 'L2TP', 'WireGuard'] },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Security: IDS/IPS ──────────────────────────────────────
  'intrusion-detection-prevention': {
    name: 'مشخصات فنی تشخیص و پیشگیری نفوذ',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['IDS', 'IPS'] },
      { name: 'THROUGHPUT', key: 'throughput', type: 'NUMBER', isRequired: false, sortOrder: 6, unit: 'Gbps' },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Security: Access Control ───────────────────────────────
  'access-control-auth': {
    name: 'مشخصات فنی کنترل دسترسی و احراز هویت',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['NAC', 'WAF', 'Authentication Server'] },
      { name: 'حداکثر کاربر', key: 'max_users', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'پروتکل احراز هویت', key: 'auth_protocols', type: 'MULTI_SELECT', isRequired: false, sortOrder: 7, options: ['RADIUS', 'LDAP', 'AD', 'TACACS+', 'MFA'] },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── VoIP: PBX ──────────────────────────────────────────────
  'pbx-systems': {
    name: 'مشخصات فنی سیستم‌های PBX',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع PBX', key: 'pbx_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['PBX', 'IP-PBX', 'SBC'] },
      { name: 'تعداد خطوط داخلی', key: 'extension_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'تعداد تماس همزمان', key: 'concurrent_calls', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      { name: 'پورت FXS', key: 'fxs_ports', type: 'NUMBER', isRequired: false, sortOrder: 8 },
      { name: 'پورت FXO', key: 'fxo_ports', type: 'NUMBER', isRequired: false, sortOrder: 9 },
      { name: 'SIP Trunk', key: 'sip_trunk', type: 'BOOLEAN', isRequired: false, sortOrder: 10 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── VoIP: Voice Devices ────────────────────────────────────
  'voice-devices': {
    name: 'مشخصات فنی دستگاه‌های صوتی',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع دستگاه', key: 'device_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Voice Gateway', 'IP Phone'] },
      { name: 'تعداد خط', key: 'line_count', type: 'NUMBER', isRequired: false, sortOrder: 6 },
      { name: 'پورت اترنت', key: 'ethernet_ports', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      { name: 'PoE', key: 'poe_support', type: 'SELECT', isRequired: false, sortOrder: 8, options: ['ندارد', 'PoE', 'PoE+'] },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── IoT: Gateways ──────────────────────────────────────────
  'iot-gateways': {
    name: 'مشخصات فنی گیت‌وی‌های IoT',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع گیت‌وی', key: 'gateway_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['IoT Gateway', 'Edge Gateway', 'LoRa Gateway'] },
      { name: 'پروتکل IoT', key: 'iot_protocols', type: 'MULTI_SELECT', isRequired: false, sortOrder: 6, options: ['LoRa', 'NB-IoT', 'Zigbee', 'BLE', 'Matter'] },
      { name: 'تعداد پورت', key: 'port_count', type: 'NUMBER', isRequired: false, sortOrder: 7 },
      { name: 'RAM', key: 'ram', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'GB' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── IoT: Sensors ───────────────────────────────────────────
  'iot-sensors-devices': {
    name: 'مشخصات فنی سنسور و دستگاه‌های IoT',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع دستگاه', key: 'device_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['IoT Sensor', 'Smart Meter', 'NB-IoT Device', 'Industrial IoT'] },
      { name: 'پروتکل ارتباطی', key: 'communication_protocol', type: 'MULTI_SELECT', isRequired: false, sortOrder: 6, options: ['LoRa', 'NB-IoT', 'Zigbee', 'BLE', 'Wi-Fi', 'MQTT'] },
      { name: 'مصرف انرژی', key: 'power_consumption', type: 'NUMBER', isRequired: false, sortOrder: 7, unit: 'mW' },
      { name: 'عمر باتری', key: 'battery_life', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'سال' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.environmental(),
      ...commonFields.general(),
    ],
  },

  // ── Test: Optical ──────────────────────────────────────────
  'optical-test-equipment': {
    name: 'مشخصات فنی تجهیزات تست نوری',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['OTDR', 'Optical Power Meter', 'Light Source', 'Fusion Splicer', 'Fiber Identifier'] },
      { name: 'بازه اندازه‌گیری', key: 'measurement_range', type: 'TEXT', isRequired: false, sortOrder: 6 },
      { name: 'دقت', key: 'accuracy', type: 'TEXT', isRequired: false, sortOrder: 7 },
      { name: 'حداکثر برد', key: 'max_range', type: 'NUMBER', isRequired: false, sortOrder: 8, unit: 'km' },
      { name: 'طول موج', key: 'wavelength', type: 'TEXT', isRequired: false, sortOrder: 9, unit: 'nm' },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },

  // ── Test: RF/Network ───────────────────────────────────────
  'rf-network-test-equipment': {
    name: 'مشخصات فنی تجهیزات تست RF و شبکه',
    fields: [
      ...commonFields.identification(),
      { name: 'نوع تجهیز', key: 'equipment_type', type: 'SELECT', isRequired: true, sortOrder: 5, options: ['Spectrum Analyzer', 'Network Analyzer', 'Cable Tester', 'LAN Tester'] },
      { name: 'بازه فرکانسی', key: 'frequency_range', type: 'TEXT', isRequired: false, sortOrder: 6, unit: 'MHz' },
      { name: 'بازه اندازه‌گیری', key: 'measurement_range', type: 'TEXT', isRequired: false, sortOrder: 7 },
      { name: 'دقت', key: 'accuracy', type: 'TEXT', isRequired: false, sortOrder: 8 },
      ...commonFields.electrical(),
      ...commonFields.physical(),
      ...commonFields.general(),
    ],
  },
};

async function seedSpecificationTemplates(prisma) {
  console.log('Seeding specification templates...');

  // Fetch all subcategories by slug
  const subcategories = await prisma.subcategory.findMany({
    select: { id: true, slug: true, nameFa: true },
  });

  const subcategoryBySlug = new Map(subcategories.map((s) => [s.slug, s]));

  let templateCount = 0;
  let fieldCount = 0;

  for (const [slug, templateDef] of Object.entries(SUBCATEGORY_TEMPLATES)) {
    const subcategory = subcategoryBySlug.get(slug);
    if (!subcategory) {
      console.warn(`  ⚠ Subcategory "${slug}" not found — skipping template`);
      continue;
    }

    // Upsert the template (one per subcategory)
    const template = await prisma.specificationTemplate.upsert({
      where: { subcategoryId: subcategory.id },
      update: { name: templateDef.name, isActive: true },
      create: {
        subcategoryId: subcategory.id,
        name: templateDef.name,
        isActive: true,
      },
    });
    templateCount++;

    // Upsert each field (unique on templateId + key)
    for (const field of templateDef.fields) {
      await prisma.specificationField.upsert({
        where: { templateId_key: { templateId: template.id, key: field.key } },
        update: {
          name: field.name,
          type: field.type,
          isRequired: field.isRequired,
          unit: field.unit || null,
          options: field.options || null,
          sortOrder: field.sortOrder,
        },
        create: {
          templateId: template.id,
          name: field.name,
          key: field.key,
          type: field.type,
          isRequired: field.isRequired,
          unit: field.unit || null,
          options: field.options || null,
          sortOrder: field.sortOrder,
        },
      });
      fieldCount++;
    }
  }

  console.log(`  ✓ ${templateCount} templates, ${fieldCount} fields`);
}

module.exports = {
  SUBCATEGORY_TEMPLATES,
  seedSpecificationTemplates,
};
