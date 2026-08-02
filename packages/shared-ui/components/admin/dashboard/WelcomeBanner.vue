<script setup>
/**
 * WelcomeBanner — greeting header for the admin command center.
 *
 * Presentational: shows a localized greeting, the admin's name, and the current
 * date. The name is passed in by the parent (which reads it from the auth store)
 * so this component stays free of store/API coupling.
 */
import { computed } from 'vue'

defineProps({
  name: { type: String, default: '' },
  subtitle: { type: String, default: 'مرکز فرماندهی بازار عمده‌فروشی مخابرات' },
})

// Time-of-day greeting in Persian.
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'صبح بخیر'
  if (h < 17) return 'ظهر بخیر'
  if (h < 20) return 'عصر بخیر'
  return 'شب بخیر'
})

const today = computed(() =>
  new Date().toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
)
</script>

<template>
  <section class="welcome-banner">
    <div class="welcome-banner-content">
      <span class="welcome-banner-date">
        <i class="pi pi-calendar"></i> {{ today }}
      </span>
      <h1 class="welcome-banner-title">
        {{ greeting }}<template v-if="name">، {{ name }}</template>
      </h1>
      <p class="welcome-banner-subtitle">{{ subtitle }}</p>
    </div>
    <div class="welcome-banner-glyph" aria-hidden="true">
      <i class="pi pi-th-large"></i>
    </div>
  </section>
</template>

<style scoped>
.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-8);
  border-radius: var(--ds-radius-lg);
  background: linear-gradient(
    135deg,
    var(--ds-color-primary) 0%,
    var(--ds-color-primary-active) 100%
  );
  color: var(--ds-color-primary-contrast);
  overflow: hidden;
  position: relative;
}

.welcome-banner-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.welcome-banner-date {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  font-size: var(--ds-font-size-sm);
  opacity: 0.9;
  margin-bottom: var(--ds-space-2);
}

.welcome-banner-title {
  font-size: var(--ds-font-size-2xl);
  font-weight: var(--ds-font-weight-bold);
  margin: 0 0 var(--ds-space-1);
  color: var(--ds-color-primary-contrast);
}

.welcome-banner-subtitle {
  font-size: var(--ds-font-size-md);
  opacity: 0.9;
  margin: 0;
}

.welcome-banner-glyph {
  font-size: 6rem;
  opacity: 0.15;
  flex-shrink: 0;
  line-height: 1;
}

@media (max-width: 640px) {
  .welcome-banner {
    padding: var(--ds-space-6);
  }
  .welcome-banner-glyph {
    display: none;
  }
  .welcome-banner-title {
    font-size: var(--ds-font-size-xl);
  }
}
</style>
