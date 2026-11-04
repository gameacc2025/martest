<script setup>
import OperationalWorkspace from '@telecom/shared-ui/components/operations/OperationalWorkspace.vue'

const stats = [
  { label: 'سفارش‌های جدید', value: 8, icon: 'pi pi-inbox', tone: 'primary', meta: 'نیازمند بررسی شرکت' },
  { label: 'در حال آماده‌سازی', value: 5, icon: 'pi pi-box', tone: 'warning', meta: 'سفارش‌های پذیرفته‌شده' },
  { label: 'ارسال‌شده', value: 12, icon: 'pi pi-truck', tone: 'info', meta: 'در مسیر تحویل' },
  { label: 'تحویل این ماه', value: 31, icon: 'pi pi-check-circle', tone: 'success', meta: 'آمار نمونه' },
]
const columns = [
  { key: 'primary', label: 'سفارش / اقلام' },
  { key: 'owner', label: 'خریدار' },
  { key: 'category', label: 'مبلغ ناخالص' },
  { key: 'date', label: 'تاریخ ثبت' },
  { key: 'statusLabel', label: 'وضعیت' },
]
const rows = [
  { id: 1, primary: 'RO-25081 — سوئیچ شبکه ZTE', owner: 'مشتری حقیقی', category: '۸۴٬۵۰۰٬۰۰۰ ریال', date: 'امروز، ۱۱:۲۰', statusLabel: 'جدید؛ نیازمند پذیرش', statusTone: 'warning' },
  { id: 2, primary: 'RO-25079 — ماژول فیبر نوری × ۲', owner: 'شرکت خریدار', category: '۴۲٬۰۰۰٬۰۰۰ ریال', date: 'امروز، ۱۰:۴۵', statusLabel: 'در حال آماده‌سازی', statusTone: 'info' },
  { id: 3, primary: 'RO-25072 — روتر سازمانی', owner: 'مشتری حقیقی', category: '۱۱۸٬۰۰۰٬۰۰۰ ریال', date: 'دیروز', statusLabel: 'ارسال‌شده', statusTone: 'info' },
  { id: 4, primary: 'RO-25068 — کابل مخابراتی', owner: 'مشتری حقیقی', category: '۲۶٬۰۰۰٬۰۰۰ ریال', date: '۲ روز پیش', statusLabel: 'تحویل‌شده', statusTone: 'success' },
]
</script>

<template>
  <OperationalWorkspace
    title="سفارش‌های خرده‌فروشی شرکت"
    eyebrow="COMPANY · RETAIL ORDERS"
    description="سفارش‌های مربوط به شرکت خود را بررسی کنید؛ پذیرش، آماده‌سازی، ارسال و وضعیت تسویه هر سفارش در این بخش مدیریت خواهد شد."
    :stats="stats"
    :columns="columns"
    :rows="rows"
  />
</template>