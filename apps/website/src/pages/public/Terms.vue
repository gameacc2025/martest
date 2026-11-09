<script setup>
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { ref, onMounted } from 'vue'
import { useCmsStore } from '../../stores/cms'

const cmsStore = useCmsStore()
const termsContent = ref(null)
const privacyContent = ref(null)
const loading = ref(false)

onMounted(async () => {
  await loadPages()
})

async function loadPages() {
  loading.value = true
  try {
    await Promise.all([
      cmsStore.fetchPageBySlug('terms').then(p => { termsContent.value = p }),
      cmsStore.fetchPageBySlug('privacy').then(p => { privacyContent.value = p })
    ])
  } catch (error) {
    console.error('Failed to load terms/privacy pages:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="terms-page ds-page" dir="rtl" aria-labelledby="terms-title">
    <div class="terms-container ds-container ds-stack">
      <nav class="terms-breadcrumb" aria-label="مسیر صفحه">
        <router-link :to="{ name: 'home' }">خانه</router-link>
        <i class="pi pi-angle-left" aria-hidden="true"></i>
        <span aria-current="page">قوانین و حریم خصوصی</span>
      </nav>

      <WorkspacePageHeading
        class="terms-hero"
        eyebrow="قوانین و شفافیت"
        title="قوانین و حریم خصوصی"
        description="شرایط استفاده از وب‌سایت و توضیحات مربوط به حریم خصوصی را در این صفحه مطالعه کنید."
        icon="pi pi-shield"
        heading-id="terms-title"
      />

      <div v-if="loading" class="terms-loading ds-stack">
        <div class="spinner"></div>
        <p>در حال بارگذاری محتوا...</p>
      </div>

      <div v-else class="terms-sections" aria-label="متن قوانین و حریم خصوصی">
        <section v-if="termsContent" class="terms-section ds-card" aria-labelledby="terms-content-title">
          <h2 id="terms-content-title" class="terms-section__title" style="display:none;">شرایط استفاده</h2>
          <div class="ds-prose" v-html="termsContent.content"></div>
        </section>

        <section v-if="privacyContent" class="terms-section ds-card" aria-labelledby="privacy-content-title">
          <h2 id="privacy-content-title" class="terms-section__title" style="display:none;">سیاست حریم خصوصی</h2>
          <div class="ds-prose" v-html="privacyContent.content"></div>
        </section>

        <div v-if="!termsContent && !privacyContent && !loading" class="terms-empty ds-card">
          <p>محتوا در دسترس نیست. لطفاً بعداً مراجعه کنید.</p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.terms-page { direction: rtl; }
.terms-container { padding-block: var(--ds-space-8) var(--ds-space-16); }
.terms-sections { width: 100%; max-width: 76ch; }
.terms-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
}
.terms-breadcrumb a {
  color: var(--ds-color-primary-text);
  text-decoration: none;
}
.terms-breadcrumb a:hover { text-decoration: underline; }
.terms-hero {
  padding: 0 0 var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border);
}
.terms-hero .ds-lead {
  max-width: 70ch;
  margin-bottom: 0;
}
.terms-sections {
  display: flex;
  flex-direction: column;
}
.terms-section {
  padding: var(--ds-space-5) 0;
  border: 0;
  border-bottom: 1px solid var(--ds-color-border);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.terms-section__title {
  margin: 0 0 var(--ds-space-4);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-bold);
  line-height: var(--ds-line-height-tight);
}
.terms-section p {
  margin: 0;
  color: var(--ds-color-text-muted);
  line-height: var(--ds-line-height-relaxed);
}
.terms-subsections {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
}
.terms-subsections article + article {
  padding-top: var(--ds-space-5);
  border-top: 1px solid var(--ds-color-border);
}
.terms-subsections h3 {
  margin: 0 0 var(--ds-space-2);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
}
.terms-section h2,
.terms-section h3 { scroll-margin-top: 6rem; }
@media (max-width: 640px) {
  .terms-section { padding-block: var(--ds-space-4); }
}

/* Loading & Empty States */
.terms-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: var(--ds-space-4);
  color: var(--ds-color-text-muted);
}

.terms-loading .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--ds-color-border);
  border-top-color: var(--ds-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.terms-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: var(--ds-space-8);
  text-align: center;
  border-color: var(--ds-color-border);
}

.terms-empty p {
  margin: 0;
  color: var(--ds-color-text-muted);
}
</style>
