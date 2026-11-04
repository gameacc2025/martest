// =============================================================
// Database Seed — Phase 1 (Auth + RBAC) — Refactored
//
// Clean-rebuild seed aligned with the new domain model:
//   - User            = authentication identity only
//   - AccessProfile   = application context (STAFF | COMPANY | CUSTOMER)
//   - Profile         = personal profile info (1:1 with User)
//                       STAFF and COMPANY users have NO profile.
//   - UserRole        = roles assigned directly to the user
//
// What gets created:
//   - 7 system roles:
//       STAFF:    SUPER_ADMIN, ADMIN, MODERATOR
//       COMPANY:  COMPANY_MANAGER, COMPANY_USER
//       CUSTOMER: CUSTOMER_USER
//   - Permission catalogue grouped by module
//   - Role → permission assignments
//   - Main platform company + default telecom companies
//   - Categories, specification library & templates
//   - One initial Super Admin (STAFF — no profile):
//       User        (email from SUPER_ADMIN_EMAIL)
//       AccessProfile { type: STAFF }
//       UserRole    → SUPER_ADMIN
//
// All data is idempotent (upsert), so re-running is safe.
//
// Run:  node prisma/seed.js
// =============================================================

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');
const { countTaxonomy, seedMarketplaceCategories } = require('./seeds/categories');
const { DEFAULT_COMPANIES, seedCompanies, seedMainCompany } = require('./seeds/companies');
const { LIBRARY_FIELDS, seedSpecificationLibrary } = require('./seeds/specification-library');
const { seedSpecificationTemplates } = require('./seeds/specification-templates');

const prisma = new PrismaClient();

// Initial Super Admin — phone is the authentication identity (required),
// email is optional.
const SUPER_ADMIN_USER = {
  email: process.env.SUPER_ADMIN_EMAIL || 'admin@telecommarketplace.local',
  phone: process.env.SUPER_ADMIN_PHONE || '09120000000',
  password: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
  status: 'ACTIVE',
};

// ────────────────────────────────────────────────────────────
// SYSTEM ROLES (label + description used as UI helper)
//
// Domain context is defined by AccessProfile.type; roles below are
// grouped by the domain they are intended for (STAFF/COMPANY/CUSTOMER).
// ────────────────────────────────────────────────────────────
const ROLES = [
  // ── STAFF domain ──────────────────────────────────────────
  {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'دسترسی کامل به کل سامانه (bypass تمام مجوزها).',
    isSystem: true,
    scope: 'STAFF',
  },
  {
    name: 'ADMIN',
    label: 'مدیر سامانه',
    description:
      'مدیر سامانه با دسترسی گسترده برای مدیریت کاربران، شرکت‌ها، محصولات، دسته‌بندی‌ها، گزارش‌ها و عملیات روزمره سیستم. این نقش معمولاً به تنظیمات بسیار حساس و مدیریت نقش‌ها دسترسی ندارد.',
    isSystem: true,
    scope: 'STAFF',
  },
  {
    name: 'MODERATOR',
    label: 'مسئول محتوا',
    description:
      'مسئول بررسی و کنترل محتوا. این نقش می‌تواند محصولات را تأیید، رد یا از انتشار خارج کند و بر کیفیت محتوای ثبت‌شده نظارت داشته باشد.',
    isSystem: true,
    scope: 'STAFF',
  },

  // ── COMPANY domain ────────────────────────────────────────
  {
    name: 'COMPANY_MANAGER',
    label: 'مدیر شرکت',
    description:
      'مدیر شرکت عضو پلتفرم. مدیریت کامل اطلاعات شرکت، کاربران شرکت، محصولات و پاسخ به استعلام‌ها را بر عهده دارد و به اطلاعات سایر شرکت‌ها دسترسی ندارد.',
    isSystem: true,
    scope: 'COMPANY',
  },
  {
    name: 'COMPANY_USER',
    label: 'کاربر شرکت',
    description:
      'کاربر عضو شرکت با دسترسی عملیاتی محدود به محصولات و استعلام‌های شرکت خود. امکان مدیریت تنظیمات شرکت یا کاربران را ندارد.',
    isSystem: true,
    scope: 'COMPANY',
  },

  // ── CUSTOMER domain ───────────────────────────────────────
  {
    name: 'CUSTOMER_USER',
    label: 'مشتری',
    description:
      'کاربر خریدار که می‌تواند کاتالوگ محصولات را مشاهده کند و استعلام قیمت (RFQ) ثبت کند.',
    isSystem: true,
    scope: 'CUSTOMER',
  },
];

// ────────────────────────────────────────────────────────────
// PERMISSION CATALOGUE  (group → [permission])
// label + description in Persian — surfaced as UI helper text.
// (Naming convention preserved from the previous catalogue.)
// ────────────────────────────────────────────────────────────
const PERMISSIONS = [
  // Dashboard
  { name: 'dashboard.read', label: 'مشاهده داشبورد', group: 'داشبورد', description: 'مشاهده داشبورد، آمار، نمودارها و اطلاعات کلی سامانه.' },

  // Users
  { name: 'users.create',          label: 'ایجاد کاربر',           group: 'کاربران', description: 'ایجاد کاربر جدید در سیستم.' },
  { name: 'users.read',            label: 'مشاهده کاربران',        group: 'کاربران', description: 'مشاهده لیست کاربران، اطلاعات و جزئیات حساب آن‌ها.' },
  { name: 'users.update',          label: 'ویرایش کاربر',          group: 'کاربران', description: 'ویرایش اطلاعات کاربران شامل نام، ایمیل، وضعیت و سایر مشخصات.' },
  { name: 'users.delete',          label: 'حذف کاربر',             group: 'کاربران', description: 'حذف کاربر از سیستم.' },
  { name: 'users.activate',        label: 'فعال‌سازی کاربر',       group: 'کاربران', description: 'فعال‌سازی حساب کاربری غیرفعال.' },
  { name: 'users.deactivate',      label: 'غیرفعال‌سازی کاربر',    group: 'کاربران', description: 'غیرفعال‌سازی حساب کاربری بدون حذف اطلاعات.' },
  { name: 'users.assign_roles',    label: 'تخصیص نقش',             group: 'کاربران', description: 'تخصیص یا تغییر نقش کاربران.' },
  { name: 'users.reset_password',  label: 'بازنشانی رمز عبور',     group: 'کاربران', description: 'تغییر یا بازنشانی رمز عبور کاربران.' },
  { name: 'users.impersonate',     label: 'ورود به حساب کاربر',     group: 'کاربران', description: 'ورود به حساب کاربر برای پشتیبانی و عیب‌یابی بدون نیاز به دریافت رمز عبور.' },

  // Roles & Permissions
  { name: 'roles.create',         label: 'ایجاد نقش',              group: 'نقش‌ها', description: 'ایجاد نقش جدید.' },
  { name: 'roles.read',           label: 'مشاهده نقش‌ها',          group: 'نقش‌ها', description: 'مشاهده لیست نقش‌ها و جزئیات آن‌ها.' },
  { name: 'roles.update',         label: 'ویرایش نقش',             group: 'نقش‌ها', description: 'ویرایش نام، توضیحات و تنظیمات نقش.' },
  { name: 'roles.delete',         label: 'حذف نقش',                group: 'نقش‌ها', description: 'حذف نقش از سیستم.' },
  { name: 'permissions.read',     label: 'مشاهده دسترسی‌ها',        group: 'دسترسی‌ها', description: 'مشاهده لیست دسترسی‌ها و توضیحات آن‌ها.' },
  { name: 'permissions.assign',   label: 'تخصیص دسترسی',           group: 'دسترسی‌ها', description: 'تخصیص دسترسی به نقش‌ها.' },

  // Companies
  { name: 'companies.create',           label: 'ایجاد شرکت',          group: 'شرکت‌ها', description: 'ایجاد شرکت جدید در پلتفرم.' },
  { name: 'companies.read',             label: 'مشاهده شرکت‌ها',      group: 'شرکت‌ها', description: 'مشاهده اطلاعات شرکت‌ها.' },
  { name: 'companies.update',           label: 'ویرایش شرکت',         group: 'شرکت‌ها', description: 'ویرایش اطلاعات شرکت‌ها.' },
  { name: 'companies.delete',           label: 'حذف شرکت',            group: 'شرکت‌ها', description: 'حذف شرکت از سیستم.' },
  { name: 'companies.activate',         label: 'فعال‌سازی شرکت',      group: 'شرکت‌ها', description: 'فعال‌سازی شرکت.' },
  { name: 'companies.deactivate',       label: 'غیرفعال‌سازی شرکت',   group: 'شرکت‌ها', description: 'غیرفعال‌سازی شرکت بدون حذف اطلاعات.' },
  { name: 'companies.manage_settings',  label: 'مدیریت تنظیمات شرکت', group: 'شرکت‌ها', description: 'مدیریت تنظیمات شرکت مانند سقف محصولات، دسته‌بندی‌های مجاز، وضعیت عضویت و سایر محدودیت‌ها.' },
  { name: 'companies.view_statistics',  label: 'مشاهده آمار شرکت',    group: 'شرکت‌ها', description: 'مشاهده آمار و گزارش‌های عملکرد شرکت.' },
  { name: 'companies.change_owner',     label: 'تغییر مالک شرکت',     group: 'شرکت‌ها', description: 'تغییر کاربر اصلی یا مالک شرکت.' },
  { name: 'companies.restore',          label: 'بازیابی شرکت',        group: 'شرکت‌ها', description: 'بازیابی شرکت حذف‌شده.' },

  // Company Profile (self)
  { name: 'company_profile.read',   label: 'مشاهده پروفایل شرکت',  group: 'پروفایل شرکت', description: 'مشاهده اطلاعات پروفایل شرکت خود.' },
  { name: 'company_profile.update', label: 'ویرایش پروفایل شرکت',  group: 'پروفایل شرکت', description: 'ویرایش اطلاعات پروفایل شرکت خود.' },

  // Categories
  { name: 'categories.create', label: 'ایجاد دسته‌بندی',  group: 'دسته‌بندی‌ها', description: 'ایجاد دسته‌بندی جدید.' },
  { name: 'categories.read',   label: 'مشاهده دسته‌بندی‌ها', group: 'دسته‌بندی‌ها', description: 'مشاهده دسته‌بندی‌ها.' },
  { name: 'categories.update', label: 'ویرایش دسته‌بندی', group: 'دسته‌بندی‌ها', description: 'ویرایش دسته‌بندی‌ها.' },
  { name: 'categories.delete', label: 'حذف دسته‌بندی',   group: 'دسته‌بندی‌ها', description: 'حذف دسته‌بندی‌ها.' },

  // Products
  { name: 'products.create',        label: 'ایجاد محصول',        group: 'محصولات', description: 'ایجاد محصول جدید.' },
  { name: 'products.read',          label: 'مشاهده محصولات',     group: 'محصولات', description: 'مشاهده محصولات.' },
  { name: 'products.update',        label: 'ویرایش محصول',       group: 'محصولات', description: 'ویرایش اطلاعات محصولات.' },
  { name: 'products.delete',        label: 'حذف محصول',          group: 'محصولات', description: 'حذف محصولات.' },
  { name: 'products.submit_review', label: 'ارسال برای بررسی',   group: 'محصولات', description: 'ارسال محصول شرکت برای بررسی مدیر.' },
  { name: 'products.review',        label: 'بررسی محصول',        group: 'محصولات', description: 'مشاهده و مدیریت فرآیند بررسی محصول.' },
  { name: 'products.publish',       label: 'انتشار محصول',       group: 'محصولات', description: 'انتشار محصول و نمایش آن در سایت.' },
  { name: 'products.hide',          label: 'مخفی کردن محصول',    group: 'محصولات', description: 'مخفی کردن محصول منتشرشده از کاتالوگ عمومی.' },
  { name: 'products.archive',       label: 'آرشیو محصول',        group: 'محصولات', description: 'آرشیو کردن محصول و خروج آن از چرخه انتشار.' },
  { name: 'products.unpublish',     label: 'لغو انتشار محصول',   group: 'محصولات', description: 'خارج کردن محصول از انتشار.' },
  { name: 'products.approve',       label: 'تأیید محصول',        group: 'محصولات', description: 'تأیید محصول جهت انتشار.' },
  { name: 'products.reject',        label: 'رد محصول',           group: 'محصولات', description: 'رد محصول و جلوگیری از انتشار آن.' },
  { name: 'products.feature',       label: 'محصول ویژه',         group: 'محصولات', description: 'قرار دادن محصول در بخش محصولات ویژه.' },
  { name: 'products.restore',       label: 'بازیابی محصول',      group: 'محصولات', description: 'بازیابی محصول حذف‌شده.' },
  { name: 'products.import',        label: 'ورودی گروهی',        group: 'محصولات', description: 'ایجاد یا به‌روزرسانی محصولات به‌صورت گروهی از فایل Excel یا CSV.' },
  { name: 'products.export',        label: 'خروجی محصولات',      group: 'محصولات', description: 'دریافت خروجی محصولات در قالب Excel یا CSV.' },
  { name: 'products.change_status', label: 'تغییر وضعیت محصول',  group: 'محصولات', description: 'تغییر وضعیت محصول بین Draft، Pending، Approved و Archived.' },

  // System settings (admin-managed platform configuration, e.g. the count of
  // post-approval product edits that triggers re-review).
  { name: 'system_settings.manage', label: 'مدیریت تنظیمات سیستم', group: 'تنظیمات سیستم', description: 'مشاهده و تغییر تنظیمات سراسری سیستم (مانند سقف ویرایش‌های پس از تأیید محصول).' },

  // Product Images
  { name: 'product_images.read',   label: 'مشاهده تصاویر محصول', group: 'تصاویر محصول', description: 'مشاهده تصاویر محصولات.' },
  { name: 'product_images.create', label: 'افزودن تصویر محصول', group: 'تصاویر محصول', description: 'افزودن تصویر به محصول.' },
  { name: 'product_images.update', label: 'ویرایش تصاویر محصول', group: 'تصاویر محصول', description: 'ویرایش تصاویر محصول.' },
  { name: 'product_images.delete', label: 'حذف تصاویر محصول',   group: 'تصاویر محصول', description: 'حذف تصاویر محصول.' },

  // Product Documents
  { name: 'product_documents.create', label: 'افزودن فایل محصول', group: 'فایل‌های محصول', description: 'افزودن فایل، کاتالوگ یا بروشور به محصول.' },
  { name: 'product_documents.update', label: 'ویرایش فایل‌های محصول', group: 'فایل‌های محصول', description: 'ویرایش فایل‌های پیوست محصول.' },
  { name: 'product_documents.delete', label: 'حذف فایل‌های محصول', group: 'فایل‌های محصول', description: 'حذف فایل‌های پیوست محصول.' },

  // Product Reviews
  { name: 'product_reviews.read',   label: 'مشاهده نظرات',   group: 'نظرات محصولات', description: 'مشاهده نظرات و امتیازهای ثبت‌شده برای محصولات.' },
  { name: 'product_reviews.approve', label: 'تأیید نظر',     group: 'نظرات محصولات', description: 'تأیید نظرات جهت نمایش عمومی.' },
  { name: 'product_reviews.reject',  label: 'رد نظر',        group: 'نظرات محصولات', description: 'رد نظرات نامناسب یا اسپم.' },
  { name: 'product_reviews.delete',  label: 'حذف نظر',       group: 'نظرات محصولات', description: 'حذف نظرات ثبت‌شده.' },

  // Leads / RFQ
  { name: 'leads.create',        label: 'ایجاد لید',         group: 'لیدها و RFQ', description: 'ایجاد درخواست قیمت یا سرنخ فروش جدید.' },
  { name: 'leads.read',          label: 'مشاهده لیدها',      group: 'لیدها و RFQ', description: 'مشاهده لیدها و جزئیات آن‌ها.' },
  { name: 'leads.update',        label: 'ویرایش لید',        group: 'لیدها و RFQ', description: 'ویرایش اطلاعات لید.' },
  { name: 'leads.delete',        label: 'حذف لید',           group: 'لیدها و RFQ', description: 'حذف لید.' },
  { name: 'leads.assign',        label: 'تخصیص لید',         group: 'لیدها و RFQ', description: 'تخصیص لید به شرکت یا کاربر مسئول.' },
  { name: 'leads.change_status', label: 'تغییر وضعیت لید',   group: 'لیدها و RFQ', description: 'تغییر وضعیت لید بین New، Contacted، Negotiating، Won و Lost.' },
  { name: 'leads.export',        label: 'خروجی لیدها',       group: 'لیدها و RFQ', description: 'دریافت خروجی از لیدها.' },

  // Inquiries / RFQ workflow
  { name: 'inquiries.create',  label: 'ایجاد درخواست',       group: 'درخواست‌ها و RFQ', description: 'ایجاد درخواست خرید یا RFQ جدید.' },
  { name: 'inquiries.read',    label: 'مشاهده درخواست‌ها',    group: 'درخواست‌ها و RFQ', description: 'مشاهده درخواست‌ها و جزئیات پاسخ‌ها.' },
  { name: 'inquiries.respond', label: 'پاسخ به درخواست',      group: 'درخواست‌ها و RFQ', description: 'ثبت پاسخ یا پیشنهاد قیمت برای یک درخواست باز.' },

  // Sales
  { name: 'sales.create',  label: 'ثبت فروش',         group: 'فروش', description: 'ثبت فروش جدید.' },
  { name: 'sales.read',    label: 'مشاهده فروش‌ها',    group: 'فروش', description: 'مشاهده فروش‌ها.' },
  { name: 'sales.update',  label: 'ویرایش فروش',      group: 'فروش', description: 'ویرایش اطلاعات فروش.' },
  { name: 'sales.delete',  label: 'حذف فروش',         group: 'فروش', description: 'حذف فروش ثبت‌شده.' },
  { name: 'sales.approve', label: 'تأیید فروش',       group: 'فروش', description: 'تأیید فروش برای محاسبه کمیسیون.' },
  { name: 'sales.reject',  label: 'رد فروش',          group: 'فروش', description: 'رد فروش به دلیل نقص یا مغایرت اطلاعات.' },
  { name: 'sales.export',  label: 'خروجی فروش',       group: 'فروش', description: 'دریافت خروجی از اطلاعات فروش.' },

  // Commissions
  { name: 'commissions.read',   label: 'مشاهده کمیسیون‌ها',  group: 'کمیسیون‌ها', description: 'مشاهده کمیسیون‌های محاسبه‌شده.' },
  { name: 'commissions.update', label: 'ویرایش کمیسیون',    group: 'کمیسیون‌ها', description: 'ویرایش درصد یا مبلغ کمیسیون.' },
  { name: 'commissions.approve', label: 'تأیید کمیسیون',    group: 'کمیسیون‌ها', description: 'تأیید کمیسیون جهت تسویه.' },
  { name: 'commissions.reject',  label: 'رد کمیسیون',       group: 'کمیسیون‌ها', description: 'رد کمیسیون.' },
  { name: 'commissions.pay',     label: 'پرداخت کمیسیون',   group: 'کمیسیون‌ها', description: 'ثبت پرداخت کمیسیون.' },
  { name: 'commissions.export',  label: 'خروجی کمیسیون‌ها', group: 'کمیسیون‌ها', description: 'دریافت خروجی از کمیسیون‌ها.' },

  // Settlements
  { name: 'settlements.read',   label: 'مشاهده تسویه‌ها',    group: 'تسویه‌حساب', description: 'مشاهده تسویه‌حساب‌ها.' },
  { name: 'settlements.create', label: 'ایجاد تسویه',       group: 'تسویه‌حساب', description: 'ایجاد رکورد تسویه‌حساب جدید.' },
  { name: 'settlements.update', label: 'ویرایش تسویه',      group: 'تسویه‌حساب', description: 'ویرایش اطلاعات تسویه‌حساب.' },
  { name: 'settlements.pay',    label: 'ثبت پرداخت',        group: 'تسویه‌حساب', description: 'ثبت انجام پرداخت.' },
  { name: 'settlements.export', label: 'خروجی تسویه‌ها',    group: 'تسویه‌حساب', description: 'دریافت خروجی از تسویه‌حساب‌ها.' },

  // Reports
  { name: 'reports.read',  label: 'مشاهده گزارش‌ها',  group: 'گزارش‌ها', description: 'مشاهده گزارش‌ها و آمار سیستم.' },
  { name: 'reports.export', label: 'خروجی گزارش‌ها', group: 'گزارش‌ها', description: 'دریافت خروجی Excel یا PDF از گزارش‌ها.' },

  // Notifications
  { name: 'notifications.read',   label: 'مشاهده اعلان‌ها', group: 'اعلان‌ها', description: 'مشاهده اعلان‌ها.' },
  { name: 'notifications.send',   label: 'ارسال اعلان',    group: 'اعلان‌ها', description: 'ارسال اعلان به کاربران یا شرکت‌ها.' },
  { name: 'notifications.delete', label: 'حذف اعلان‌ها',   group: 'اعلان‌ها', description: 'حذف اعلان‌ها.' },

  // Tickets
  { name: 'tickets.create', label: 'ایجاد تیکت',  group: 'تیکت‌ها', description: 'ایجاد تیکت پشتیبانی.' },
  { name: 'tickets.read',   label: 'مشاهده تیکت‌ها', group: 'تیکت‌ها', description: 'مشاهده تیکت‌ها.' },
  { name: 'tickets.update', label: 'ویرایش تیکت', group: 'تیکت‌ها', description: 'ویرایش تیکت.' },
  { name: 'tickets.reply',  label: 'پاسخ به تیکت', group: 'تیکت‌ها', description: 'پاسخ به تیکت.' },
  { name: 'tickets.close',  label: 'بستن تیکت',   group: 'تیکت‌ها', description: 'بستن تیکت.' },

  // Banners
  { name: 'banners.create', label: 'ایجاد بنر',   group: 'بنرها', description: 'ایجاد بنر تبلیغاتی یا اطلاع‌رسانی.' },
  { name: 'banners.read',   label: 'مشاهده بنرها', group: 'بنرها', description: 'مشاهده بنرها.' },
  { name: 'banners.update', label: 'ویرایش بنر',  group: 'بنرها', description: 'ویرایش بنرها.' },
  { name: 'banners.delete', label: 'حذف بنر',     group: 'بنرها', description: 'حذف بنرها.' },

  // Media
  { name: 'media.upload', label: 'آپلود فایل',     group: 'رسانه', description: 'آپلود فایل‌ها و تصاویر.' },
  { name: 'media.read',   label: 'مشاهده فایل‌ها',  group: 'رسانه', description: 'مشاهده فایل‌های آپلودشده.' },
  { name: 'media.delete', label: 'حذف فایل‌ها',    group: 'رسانه', description: 'حذف فایل‌ها.' },

  // Audit Logs
  { name: 'audit_logs.read', label: 'مشاهده لاگ‌ها', group: 'لاگ‌های ممیزی', description: 'مشاهده تاریخچه فعالیت‌ها و عملیات کاربران.' },

  // Settings
  { name: 'settings.read',  label: 'مشاهده تنظیمات', group: 'تنظیمات', description: 'مشاهده تنظیمات سامانه.' },
  { name: 'settings.update', label: 'ویرایش تنظیمات', group: 'تنظیمات', description: 'تغییر تنظیمات اصلی سامانه.' },

  // API Keys
  { name: 'api_keys.create', label: 'ایجاد کلید API',  group: 'کلیدهای API', description: 'ایجاد کلید دسترسی برای API.' },
  { name: 'api_keys.read',   label: 'مشاهده کلیدهای API', group: 'کلیدهای API', description: 'مشاهده کلیدهای API.' },
  { name: 'api_keys.delete', label: 'حذف کلید API',   group: 'کلیدهای API', description: 'حذف کلیدهای API.' },

  // System
  { name: 'system.jobs.read',     label: 'مشاهده Jobها',       group: 'سیستم', description: 'مشاهده وضعیت Jobها و صف‌های پردازشی.' },
  { name: 'system.jobs.retry',    label: 'اجرای مجدد Job',     group: 'سیستم', description: 'اجرای مجدد Jobهای ناموفق.' },
  { name: 'system.cache.clear',   label: 'پاک‌سازی Cache',      group: 'سیستم', description: 'پاک‌سازی Cache سیستم.' },
  { name: 'system.maintenance',   label: 'حالت نگهداری',       group: 'سیستم', description: 'فعال یا غیرفعال کردن حالت Maintenance سامانه.' },
];

// ────────────────────────────────────────────────────────────
// ROLE → PERMISSION ASSIGNMENTS
// (SUPER_ADMIN bypasses everything at runtime via wildcard '*')
// ────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  // ADMIN (STAFF): broad operational access, no sensitive role/settings management
  ADMIN: [
    'dashboard.read',
    'users.create', 'users.read', 'users.update', 'users.delete', 'users.activate', 'users.deactivate', 'users.assign_roles', 'users.reset_password',
    'roles.read', 'permissions.read',
    'companies.create', 'companies.read', 'companies.update', 'companies.delete', 'companies.activate', 'companies.deactivate', 'companies.manage_settings', 'companies.view_statistics', 'companies.change_owner', 'companies.restore',
    'categories.create', 'categories.read', 'categories.update', 'categories.delete',
    'products.create', 'products.read', 'products.update', 'products.delete', 'products.submit_review', 'products.review', 'products.publish', 'products.hide', 'products.archive', 'products.unpublish', 'products.approve', 'products.reject', 'products.feature', 'products.restore', 'products.import', 'products.export', 'products.change_status',
    'product_images.create', 'product_images.update', 'product_images.delete',
    'product_documents.create', 'product_documents.update', 'product_documents.delete',
    'product_reviews.read', 'product_reviews.approve', 'product_reviews.reject', 'product_reviews.delete',
    'leads.create', 'leads.read', 'leads.update', 'leads.delete', 'leads.assign', 'leads.change_status', 'leads.export',
    'inquiries.create', 'inquiries.read', 'inquiries.respond',
    'sales.create', 'sales.read', 'sales.update', 'sales.delete', 'sales.approve', 'sales.reject', 'sales.export',
    'commissions.read', 'commissions.approve', 'commissions.reject',
    'settlements.read', 'settlements.create', 'settlements.pay',
    'reports.read', 'reports.export',
    'notifications.read', 'notifications.send', 'notifications.delete',
    'tickets.create', 'tickets.read', 'tickets.update', 'tickets.reply', 'tickets.close',
    'system_settings.manage',
    'banners.create', 'banners.read', 'banners.update', 'banners.delete',
    'media.upload', 'media.read', 'media.delete',
    'audit_logs.read',
  ],

  // MODERATOR (STAFF): content moderation
  MODERATOR: [
    'dashboard.read',
    'products.read', 'products.review', 'products.approve', 'products.reject', 'products.publish', 'products.hide', 'products.archive', 'products.feature', 'products.unpublish', 'products.change_status',
    'product_images.read',
    'product_reviews.read', 'product_reviews.approve', 'product_reviews.reject', 'product_reviews.delete',
    'banners.read',
  ],

  // COMPANY_MANAGER (COMPANY): full management of own company
  COMPANY_MANAGER: [
    'dashboard.read',
    'company_profile.read', 'company_profile.update',
    'users.create', 'users.read', 'users.update', 'users.activate', 'users.deactivate', 'users.assign_roles',
    'products.create', 'products.read', 'products.update', 'products.delete', 'products.submit_review', 'products.publish', 'products.import', 'products.export',
    'product_images.create', 'product_images.update', 'product_images.delete',
    'product_documents.create', 'product_documents.update', 'product_documents.delete',
    'leads.read', 'leads.update', 'leads.change_status',
    'inquiries.create', 'inquiries.read', 'inquiries.respond',
    'sales.create', 'sales.read', 'sales.update',
    'commissions.read',
    'reports.read',
    'notifications.read',
    'tickets.create', 'tickets.read', 'tickets.reply',
    'media.upload', 'media.read',
  ],

  // COMPANY_USER (COMPANY): limited operational access within own company
  COMPANY_USER: [
    'dashboard.read',
    'company_profile.read',
    'products.create', 'products.read', 'products.update', 'products.submit_review', 'products.publish',
    'product_images.create', 'product_images.update',
    'product_documents.create', 'product_documents.update',
    'leads.read',
    'inquiries.read', 'inquiries.respond',
    'notifications.read',
    'tickets.create', 'tickets.read', 'tickets.reply',
    'media.upload', 'media.read',
  ],

  // CUSTOMER_USER (CUSTOMER): catalog + RFQ (no admin/company panels)
  CUSTOMER_USER: [
    'products.read',
    'companies.read',
    'leads.create', 'leads.read',
    'inquiries.create', 'inquiries.read',
    'notifications.read',
    'tickets.create', 'tickets.read', 'tickets.reply',
  ],
};

async function main() {
  console.log('Seeding default marketplace system data...\n');

  // ── 1. Default Main company ─────────────────────────────────
  console.log('Creating Main company...');
  const mainCompany = await seedMainCompany(prisma);
  console.log(`  ✓ Main company ready (id: ${mainCompany.id})`);

  // ── 2. Marketplace categories ───────────────────────────────
  console.log('Creating marketplace categories...');
  await seedMarketplaceCategories(prisma);
  const taxonomy = countTaxonomy();
  console.log(`  ✓ ${taxonomy.categories} categories, ${taxonomy.subcategories} subcategories`);

  // ── 3. Specification library ────────────────────────────────
  await seedSpecificationLibrary(prisma);

  // ── 4. Specification templates ──────────────────────────────
  await seedSpecificationTemplates(prisma);

  // ── 5. Permissions ──────────────────────────────────────────
  console.log('Creating permissions...');
  const permBy = {}; // name → record
  for (const p of PERMISSIONS) {
    permBy[p.name] = await prisma.permission.upsert({
      where: { name: p.name },
      update: { label: p.label, description: p.description, group: p.group },
      create: p,
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions`);

  // ── 6. Roles ────────────────────────────────────────────────
  console.log('Creating roles...');
  const roleBy = {}; // name → record
  for (const r of ROLES) {
    roleBy[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label, description: r.description, isSystem: r.isSystem, scope: r.scope },
      create: r,
    });
  }
  console.log(`  ✓ ${ROLES.length} roles`);

  // ── 7. Role-Permission assignments ──────────────────────────
  console.log('Assigning permissions to roles...');
  let assignmentCount = 0;
  for (const roleName of Object.keys(roleBy)) {
    const role = roleBy[roleName];
    if (!role) continue;
    const permNames = roleName === 'SUPER_ADMIN'
      ? Object.keys(permBy)
      : ROLE_PERMISSIONS[roleName] || [];
    for (const permName of permNames) {
      const perm = permBy[permName];
      if (!perm) {
        console.warn(`  ⚠ permission "${permName}" not found (skipped for ${roleName})`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
      assignmentCount++;
    }
  }
  console.log(`  ✓ ${assignmentCount} role-permission assignments`);

  // ── 8. Super Admin user (identity) + AccessProfile ──────────
  // STAFF users have NO profile (Profile is customer-only in the seed).
  console.log('Creating Super Admin...');
  const passwordHash = await hashPassword(SUPER_ADMIN_USER.password);

  const admin = await prisma.user.upsert({
    where: { phone: SUPER_ADMIN_USER.phone },
    update: {
      passwordHash,
      status: SUPER_ADMIN_USER.status,
      email: SUPER_ADMIN_USER.email,
    },
    create: {
      email: SUPER_ADMIN_USER.email,
      phone: SUPER_ADMIN_USER.phone,
      passwordHash,
      status: SUPER_ADMIN_USER.status,
    },
  });

  // AccessProfile (exactly one per user) — STAFF domain, linked to Main company
  await prisma.accessProfile.upsert({
    where: { userId: admin.id },
    update: {
      type: 'STAFF',
      companyId: mainCompany.id,
      isActive: true,
    },
    create: {
      userId: admin.id,
      type: 'STAFF',
      companyId: mainCompany.id,
      isActive: true,
    },
  });

  // ── 9. Assign SUPER_ADMIN role to user ──────────────────────
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roleBy.SUPER_ADMIN.id } },
    update: {},
    create: { userId: admin.id, roleId: roleBy.SUPER_ADMIN.id },
  });
  console.log('  ✓ Super Admin ready (User + AccessProfile[STAFF] + SUPER_ADMIN role)');

  // ── 10. Default telecom companies ───────────────────────────
  console.log('Creating default telecom companies...');
  await seedCompanies(prisma);
  console.log(`  ✓ ${DEFAULT_COMPANIES.length} default telecom companies`);

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────');
  console.log('Seed completed successfully!');
  console.log(`  Roles:       ${ROLES.length}`);
  console.log(`  Permissions: ${PERMISSIONS.length}`);
  console.log(`  Assignments: ${assignmentCount}`);
  console.log(`  Categories:  ${taxonomy.categories} (subcategories: ${taxonomy.subcategories})`);
  console.log(`  Companies:   ${DEFAULT_COMPANIES.length + 1}`);
  console.log(`  Spec Fields: ~${LIBRARY_FIELDS.length} predefined`);
  console.log('\nSuper Admin login:');
  console.log(`  phone:    ${SUPER_ADMIN_USER.phone}`);
  console.log(`  password: ${SUPER_ADMIN_USER.password}`);
  console.log('\n⚠️  After first login, change the password from the admin panel.');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());