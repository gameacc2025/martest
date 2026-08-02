<script setup>
/**
 * EntityList — compact list used for "Latest Companies / Users / Products".
 *
 * Generic and presentational: the parent maps its real API rows into a simple
 * item shape and passes them in. Handles loading (skeleton) and empty states.
 * Token-driven; no hardcoded colors, no fabricated data.
 *
 * item shape:
 *   { id, title, subtitle?, avatar?, initial?, icon?, meta?, badge?, badgeTone?, to? }
 */
defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  // Number of skeleton rows while loading.
  skeletonRows: { type: Number, default: 5 },
  emptyMessage: { type: String, default: 'موردی برای نمایش وجود ندارد.' },
})

const toneClass = (tone) => `entity-badge--${tone || 'gray'}`
</script>

<template>
  <div class="entity-list">
    <!-- Loading skeletons -->
    <template v-if="loading">
      <div v-for="n in skeletonRows" :key="`sk-${n}`" class="entity-row entity-row--skeleton">
        <span class="entity-avatar entity-skeleton"></span>
        <div class="entity-main">
          <span class="entity-skeleton entity-skeleton-line"></span>
          <span class="entity-skeleton entity-skeleton-line entity-skeleton-line--sm"></span>
        </div>
      </div>
    </template>

    <!-- Empty -->
    <div v-else-if="!items.length" class="entity-empty">
      <i class="pi pi-inbox"></i>
      <span>{{ emptyMessage }}</span>
    </div>

    <!-- Rows -->
    <template v-else>
      <component
        :is="item.to ? 'router-link' : 'div'"
        v-for="item in items"
        :key="item.id"
        :to="item.to || undefined"
        class="entity-row"
        :class="{ 'entity-row--link': item.to }"
      >
        <span class="entity-avatar">
          <img v-if="item.avatar" :src="item.avatar" :alt="item.title" />
          <i v-else-if="item.icon" :class="item.icon"></i>
          <span v-else>{{ item.initial || (item.title || '?').charAt(0) }}</span>
        </span>

        <div class="entity-main">
          <span class="entity-title">{{ item.title }}</span>
          <span v-if="item.subtitle" class="entity-subtitle">{{ item.subtitle }}</span>
        </div>

        <div class="entity-side">
          <span
            v-if="item.badge"
            class="entity-badge"
            :class="toneClass(item.badgeTone)"
          >{{ item.badge }}</span>
          <span v-if="item.meta" class="entity-meta">{{ item.meta }}</span>
        </div>
      </component>
    </template>
  </div>
</template>

<style scoped>
.entity-list {
  display: flex;
  flex-direction: column;
}

.entity-row {
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) 0;
  border-bottom: 1px solid var(--ds-color-border);
  text-decoration: none;
  color: inherit;
}

.entity-row:last-child {
  border-bottom: none;
}

.entity-row--link {
  cursor: pointer;
  transition: background-color var(--ds-transition);
  margin: 0 calc(-1 * var(--ds-space-2));
  padding-inline: var(--ds-space-2);
  border-radius: var(--ds-radius-sm);
}

.entity-row--link:hover {
  background: var(--ds-color-surface-hover);
}

.entity-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-info-soft);
  color: var(--ds-color-primary);
  font-weight: var(--ds-font-weight-bold);
  overflow: hidden;
  flex-shrink: 0;
}

.entity-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.entity-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.entity-title {
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-subtitle {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entity-side {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-shrink: 0;
}

.entity-meta {
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-muted);
  white-space: nowrap;
}

.entity-badge {
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  padding: 0.15rem 0.5rem;
  border-radius: var(--ds-radius-pill);
}

.entity-badge--success { background: var(--ds-color-success-soft); color: var(--ds-color-success); }
.entity-badge--warning { background: var(--ds-color-warning-soft); color: var(--ds-color-warning); }
.entity-badge--danger  { background: var(--ds-color-danger-soft);  color: var(--ds-color-danger); }
.entity-badge--info    { background: var(--ds-color-info-soft);    color: var(--ds-color-info); }
.entity-badge--gray    { background: var(--ds-color-surface-alt);  color: var(--ds-color-text-muted); }

/* Empty state */
.entity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-8) 0;
  color: var(--ds-color-text-muted);
}

.entity-empty i {
  font-size: var(--ds-font-size-2xl);
}

/* Skeleton */
.entity-skeleton {
  background: var(--ds-color-surface-alt);
  border-radius: var(--ds-radius-sm);
  animation: entity-pulse 1.2s ease-in-out infinite;
}

.entity-skeleton-line {
  height: 0.75rem;
  width: 70%;
  margin-bottom: var(--ds-space-2);
}

.entity-skeleton-line--sm {
  width: 45%;
  margin-bottom: 0;
}

@keyframes entity-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
