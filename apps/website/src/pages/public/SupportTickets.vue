<script setup>
import OperationalWorkspace from '@telecom/shared-ui/components/operations/OperationalWorkspace.vue'

const stats = [
  { label: 'تیکت‌های ثبت‌شده', value: 4, icon: 'pi pi-inbox', tone: 'primary', meta: 'نمونه پرونده‌های حساب' },
  { label: 'در انتظار پاسخ', value: 2, icon: 'pi pi-clock', tone: 'warning', meta: 'نیازمند پاسخ پشتیبانی' },
  { label: 'پاسخ‌های دریافت‌شده', value: 6, icon: 'pi pi-comments', tone: 'success', meta: 'در نمونه فعالیت‌ها' },
  { label: 'آخرین پاسخ', value: '۲ ساعت پیش', icon: 'pi pi-reply', tone: 'accent', meta: 'زمان نمایشی' },
]
const columns = [
  { key: 'primary', label: 'موضوع درخواست' },
  { key: 'category', label: 'دسته‌بندی' },
  { key: 'date', label: 'آخرین بروزرسانی' },
  { key: 'statusLabel', label: 'وضعیت' },
]
const rows = [
  { id: 1, primary: 'TK-C-104 — پیگیری سفارش', category: 'سفارش و ارسال', date: 'امروز، ۱۰:۲۰', statusLabel: 'در انتظار پاسخ', statusTone: 'warning' },
  { id: 2, primary: 'TK-C-098 — اصلاح اطلاعات حساب', category: 'حساب کاربری', date: 'دیروز', statusLabel: 'پاسخ داده‌شده', statusTone: 'success' },
  { id: 3, primary: 'TK-C-091 — مشخصات فنی محصول', category: 'محصولات', date: '۲ روز پیش', statusLabel: 'بسته‌شده', statusTone: 'neutral' },
]
</script>

<template>
  <OperationalWorkspace
    title="پشتیبانی و تیکت‌های من"
    eyebrow="CUSTOMER SUPPORT"
    description="ثبت درخواست، دریافت پاسخ و پیگیری ارتباط با تیم پشتیبانی بازارگاه."
    :stats="stats"
    :columns="columns"
    :rows="rows"
  />
</template>