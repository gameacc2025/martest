<template>
  <main class="terms-page ds-page" dir="rtl" aria-labelledby="terms-title">
    <div class="terms-container ds-container ds-stack">
      <nav class="terms-breadcrumb" aria-label="مسیر صفحه">
        <router-link :to="{ name: 'home' }">خانه</router-link>
        <i class="pi pi-angle-left" aria-hidden="true"></i>
        <span aria-current="page">قوانین و حریم خصوصی</span>
      </nav>

      <header class="terms-hero ds-card">
        <span class="terms-hero__icon" aria-hidden="true">
          <i class="pi pi-shield"></i>
        </span>
        <div class="terms-hero__copy">
          <span class="ds-eyebrow">اطلاعات و ضوابط</span>
          <h1 id="terms-title" class="ds-h1">قوانین و حریم خصوصی</h1>
          <p class="ds-lead">شرایط استفاده از وب‌سایت و توضیحات مربوط به حریم خصوصی را در این صفحه مطالعه کنید.</p>
        </div>
      </header>

      <div class="terms-sections" aria-label="متن قوانین و حریم خصوصی">
        <section class="terms-section ds-card" aria-labelledby="terms-intro">
          <h2 id="terms-intro" class="terms-section__title">مقدمه</h2>
          <p>
            به بازار آنلاین تجهیزات مخابراتی خوش آمدید. با استفاده از خدمات ما، شما موافقت خود را با شرایط و قوانین زیر اعلام میکنید.
            لطفاً این صفحه را با دقت مطالعه فرمایید.
          </p>
        </section>

        <section class="terms-section ds-card" aria-labelledby="terms-usage">
          <h2 id="terms-usage" class="terms-section__title">شرایط استفاده</h2>
          <div class="terms-subsections">
            <article>
              <h3>1. پذیرش شرایط</h3>
              <p>
                با دسترسی و استفاده از این وبسایت، شما شرایط و قوانین مندرج در این صفحه را میپذیرید.
                اگر با این شرایط موافق نیستید، لطفاً از استفاده از خدمات ما خودداری فرمایید.
              </p>
            </article>

            <article>
              <h3>2. تغییرات در شرایط</h3>
              <p>
                ما حق داریم در هر زمان شرایط استفاده از خدمات را تغییر دهیم. تغییرات از زمان انتشار در این صفحه لازم الاجرا خواهند بود.
                استفاده مستمر شما از خدمات پس از انتشار تغییرات، به منزله پذیرش شرایط جدید تلقی میشود.
              </p>
            </article>

            <article>
              <h3>3. حساب کاربری</h3>
              <p>
                برای استفاده از برخی امکانات وبسایت، نیاز به ایجاد حساب کاربری دارید. شما مسئول حفظ محرمانگی اطلاعات حساب کاربری خود هستید
                و تمامی فعالیتهایی که از طریق حساب کاربری شما انجام میشود، تحت مسئولیت شما خواهد بود.
              </p>
            </article>
          </div>
        </section>

        <section class="terms-section ds-card" aria-labelledby="terms-privacy">
          <h2 id="terms-privacy" class="terms-section__title">حریم خصوصی</h2>
          <div class="terms-subsections">
            <article>
              <h3>1. جمع آوری اطلاعات</h3>
              <p>
                ما ممکن است اطلاعات شخصی شما را به منظور ارائه خدمات بهتر جمع آوری کنیم. این اطلاعات شامل نام، ایمیل، شماره تلفن و سایر اطلاعات تماس میباشد.
              </p>
            </article>

            <article>
              <h3>2. استفاده از اطلاعات</h3>
              <p>
                اطلاعات جمع آوری شده صرفاً برای ارائه خدمات، بهبود تجربه کاربری و ارتباط با شما استفاده میشود.
                ما اطلاعات شما را به اشخاص ثالث بدون رضایت شما منتقل نخواهیم کرد، مگر در مواردی که قانون ما را ملزم به این کار کند.
              </p>
            </article>

            <article>
              <h3>3. امنیت اطلاعات</h3>
              <p>
                ما از تدابیر امنیتی مناسب برای حفاظت از اطلاعات شما استفاده میکنیم. با این حال، هیچ روش انتقال اطلاعات در اینترنت 100% امن نیست
                و ما نمیتوانیم امنیت کامل اطلاعات را تضمین کنیم.
              </p>
            </article>
          </div>
        </section>

        <section class="terms-section ds-card" aria-labelledby="terms-privacy-changes">
          <h2 id="terms-privacy-changes" class="terms-section__title">تغییرات در سیاست حریم خصوصی</h2>
          <p>
            ما حق داریم در هر زمان سیاست حریم خصوصی خود را تغییر دهیم. تغییرات از زمان انتشار در این صفحه لازم الاجرا خواهند بود.
            توصیه میکنیم به طور منظم این صفحه را بررسی کنید تا از آخرین تغییرات مطلع شوید.
          </p>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.terms-page { direction: rtl; }
.terms-container { padding-block: var(--ds-space-8) var(--ds-space-16); }
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
  display: flex;
  align-items: center;
  gap: var(--ds-space-5);
  padding: clamp(1.25rem, 4vw, 2.5rem);
  background: linear-gradient(120deg, var(--ds-color-surface), var(--ds-color-surface-hover));
}
.terms-hero__icon {
  display: flex;
  flex: 0 0 4rem;
  width: 4rem;
  height: 4rem;
  align-items: center;
  justify-content: center;
  border-radius: var(--ds-radius-xl);
  background: var(--ds-color-brand-dark);
  color: var(--ds-color-on-brand);
  font-size: 1.75rem;
}
.terms-hero__copy { min-width: 0; }
.terms-hero .ds-lead { max-width: 70ch; }
.terms-sections {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}
.terms-section { padding: clamp(1.25rem, 3vw, 2rem); }
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
@media (max-width: 640px) {
  .terms-hero { align-items: flex-start; }
  .terms-hero__icon {
    flex-basis: 3rem;
    width: 3rem;
    height: 3rem;
    font-size: 1.35rem;
  }
}
</style>
