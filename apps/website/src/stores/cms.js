import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cmsArticlesApi, cmsCategoriesApi, cmsTagsApi, cmsFaqsApi, cmsPagesApi } from '@telecom/api-client'

export const useCmsStore = defineStore('cms', () => {
  const articles = ref([])
  const featuredArticles = ref([])
  const article = ref(null)
  const articlesLoading = ref(false)
  const articlesError = ref('')

  const categories = ref([])
  const categoriesLoading = ref(false)

  const tags = ref([])
  const tagsLoading = ref(false)

  const faqs = ref([])
  const faqCategories = ref([])
  const faqsLoading = ref(false)

  const pages = ref({})
  const pagesLoading = ref(false)

  const publishedArticles = computed(() => articles.value.filter(a => a.status === 'PUBLISHED'))
  const publishedCategories = computed(() => categories.value.filter(c => c.isActive))
  const publishedTags = computed(() => tags.value)
  const activeFaqs = computed(() => faqs.value.filter(f => f.isActive))

  async function fetchArticles(params = {}) {
    articlesLoading.value = true
    articlesError.value = ''
    try {
      const response = await cmsArticlesApi.list(params)
      const data = response.data?.data ?? response.data ?? response
      articles.value = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
      return articles.value
    } catch (error) {
      articlesError.value = error.message || 'دریافت مقالات با خطا مواجه شد'
      throw error
    } finally {
      articlesLoading.value = false
    }
  }

  async function fetchFeaturedArticles(limit = 3) {
    try {
      const response = await cmsArticlesApi.list({ limit, featured: true, page: 1 })
      const data = response.data?.data ?? response.data ?? response
      featuredArticles.value = Array.isArray(data) ? data.slice(0, limit) : (data?.items ?? data?.data ?? []).slice(0, limit)
      return featuredArticles.value
    } catch (error) {
      console.error('Failed to fetch featured articles:', error)
      return []
    }
  }

  async function fetchArticleBySlug(slug) {
    articlesLoading.value = true
    articlesError.value = ''
    try {
      const response = await cmsArticlesApi.getBySlug(slug)
      article.value = response.data?.data ?? response.data ?? response
      return article.value
    } catch (error) {
      articlesError.value = error.message || 'دریافت مقاله با خطا مواجه شد'
      throw error
    } finally {
      articlesLoading.value = false
    }
  }

async function fetchCategories() {
    categoriesLoading.value = true
    try {
      const response = await cmsCategoriesApi.list()
      const data = response.data?.data ?? response.data ?? response
      categories.value = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
      return categories.value
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    } finally {
      categoriesLoading.value = false
    }
  }

  async function fetchTags() {
    tagsLoading.value = true
    try {
      const response = await cmsTagsApi.list()
      const data = response.data?.data ?? response.data ?? response
      tags.value = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
      return tags.value
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      return []
    } finally {
      tagsLoading.value = false
    }
  }

  async function fetchFaqs(params = {}) {
    faqsLoading.value = true
    try {
      const response = await cmsFaqsApi.list(params)
      const data = response.data?.data ?? response.data ?? response
      faqs.value = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
      return faqs.value
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
      return []
    } finally {
      faqsLoading.value = false
    }
  }

  async function fetchFaqCategories() {
    try {
      const response = await cmsFaqsApi.listCategories()
      const data = response.data?.data ?? response.data ?? response
      faqCategories.value = Array.isArray(data) ? data.map(d => d.category).filter(Boolean) : []
      return faqCategories.value
    } catch (error) {
      console.error('Failed to fetch FAQ categories:', error)
      return []
    }
  }

  async function fetchPages() {
    pagesLoading.value = true
    try {
      const response = await cmsPagesApi.list()
      const data = response.data?.data ?? response.data ?? response
      const pageList = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
      pages.value = Object.fromEntries(pageList.map(p => [p.slug, p]))
      return pages.value
    } catch (error) {
      console.error('Failed to fetch pages:', error)
      return {}
    } finally {
      pagesLoading.value = false
    }
  }

  async function fetchPageBySlug(slug) {
    pagesLoading.value = true
    try {
      const response = await cmsPagesApi.getBySlug(slug)
      const page = response.data?.data ?? response.data ?? response
      pages.value[slug] = page
      return page
    } catch (error) {
      console.error('Failed to fetch page:', error)
      throw error
    } finally {
      pagesLoading.value = false
    }
  }

  function getPage(slug) {
    return pages.value[slug] || null
  }

  function getCategoryBySlug(slug) {
    return categories.value.find(c => c.slug === slug) || null
  }

  function getTagBySlug(slug) {
    return tags.value.find(t => t.slug === slug) || null
  }

  return {
    articles,
    featuredArticles,
    article,
    articlesLoading,
    articlesError,
    categories,
    categoriesLoading,
    tags,
    tagsLoading,
    faqs,
    faqCategories,
    faqsLoading,
    pages,
    pagesLoading,
    publishedArticles,
    publishedCategories,
    publishedTags,
    activeFaqs,
    fetchArticles,
    fetchFeaturedArticles,
    fetchArticleBySlug,
    fetchCategories,
    fetchTags,
    fetchFaqs,
    fetchFaqCategories,
    fetchPages,
    fetchPageBySlug,
    getPage,
    getCategoryBySlug,
    getTagBySlug,
  }
})
