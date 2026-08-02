import { defineStore } from 'pinia'
import { ref } from 'vue'
import { inquiriesApi } from '@telecom/api-client'

export const useInquiriesStore = defineStore('inquiries', () => {
  const inquiries = ref([])
  const currentInquiry = ref(null)
  const stats = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const total = ref(0)

  const list = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      const res = await inquiriesApi.list(params)
      const body = res?.data ?? res
      const items = body?.data?.data || body?.data || body?.items || (Array.isArray(body) ? body : [])
      const meta = body?.data?.meta || body?.meta || {}
      inquiries.value = Array.isArray(items) ? items : []
      total.value = meta.total || 0
      return { data: inquiries.value, meta }
    } catch (err) {
      error.value = err.message || 'خطا در دریافت استعلام‌ها'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getById = async (id) => {
    try {
      loading.value = true
      error.value = null
      const res = await inquiriesApi.getById(id)
      const body = res?.data ?? res
      currentInquiry.value = body?.data ?? body
      return currentInquiry.value
    } catch (err) {
      error.value = err.message || 'خطا در دریافت استعلام'
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (data) => {
    try {
      loading.value = true
      error.value = null
      const res = await inquiriesApi.create(data)
      return res
    } catch (err) {
      error.value = err.message || 'خطا در ایجاد استعلام'
      throw err
    } finally {
      loading.value = false
    }
  }

  const changeStatus = async (id, data) => {
    try {
      loading.value = true
      error.value = null
      const res = await inquiriesApi.changeStatus(id, data)
      return res
    } catch (err) {
      error.value = err.message || 'خطا در تغییر وضعیت'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getStats = async () => {
    try {
      loading.value = true
      error.value = null
      const res = await inquiriesApi.getStats()
      const body = res?.data ?? res
      stats.value = body?.data ?? body
      return stats.value
    } catch (err) {
      error.value = err.message || 'خطا در دریافت آمار'
      throw err
    } finally {
      loading.value = false
    }
  }

  const submitResponse = async (inquiryId, data) => {
    try {
      loading.value = true
      error.value = null
      const res = await inquiriesApi.submitResponse(inquiryId, data)
      return res
    } catch (err) {
      error.value = err.message || 'خطا در ارسال پاسخ'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateResponse = async (inquiryId, responseId, data) => {
    try {
      loading.value = true
      error.value = null
      const res = await inquiriesApi.updateResponse(inquiryId, responseId, data)
      return res
    } catch (err) {
      error.value = err.message || 'خطا در ویرایش پاسخ'
      throw err
    } finally {
      loading.value = false
    }
  }

  const withdrawResponse = async (inquiryId, responseId) => {
    try {
      loading.value = true
      error.value = null
      const res = await inquiriesApi.withdrawResponse(inquiryId, responseId)
      return res
    } catch (err) {
      error.value = err.message || 'خطا در پس‌گرفتن پاسخ'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    inquiries, currentInquiry, stats, loading, error, total,
    list, getById, create, changeStatus, getStats,
    submitResponse, updateResponse, withdrawResponse,
  }
})
