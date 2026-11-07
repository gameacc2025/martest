<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  text: {
    type: String,
    default: 'در حال دریافت داده ها...'
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})

const loaderWidth = computed(() => ({ sm: '250px', md: '360px', lg: '440px' })[props.size])
</script>

<template>
  <div
    v-if="fullscreen"
    class="app-loading app-loading-fullscreen"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="app-loading-content">
      <svg
        class="fiber-loader-svg"
        :style="{ width: loaderWidth }"
        viewBox="0 0 500 240"
        fill="none"
        aria-hidden="true"
      >
        <rect x="35" y="80" width="80" height="80" rx="12" class="fiber-server" />
        <rect x="45" y="95" width="40" height="8" rx="2" class="fiber-cyan" />
        <rect x="45" y="110" width="25" height="8" rx="2" class="fiber-indigo" />
        <circle cx="100" cy="99" r="4" class="fiber-green fiber-node" />
        <polygon points="250,70 290,120 250,170 210,120" class="fiber-core" />
        <rect x="385" y="30" width="65" height="50" rx="8" class="fiber-server" />
        <rect x="385" y="95" width="65" height="50" rx="8" class="fiber-server" />
        <rect x="385" y="160" width="65" height="50" rx="8" class="fiber-server" />
        <path d="M115 120 L210 120 M290 120 L385 55 M290 120 L385 120 M290 120 L385 185" class="fiber-static-line" />
        <path d="M115 120 L210 120" class="fiber-flow fiber-flow-cyan" />
        <path d="M290 120 L385 55" class="fiber-flow fiber-flow-violet" />
        <path d="M290 120 L385 120" class="fiber-flow fiber-flow-cyan fiber-flow-delay" />
        <path d="M290 120 L385 185" class="fiber-flow fiber-flow-cyan fiber-flow-delay-long" />
        <circle cx="250" cy="120" r="7" class="fiber-core-dot" />
      </svg>
      <p v-if="text" class="app-loading-text">{{ text }}</p>
    </div>
  </div>

  <div v-else class="app-loading app-loading-inline" role="status" aria-live="polite" aria-busy="true">
    <svg class="inline-fiber-spinner" viewBox="0 0 48 48" aria-hidden="true">
      <circle class="inline-spinner-track" cx="24" cy="24" r="19" />
      <path class="inline-spinner-flow" d="M24 5a19 19 0 0 1 19 19" />
    </svg>
    <span v-if="text" class="app-loading-text app-loading-text-sm">{{ text }}</span>
  </div>
</template>

<style scoped>
.app-loading-fullscreen {
  position: fixed;
  inset: 0;
  z-index: var(--ds-z-overlay, 1000);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--ds-color-brand-deep, #0A1625);
  color: #FFFFFF;
}
.app-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: min(100%, 500px);
}
.fiber-loader-svg { display: block; max-width: 90vw; height: auto; overflow: visible; }
.fiber-server { fill: var(--ds-color-brand-dark, #122438); stroke: var(--ds-brand-primary); stroke-width: 2.5; }
.fiber-cyan { fill: var(--ds-brand-primary); }
.fiber-indigo { fill: var(--ds-brand-secondary); }
.fiber-green { fill: var(--ds-status-success-fg); }
.fiber-core { fill: var(--ds-color-brand-dark); stroke: var(--ds-brand-accent); stroke-width: 2.5; transform-box: fill-box; transform-origin: center; animation: fiber-core-pulse 2.4s ease-in-out infinite; }
.fiber-core-dot { fill: var(--ds-brand-primary); filter: drop-shadow(0 0 6px var(--ds-brand-primary)); }
.fiber-static-line { stroke: #31506C; stroke-width: 3; stroke-linecap: round; }
.fiber-flow { fill: none; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 15 120; stroke-dashoffset: 135; animation: fiber-data-flow 1.2s linear infinite; }
.fiber-flow-cyan { stroke: var(--ds-brand-primary); }
.fiber-flow-violet { stroke: var(--ds-brand-accent); animation-duration: 1.4s; }
.fiber-flow-delay { animation-duration: 1s; animation-delay: .12s; }
.fiber-flow-delay-long { animation-duration: 1.35s; animation-delay: .28s; }
.fiber-node { transform-box: fill-box; transform-origin: center; animation: fiber-node-pulse 1.5s ease-in-out infinite; }
.app-loading-text { margin: 0; color: var(--ds-brand-primary); font-size: 15px; font-weight: 650; text-align: center; animation: fiber-text-pulse 1.5s ease-in-out infinite alternate; }
.app-loading-inline { display: flex; align-items: center; justify-content: center; gap: 9px; color: var(--ds-color-primary); }
.inline-fiber-spinner { width: 22px; height: 22px; flex: none; animation: fiber-spinner-rotate .9s linear infinite; }
.inline-spinner-track { fill: none; stroke: var(--ds-color-primary-soft); stroke-width: 4; }
.inline-spinner-flow { fill: none; stroke: var(--ds-primary-button); stroke-width: 4; stroke-linecap: round; }
.app-loading-text-sm { color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
@keyframes fiber-data-flow { to { stroke-dashoffset: -135; } }
@keyframes fiber-core-pulse { 50% { transform: scale(1.045); filter: drop-shadow(0 0 10px color-mix(in srgb, var(--ds-brand-accent) 55%, transparent)); } }
@keyframes fiber-node-pulse { 50% { opacity: .45; transform: scale(.72); } }
@keyframes fiber-text-pulse { from { opacity: .48; } to { opacity: 1; } }
@keyframes fiber-spinner-rotate { to { transform: rotate(360deg); } }
@media (max-width: 480px) {
  .app-loading-fullscreen { padding: 16px; }
  .app-loading-text { font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .fiber-core,.fiber-flow,.fiber-node,.app-loading-text,.inline-fiber-spinner { animation: none !important; }
  .fiber-flow { stroke-dashoffset: 0; }
}
</style>
