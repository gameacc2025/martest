<script setup>
import { computed } from 'vue'
import OperationalWorkspace from '@telecom/shared-ui/components/operations/OperationalWorkspace.vue'

const props = defineProps({ module: { type: String, required: true } })

const commonColumns = [
  { key: 'primary', label: 'عنوان / شناسه' },
  { key: 'owner', label: 'مسئول / طرف حساب' },
  { key: 'category', label: 'دسته‌بندی' },
  { key: 'date', label: 'آخرین بروزرسانی' },
  { key: 'statusLabel', label: 'وضعیت' },
]
const modules = {
  crm: {
    title: 'مرکز ارتباط با مشتریان',
    eyebrow: 'CRM',
    description: 'نمای یکپارچه سرنخ‌ها، مشتریان، تعاملات و پیگیری‌های تیم فروش.',
    stats: [
      { label: 'مخاطبین فعال', value: 1284, icon: 'pi pi-users', tone: 'primary', meta: 'پرونده‌های قابل پیگیری' },
      { label: 'سرنخ‌های جدید', value: 86, icon: 'pi pi-user-plus', tone: 'accent', meta: 'در این ماه' },
      { label: 'فرصت‌های فروش', value: 42, icon: 'pi pi-chart-line', tone: 'success', meta: 'در قیف فروش' },
      { label: 'پیگیری‌های امروز', value: 17, icon: 'pi pi-calendar-clock', tone: 'warning', meta: 'وظایف سررسیدشده' },
    ],
    highlights: [
      { title: 'قیف فروش', description: 'سرنخ ← مذاکره ← پیشنهاد ← تبدیل', value: '۴۲ فرصت', icon: 'pi pi-filter' },
      { title: 'تعاملات اخیر', description: 'تماس، جلسه و پیام ثبت‌شده', value: '۲۳ مورد', icon: 'pi pi-comments' },
      { title: 'نیازمند پیگیری', description: 'مخاطبانی که اقدام بعدی ندارند', value: '۸ مورد', icon: 'pi pi-flag' },
    ],
    columns: commonColumns,
    rows: [
      { id: 1, primary: 'سرنخ #LD-1042 — اپراتور منطقه‌ای', owner: 'تیم فروش', category: 'سرنخ سازمانی', date: 'امروز، ۱۰:۳۰', statusLabel: 'جدید', statusTone: 'info' },
      { id: 2, primary: 'شرکت ارتباط‌گستر پارس', owner: 'مریم احمدی', category: 'مشتری بالقوه', date: 'امروز، ۰۹:۱۵', statusLabel: 'در حال مذاکره', statusTone: 'warning' },
      { id: 3, primary: 'گروه فناوری شبکه آریا', owner: 'علی رضایی', category: 'مشتری', date: 'دیروز', statusLabel: 'فعال', statusTone: 'success' },
      { id: 4, primary: 'سرنخ #LD-1038 — تأمین تجهیزات', owner: 'تیم فروش', category: 'سرنخ', date: '۲ روز پیش', statusLabel: 'نیازمند پیگیری', statusTone: 'danger' },
    ],
  },
  finance: {
    title: 'مالی و تسویه حساب',
    eyebrow: 'FINANCE',
    description: 'نمای مدیریتی گردش مالی، کمیسیون بازارگاه، پرداخت‌ها و تسویه تأمین‌کنندگان.',
    stats: [
      { label: 'گردش مالی ماه', value: '۸٫۴ میلیارد', icon: 'pi pi-wallet', tone: 'primary', meta: 'مبلغ ناخالص سفارش‌ها' },
      { label: 'در انتظار تسویه', value: '۱٫۲ میلیارد', icon: 'pi pi-hourglass', tone: 'warning', meta: 'بدهی به شرکت‌ها' },
      { label: 'کمیسیون بازارگاه', value: '۴۲۸ میلیون', icon: 'pi pi-percentage', tone: 'success', meta: 'درآمد شناسایی‌شده' },
      { label: 'پرداخت ناموفق', value: 12, icon: 'pi pi-exclamation-circle', tone: 'danger', meta: 'نیازمند بررسی' },
    ],
    highlights: [
      { title: 'چرخه تسویه', description: 'تطبیق سفارش، کسر کمیسیون و تأیید مالی', value: '۲۴ پرونده', icon: 'pi pi-sync' },
      { title: 'مغایرت بانکی', description: 'تراکنش‌های نیازمند تطبیق دستی', value: '۳ مورد', icon: 'pi pi-building-columns' },
      { title: 'اسناد مالی', description: 'فاکتورهای صادرشده در ماه جاری', value: '۱۸۶ سند', icon: 'pi pi-file-invoice' },
    ],
    columns: commonColumns,
    rows: [
      { id: 1, primary: 'تسویه #ST-2048', owner: 'تجهیزات شبکه نوین', category: 'تسویه فروشنده', date: 'امروز', statusLabel: 'در انتظار تأیید', statusTone: 'warning' },
      { id: 2, primary: 'تراکنش #TX-9812', owner: 'درگاه پرداخت', category: 'دریافت سفارش', date: 'امروز', statusLabel: 'موفق', statusTone: 'success' },
      { id: 3, primary: 'تسویه #ST-2042', owner: 'پارس مخابرات', category: 'تسویه فروشنده', date: 'دیروز', statusLabel: 'در حال پردازش', statusTone: 'info' },
      { id: 4, primary: 'بازپرداخت #RF-1021', owner: 'مشتری سازمانی', category: 'بازپرداخت', date: '۲ روز پیش', statusLabel: 'نیازمند بررسی', statusTone: 'danger' },
    ],
  },
  tickets: {
    title: 'مرکز پشتیبانی و تیکت‌ها',
    eyebrow: 'SUPPORT DESK',
    description: 'مدیریت درخواست‌های کاربران و شرکت‌ها، ارجاع کارشناسی و پایش زمان پاسخ‌گویی.',
    stats: [
      { label: 'کل تیکت‌های باز', value: 74, icon: 'pi pi-inbox', tone: 'primary', meta: 'در تمام صف‌ها' },
      { label: 'اولویت بالا', value: 9, icon: 'pi pi-exclamation-triangle', tone: 'danger', meta: 'نیازمند رسیدگی فوری' },
      { label: 'پاسخ‌داده‌نشده', value: 21, icon: 'pi pi-comments', tone: 'warning', meta: 'در انتظار کارشناس' },
      { label: 'میانگین پاسخ', value: '۲٫۴ ساعت', icon: 'pi pi-clock', tone: 'success', meta: 'شاخص نمایشی SLA' },
    ],
    highlights: [
      { title: 'صف کاربران', description: 'درخواست‌های خریداران و بازدیدکنندگان', value: '۳۱ تیکت', icon: 'pi pi-user' },
      { title: 'صف شرکت‌ها', description: 'پشتیبانی تأمین‌کنندگان و اعضای شرکت', value: '۴۳ تیکت', icon: 'pi pi-building' },
      { title: 'SLA نزدیک سررسید', description: 'مواردی که باید پیش از پایان مهلت پاسخ بگیرند', value: '۶ تیکت', icon: 'pi pi-stopwatch' },
    ],
    columns: commonColumns,
    rows: [
      { id: 1, primary: 'تیکت #TK-4021 — مشکل ثبت سفارش', owner: 'کاربر خریدار', category: 'سفارش', date: '۱۰ دقیقه پیش', statusLabel: 'اولویت بالا', statusTone: 'danger' },
      { id: 2, primary: 'تیکت #TK-4018 — مدارک شرکت', owner: 'شرکت پارس شبکه', category: 'حساب شرکت', date: '۳۵ دقیقه پیش', statusLabel: 'در انتظار پاسخ', statusTone: 'warning' },
      { id: 3, primary: 'تیکت #TK-4012 — استعلام', owner: 'شرکت ارتباط‌گستر', category: 'استعلام', date: 'امروز', statusLabel: 'ارجاع‌شده', statusTone: 'info' },
      { id: 4, primary: 'تیکت #TK-4004 — بازیابی حساب', owner: 'کاربر خریدار', category: 'حساب کاربری', date: 'دیروز', statusLabel: 'بسته‌شده', statusTone: 'success' },
    ],
  },
  orders: {
    title: 'سفارش‌های خرده‌فروشی',
    eyebrow: 'RETAIL ORDERS',
    description: 'پایش سفارش‌های B2C، پرداخت، آماده‌سازی، ارسال، مرجوعی و ارتباط با تسویه فروشنده.',
    stats: [
      { label: 'سفارش‌های امروز', value: 128, icon: 'pi pi-shopping-bag', tone: 'primary', meta: 'همه کانال‌ها' },
      { label: 'در انتظار پردازش', value: 23, icon: 'pi pi-hourglass', tone: 'warning', meta: 'نیازمند اقدام' },
      { label: 'ارسال‌شده', value: 86, icon: 'pi pi-truck', tone: 'accent', meta: 'در مسیر تحویل' },
      { label: 'مرجوعی / بازپرداخت', value: 7, icon: 'pi pi-replay', tone: 'danger', meta: 'در حال بررسی' },
    ],
    highlights: [
      { title: 'ارزش سفارش‌های امروز', description: 'مبلغ ناخالص پیش از کسر کمیسیون', value: '۶۸۵ میلیون ریال', icon: 'pi pi-chart-line' },
      { title: 'نرخ تحویل', description: 'شاخص نمونه برای پایش عملیات ارسال', value: '۹۴٫۲٪', icon: 'pi pi-check-circle' },
      { title: 'تسویه فروشندگان', description: 'سفارش‌های تحویل‌شده آماده محاسبه سهم', value: '۱۸ سفارش', icon: 'pi pi-wallet' },
    ],
    columns: commonColumns,
    rows: [
      { id: 1, primary: 'سفارش #RO-25081', owner: 'مشتری حقیقی', category: 'سوئیچ شبکه', date: 'امروز، ۱۱:۲۰', statusLabel: 'در انتظار پردازش', statusTone: 'warning' },
      { id: 2, primary: 'سفارش #RO-25079', owner: 'مشتری سازمانی', category: 'ماژول فیبر نوری', date: 'امروز، ۱۰:۴۵', statusLabel: 'ارسال‌شده', statusTone: 'info' },
      { id: 3, primary: 'سفارش #RO-25072', owner: 'مشتری حقیقی', category: 'روتر', date: 'دیروز', statusLabel: 'تحویل‌شده', statusTone: 'success' },
      { id: 4, primary: 'سفارش #RO-25068', owner: 'مشتری حقیقی', category: 'کابل مخابراتی', date: 'دیروز', statusLabel: 'مرجوعی', statusTone: 'danger' },
    ],
  },
}
modules.crmLeads = {
  ...modules.crm,
  title: 'سرنخ‌ها و مشتریان بالقوه',
  eyebrow: 'CRM · LEADS',
  columns: [
    { key: 'primary', label: 'سرنخ / شناسه' }, { key: 'owner', label: 'مخاطب' },
    { key: 'category', label: 'منبع جذب' }, { key: 'date', label: 'تاریخ ثبت' },
    { key: 'statusLabel', label: 'وضعیت' },
  ],
  rows: [
    { id: 11, primary: 'LD-1042 — اپراتور منطقه‌ای', owner: 'شرکت ارتباط‌گستر', category: 'فرم سایت', date: 'امروز', statusLabel: 'جدید', statusTone: 'info' },
    { id: 12, primary: 'LD-1038 — تأمین‌کننده تجهیزات', owner: 'گروه شبکه آریا', category: 'معرفی همکار', date: 'دیروز', statusLabel: 'تماس اولیه', statusTone: 'warning' },
    { id: 13, primary: 'LD-1027 — خریدار سازمانی', owner: 'مخابرات شرق', category: 'استعلام', date: '۳ روز پیش', statusLabel: 'تبدیل‌شده', statusTone: 'success' },
  ],
}
modules.crmPipeline = {
  ...modules.crm,
  title: 'قیف فرصت‌های فروش',
  eyebrow: 'CRM · PIPELINE',
  columns: [
    { key: 'primary', label: 'فرصت فروش' }, { key: 'owner', label: 'حساب / شرکت' },
    { key: 'category', label: 'ارزش احتمالی' }, { key: 'date', label: 'موعد تصمیم' },
    { key: 'statusLabel', label: 'مرحله' },
  ],
  rows: [
    { id: 21, primary: 'OP-208 — توسعه شبکه دسترسی', owner: 'اپراتور منطقه‌ای', category: '۲٫۸ میلیارد ریال', date: '۱۴۰۵/۰۹/۱۵', statusLabel: 'مذاکره', statusTone: 'warning' },
    { id: 22, primary: 'OP-204 — تأمین سوئیچ', owner: 'شرکت زیرساخت', category: '۱٫۲ میلیارد ریال', date: '۱۴۰۵/۰۹/۰۸', statusLabel: 'پیشنهاد ارسال‌شده', statusTone: 'info' },
    { id: 23, primary: 'OP-199 — ماژول نوری', owner: 'پیمانکار مخابراتی', category: '۶۸۰ میلیون ریال', date: '۱۴۰۵/۰۸/۲۸', statusLabel: 'برنده‌شده', statusTone: 'success' },
  ],
}
modules.crmActivities = {
  ...modules.crm,
  title: 'تعاملات و پیگیری‌ها',
  eyebrow: 'CRM · ACTIVITIES',
  columns: [
    { key: 'primary', label: 'فعالیت' }, { key: 'owner', label: 'مسئول' },
    { key: 'category', label: 'نوع تعامل' }, { key: 'date', label: 'سررسید' },
    { key: 'statusLabel', label: 'وضعیت' },
  ],
  rows: [
    { id: 31, primary: 'تماس پیگیری با شرکت ارتباط‌گستر', owner: 'مریم احمدی', category: 'تماس', date: 'امروز، ۱۴:۰۰', statusLabel: 'سررسید امروز', statusTone: 'warning' },
    { id: 32, primary: 'ارسال پیشنهاد قیمت سوئیچ', owner: 'علی رضایی', category: 'ارسال پیشنهاد', date: 'فردا', statusLabel: 'برنامه‌ریزی‌شده', statusTone: 'info' },
    { id: 33, primary: 'جلسه معرفی خدمات بازارگاه', owner: 'تیم فروش', category: 'جلسه', date: 'دیروز', statusLabel: 'انجام‌شده', statusTone: 'success' },
  ],
}
modules.financeSettlements = {
  ...modules.finance,
  title: 'تسویه با شرکت‌ها',
  eyebrow: 'FINANCE · SETTLEMENTS',
  columns: [
    { key: 'primary', label: 'شناسه تسویه' }, { key: 'owner', label: 'شرکت' },
    { key: 'category', label: 'مبلغ قابل پرداخت' }, { key: 'date', label: 'تاریخ درخواست' },
    { key: 'statusLabel', label: 'وضعیت' },
  ],
  rows: [
    { id: 41, primary: 'ST-2048', owner: 'تجهیزات شبکه نوین', category: '۸۴ میلیون ریال', date: 'امروز', statusLabel: 'در انتظار تأیید', statusTone: 'warning' },
    { id: 42, primary: 'ST-2042', owner: 'پارس مخابرات', category: '۱۲۶ میلیون ریال', date: 'دیروز', statusLabel: 'در حال پردازش', statusTone: 'info' },
    { id: 43, primary: 'ST-2031', owner: 'فناوری ارتباطات شرق', category: '۲۴۰ میلیون ریال', date: '۲ روز پیش', statusLabel: 'واریزشده', statusTone: 'success' },
  ],
}
modules.financeTransactions = {
  ...modules.finance,
  title: 'تراکنش‌ها و گردش حساب',
  eyebrow: 'FINANCE · TRANSACTIONS',
  columns: [
    { key: 'primary', label: 'شناسه تراکنش' }, { key: 'owner', label: 'طرف حساب' },
    { key: 'category', label: 'نوع تراکنش' }, { key: 'date', label: 'تاریخ' },
    { key: 'statusLabel', label: 'وضعیت' },
  ],
  rows: [
    { id: 51, primary: 'TX-9812', owner: 'درگاه پرداخت', category: 'دریافت سفارش', date: 'امروز، ۱۱:۲۰', statusLabel: 'موفق', statusTone: 'success' },
    { id: 52, primary: 'TX-9808', owner: 'شرکت پارس مخابرات', category: 'پرداخت تسویه', date: 'امروز، ۰۹:۴۵', statusLabel: 'در انتظار تطبیق', statusTone: 'warning' },
    { id: 53, primary: 'TX-9799', owner: 'مشتری سازمانی', category: 'بازپرداخت', date: 'دیروز', statusLabel: 'ناموفق', statusTone: 'danger' },
  ],
}
modules.financeInvoices = {
  ...modules.finance,
  title: 'صورتحساب‌ها و اسناد مالی',
  eyebrow: 'FINANCE · INVOICES',
  columns: [
    { key: 'primary', label: 'شماره سند' }, { key: 'owner', label: 'طرف حساب' },
    { key: 'category', label: 'نوع سند' }, { key: 'date', label: 'سررسید' },
    { key: 'statusLabel', label: 'وضعیت' },
  ],
  rows: [
    { id: 61, primary: 'INV-4421', owner: 'تجهیزات شبکه نوین', category: 'صورتحساب کمیسیون', date: '۱۴۰۵/۰۹/۰۱', statusLabel: 'صادرشده', statusTone: 'info' },
    { id: 62, primary: 'INV-4418', owner: 'مشتری سازمانی', category: 'فاکتور فروش', date: '۱۴۰۵/۰۸/۲۸', statusLabel: 'پرداخت‌شده', statusTone: 'success' },
    { id: 63, primary: 'INV-4412', owner: 'پارس مخابرات', category: 'صورتحساب تسویه', date: '۱۴۰۵/۰۸/۲۵', statusLabel: 'سررسیدگذشته', statusTone: 'danger' },
  ],
}

const page = computed(() => modules[props.module] || modules.tickets)
</script>

<template>
  <OperationalWorkspace
    :title="page.title"
    :eyebrow="page.eyebrow"
    :description="page.description"
    :stats="page.stats"
    :highlights="page.highlights"
    :columns="page.columns"
    :rows="page.rows"
  />
</template>