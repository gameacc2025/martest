import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiGet, apiGetPaginated, apiPost, apiPatch, apiDelete } from '@telecom/shared-core/http/apiClient'
import { handleApiError } from '@telecom/api-client'
import { endpoints } from '@telecom/api-client'

export const useCompanyStore = defineStore('companies', () => {
  const companies = ref([])
  const currentCompany = ref(null)
  const companySettings = ref(null)
  const companyStatistics = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const total = ref(0)

  // ── List companies with filters ──────────────────────────
  const getCompanies = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      const { data, meta } = await apiGetPaginated(endpoints.companies.list, { params })
      companies.value = data || []
      total.value = meta?.total || 0
      return { data, meta }
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت شرکت‌ها'
      console.error('Error fetching companies:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Get single company by ID ──────────────────────────────
  const getCompanyById = async (id, params = {}) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiGet(endpoints.companies.get(id), { params })
      currentCompany.value = company
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت شرکت'
      console.error('Error fetching company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Create company ────────────────────────────────────────
  const createCompany = async (data) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiPost(endpoints.companies.create, data)
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ایجاد شرکت'
      console.error('Error creating company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Update company ────────────────────────────────────────
  const updateCompany = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiPatch(endpoints.companies.update(id), data)
      currentCompany.value = company
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در ویرایش شرکت'
      console.error('Error updating company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Delete company (soft delete) ──────────────────────────
  const deleteCompany = async (id) => {
    try {
      loading.value = true
      error.value = null
      await apiDelete(endpoints.companies.delete(id))
      return true
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در حذف شرکت'
      console.error('Error deleting company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Restore deleted company ───────────────────────────────
  const restoreCompany = async (id) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiPatch(endpoints.companies.restore(id))
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در بازیابی شرکت'
      console.error('Error restoring company:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Change company status ─────────────────────────────────
  const changeStatus = async (id, status) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiPatch(endpoints.companies.status(id), { status })
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در تغییر وضعیت شرکت'
      console.error('Error changing company status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Toggle verification ──────────────────────────────────
  const toggleVerify = async (id, isVerified) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiPatch(endpoints.companies.verify(id), { isVerified })
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در تغییر وضعیت تأیید شرکت'
      console.error('Error toggling company verification:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Update logo ───────────────────────────────────────────
  const updateLogo = async (id, logo) => {
    try {
      loading.value = true
      error.value = null
      const company = await apiPatch(endpoints.companies.logo(id), { logo })
      return company
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در به‌روزرسانی لوگو'
      console.error('Error updating company logo:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Get company settings ──────────────────────────────────
  const getSettings = async (id) => {
    try {
      loading.value = true
      error.value = null
      const settings = await apiGet(endpoints.companies.settings(id))
      companySettings.value = settings
      return settings
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت تنظیمات شرکت'
      console.error('Error fetching company settings:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Update company settings ───────────────────────────────
  const updateSettings = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      const settings = await apiPatch(endpoints.companies.settings(id), data)
      companySettings.value = settings
      return settings
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در به‌روزرسانی تنظیمات شرکت'
      console.error('Error updating company settings:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Get company statistics ────────────────────────────────
  const getStatistics = async (id) => {
    try {
      loading.value = true
      error.value = null
      const stats = await apiGet(endpoints.companies.statistics(id))
      companyStatistics.value = stats
      return stats
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت آمار شرکت'
      console.error('Error fetching company statistics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Get company products ──────────────────────────────────
  const getCompanyProducts = async (id, params = {}) => {
    try {
      loading.value = true
      error.value = null
      const result = await apiGet(endpoints.companies.products(id), { params })
      return result
    } catch (err) {
      error.value = handleApiError(err).message || 'خطا در دریافت محصولات شرکت'
      console.error('Error fetching company products:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    companies,
    currentCompany,
    companySettings,
    companyStatistics,
    loading,
    error,
    total,
    getCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    deleteCompany,
    restoreCompany,
    changeStatus,
    toggleVerify,
    updateLogo,
    getSettings,
    updateSettings,
    getStatistics,
    getCompanyProducts,
  }
})
