<script setup>
defineProps({
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'فعالیتی برای نمایش وجود ندارد.' },
})
</script>

<template>
  <ol v-if="loading" class="tm-activity-timeline tm-activity-timeline--loading" aria-label="در حال بارگذاری فعالیت‌ها">
    <li v-for="i in 4" :key="i"><span></span><div><i></i><i></i></div></li>
  </ol>
  <ol v-else-if="events.length" class="tm-activity-timeline">
    <li v-for="(event, index) in events" :key="event.id || index">
      <span class="tm-activity-timeline__marker" :class="event.tone ? 'tm-activity-timeline__marker--' + event.tone : ''"><i :class="event.icon || 'pi pi-circle-fill'" aria-hidden="true"></i></span>
      <div class="tm-activity-timeline__content">
        <strong>{{ event.title }}</strong>
        <p v-if="event.description">{{ event.description }}</p>
        <small v-if="event.timestamp">{{ event.timestamp }}</small>
      </div>
      <slot name="action" :event="event" />
    </li>
  </ol>
  <div v-else class="tm-activity-timeline__empty">{{ emptyMessage }}</div>
</template>

<style scoped>
.tm-activity-timeline{list-style:none;margin:0;padding:2px 0;display:flex;flex-direction:column}
.tm-activity-timeline li{display:flex;align-items:flex-start;gap:12px;position:relative;padding:0 0 18px;min-width:0}
.tm-activity-timeline li:not(:last-child):before{content:'';position:absolute;top:25px;bottom:0;inset-inline-start:12px;width:1px;background:var(--tm-line)}
.tm-activity-timeline__marker{display:grid;place-items:center;width:25px;height:25px;flex:none;border-radius:50%;background:var(--tm-blue-soft);color:var(--tm-blue);font-size:10px;z-index:1}
.tm-activity-timeline__marker--success{background:var(--tm-green-soft);color:#0c8a6e}.tm-activity-timeline__marker--warning{background:var(--tm-amber-soft);color:#a86c05}.tm-activity-timeline__marker--danger{background:var(--tm-red-soft);color:#c92f2f}
.tm-activity-timeline__content{flex:1;min-width:0}.tm-activity-timeline__content strong{display:block;font-size:12px;font-weight:600}.tm-activity-timeline__content p{margin:4px 0;color:var(--tm-ink-soft);font-size:11px;line-height:1.7}.tm-activity-timeline__content small{color:var(--tm-muted);font-size:10px}
.tm-activity-timeline__empty{padding:22px;text-align:center;color:var(--tm-muted);font-size:12px}
.tm-activity-timeline--loading li span{width:25px;height:25px;border-radius:50%;background:var(--tm-surface-sunk)}.tm-activity-timeline--loading li div{flex:1}.tm-activity-timeline--loading i{display:block;height:10px;width:65%;margin:6px 0;border-radius:5px;background:var(--tm-surface-sunk)}
</style>