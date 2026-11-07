<script setup>
import { ref } from 'vue'
import WorkspacePageHeading from '@telecom/shared-ui/components/common/WorkspacePageHeading.vue'

const activeFaqIndex = ref(null)

const faqs = [
  {
    question: 'بازارگاه مخابرات چه خدماتی ارائه می‌کند؟',
    answer: 'این سامانه یک بازارگاه B2B برای پیدا کردن تجهیزات مخابراتی و شبکه، بررسی اطلاعات محصولات منتشرشده و ارتباط با تأمین‌کنندگان از طریق فرایند استعلام است.'
  },
  {
    question: 'چه کسی می‌تواند درخواست استعلام ثبت کند؟',
    answer: 'ثبت درخواست استعلام برای همه کاربران به‌صورت خودکار فعال نیست. حساب شما باید دسترسی لازم را داشته باشد و محدودیت‌ها یا سهمیه اشتراک مربوطه نیز باید اجازه ثبت درخواست را بدهند.'
  },
  {
    question: 'چه کسی می‌تواند به استعلام پاسخ بدهد؟',
    answer: 'پاسخ‌دهی از سوی کاربران شرکتیِ دارای مجوز مربوطه انجام می‌شود. دسترسی و سهمیه پاسخ‌دهی در سمت سامانه بررسی می‌شوند؛ داشتن حساب کاربری به‌تنهایی به معنی داشتن این دسترسی نیست.'
  },
  {
    question: 'اگر قیمت محصول نمایش داده نشود، چه کار کنم؟',
    answer: 'ممکن است قیمت در اطلاعات عمومی محصول ثبت نشده باشد یا لازم باشد شرایط تأمین مشخص شود. اگر دسترسی لازم را داشته باشید، گزینه ثبت استعلام قیمت در صفحه جزئیات محصول در دسترس خواهد بود.'
  },
  {
    question: 'پس از ثبت‌نام شرکت، حساب چه زمانی فعال می‌شود؟',
    answer: 'ثبت‌نام شرکت به‌تنهایی به معنی فعال‌شدن فوری حساب نیست. اطلاعات شرکت باید طبق فرایند بررسی و تأیید سامانه تأیید شود؛ وضعیت حساب را از پیام‌های سامانه یا پشتیبانی پیگیری کنید.'
  },
  {
    question: 'چرا محصولی که ثبت کرده‌ایم هنوز در کاتالوگ عمومی نیست؟',
    answer: 'محصول باید اطلاعات لازم را داشته باشد، برای بررسی ارسال شود، توسط تیم مسئول تأیید شود و سپس شرکت آن را منتشر کند. محصول پیش‌نویس یا در انتظار بررسی در کاتالوگ عمومی نمایش داده نمی‌شود.'
  },
  {
    question: 'آیا برای همه محصولات امکان خرید مستقیم و پرداخت آنلاین وجود دارد؟',
    answer: 'نسخه فعلی بر فرایند B2B و استعلام متمرکز است؛ بنابراین وجود صفحه محصول به معنی فعال‌بودن خرید مستقیم یا پرداخت آنلاین برای آن محصول نیست. برای شرایط تأمین، از اطلاعات محصول و فرایند استعلام استفاده کنید.'
  },
  {
    question: 'چطور با پشتیبانی تماس بگیرم؟',
    answer: 'برای پرسش‌هایی که در این صفحه پاسخ داده نشده‌اند، از صفحه تماس با ما استفاده کنید و شرح مسئله را برای تیم پشتیبانی ارسال کنید.'
  },
]

function toggleFaq(index) {
  activeFaqIndex.value = activeFaqIndex.value === index ? null : index
}
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

      <section class="faq-list" aria-label="فهرست پرسش‌ها">
        <article v-for="(faq, index) in faqs" :key="faq.question" class="faq-item ds-card" :class="{ 'faq-item--active': activeFaqIndex === index }">
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
            v-if="faq.open"
            :id="`faq-answer-${index}`"
            class="faq-answer"
            role="region"
            :aria-labelledby="`faq-question-${index}`"
          >
            <p>{{ faq.answer }}</p>
            <router-link v-if="index === 7" :to="{ name: 'contact' }" class="ds-link">
              رفتن به صفحه تماس با ما <i class="pi pi-arrow-left" aria-hidden="true"></i>
            </router-link>
          </div>
        </article>
      </section>

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
  padding: 0 var(--ds-space-4) var(--ds-space-5);
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
  padding: 0 0 var(--ds-space-5);
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
