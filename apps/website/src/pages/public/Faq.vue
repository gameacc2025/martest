<template>
  <div class="faq-page">
    <div class="faq-container">
      <h1 class="faq-heading">سوالات متداول</h1>

      <div class="faq-list">
        <div v-for="(faq, index) in faqs" :key="index" class="faq-item">
          <button
            type="button"
            class="faq-question"
            :aria-expanded="faq.open"
            @click="toggleFaq(index)"
          >
            <h3>{{ faq.question }}</h3>
            <i class="pi" :class="faq.open ? 'pi-minus' : 'pi-plus'" aria-hidden="true"></i>
          </button>

          <div v-if="faq.open" class="faq-answer">
            <p>{{ faq.answer }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const faqs = ref([
  {
    question: 'چگونه میتوانم محصول مورد نظر خود را پیدا کنم؟',
    answer: 'شما میتوانید از طریق بخش جستجو در بالای صفحه، محصول مورد نظر خود را جستجو کنید. همچنین میتوانید از طریق دسته بندیها و فیلترهای موجود، محصولات را بر اساس نیاز خود فیلتر کنید.',
    open: false
  },
  {
    question: 'آیا امکان بازگشت کالا وجود دارد؟',
    answer: 'بله، در صورتی که محصول دریافتی شما با مشخصات ذکر شده مغایرت داشته باشد یا در حین حمل و نقل آسیب دیده باشد، میتوانید درخواست بازگشت کالا دهید. لطفاً ظرف ۷ روز پس از دریافت کالا با پشتیبانی تماس بگیرید.',
    open: false
  },
  {
    question: 'چگونه میتوانم سفارش خود را پیگیری کنم؟',
    answer: 'پس از ثبت سفارش، یک کد پیگیری به شما داده میشود. میتوانید با ورود به بخش "سفارشات من" در پروفایل کاربری خود، وضعیت سفارش را مشاهده کنید. همچنین لینک پیگیری به ایمیل شما ارسال خواهد شد.',
    open: false
  },
  {
    question: 'آیا امکان خرید اقساطی وجود دارد؟',
    answer: 'بله، برخی از محصولات امکان خرید اقساطی را دارند. در صفحه جزئیات محصول، اگر امکان خرید اقساطی وجود داشته باشد، گزینه مربوطه نمایش داده خواهد شد.',
    open: false
  },
  {
    question: 'چگونه میتوانم با فروشنده محصول تماس بگیرم؟',
    answer: 'در صفحه جزئیات هر محصول، اطلاعات تماس فروشنده در دسترس است. همچنین میتوانید از طریق بخش "تماس با ما" با فروشنده یا پشتیبانی بازار تماس بگیرید.',
    open: false
  }
])

const toggleFaq = (index) => {
  faqs.value[index].open = !faqs.value[index].open
}
</script>

<style scoped>
.faq-page {
  min-height: calc(100vh - 200px);
  padding: 2rem 1rem;
}

.faq-container {
  max-width: 56rem;
  margin: 0 auto;
}

.faq-heading {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 2rem 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem;
  background: var(--surface-ground);
  border: none;
  border-radius: var(--content-border-radius);
  cursor: pointer;
  text-align: right;
  font: inherit;
  color: var(--text-color);
}

.faq-question:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.faq-question h3 {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--text-color);
  margin: 0;
}

.faq-answer {
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 0 0 var(--content-border-radius) var(--content-border-radius);
  border: 1px solid var(--surface-border);
  border-top: none;
}

.faq-answer p {
  color: var(--text-color-secondary);
  margin: 0;
}
</style>
