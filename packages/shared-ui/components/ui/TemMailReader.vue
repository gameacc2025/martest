<script setup>
defineProps({
  subject: { type: String, default: '' },
  sender: { type: String, default: '' },
  senderMeta: { type: String, default: '' },
  timestamp: { type: String, default: '' },
  initials: { type: String, default: '' },
  avatarColor: { type: String, default: '' },
})
</script>

<template>
  <article class="tm-mail-reader">
    <header class="tm-mail-reader__head">
      <div class="tm-mail-reader__subject"><h2>{{ subject }}</h2><time v-if="timestamp">{{ timestamp }}</time></div>
      <div class="tm-mail-reader__sender">
        <span class="tm-mail-reader__avatar" :style="avatarColor ? { background: avatarColor } : undefined">{{ initials || sender.slice(0, 1) }}</span>
        <div><strong>{{ sender }}</strong><small v-if="senderMeta">{{ senderMeta }}</small></div>
        <div v-if="$slots.actions" class="tm-mail-reader__actions"><slot name="actions" /></div>
      </div>
    </header>
    <div class="tm-mail-reader__body"><slot /></div>
    <section v-if="$slots.attachments" class="tm-mail-reader__attachments"><slot name="attachments" /></section>
    <footer v-if="$slots.footer" class="tm-mail-reader__footer"><slot name="footer" /></footer>
  </article>
</template>

<style scoped>
.tm-mail-reader{display:flex;flex-direction:column;min-width:0;height:100%;background:var(--tm-surface)}
.tm-mail-reader__head{padding:20px 22px 16px;border-bottom:1px solid var(--tm-line)}
.tm-mail-reader__subject{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px}
.tm-mail-reader__subject h2{font-size:16px;line-height:1.7;font-weight:700;color:var(--tm-ink);margin:0}
.tm-mail-reader__subject time{font-size:10px;color:var(--tm-muted);white-space:nowrap}
.tm-mail-reader__sender{display:flex;align-items:center;gap:10px}
.tm-mail-reader__avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--tm-blue-soft);color:var(--tm-blue);font-size:12px;font-weight:700}
.tm-mail-reader__sender strong{display:block;font-size:12px}.tm-mail-reader__sender small{display:block;color:var(--tm-muted);font-size:10px;margin-top:3px}
.tm-mail-reader__actions{display:flex;gap:6px;margin-inline-start:auto}
.tm-mail-reader__body{padding:20px 22px;color:var(--tm-ink-soft);font-size:12px;line-height:2}
.tm-mail-reader__attachments{padding:0 22px 18px}.tm-mail-reader__footer{margin-top:auto;padding:13px 22px;border-top:1px solid var(--tm-line);display:flex;justify-content:flex-end;gap:8px}
@media(max-width:640px){.tm-mail-reader__subject{flex-direction:column}.tm-mail-reader__head,.tm-mail-reader__body{padding-inline:14px}}
</style>