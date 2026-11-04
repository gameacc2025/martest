<script setup>
import OperationalWorkspace from '@telecom/shared-ui/components/operations/OperationalWorkspace.vue'

const stats = [
  { label: 'مانده قابل تسویه', value: '۱۲۸ میلیون ریال', icon: 'pi pi-wallet', tone: 'primary', meta: 'نمونه مانده حساب' },
  { label: 'در انتظار واریز', value: '۸۴ میلیون ریال', icon: 'pi pi-clock', tone: 'warning', meta: 'پرونده‌های باز' },
  { label: 'تسویه‌شده این ماه', value: '۲۴۶ میلیون ریال', icon: 'pi pi-check-circle', tone: 'success', meta: 'مبلغ نمونه' },
  { label: 'مغایرت‌ها', value: 1, icon: 'pi pi-exclamation-circle', tone: 'danger', meta: 'نیازمند بررسی' },
]
const columns = [
  { key: 'primary', label: 'شناسه تسویه' },
  { key: 'category', label: 'مبنای تسویه' },
  { key: 'date', label: 'تاریخ' },
  { key: 'amount', label: 'مبلغ' },
  { key: 'statusLabel', label: 'وضعیت' },
]
const rows = [
  { id: 1, primary: 'ST-C-1048', category: 'سفارش‌های تحویل‌شده', date: '۱۴۰۵/۰۸/۱۲', amount: '۸۴٬۰۰۰٬۰۰۰ ریال', statusLabel: 'در انتظار واریز', statusTone: 'warning' },
  { id: 2, primary: 'ST-C-1031', category: 'فروش خرده‌فروشی', date: '۱۴۰۵/۰۸/۰۵', amount: '۱۲۶٬۰۰۰٬۰۰۰ ریال', statusLabel: 'واریزشده', statusTone: 'success' },
  { id: 3, primary: 'ST-C-1012', category: 'سفارش‌های تحویل‌شده', date: '۱۴۰۵/۰۷/۲۸', amount: '۱۲۰٬۰۰۰٬۰۰۰ ریال', statusLabel: 'واریزشده', statusTone: 'success' },
]
</script>

<template>
  <OperationalWorkspace
    title="وضعیت تسویه‌های شرکت"
    eyebrow="COMPANY FINANCE"
    description="مشاهده مبالغ قابل تسویه، سوابق واریز و موارد نیازمند پیگیری مالی."
    :stats="stats"
    :columns="columns"
    :rows="rows"
  />
</template>