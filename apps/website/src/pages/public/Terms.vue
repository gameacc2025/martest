<template>
  <div class="terms-page">
    <div class="terms-container">
      <h1 class="terms-heading">قوانین و حریم خصوصی</h1>

      <div class="terms-sections">
        <section>
          <h2>مقدمه</h2>
          <p>
            به بازار آنلاین تجهیزات مخابراتی خوش آمدید. با استفاده از خدمات ما، شما موافقت خود را با شرایط و قوانین زیر اعلام میکنید.
            لطفاً این صفحه را با دقت مطالعه فرمایید.
          </p>
        </section>

        <section>
          <h2>شرایط استفاده</h2>
          <div class="terms-subsections">
            <div>
              <h3>1. پذیرش شرایط</h3>
              <p>
                با دسترسی و استفاده از این وبسایت، شما شرایط و قوانین مندرج در این صفحه را میپذیرید.
                اگر با این شرایط موافق نیستید، لطفاً از استفاده از خدمات ما خودداری فرمایید.
              </p>
            </div>

            <div>
              <h3>2. تغییرات در شرایط</h3>
              <p>
                ما حق داریم در هر زمان شرایط استفاده از خدمات را تغییر دهیم. تغییرات از زمان انتشار در این صفحه لازم الاجرا خواهند بود.
                استفاده مستمر شما از خدمات پس از انتشار تغییرات، به منزله پذیرش شرایط جدید تلقی میشود.
              </p>
            </div>

            <div>
              <h3>3. حساب کاربری</h3>
              <p>
                برای استفاده از برخی امکانات وبسایت، نیاز به ایجاد حساب کاربری دارید. شما مسئول حفظ محرمانگی اطلاعات حساب کاربری خود هستید
                و تمامی فعالیتهایی که از طریق حساب کاربری شما انجام میشود، تحت مسئولیت شما خواهد بود.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>حریم خصوصی</h2>
          <div class="terms-subsections">
            <div>
              <h3>1. جمع آوری اطلاعات</h3>
              <p>
                ما ممکن است اطلاعات شخصی شما را به منظور ارائه خدمات بهتر جمع آوری کنیم. این اطلاعات شامل نام، ایمیل، شماره تلفن و سایر اطلاعات تماس میباشد.
              </p>
            </div>

            <div>
              <h3>2. استفاده از اطلاعات</h3>
              <p>
                اطلاعات جمع آوری شده صرفاً برای ارائه خدمات، بهبود تجربه کاربری و ارتباط با شما استفاده میشود.
                ما اطلاعات شما را به اشخاص ثالث بدون رضایت شما منتقل نخواهیم کرد، مگر در مواردی که قانون ما را ملزم به این کار کند.
              </p>
            </div>

            <div>
              <h3>3. امنیت اطلاعات</h3>
              <p>
                ما از تدابیر امنیتی مناسب برای حفاظت از اطلاعات شما استفاده میکنیم. با این حال، هیچ روش انتقال اطلاعات در اینترنت 100% امن نیست
                و ما نمیتوانیم امنیت کامل اطلاعات را تضمین کنیم.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>تغییرات در سیاست حریم خصوصی</h2>
          <p>
            ما حق داریم در هر زمان سیاست حریم خصوصی خود را تغییر دهیم. تغییرات از زمان انتشار در این صفحه لازم الاجرا خواهند بود.
            توصیه میکنیم به طور منظم این صفحه را بررسی کنید تا از آخرین تغییرات مطلع شوید.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
// No additional logic needed for static terms page
</script>

<style scoped>
.terms-page {
  min-height: calc(100vh - 200px);
  padding: 2rem 1rem;
}

.terms-container {
  max-width: 56rem;
  margin: 0 auto;
}

.terms-heading {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 2rem 0;
}

.terms-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.terms-sections h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1rem 0;
}

.terms-sections h3 {
  font-weight: 500;
  color: var(--text-color);
  margin: 0;
}

.terms-sections p {
  color: var(--text-color-secondary);
  line-height: 1.7;
  margin: 0.5rem 0 0 0;
}

.terms-sections > section > p {
  margin-top: 0;
}

.terms-subsections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>