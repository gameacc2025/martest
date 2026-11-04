// =============================================================
// Specification Library Seed
//
// Seeds ~150 predefined global SpecificationLibraryField records.
// These are NOT attached to any template — they are a shared
// catalogue of reusable fields for product `attributes` autocomplete
// and for composing subcategory templates.
//
// Run:  node prisma/seed.js (invoked automatically)
// Idempotent: uses upsert on `slug` (unique).
// =============================================================

/**
 * Each entry: { title, slug, type, defaultUnit?, description? }
 *
 * type must match the SpecificationFieldType enum:
 *   TEXT | NUMBER | BOOLEAN | SELECT | MULTI_SELECT | DATE
 */
const LIBRARY_FIELDS = [
  // ── Electrical ──────────────────────────────────────────────
  { title: 'توان', slug: 'power', type: 'NUMBER', defaultUnit: 'وات', description: 'توان مصرفی دستگاه' },
  { title: 'توان مصرفی', slug: 'power-consumption', type: 'NUMBER', defaultUnit: 'وات', description: 'میزان توان مصرفی در حالت کاری' },
  { title: 'ولتاژ ورودی', slug: 'input-voltage', type: 'TEXT', defaultUnit: 'ولت', description: 'محدوده ولتاژ ورودی مجاز' },
  { title: 'ولتاژ خروجی', slug: 'output-voltage', type: 'TEXT', defaultUnit: 'ولت', description: 'ولتاژ خروجی دستگاه' },
  { title: 'جریان', slug: 'current', type: 'NUMBER', defaultUnit: 'آمپر', description: 'جریان مصرفی یا خروجی' },
  { title: 'فرکانس', slug: 'frequency', type: 'TEXT', defaultUnit: 'هرتز', description: 'فرکانس کاری' },
  { title: 'فرکانس کاری', slug: 'operating-frequency', type: 'TEXT', defaultUnit: 'هرتز', description: 'محدوده فرکانس کاری' },
  { title: 'ولتاژ DC', slug: 'dc-voltage', type: 'TEXT', defaultUnit: 'ولت', description: 'ولتاژ DC مورد نیاز' },
  { title: 'ولتاژ AC', slug: 'ac-voltage', type: 'TEXT', defaultUnit: 'ولت', description: 'ولتاژ AC مورد نیاز' },
  { title: 'توان خروجی', slug: 'output-power', type: 'NUMBER', defaultUnit: 'وات', description: 'توان خروجی دستگاه' },
  { title: 'بهره انرژی', slug: 'power-efficiency', type: 'NUMBER', defaultUnit: 'درصد', description: 'بهره‌وری انرژی' },
  { title: 'PF', slug: 'power-factor', type: 'NUMBER', defaultUnit: '', description: 'ضریب توان' },
  { title: 'THD', slug: 'thd', type: 'NUMBER', defaultUnit: 'درصد', description: ' اعوجاج هارمونیکی کل' },

  // ── Physical ────────────────────────────────────────────────
  { title: 'وزن', slug: 'weight', type: 'NUMBER', defaultUnit: 'کیلوگرم', description: 'وزن خالص دستگاه' },
  { title: 'ابعاد', slug: 'dimensions', type: 'TEXT', defaultUnit: 'میلی‌متر', description: 'ابعاد (طول × عرض × ارتفاع)' },
  { title: 'طول', slug: 'length', type: 'NUMBER', defaultUnit: 'متر', description: 'طول' },
  { title: 'عرض', slug: 'width', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'عرض' },
  { title: 'ارتفاع', slug: 'height', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'ارتفاع' },
  { title: 'قطر', slug: 'diameter', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'قطر' },
  { title: 'جنس بدنه', slug: 'body-material', type: 'SELECT', defaultUnit: '', description: 'جنس بدنه دستگاه', options: ['فلز', 'پلاستیک', 'آلومینیوم', 'استیل', 'ترکیبی'] },
  { title: 'رنگ', slug: 'color', type: 'SELECT', defaultUnit: '', description: 'رنگ دستگاه', options: ['مشکی', 'سفید', 'طوسی', 'سرمه‌ای', 'قرمز', 'سبز', 'آبی', 'نقره‌ای'] },
  { title: 'فرم فاکتور', slug: 'form-factor', type: 'SELECT', defaultUnit: '', description: 'فرم فاکتور دستگاه', options: ['rack-mount', 'desktop', 'wall-mount', 'standalone', 'blade', 'compact'] },
  { title: 'اندازه رک', slug: 'rack-size', type: 'SELECT', defaultUnit: 'یونیت', description: 'اندازه رک (ارتفاع در یونیت)', options: ['1U', '2U', '4U', '6U', '8U', '10U', '12U', '42U'] },
  { title: 'ضخامت', slug: 'thickness', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'ضخامت' },
  { title: 'قطر خارجی', slug: 'outer-diameter', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'قطر خارجی' },
  { title: 'قطر داخلی', slug: 'inner-diameter', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'قطر داخلی' },

  // ── Environmental ───────────────────────────────────────────
  { title: 'دمای کاری', slug: 'operating-temperature', type: 'TEXT', defaultUnit: 'درجه سانتیگراد', description: 'محدوده دمای کاری' },
  { title: 'دمای نگهداری', slug: 'storage-temperature', type: 'TEXT', defaultUnit: 'درجه سانتیگراد', description: 'محدوده دمای نگهداری' },
  { title: 'رطوبت مجاز', slug: 'humidity', type: 'TEXT', defaultUnit: 'درصد', description: 'محدوده رطوبت مجاز' },
  { title: 'درجه حفاظت IP', slug: 'ip-rating', type: 'SELECT', defaultUnit: '', description: 'کلاس حفاظت در برابر نفوذ', options: ['IP20', 'IP54', 'IP55', 'IP65', 'IP66', 'IP67', 'IP68'] },
  { title: 'ارتفاع کاری', slug: 'operating-altitude', type: 'NUMBER', defaultUnit: 'متر', description: 'حداکثر ارتفاع کاری' },
  { title: ' آلودگی صوتی', slug: 'noise-level', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'سطح صدا در حالت کاری' },
  { title: 'مقاومت در برابر لرزش', slug: 'vibration-resistance', type: 'TEXT', defaultUnit: '', description: 'مقاومت در برابر لرزش' },
  { title: 'مقاومت در برابر شوک', slug: 'shock-resistance', type: 'TEXT', defaultUnit: '', description: 'مقاومت در برابر شوک مکانیکی' },
  { title: 'استاندارد EMC', slug: 'emc-standard', type: 'TEXT', defaultUnit: '', description: 'استاندارد سازگاری الکترومغناطیسی' },

  // ── Fiber Optic ─────────────────────────────────────────────
  { title: 'طول موج', slug: 'wavelength', type: 'TEXT', defaultUnit: 'نانومتر', description: 'طول موج کاری' },
  { title: 'افت سیگنال', slug: 'insertion-loss', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'افت تضعیف (Insertion Loss)' },
  { title: 'بازتاب', slug: 'return-loss', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'بازتاب (Return Loss)' },
  { title: 'نوع فیبر', slug: 'fiber-type', type: 'SELECT', defaultUnit: '', description: 'نوع فیبر نوری', options: ['SM (G.652D)', 'SM (G.657A)', 'MM (OM2)', 'MM (OM3)', 'MM (OM4)', 'MM (OM5)', 'G.655', 'G.654'] },
  { title: 'تعداد کور', slug: 'fiber-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد کور فیبر' },
  { title: 'قطر کور', slug: 'core-diameter', type: 'NUMBER', defaultUnit: 'میکرومتر', description: 'قطر مغز فیبر' },
  { title: 'قطر کلاد', slug: 'cladding-diameter', type: 'NUMBER', defaultUnit: 'میکرومتر', description: 'قطر پوشش فیبر' },
  { title: 'نوع کانکتور', slug: 'connector-type', type: 'SELECT', defaultUnit: '', description: 'نوع کانکتور فیبر', options: ['SC/APC', 'SC/UPC', 'LC/APC', 'LC/UPC', 'FC/APC', 'FC/UPC', 'ST', 'MPO/MTP', 'E2000'] },
  { title: 'تعداد پورت', slug: 'port-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پورت‌ها' },
  { title: 'نسبة الانصاف', slug: 'uniformity', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'نسبة انصاف تقسیم‌کننده' },
  { title: 'نوع تقسیم‌کننده', slug: 'splitter-type', type: 'SELECT', defaultUnit: '', description: 'نوع تقسیم‌کننده نوری', options: ['PLC', 'FBT'] },
  { title: 'نسبت تقسیم', slug: 'split-ratio', type: 'SELECT', defaultUnit: '', description: 'نسبت تقسیم نوری', options: ['1×2', '1×4', '1×8', '1×16', '1×32', '1×64', '2×2', '2×4', '2×8', '2×16', '2×32'] },
  { title: 'بهره تقسیم', slug: 'splitting-loss', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'افت ناشی از تقسیم' },
  { title: 'حداکثر توان نوری', slug: 'max-optical-power', type: 'NUMBER', defaultUnit: 'دسی‌بل‌میلی‌وات', description: 'حداکثر توان نوری قابل تحمل' },

  // ── Cable ───────────────────────────────────────────────────
  { title: 'نوع کابل', slug: 'cable-type', type: 'SELECT', defaultUnit: '', description: 'نوع کابل', options: ['فیبر نوری', 'مسی', 'کواکسیال', 'زوج به هم تابیده', 'Cat5e', 'Cat6', 'Cat6a', 'Cat7', 'Cat8'] },
  { title: 'قطر کابل', slug: 'cable-diameter', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'قطر خارجی کابل' },
  { title: 'نوع روکش', slug: 'jacket-type', type: 'SELECT', defaultUnit: '', description: 'نوع روکش کابل', options: ['PVC', 'LSZH', 'PE', 'MDPE', 'HDPE', 'PU'] },
  { title: 'رنگ روکش', slug: 'jacket-color', type: 'TEXT', defaultUnit: '', description: 'رنگ روکش کابل' },
  { title: 'مقاومت کششی', slug: 'tensile-strength', type: 'NUMBER', defaultUnit: 'نیوتن', description: 'حداکثر نیروی کششی مجاز' },
  { title: 'شعاع خمش', slug: 'bend-radius', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'حداقل شعاع خمش' },
  { title: 'نوع نصب', slug: 'installation-type', type: 'SELECT', defaultUnit: '', description: 'نوع نصب کابل', options: ['هوایی', 'زیرزمینی', ' داخلی', 'زیرآبی', 'خودنگهدار'] },
  { title: 'طول کابل', slug: 'cable-length', type: 'NUMBER', defaultUnit: 'متر', description: 'طول کابل' },
  { title: 'تعداد زوج', slug: 'pair-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد زوج سیم' },
  { title: 'مقطع هادی', slug: 'conductor-cross-section', type: 'NUMBER', defaultUnit: 'میلی‌متر مربع', description: 'مقطع هادی' },
  { title: 'مقاومت DC', slug: 'dc-resistance', type: 'NUMBER', defaultUnit: 'اهم بر کیلومتر', description: 'مقاومت DC هادی' },

  // ── Network / Data ──────────────────────────────────────────
  { title: 'سرعت انتقال', slug: 'transfer-speed', type: 'SELECT', defaultUnit: '', description: 'حداکثر سرعت انتقال', options: ['10/100 Mbps', '100/1000 Mbps', '1 Gbps', '2.5 Gbps', '5 Gbps', '10 Gbps', '25 Gbps', '40 Gbps', '100 Gbps'] },
  { title: 'نوع استاندارد بی‌سیم', slug: 'wireless-standard', type: 'SELECT', defaultUnit: '', description: 'استاندارد بی‌سیم', options: ['Wi-Fi 4 (802.11n)', 'Wi-Fi 5 (802.11ac)', 'Wi-Fi 6 (802.11ax)', 'Wi-Fi 6E', 'Wi-Fi 7 (802.11be)'] },
  { title: 'فرکانس بی‌سیم', slug: 'wireless-frequency', type: 'MULTI_SELECT', defaultUnit: '', description: 'بازه‌های فرکانسی بی‌سیم', options: ['2.4 GHz', '5 GHz', '6 GHz'] },
  { title: 'حداکثر کاربر', slug: 'max-clients', type: 'NUMBER', defaultUnit: '', description: 'حداکثر تعداد کاربر همزمان' },
  { title: 'SSO', slug: 'ssid-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد SSID همزمان' },
  { title: 'بهره آنتن', slug: 'antenna-gain', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'بهره آنتن (dBi)' },
  { title: 'نوع آنتن', slug: 'antenna-type', type: 'SELECT', defaultUnit: '', description: 'نوع آنتن', options: ['داخلی', 'خارجی', ' Omnidirectional', '_sector', 'directional', 'parabolic'] },
  { title: 'PoE', slug: 'poe-support', type: 'SELECT', defaultUnit: '', description: 'پشتیبانی از PoE', options: ['ندارد', 'PoE (802.3af)', 'PoE+ (802.3at)', 'PoE++ (802.3bt)'] },
  { title: 'توان PoE خروجی', slug: 'poe-output-power', type: 'NUMBER', defaultUnit: 'وات', description: 'حداکثر توان PoE خروجی' },
  { title: 'ظرفیت سوئیچینگ', slug: 'switching-capacity', type: 'NUMBER', defaultUnit: 'گیگابیت بر ثانیه', description: 'ظرفیت سوئیچینگ' },
  { title: 'نرخ فوروارد', slug: 'forwarding-rate', type: 'NUMBER', defaultUnit: 'میلیون بسته بر ثانیه', description: 'نرخ فوروارد بسته‌ها (Mpps)' },
  { title: 'جدول MAC', slug: 'mac-table-size', type: 'NUMBER', defaultUnit: '', description: 'ظرفیت جدول MAC' },
  { title: 'جدول مسیریابی', slug: 'routing-table-size', type: 'NUMBER', defaultUnit: '', description: 'ظرفیت جدول مسیریابی' },
  { title: 'حافظه بافر', slug: 'buffer-memory', type: 'NUMBER', defaultUnit: 'مگابایت', description: 'حافظه بافر' },
  { title: 'RAM', slug: 'ram', type: 'NUMBER', defaultUnit: 'گیگابایت', description: 'حافظه RAM' },
  { title: 'حافظه فلش', slug: 'flash-memory', type: 'NUMBER', defaultUnit: 'گیگابایت', description: 'حافظه فلش' },

  // ── Transceiver / Module ────────────────────────────────────
  { title: 'نوع ماژول', slug: 'module-type', type: 'SELECT', defaultUnit: '', description: 'نوع ماژول ترنسیور', options: ['SFP', 'SFP+', 'SFP28', 'QSFP+', 'QSFP28', 'QSFP-DD', 'CFP', 'CFP2', 'CFP4', 'XFP', 'GBIC'] },
  { title: 'نوع فیبر ماژول', slug: 'module-fiber-type', type: 'SELECT', defaultUnit: '', description: 'نوع فیبر سازگار با ماژول', options: ['SMF (Single Mode)', 'MMF (Multi Mode)', 'هر دو'] },
  { title: 'فاصله انتقال', slug: 'transmission-distance', type: 'TEXT', defaultUnit: '', description: 'حداکثر فاصله انتقال' },
  { title: 'دامنه طول موج', slug: 'wavelength-range', type: 'TEXT', defaultUnit: 'نانومتر', description: 'دامنه طول موج کاری' },
  { title: 'توان خروجی نوری', slug: 'optical-output-power', type: 'TEXT', defaultUnit: 'دسی‌بل‌میلی‌وات', description: 'محدوده توان خروجی نوری' },
  { title: 'حساسیت دریافت', slug: 'receiver-sensitivity', type: 'NUMBER', defaultUnit: 'دسی‌بل‌میلی‌وات', description: 'حداقل حساسیت دریافت' },
  { title: 'DDM', slug: 'ddm-support', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از DDM/DOM' },
  { title: 'سازگاری', slug: 'compatibility', type: 'TEXT', defaultUnit: '', description: 'لیست تجهیزات سازگار' },

  // ── Connector ───────────────────────────────────────────────
  { title: 'نوع کانکتور مسی', slug: 'copper-connector-type', type: 'SELECT', defaultUnit: '', description: 'نوع کانکتور مسی', options: ['RJ45', 'RJ11', 'DB9', 'DB25', 'BNC', 'N-Type', 'BNC'] },
  { title: 'نوع کانکتور RF', slug: 'rf-connector-type', type: 'SELECT', defaultUnit: '', description: 'نوع کانکتور RF', options: ['N-Type', 'BNC', 'SMA', 'TNC', '7/16 DIN', '4.3-10', '7/8 EIA'] },
  { title: 'تعداد پین', slug: 'pin-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پین کانکتور' },
  { title: 'مقاومت مسیر', slug: 'path-resistance', type: 'NUMBER', defaultUnit: 'اهم', description: 'مقاومت مسیر' },
  { title: 'عایق‌بندی', slug: 'insulation', type: 'TEXT', defaultUnit: '', description: 'نوع عایق‌بندی' },

  // ── RF / Antenna ────────────────────────────────────────────
  { title: 'بهره آنتن (dBi)', slug: 'antenna-gain-dbi', type: 'NUMBER', defaultUnit: 'dBi', description: 'بهره آنتن' },
  { title: 'پهنای باند', slug: 'bandwidth', type: 'TEXT', defaultUnit: 'مگاهرتز', description: 'پهنای باند کاری' },
  { title: 'پلاریزاسیون', slug: 'polarization', type: 'SELECT', defaultUnit: '', description: 'نوع قطبش آنتن', options: ['خطی عمودی', 'خطی افقی', 'دایروی', 'بیضوی'] },
  { title: 'نوع سکتور', slug: 'sector-type', type: 'NUMBER', defaultUnit: 'درجه', description: 'زاویه پرتو سکتور' },
  { title: 'VSWR', slug: 'vswr', type: 'NUMBER', defaultUnit: '', description: 'نسبت موج ایستاده' },
  { title: 'توان RMS', slug: 'rms-power', type: 'NUMBER', defaultUnit: 'وات', description: 'توان متوسط RMS' },
  { title: 'توان اوج', slug: 'peak-power', type: 'NUMBER', defaultUnit: 'وات', description: 'توان اوج' },
  { title: 'نوع پرتو', slug: 'beam-type', type: 'SELECT', defaultUnit: '', description: 'نوع الگوی پرتو', options: ['Omnidirectional', 'Sector', 'Directional', 'Parabolic', 'Yagi'] },

  // ── Microwave ───────────────────────────────────────────────
  { title: 'بهره لینک مایکروویو', slug: 'microwave-link-gain', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'بهره کلی لینک مایکروویو' },
  { title: 'ظرفیت کانال', slug: 'channel-capacity', type: 'TEXT', defaultUnit: 'مگابیت بر ثانیه', description: 'ظرفیت کانال مایکروویو' },
  { title: 'تعداد کانال', slug: 'channel-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد کانال فرکانسی' },
  { title: 'Modulation', slug: 'modulation', type: 'TEXT', defaultUnit: '', description: 'نوع مدولاسیون' },

  // ── Power & Battery ─────────────────────────────────────────
  { title: 'نوع باتری', slug: 'battery-type', type: 'SELECT', defaultUnit: '', description: 'نوع باتری', options: ['VRLA', 'Li-ion', 'LiFePO4', 'NiMH', 'NiCd'] },
  { title: 'ظرفیت باتری', slug: 'battery-capacity', type: 'NUMBER', defaultUnit: 'آمپر ساعت', description: 'ظرفیت باتری' },
  { title: 'ولتاژ باتری', slug: 'battery-voltage', type: 'NUMBER', defaultUnit: 'ولت', description: 'ولتاژ نامی باتری' },
  { title: 'عمر باتری', slug: 'battery-lifespan', type: 'NUMBER', defaultUnit: 'سال', description: 'عمر مفید باتری' },
  { title: 'زمان پشتیبانی', slug: 'backup-time', type: 'NUMBER', defaultUnit: 'ساعت', description: 'زمان پشتیبانی در حالت بار کامل' },
  { title: 'نوع UPS', slug: 'ups-type', type: 'SELECT', defaultUnit: '', description: 'نوع UPS', options: ['Offline', 'Line-Interactive', 'Online (Double Conversion)'] },
  { title: 'توان خروجی VA', slug: 'output-volt-ampere', type: 'NUMBER', defaultUnit: 'ولت‌آمپر', description: 'توان خروجی VA' },
  { title: 'تعداد خروجی', slug: 'output-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد خروجی‌ها' },
  { title: 'زمان سوئیچ', slug: 'switch-time', type: 'NUMBER', defaultUnit: 'میلی‌ثانیه', description: 'زمان سوئیچ به حالت باتری' },
  { title: 'نوع رکتیفایر', slug: 'rectifier-type', type: 'SELECT', defaultUnit: '', description: 'نوع رکتیفایر', options: ['یکسوساز خطی', 'یکسوساز سوئیچینگ'] },
  { title: 'تعداد شاسی', slug: 'shelf-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد شاسی' },
  { title: 'تعداد ماژول', slug: 'module-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد ماژول' },

  // ── Wireless / Microwave Radio ──────────────────────────────
  { title: 'بهره لینک', slug: 'link-budget', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'بودجه لینک' },
  { title: 'RSL', slug: 'received-signal-level', type: 'NUMBER', defaultUnit: 'دسی‌بل‌میلی‌وات', description: 'سطح سیگنال دریافتی' },
  { title: 'MTBF', slug: 'mtbf', type: 'NUMBER', defaultUnit: 'ساعت', description: 'میانگین زمان بین دو خرابی' },
  { title: 'تعداد پورت اترنت', slug: 'ethernet-port-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پورت اترنت' },
  { title: 'ACARS', slug: 'acars', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از ACARS' },

  // ── Synchronization ─────────────────────────────────────────
  { title: 'نوع سنکرونایزیشن', slug: 'sync-type', type: 'MULTI_SELECT', defaultUnit: '', description: 'پروتکل‌های سنکرونایزیشن', options: ['GPS', 'PTP (IEEE 1588)', 'NTP', 'SyncE', 'BITS'] },
  { title: 'دقت', slug: 'accuracy', type: 'NUMBER', defaultUnit: 'نانوثانیه', description: 'دقت سنکرونایزیشن' },

  // ── Server / Storage ────────────────────────────────────────
  { title: 'پردازنده', slug: 'processor', type: 'TEXT', defaultUnit: '', description: 'نوع و مدل پردازنده' },
  { title: 'تعداد پردازنده', slug: 'processor-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد سوکت پردازنده' },
  { title: 'هسته', slug: 'cpu-cores', type: 'NUMBER', defaultUnit: '', description: 'تعداد هسته پردازنده' },
  { title: 'فرکانس پردازنده', slug: 'cpu-clock-speed', type: 'NUMBER', defaultUnit: 'گیگاهرتز', description: 'فرکانس پردازنده' },
  { title: 'حداکثر RAM', slug: 'max-ram', type: 'NUMBER', defaultUnit: 'گیگابایت', description: 'حداکثر حافظه RAM قابل پشتیبانی' },
  { title: 'نوع حافظه', slug: 'memory-type', type: 'SELECT', defaultUnit: '', description: 'نوع حافظه RAM', options: ['DDR3', 'DDR4', 'DDR5', 'ECC DDR4', 'ECC DDR5', 'RDIMM', 'LRDIMM'] },
  { title: 'تعداد اسلات', slug: 'slot-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد اسلات حافظه' },
  { title: 'نوع ذخیره‌سازی', slug: 'storage-type', type: 'SELECT', defaultUnit: '', description: 'نوع درایو ذخیره‌سازی', options: ['SATA HDD', 'SAS HDD', 'SATA SSD', 'NVMe SSD', 'M.2 NVMe'] },
  { title: 'ظرفیت ذخیره‌سازی', slug: 'storage-capacity', type: 'NUMBER', defaultUnit: 'گیگابایت', description: 'ظرفیت کل ذخیره‌سازی' },
  { title: 'تعداد درایو', slug: 'drive-bays', type: 'NUMBER', defaultUnit: '', description: 'تعداد اسلات درایو' },
  { title: 'RAID', slug: 'raid-support', type: 'MULTI_SELECT', defaultUnit: '', description: 'سطح RAID پشتیبانی شده', options: ['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10', 'JBOD'] },
  { title: 'نوع رید کنترلر', slug: 'raid-controller', type: 'TEXT', defaultUnit: '', description: 'نوع رید کنترلر' },
  { title: 'تعداد پورت شبکه', slug: 'network-port-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پورت شبکه' },
  { title: 'سرعت پورت شبکه', slug: 'network-port-speed', type: 'SELECT', defaultUnit: '', description: 'سرعت پورت شبکه', options: ['1 Gbps', '10 Gbps', '25 Gbps', '40 Gbps', '100 Gbps'] },
  { title: 'تعداد GPU', slug: 'gpu-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد کارت گرافیک' },
  { title: 'PCIe', slug: 'pcie-slots', type: 'TEXT', defaultUnit: '', description: 'تعداد و نوع اسلات PCIe' },

  // ── Security ────────────────────────────────────────────────
  { title: 'حداکثر VPN', slug: 'max-vpn-tunnels', type: 'NUMBER', defaultUnit: '', description: 'حداکثر تونل VPN همزمان' },
  { title: 'حداکثر اتصال', slug: 'max-connections', type: 'NUMBER', defaultUnit: '', description: 'حداکثر اتصالات همزمان' },
  { title: 'THROUGHPUT فایروال', slug: 'firewall-throughput', type: 'NUMBER', defaultUnit: 'گیگابیت بر ثانیه', description: 'نرخ تبادل فایروال' },
  { title: 'THROUGHPUT IPS', slug: 'ips-throughput', type: 'NUMBER', defaultUnit: 'گیگابیت بر ثانیه', description: 'نرخ تبادل IPS' },
  { title: 'THROUGHPUT SSL', slug: 'ssl-throughput', type: 'NUMBER', defaultUnit: 'گیگابیت بر ثانیه', description: 'نرخ تبادل SSL Inspection' },
  { title: 'نوع VPN', slug: 'vpn-type', type: 'MULTI_SELECT', defaultUnit: '', description: 'پروتکل‌های VPN پشتیبانی شده', options: ['IPSec', 'SSL', 'L2TP', 'PPTP', 'WireGuard', 'OpenVPN'] },
  { title: 'IPS/IDS', slug: 'ips-ids', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از IPS/IDS' },
  { title: 'UTM', slug: 'utm', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از UTM' },
  { title: 'لایسنس', slug: 'license-type', type: 'SELECT', defaultUnit: '', description: 'نوع لایسنس', options: ['Perpetual', 'Subscription', 'Hardware bundled'] },

  // ── VoIP / Telephony ────────────────────────────────────────
  { title: 'تعداد خطوط داخلی', slug: 'extension-count', type: 'NUMBER', defaultUnit: '', description: 'حداکثر تعداد خطوط داخلی' },
  { title: 'تعداد خطوط همزمان', slug: 'concurrent-calls', type: 'NUMBER', defaultUnit: '', description: 'حداکثر تماس همزمان' },
  { title: 'پورت FXS', slug: 'fxs-port-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پورت FXS' },
  { title: 'پورت FXO', slug: 'fxo-port-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پورت FXO' },
  { title: 'پورت E1/T1', slug: 'e1-t1-port-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پورت E1/T1' },
  { title: 'پروتکل صوتی', slug: 'voice-codec', type: 'MULTI_SELECT', defaultUnit: '', description: 'کدک‌های صوتی پشتیبانی شده', options: ['G.711', 'G.722', 'G.729', 'G.726', 'Opus'] },
  { title: 'SIP Trunk', slug: 'sip-trunk', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از SIP Trunk' },

  // ── IoT ─────────────────────────────────────────────────────
  { title: 'پروتکل IoT', slug: 'iot-protocol', type: 'MULTI_SELECT', defaultUnit: '', description: 'پروتکل‌های ارتباطی IoT', options: ['LoRa', 'NB-IoT', 'Zigbee', 'Z-Wave', 'Bluetooth LE', 'Matter', 'Thread'] },
  { title: 'مصرف انرژی', slug: 'energy-consumption', type: 'NUMBER', defaultUnit: 'میلی‌وات', description: 'مصرف انرژی در حالت کاری' },
  { title: 'عمر باتری سنسور', slug: 'sensor-battery-life', type: 'NUMBER', defaultUnit: 'سال', description: 'عمر تقریبی باتری سنسور' },

  // ── Tower / Structure ───────────────────────────────────────
  { title: 'ارتفاع دکل', slug: 'tower-height', type: 'NUMBER', defaultUnit: 'متر', description: 'ارتفاع کل دکل' },
  { title: 'نوع دکل', slug: 'tower-type', type: 'SELECT', defaultUnit: '', description: 'نوع سازه', options: ['Lattice Tower', 'Monopole', 'Guyed', 'Self-supporting', 'Camouflage'] },
  { title: 'بار باد', slug: 'wind-load', type: 'NUMBER', defaultUnit: 'کیلوگرم بر متر مربع', description: 'حداکثر بار باد طراحی' },
  { title: 'بار یخ', slug: 'ice-load', type: 'NUMBER', defaultUnit: 'میلی‌متر', description: 'حداکثر ضخامت یخ طراحی' },
  { title: 'ظرفیت بار', slug: 'load-capacity', type: 'NUMBER', defaultUnit: 'کیلوگرم', description: 'حداکثر ظرفیت بار' },
  { title: 'مقاومت ارتینگ', slug: 'grounding-resistance', type: 'NUMBER', defaultUnit: 'اهم', description: 'مقاومت سیستم ارتینگ' },

  // ── Shelter / Cabinet ───────────────────────────────────────
  { title: 'نوع خنک‌کننده', slug: 'cooling-type', type: 'SELECT', defaultUnit: '', description: 'نوع سیستم خنک‌کننده', options: ['فans', 'Air Conditioner', 'TEC', ' Heat Exchanger', 'None'] },
  { title: 'ظرفیت خنک‌کننده', slug: 'cooling-capacity', type: 'NUMBER', defaultUnit: 'BTU', description: 'ظرفیت خنک‌کننده' },
  { title: 'نوع کف', slug: 'floor-type', type: 'SELECT', defaultUnit: '', description: 'نوع کف', options: ['Raised Floor', 'Anti-static', 'Standard'] },
  { title: 'سنسور محیطی', slug: 'env-sensors', type: 'MULTI_SELECT', defaultUnit: '', description: 'سنسورهای محیطی', options: ['دما', 'رطوبت', 'نفوذ آب', 'دود', 'دسترسی غیرمجاز'] },
  { title: 'UPS داخلی', slug: 'internal-ups', type: 'BOOLEAN', defaultUnit: '', description: 'دارای UPS داخلی' },

  // ── General / Commercial ────────────────────────────────────
  { title: 'استاندارد', slug: 'standard', type: 'TEXT', defaultUnit: '', description: 'استانداردهای مرجع' },
  { title: 'گارانتی', slug: 'warranty', type: 'TEXT', defaultUnit: '', description: 'مدت و شرایط گارانتی' },
  { title: 'کشور مبدأ', slug: 'country-of-origin', type: 'SELECT', defaultUnit: '', description: 'کشور سازنده', options: ['ایران', 'چین', 'آمریکا', 'آلمان', 'ژاپن', 'کره جنوبی', 'تایوان', 'سوئیس', 'سوئد', 'فرانسه', 'انگلیس', 'هند', 'ترکیه'] },
  { title: 'شرکت سازنده', slug: 'manufacturer', type: 'TEXT', defaultUnit: '', description: 'نام شرکت سازنده' },
  { title: 'مدل', slug: 'model-name', type: 'TEXT', defaultUnit: '', description: 'نام و مدل محصول' },
  { title: 'نسخه سخت‌افزاری', slug: 'hardware-version', type: 'TEXT', defaultUnit: '', description: 'نسخه سخت‌افزاری' },
  { title: 'نسخه نرم‌افزاری', slug: 'firmware-version', type: 'TEXT', defaultUnit: '', description: 'نسخه نرم‌افزاری / Firmware' },
  { title: 'تعداد ورودی دیجیتال', slug: 'digital-input-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد ورودی‌های دیجیتال (DI)' },
  { title: 'تعداد خروجی دیجیتال', slug: 'digital-output-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد خروجی‌های دیجیتال (DO)' },
  { title: 'تعداد ورودی آنالوگ', slug: 'analog-input-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد ورودی‌های آنالوگ (AI)' },
  { title: 'SNMP', slug: 'snmp-support', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از SNMP' },
  { title: 'نسخه SNMP', slug: 'snmp-version', type: 'SELECT', defaultUnit: '', description: 'نسخه SNMP', options: ['v1', 'v2c', 'v3'] },
  { title: 'Syslog', slug: 'syslog-support', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از Syslog' },
  { title: 'SSH', slug: 'ssh-support', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از SSH' },
  { title: 'TLS', slug: 'tls-version', type: 'TEXT', defaultUnit: '', description: 'نسخه TLS پشتیبانی شده' },
  { title: 'پورت کنسول', slug: 'console-port', type: 'SELECT', defaultUnit: '', description: 'نوع پورت کنسول', options: ['RJ45 Console', 'Mini-USB Console', 'DB9 Serial', 'None'] },
  { title: 'USB', slug: 'usb-ports', type: 'TEXT', defaultUnit: '', description: 'تعداد و نوع پورت USB' },

  // ── Test & Measurement ──────────────────────────────────────
  { title: 'بازه اندازه‌گیری', slug: 'measurement-range', type: 'TEXT', defaultUnit: '', description: 'بازه اندازه‌گیری' },
  { title: 'دقت اندازه‌گیری', slug: 'measurement-accuracy', type: 'TEXT', defaultUnit: '', description: 'دقت اندازه‌گیری' },
  { title: 'بازه دینامیکی', slug: 'dynamic-range', type: 'NUMBER', defaultUnit: 'دسی‌بل', description: 'بازه دینامیکی' },
  { title: 'رزولوشن', slug: 'resolution', type: 'NUMBER', defaultUnit: '', description: 'رزولوشن اندازه‌گیری' },

  // ── OTDR specific ──────────────────────────────────────────
  { title: 'حداکثر برد OTDR', slug: 'otdr-max-range', type: 'NUMBER', defaultUnit: 'کیلومتر', description: 'حداکثر برد اندازه‌گیری OTDR' },
  { title: 'dead zone OTDR', slug: 'otdr-dead-zone', type: 'NUMBER', defaultUnit: 'متر', description: 'نقطه کور OTDR' },
  { title: 'پالس OTDR', slug: 'otdr-pulse-width', type: 'TEXT', defaultUnit: 'نانوثانیه', description: 'پهنای پالس OTDR' },

  // ── Additional telecom fields ───────────────────────────────
  { title: 'نوع انتقال', slug: 'transmission-type', type: 'SELECT', defaultUnit: '', description: 'نوع تکنولوژی انتقال', options: ['SDH', 'PDH', 'OTN', 'MPLS', 'IP/MPLS', 'Ethernet', 'Packet'] },
  { title: 'ظرفیت انتقال', slug: 'transmission-capacity', type: 'TEXT', defaultUnit: '', description: 'ظرفیت کل انتقال' },
  { title: 'تعداد کانال DWDM', slug: 'dwdm-channel-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد کانال DWDM' },
  { title: 'فاصله کانال', slug: 'channel-spacing', type: 'TEXT', defaultUnit: 'گیگاهرتز', description: 'فاصله کانال' },
  { title: 'نوع WDM', slug: 'wdm-type', type: 'SELECT', defaultUnit: '', description: 'نوع WDM', options: ['CWDM', 'DWDM', 'FWDM'] },
  { title: 'تعداد درگاه سرویس', slug: 'service-port-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد درگاه سرویس' },
  { title: 'QoS', slug: 'qos-support', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از QoS' },
  { title: 'MPLS', slug: 'mpls-support', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از MPLS' },
  { title: 'VLAN', slug: 'vlan-support', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از VLAN' },
  { title: 'نوع اسلات', slug: 'slot-type', type: 'TEXT', defaultUnit: '', description: 'نوع اسلات‌های قابل ارتقاء' },
  { title: 'تعداد اسلات', slug: 'available-slots', type: 'NUMBER', defaultUnit: '', description: 'تعداد اسلات موجود' },
  { title: 'توان فن', slug: 'fan-power', type: 'NUMBER', defaultUnit: 'وات', description: 'توان مصرفی فن‌ها' },
  { title: 'تعداد فن', slug: 'fan-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد فن‌ها' },
  { title: 'تعویض گرم', slug: 'hot-swappable', type: 'BOOLEAN', defaultUnit: '', description: 'قابلیت تعویض در حالت روشن' },
  { title: 'منبع تغذیه دوگانه', slug: 'dual-power-supply', type: 'BOOLEAN', defaultUnit: '', description: 'پشتیبانی از منبع تغذیه دوگانه' },

  // ── Splitter / Passive ──────────────────────────────────────
  { title: 'تعداد ورودی', slug: 'input-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پورت ورودی' },
  { title: 'تعداد خروجی', slug: 'output-port-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد پورت خروجی' },
  { title: 'اتصال', slug: 'splice-type', type: 'SELECT', defaultUnit: '', description: 'نوع اتصال', options: ['Fusion', 'Mechanical', 'Pre-polished'] },
  { title: 'تعداد اسپلایس', slug: 'splice-count', type: 'NUMBER', defaultUnit: '', description: 'تعداد اسلایس‌ها' },
  { title: 'تعداد فیبر در هر کلوژر', slug: 'fiber-per-closure', type: 'NUMBER', defaultUnit: '', description: 'تعداد فیبر قابل پشتیبانی در هر کلوژر' },
];

async function seedSpecificationLibrary(prisma) {
  console.log('Seeding specification library fields...');
  let created = 0;
  let updated = 0;

  for (const field of LIBRARY_FIELDS) {
    const result = await prisma.specificationLibraryField.upsert({
      where: { slug: field.slug },
      update: {
        title: field.title,
        type: field.type,
        defaultUnit: field.defaultUnit || null,
        description: field.description || null,
        isActive: true,
      },
      create: {
        title: field.title,
        slug: field.slug,
        type: field.type,
        defaultUnit: field.defaultUnit || null,
        description: field.description || null,
        isActive: true,
      },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`  ✓ ${LIBRARY_FIELDS.length} specification library fields (${created} new, ${updated} updated)`);
}

module.exports = {
  LIBRARY_FIELDS,
  seedSpecificationLibrary,
};
