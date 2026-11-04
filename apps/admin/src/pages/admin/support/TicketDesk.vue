<script setup>
import TicketDeskWorkspace from '@telecom/shared-ui/components/operations/TicketDeskWorkspace.vue'

const stats = [
  { label: 'تیکت‌های باز', value: 74, icon: 'pi pi-inbox', tone: 'primary', meta: 'تمام صف‌های پشتیبانی' },
  { label: 'اولویت بالا', value: 9, icon: 'pi pi-exclamation-triangle', tone: 'danger', meta: 'نیازمند رسیدگی فوری' },
  { label: 'در انتظار پاسخ کارشناس', value: 21, icon: 'pi pi-clock', tone: 'warning', meta: 'صف پاسخ‌گویی' },
  { label: 'میانگین پاسخ', value: '۲٫۴ ساعت', icon: 'pi pi-stopwatch', tone: 'success', meta: 'شاخص نمونه SLA' },
]
const tickets = [
  {
    id: 1, code: 'TK-4021', subject: 'مشکل ثبت سفارش و پرداخت', category: 'سفارش خرده‌فروشی',
    status: 'OPEN', statusLabel: 'اولویت بالا', statusTone: 'danger', priorityLabel: 'فوری',
    requesterName: 'مهدی رضایی', requesterType: 'مشتری', assignee: 'سارا محمدی', updatedAt: '۱۰ دقیقه پیش', unread: true,
    messages: [
      { id: 1, sender: 'مهدی رضایی', timestamp: 'امروز، ۰۹:۴۰', body: 'پرداخت از حساب من کسر شده اما سفارش در پنل هنوز در انتظار پرداخت نمایش داده می‌شود. لطفاً بررسی کنید.' },
      { id: 2, sender: 'سارا محمدی · پشتیبانی', timestamp: 'امروز، ۰۹:۵۲', body: 'درخواست شما دریافت شد. شناسه پرداخت را با سوابق درگاه تطبیق می‌دهیم و نتیجه را اعلام می‌کنیم.', fromAgent: true },
      { id: 3, sender: 'یادداشت تیم مالی', timestamp: 'امروز، ۱۰:۰۰', body: 'قبل از پاسخ نهایی، callback درگاه و شناسه idempotency بررسی شود.', internal: true },
    ],
  },
  {
    id: 2, code: 'TK-4018', subject: 'تکمیل مدارک و احراز شرکت', category: 'حساب شرکت',
    status: 'OPEN', statusLabel: 'در انتظار پاسخ', statusTone: 'warning', priorityLabel: 'عادی',
    requesterName: 'شرکت پارس شبکه', requesterType: 'شرکت', assignee: 'علی مرادی', updatedAt: '۳۵ دقیقه پیش',
    messages: [
      { id: 1, sender: 'نماینده شرکت پارس شبکه', timestamp: 'امروز، ۰۸:۵۰', body: 'مدارک تکمیلی را بارگذاری کرده‌ایم. آیا برای تأیید نهایی مورد دیگری نیاز است؟' },
      { id: 2, sender: 'علی مرادی · پشتیبانی', timestamp: 'امروز، ۰۹:۱۰', body: 'مدارک دریافت شد و برای بررسی به واحد احراز هویت ارجاع شده است.', fromAgent: true },
    ],
  },
  {
    id: 3, code: 'TK-4004', subject: 'بازیابی دسترسی حساب کاربری', category: 'حساب کاربری',
    status: 'CLOSED', statusLabel: 'بسته‌شده', statusTone: 'success', priorityLabel: 'عادی',
    requesterName: 'کاربر خریدار', requesterType: 'مشتری', assignee: 'سارا محمدی', updatedAt: 'دیروز',
    messages: [
      { id: 1, sender: 'کاربر خریدار', timestamp: 'دیروز، ۱۲:۱۰', body: 'دسترسی حسابم بازیابی شد. ممنون از راهنمایی شما.' },
      { id: 2, sender: 'سارا محمدی · پشتیبانی', timestamp: 'دیروز، ۱۲:۲۰', body: 'خوشحالیم که مشکل برطرف شد. تیکت بسته شد.', fromAgent: true },
    ],
  },
]
</script>

<template>
  <TicketDeskWorkspace
    title="مرکز پشتیبانی و تیکت‌ها"
    eyebrow="ADMIN SUPPORT DESK"
    description="صندوق یکپارچه درخواست‌های مشتریان و شرکت‌ها، مکالمه‌ها، ارجاع کارشناسی و کنترل SLA."
    :stats="stats"
    :tickets="tickets"
    show-internal-notes
  />
</template>