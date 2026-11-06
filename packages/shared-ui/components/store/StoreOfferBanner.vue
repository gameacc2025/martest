<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  note: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  actionTo: { type: [String, Object], default: null },
})
</script>

<template>
  <section class="store-offer-banner">
    <div class="store-offer-banner__copy">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      <small v-if="note">{{ note }}</small>
    </div>
    <router-link v-if="actionTo && actionLabel" :to="actionTo" class="store-offer-banner__action">{{ actionLabel }}</router-link>
  </section>
</template>

<style scoped>
.store-offer-banner{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:22px 28px;border-radius:18px;background:linear-gradient(100deg,#7b2ff7,#2aa7e8);color:#fff}
.store-offer-banner h2{margin:0;color:#fff;font-size:20px}
.store-offer-banner p{margin:2px 0;color:#fff;font-size:13px}
.store-offer-banner small{color:rgba(255,255,255,.86);font-size:11px}
.store-offer-banner__action{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:9px 18px;border-radius:10px;background:#fff;color:#4b3bd6;font-size:13px;font-weight:700;text-decoration:none}
@media(max-width:560px){.store-offer-banner{padding:20px}}
</style>
