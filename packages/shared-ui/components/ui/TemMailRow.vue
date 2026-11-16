<script setup>
defineProps({
  sender: { type: String, required: true },
  subject: { type: String, required: true },
  preview: { type: String, default: '' },
  timestamp: { type: String, default: '' },
  initials: { type: String, default: '' },
  avatarColor: { type: String, default: '' },
  unread: { type: Boolean, default: false },
  starred: { type: Boolean, default: false },
  category: { type: String, default: '' },
})
defineEmits(['select', 'toggle-star'])
</script>

<template>
  <article class="tm-mail-row" :class="{ 'tm-mail-row--unread': unread }">
    <button class="tm-mail-row__main" type="button" @click="$emit('select')">
      <span class="tm-mail-row__avatar" :style="avatarColor ? { background: avatarColor } : undefined">{{ initials || sender.slice(0, 1) }}</span>
      <span class="tm-mail-row__content">
        <span class="tm-mail-row__top"><strong>{{ sender }}</strong><time v-if="timestamp">{{ timestamp }}</time></span>
        <span class="tm-mail-row__subject">{{ subject }} <em v-if="category">{{ category }}</em></span>
        <span class="tm-mail-row__preview">{{ preview }}</span>
      </span>
    </button>
    <button class="tm-mail-row__star" type="button" :aria-pressed="starred" :aria-label="starred ? 'حذف نشان ستاره' : 'افزودن نشان ستاره'" @click="$emit('toggle-star')">
      <i :class="starred ? 'pi pi-star-fill' : 'pi pi-star'" aria-hidden="true"></i>
    </button>
  </article>
</template>

<style scoped>
.tm-mail-row{display:flex;align-items:center;gap:12px;padding:13px 15px;border-bottom:1px solid var(--ds-color-border);background:var(--ds-color-surface);min-width:0}
.tm-mail-row--unread{background:var(--ds-color-surface-alt)}
.tm-mail-row__main{display:flex;align-items:center;gap:12px;flex:1;min-width:0;border:0;background:none;text-align:start;color:inherit;font:inherit;cursor:pointer}
.tm-mail-row__avatar{display:grid;place-items:center;width:38px;height:38px;flex:none;border-radius:50%;background:var(--ds-color-primary-soft);color:var(--ds-color-primary);font-size:12px;font-weight:700}
.tm-mail-row__content{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}
.tm-mail-row__top{display:flex;justify-content:space-between;gap:12px;font-size:12px}.tm-mail-row__top strong{font-weight:700}.tm-mail-row__top time{color:var(--ds-color-text-muted);font-size:10px;white-space:nowrap}
.tm-mail-row__subject{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tm-mail-row__subject em{font-style:normal;margin-inline-start:6px;padding:2px 6px;border-radius:4px;background:var(--ds-color-surface-alt);color:var(--ds-color-text-muted);font-size:9px}
.tm-mail-row__preview{font-size:11px;color:var(--ds-color-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tm-mail-row__star{border:0;background:none;color:var(--ds-color-text-muted);padding:7px;cursor:pointer}.tm-mail-row__star[aria-pressed=true]{color:var(--ds-status-warning-fg)}
.tm-mail-row button:focus-visible{outline:2px solid var(--ds-color-focus);outline-offset:2px;border-radius:6px}
</style>