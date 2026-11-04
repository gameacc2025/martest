<script setup>
import TicketDeskWorkspace from '@telecom/shared-ui/components/operations/TicketDeskWorkspace.vue'

const stats = [
  { label: 'تیکت‌های باز شرکت', value: 8, icon: 'pi pi-inbox', tone: 'primary', meta: 'درخواست‌های ثبت‌شده' },
  { label: 'در انتظار پاسخ', value: 3, icon: 'pi pi-clock', tone: 'warning', meta: 'نیازمند پیگیری' },
  { label: 'پاسخ کارشناسان', value: 12, icon: 'pi pi-comments', tone: 'success', meta: 'در این ماه' },
  { label: 'میانگین پاسخ', value: '۳٫۱ ساعت', icon: 'pi pi-stopwatch', tone: 'accent', meta: 'شاخص نمونه' },
]
const tickets = [
  {
    id: 1, code: 'TK-204', subject: 'پیگیری وضعیت تأیید محصول', category: 'محصولات',
    status: 'OPEN', statusLabel: 'در انتظار پاسخ', statusTone: 'warning', priorityLabel: 'عادی',
    requesterName: 'مدیر شرکت شما', requesterType: 'شرکت', assignee: 'تیم بررسی محصولات', updatedAt: 'امروز، ۱۰:۲۰', unread: true,
    messages: [
      { id: 1, sender: 'مدیر شرکت شما', timestamp: 'امروز، ۰۹:۵۰', body: 'محصول ثبت‌شده هنوز در وضعیت بررسی است. لطفاً زمان تقریبی بررسی را اعلام کنید.' },
      { id: 2, sender: 'تیم پشتیبانی سامانه', timestamp: 'امروز، ۱۰:۲۰', body: 'درخواست شما به کارشناس دسته‌بندی مربوطه ارجاع شد. نتیجه از همین مسیر اطلاع‌رسانی می‌شود.', fromAgent: true },
    ],
  },
  {
    id: 2, code: 'TK-198', subject: 'مشکل در پاسخ به استعلام', category: 'استعلام‌ها',
    status: 'OPEN', statusLabel: 'پاسخ داده‌شده', statusTone: 'success', priorityLabel: 'عادی',
    requesterName: 'کاربر شرکت شما', requesterType: 'شرکت', assignee: 'تیم بازرگانی', updatedAt: 'دیروز',
    messages: [
      { id: 1, sender: 'کاربر شرکت شما', timestamp: 'دیروز، ۱۴:۱۰', body: 'هنگام ارسال پیشنهاد قیمت با خطا مواجه می‌شوم.' },
      { id: 2, sender: 'تیم بازرگانی', timestamp: 'دیروز، ۱۵:۰۰', body: 'مشکل دسترسی برطرف شد. لطفاً دوباره ارسال پیشنهاد را امتحان کنید.', fromAgent: true },
    ],
  },
]
</script>

<template>
  <TicketDeskWorkspace
    title="پشتیبانی و ارتباط با سامانه"
    eyebrow="COMPANY SUPPORT"
    description="صندوق درخواست‌های شرکت و مکالمه با کارشناسان بازارگاه؛ اطلاعات فقط به شرکت شما محدود خواهد بود."
    :stats="stats"
    :tickets="tickets"
    :show-requester-identity="false"
  />
</template>