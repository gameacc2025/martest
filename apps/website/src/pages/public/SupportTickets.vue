<script setup>
import TicketDeskWorkspace from '@telecom/shared-ui/components/operations/TicketDeskWorkspace.vue'

const stats = [
  { label: 'تیکت‌های ثبت‌شده', value: 4, icon: 'pi pi-inbox', tone: 'primary', meta: 'نمونه پرونده‌های حساب' },
  { label: 'در انتظار پاسخ', value: 2, icon: 'pi pi-clock', tone: 'warning', meta: 'نیازمند پاسخ پشتیبانی' },
  { label: 'پاسخ‌های دریافت‌شده', value: 6, icon: 'pi pi-comments', tone: 'success', meta: 'در نمونه فعالیت‌ها' },
  { label: 'آخرین پاسخ', value: '۲ ساعت پیش', icon: 'pi pi-reply', tone: 'accent', meta: 'زمان نمایشی' },
]
const tickets = [
  {
    id: 1, code: 'TK-C-104', subject: 'پیگیری وضعیت سفارش', category: 'سفارش و ارسال',
    status: 'OPEN', statusLabel: 'در انتظار پاسخ', statusTone: 'warning', priorityLabel: 'عادی',
    requesterName: 'شما', requesterType: 'مشتری', assignee: 'تیم پشتیبانی', updatedAt: 'امروز، ۱۰:۲۰', unread: true,
    messages: [
      { id: 1, sender: 'شما', timestamp: 'امروز، ۰۹:۴۰', body: 'سفارش من هنوز به شرکت حمل تحویل نشده است. لطفاً وضعیت آن را بررسی کنید.' },
      { id: 2, sender: 'پشتیبانی بازارگاه', timestamp: 'امروز، ۱۰:۲۰', body: 'درخواست شما ثبت شد. وضعیت آماده‌سازی از فروشنده پیگیری می‌شود و نتیجه را همین‌جا اعلام می‌کنیم.', fromAgent: true },
    ],
  },
  {
    id: 2, code: 'TK-C-098', subject: 'اصلاح اطلاعات حساب', category: 'حساب کاربری',
    status: 'CLOSED', statusLabel: 'بسته‌شده', statusTone: 'success', priorityLabel: 'عادی',
    requesterName: 'شما', requesterType: 'مشتری', assignee: 'تیم پشتیبانی', updatedAt: 'دیروز',
    messages: [
      { id: 1, sender: 'شما', timestamp: 'دیروز، ۰۸:۳۰', body: 'شماره تماس حسابم را اصلاح کردم؛ لطفاً تأیید کنید.' },
      { id: 2, sender: 'پشتیبانی بازارگاه', timestamp: 'دیروز، ۰۹:۰۰', body: 'اطلاعات حساب شما به‌روزرسانی شد. تیکت بسته شد.', fromAgent: true },
    ],
  },
]
</script>

<template>
  <TicketDeskWorkspace
    title="پشتیبانی و تیکت‌های من"
    eyebrow="CUSTOMER SUPPORT"
    description="مکالمه با تیم پشتیبانی و پیگیری درخواست‌های حساب کاربری و سفارش‌ها."
    :stats="stats"
    :tickets="tickets"
    :show-requester-identity="false"
  />
</template>