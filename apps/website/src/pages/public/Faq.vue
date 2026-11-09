<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'
import { useCmsStore } from '../../stores/cms'

const route = useRoute()
const router = useRouter()
const cmsStore = useCmsStore()
const activeFaqIndex = ref(null)
const loading = ref(false)
const error = ref('')
const faqCategories = ref([])
const activeCategory = ref('عمومی')

async function loadFaqs() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([
      cmsStore.fetchFaqs(),
      cmsStore.fetchFaqCategories(),
    ])
    faqCategories.value = cmsStore.faqCategories || []
  } catch (err) {
    error.value = 'دریافت سوالات متداول با خطا مواجه شد'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const faqs = computed(() => cmsStore.activeFaqs)

const filteredFaqs = computed(() => {
  if (activeCategory.value === 'عمومی') return faqs.value
  return faqs.value.filter(f => f.category === activeCategory.value)
})

function toggleFaq(index) {
  activeFaqIndex.value = activeFaqIndex.value === index ? null : index
}

function getCategoryLabel(category) {
  return category || 'عمومی'
}

onMounted(loadFaqs)
</script>

<template>
  <main class="faq-page ds-page" dir="rtl" aria-labelledby="faq-title">
    <div class="faq-container ds-container ds-stack">
      <nav class="faq-breadcrumb" aria-label="مسیر صفحه">
        <router-link :to="{ name: 'home' }">خانه</router-link>
        <i class="pi pi-angle-left" aria-hidden="true"></i>
        <span aria-current="page">سوالات متداول</span>
      </nav>

      <WorkspacePageHeading
        class="faq-hero"
        eyebrow="پشتیبانی و راهنما"
        title="سوالات متداول"
        description="پاسخ پرسش‌های رایج درباره محصولات، دسترسی استعلام و فرایند تأمین."
        icon="pi pi-question-circle"
        heading-id="faq-title"
      />

      <div v-if="loading" class="faq-loading">
        <div class="spinner"></div>
        <p>در حال بارگذاری سوالات متداول...</p>
      </div>

      <div v-else-if="error" class="faq-error">
        <p>{{ error }}</p>
        <button @click="loadFaqs" class="ds-btn ds-btn--primary">تلاش مجدد</button>
      </div>

      <div v-else>
        <div class="faq-categories">
          <button
            v-for="cat in faqCategories"
            :key="cat"
            :class="['faq-category-btn', { active: activeCategory === cat }]"
            @click="activeCategory = cat"
          >
            {{ getCategoryLabel(cat) }}
          </button>
        </div>

        <section class="faq-list" aria-label="فهرست پرسش‌ها">
          <article v-for="(faq, index) in filteredFaqs" :key="index" class="faq-item ds-card" :class="{ 'faq-item--active': activeFaqIndex === index }">
            <h2 class="faq-item__heading">
              <button
                :id="`faq-question-${index}`"
                type="button"
                class="faq-question"
                :aria-expanded="activeFaqIndex === index"
                :aria-controls="`faq-answer-${index}`"
                @click="toggleFaq(index)"
              >
                <span>{{ faq.question }}</span>
                <span class="faq-question__icon" aria-hidden="true">
                  <i class="pi" :class="activeFaqIndex === index ? 'pi-minus' : 'pi-plus'"></i>
                </span>
              </button>
            </h2>
            <div
              v-if="activeFaqIndex === index"
              :id="`faq-answer-${index}`"
              class="faq-answer"
              role="region"
              :aria-labelledby="`faq-question-${index}`"
            >
              <p>{{ faq.answer }}</p>
            </div>
          </article>
          <div v-if="filteredFaqs.length === 0" class="faq-empty">
            <p>سوالی در این دسته‌بندی یافت نشد.</p>
          </div>
        </section>
      </div>

      <footer class="faq-support">
        <div>
          <h2>پاسخ پرسش خود را پیدا نکردید؟</h2>
          <p>سوال خود را برای پشتیبانی ارسال کنید تا راهنمایی مناسب دریافت کنید.</p>
        </div>
        <router-link :to="{ name: 'contact' }" class="ds-btn ds-btn--primary">تماس با ما</router-link>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.faq-page { direction: rtl; }
.faq-container { padding-block: var(--ds-space-8) var(--ds-space-16); }
.faq-breadcrumb { display: flex; align-items: center; gap: var(--ds-space-2); color: var(--ds-color-text-muted); font-size: var(--ds-font-size-sm); }
.faq-breadcrumb a { color: var(--ds-color-primary-text); text-decoration: none; }
.faq-breadcrumb a:hover { text-decoration: underline; }
.faq-hero {
  padding: 0 0 var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border);
}
.faq-hero .ds-lead { max-width: 68ch; margin-bottom: 0; }
.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
}
.faq-item {
  border: 1px solid var(--ds-color-border);
  border-inline-start: 4px solid var(--ds-color-border);
  border-radius: var(--ds-radius-lg, 12px);
  background: var(--ds-color-surface, #fff);
  box-shadow: none;
  transition: border-color var(--ds-transition-fast), background var(--ds-transition-fast);
}
.faq-item__heading { margin: 0; font-size: inherit; }
.faq-item--active { border-color: var(--ds-color-primary); border-inline-start-color: var(--ds-color-primary); background: var(--ds-color-primary-subtle, var(--ds-color-surface)); }
.faq-item--active .faq-question { color: var(--ds-color-primary-text); }
.faq-question {
  display: flex;
  width: 100%;
  min-height: 4rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border: 0;
  background: transparent;
  color: var(--ds-color-text);
  text-align: right;
  font: inherit;
  font-weight: var(--ds-font-weight-semibold);
  cursor: pointer;
  transition: color var(--ds-transition-fast);
}
.faq-question:hover { color: var(--ds-color-primary-text); }
.faq-question:focus-visible {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 3px;
}
.faq-question__icon {
  display: inline-flex;
  flex: 0 0 2rem;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  color: var(--ds-color-text-muted);
}
.faq-answer {
  max-width: 72ch;
  padding: 0 var(--ds-space-4) var(--ds-space-5);
  color: var(--ds-color-text-muted);
  line-height: var(--ds-line-height-relaxed);
}
.faq-answer p { margin: 0; }
.faq-answer .ds-link { display: inline-flex; margin-top: var(--ds-space-3); }
.faq-support {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-5);
  padding: var(--ds-space-5) 0 0;
  border-top: 1px solid var(--ds-color-border);
}
.faq-support h2 {
  margin: 0 0 var(--ds-space-1);
  color: var(--ds-color-text);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-bold);
}
.faq-support p {
  margin: 0;
  color: var(--ds-color-text-muted);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-relaxed);
}
.faq-support .ds-btn { white-space: nowrap; }
@media (max-width: 640px) {
  .faq-support { align-items: flex-start; flex-direction: column; }
  .faq-support .ds-btn { width: 100%; justify-content: center; }
}
</style>
