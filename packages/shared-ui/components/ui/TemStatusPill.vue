<script setup>
/**
 * TemStatusPill — single status vocabulary for every list and detail view.
 *
 * Pass either a known `status` key (mapped to a Persian label + tone) or an
 * explicit `label`/`tone` pair. Unknown values fall back to a neutral pill
 * and are displayed verbatim — never invent a meaning for an unknown state.
 */
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: '' },
  label: { type: String, default: '' },
  tone: { type: String, default: '' },
})

const MAP = {
  // generic
  ACTIVE: { label: 'فعال', tone: 'success' },
  INACTIVE: { label: 'غیرفعال', tone: 'neutral' },
  PENDING: { label: 'در انتظار', tone: 'warning' },
  APPROVED: { label: 'تأیید شده', tone: 'info' },
  REJECTED: { label: 'رد شده', tone: 'danger' },
  SUSPENDED: { label: 'تعلیق‌شده', tone: 'danger' },
  BLOCKED: { label: 'مسدود', tone: 'danger' },
  VERIFIED: { label: 'احرازشده', tone: 'success' },
  UNVERIFIED: { label: 'احرازنشده', tone: 'warning' },
  DRAFT: { label: 'پیش‌نویس', tone: 'neutral' },
  PENDING_REVIEW: { label: 'در انتظار تأیید', tone: 'warning' },
  HIDDEN: { label: 'پنهان', tone: 'neutral' },
  PUBLISHED: { label: 'منتشر شده', tone: 'success' },
  ARCHIVED: { label: 'بایگانی', tone: 'danger' },

  // inquiries
  SUBMITTED: { label: 'ارسال‌شده', tone: 'info' },
  OPEN: { label: 'باز', tone: 'info' },
  IN_PROGRESS: { label: 'در حال بررسی', tone: 'warning' },
  RESPONDED: { label: 'پاسخ داده‌شده', tone: 'success' },
  CLOSED: { label: 'بسته‌شده', tone: 'neutral' },
  EXPIRED: { label: 'منقضی‌شده', tone: 'danger' },
  CANCELLED: { label: 'لغوشده', tone: 'danger' },
  COMPLETED: { label: 'تکمیل‌شده', tone: 'success' },

  // orders / payments
  PAID: { label: 'پرداخت‌شده', tone: 'success' },
  UNPAID: { label: 'پرداخت‌نشده', tone: 'warning' },
  FAILED: { label: 'ناموفق', tone: 'danger' },
  REFUNDED: { label: 'بازگشت داده‌شده', tone: 'info' },

  // company verification
  PENDING_VERIFICATION: { label: 'در انتظار تأیید', tone: 'warning' },
}

const resolved = computed(() => {
  const key = (props.status || '').toUpperCase()
  const known = MAP[key]
  return {
    label: props.label || known?.label || props.status || '—',
    tone: props.tone || known?.tone || 'neutral',
  }
})
</script>

<template>
  <span class="tm-pill" :class="`tm-pill--${resolved.tone}`">{{ resolved.label }}</span>
</template>