<script setup>
import OperationalWorkspace from '@telecom/shared-ui/components/operations/OperationalWorkspace.vue'

const stats = [
  { label: 'تیکت‌های باز شرکت', value: 8, icon: 'pi pi-inbox', tone: 'primary', meta: 'درخواست‌های ثبت‌شده' },
  { label: 'در انتظار پاسخ', value: 3, icon: 'pi pi-clock', tone: 'warning', meta: 'نیازمند پیگیری' },
  { label: 'پاسخ کارشناسان', value: 12, icon: 'pi pi-comments', tone: 'success', meta: 'در این ماه' },
  { label: 'میانگین پاسخ', value: '۳٫۱ ساعت', icon: 'pi pi-stopwatch', tone: 'info', meta: 'شاخص نمونه' },
]
const columns = [
  { key: 'primary', label: 'موضوع تیکت' },
  { key: 'category', label: 'دسته‌بندی' },
  { key: 'date', label: 'آخرین بروزرسانی' },
  { key: 'statusLabel', label: 'وضعیت' },
]
const rows = [
  { id: 1, primary: 'TK-204 — پیگیری وضعیت تأیید محصول', category: 'محصولات', date: 'امروز، ۱۰:۲۰', statusLabel: 'در انتظار پاسخ', statusTone: 'warning' },
  { id: 2, primary: 'TK-198 — مشکل در پاسخ به استعلام', category: 'استعلام‌ها', date: 'دیروز', statusLabel: 'پاسخ داده‌شده', statusTone: 'success' },
  { id: 3, primary: 'TK-192 — درخواست اصلاح اطلاعات شرکت', category: 'پروفایل شرکت', date: '۲ روز پیش', statusLabel: 'در حال بررسی', statusTone: 'info' },
]
</script>

<template>
  <OperationalWorkspace
    title="پشتیبانی و ارتباط با سامانه"
    eyebrow="COMPANY SUPPORT"
    description="ثبت و پیگیری درخواست‌های پشتیبانی شرکت و مشاهده پاسخ کارشناسان سامانه."
    :stats="stats"
    :columns="columns"
    :rows="rows"
  />
</template>