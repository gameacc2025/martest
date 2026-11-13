<script setup>
import TicketDeskWorkspace from '@telecom/shared-ui/components/operations/TicketDeskWorkspace.vue'
</script>

<template>
  <TicketDeskWorkspace
    title="پشتیبانی و تیکت‌های من"
    eyebrow="CUSTOMER SUPPORT"
    description="ثبت تیکت، مکالمه با تیم پشتیبانی و پیگیری درخواست‌های حساب کاربری و سفارش‌ها."
    :show-requester-identity="false"
  />
</template>
