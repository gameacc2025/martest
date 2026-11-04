<script setup>
import OperationalWorkspace from '@telecom/shared-ui/components/operations/OperationalWorkspace.vue'

const stats = [
  { label: 'کل سفارش‌ها', value: 3, icon: 'pi pi-receipt', tone: 'primary', meta: 'سابقه خرید نمایشی' },
  { label: 'در انتظار پردازش', value: 1, icon: 'pi pi-clock', tone: 'warning', meta: 'منتظر اقدام فروشنده' },
  { label: 'در مسیر ارسال', value: 1, icon: 'pi pi-truck', tone: 'info', meta: 'دارای کد رهگیری نمونه' },
  { label: 'تحویل‌شده', value: 1, icon: 'pi pi-check-circle', tone: 'success', meta: 'سفارش‌های تکمیل‌شده' },
]
const columns = [
  { key: 'primary', label: 'شماره سفارش / محصول' },
  { key: 'owner', label: 'فروشنده' },
  { key: 'category', label: 'مبلغ پرداختی' },
  { key: 'date', label: 'تاریخ ثبت' },
  { key: 'statusLabel', label: 'وضعیت' },
]
const rows = [
  { id: 1, primary: 'RO-25081 — سوئیچ شبکه ZTE', owner: 'تجهیزات شبکه نوین', category: '۸۴٬۵۰۰٬۰۰۰ ریال', date: 'امروز، ۱۱:۲۰', statusLabel: 'در انتظار پردازش', statusTone: 'warning' },
  { id: 2, primary: 'RO-25079 — ماژول فیبر نوری × ۲', owner: 'پارس مخابرات', category: '۴۲٬۰۰۰٬۰۰۰ ریال', date: 'دیروز', statusLabel: 'ارسال‌شده', statusTone: 'info' },
  { id: 3, primary: 'RO-25042 — روتر سازمانی', owner: 'ارتباط‌گستر شرق', category: '۱۱۸٬۰۰۰٬۰۰۰ ریال', date: '۱۴۰۵/۰۷/۲۸', statusLabel: 'تحویل‌شده', statusTone: 'success' },
]
</script>

<template>
  <OperationalWorkspace
    title="سفارش‌های من"
    eyebrow="MY RETAIL ORDERS"
    description="پیگیری خریدهای خرده‌فروشی، فروشنده، مبلغ پرداختی و وضعیت آماده‌سازی و ارسال."
    :stats="stats"
    :columns="columns"
    :rows="rows"
  />
</template>