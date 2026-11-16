<script setup>
defineProps({
  title: { type: String, default: 'دانلود کاتالوگ محصولات' },
  description: { type: String, default: '' },
  buttonLabel: { type: String, default: 'دریافت کاتالوگ' },
  disabled: { type: Boolean, default: true },
  disabledReason: { type: String, default: 'سرویس ارسال کاتالوگ هنوز به فرم متصل نشده است' },
})
</script>

<template>
  <section class="store-catalog-request">
    <div>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <form class="store-catalog-request__form" @submit.prevent>
      <input type="text" name="company" placeholder="نام شرکت" aria-label="نام شرکت" />
      <input type="email" name="email" placeholder="ایمیل سازمانی" aria-label="ایمیل سازمانی" />
      <button type="submit" :disabled="disabled" :title="disabled ? disabledReason : undefined">{{ buttonLabel }}</button>
    </form>
  </section>
</template>

<style scoped>
.store-catalog-request{display:grid;grid-template-columns:1fr 1.2fr;gap:24px;align-items:center;padding:24px 28px;border:1px solid var(--tm-line);border-radius:18px;background:var(--tm-surface)}
.store-catalog-request h2{margin:0;color:var(--tm-ink);font-size:20px}
.store-catalog-request p{margin:4px 0 0;color:var(--tm-muted);font-size:13px}
.store-catalog-request__form{display:flex;gap:8px;flex-wrap:wrap}
.store-catalog-request__form input{flex:1;min-width:150px;height:42px;padding:9px 12px;border:1px solid var(--tm-line);border-radius:10px;background:var(--tm-canvas);color:var(--tm-ink);font:inherit;font-size:12px}
.store-catalog-request__form button{min-height:42px;padding:8px 16px;border:0;border-radius:10px;background:linear-gradient(90deg,var(--tm-violet),var(--tm-blue));color:var(--tm-violet-contrast,#fff);font:inherit;font-size:12px;font-weight:700}
.store-catalog-request__form button:disabled{opacity:.55;cursor:not-allowed}
@media(max-width:900px){.store-catalog-request{grid-template-columns:1fr}}
@media(max-width:560px){.store-catalog-request{padding:18px}.store-catalog-request__form{display:grid;grid-template-columns:1fr}}
</style>
