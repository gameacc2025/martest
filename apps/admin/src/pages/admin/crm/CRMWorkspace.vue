<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { crmApi } from '@telecom/api-client'
import { useAuthStore } from '../../../stores/auth'

const props = defineProps({ section: { type: String, default: 'overview' } })
const authStore = useAuthStore()
const canMergeLeads = computed(() => authStore.hasPermission('crm.leads.merge'))
const activeSection = computed(() => props.section)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const dashboard = ref(null)
const leads = ref([])
const leadMeta = ref({ total: 0, page: 1, limit: 25, totalPages: 0 })
const sources = ref([])
const tasks = ref([])
const activities = ref([])
const pipelines = ref([])
const opportunities = ref([])
const accounts = ref([])
const accountContacts = ref([])
const selectedAccount = ref(null)
const accountLoading = ref(false)
const showOpportunityCreate = ref(false)
const opportunityForm = ref({ accountId: '', title: '', amount: '0', currency: 'IRR', expectedCloseAt: '' })
const search = ref('')
const status = ref('')
const showCreate = ref(false)
const form = ref({ displayName: '', companyName: '', email: '', phone: '', score: 0, sourceId: '' })
const selectedLead = ref(null)
const leadTimeline = ref([])
const duplicates = ref([])
const detailLoading = ref(false)
const actionError = ref('')

const stats = computed(() => [
  { label: 'کل سرنخ‌ها', value: dashboard.value?.leads?.total ?? '—', icon: 'pi pi-users' },
  { label: 'سرنخ‌های جدید', value: dashboard.value?.leads?.new ?? '—', icon: 'pi pi-user-plus' },
  { label: 'واجد شرایط', value: dashboard.value?.leads?.qualified ?? '—', icon: 'pi pi-check-circle' },
  { label: 'وظایف معوق', value: dashboard.value?.tasks?.overdue ?? '—', icon: 'pi pi-clock' },
])

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response
}
function errorMessage(err) {
  return err?.response?.data?.message || err?.message || 'دریافت اطلاعات با خطا مواجه شد.'
}
function statusLabel(value) {
  return ({ NEW: 'جدید', CONTACTED: 'تماس گرفته‌شده', QUALIFIED: 'واجد شرایط', CONVERTED: 'تبدیل‌شده', DISQUALIFIED: 'رد صلاحیت', DUPLICATE: 'تکراری', LOST: 'از دست‌رفته' })[value] || value || '—'
}
function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value))
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    if (activeSection.value === 'pipeline') {
      const results = await Promise.all([crmApi.dashboard(), crmApi.listPipelines(), crmApi.listOpportunities(), crmApi.listAccounts({ page: 1, limit: 100 })])
      dashboard.value = unwrap(results[0])
      pipelines.value = unwrap(results[1]) || []
      opportunities.value = unwrap(results[2]) || []
      const accountPage = unwrap(results[3])
      accounts.value = accountPage?.data || []
    } else if (activeSection.value === 'accounts') {
      const results = await Promise.all([crmApi.dashboard(), crmApi.listAccounts({ page: 1, limit: 50 })])
      dashboard.value = unwrap(results[0])
      const page = unwrap(results[1])
      accounts.value = page?.data || []
    } else if (activeSection.value === 'tasks') {
      const results = await Promise.all([crmApi.dashboard(), crmApi.listTasks()])
      dashboard.value = unwrap(results[0])
      tasks.value = unwrap(results[1]) || []
    } else {
      const jobs = [crmApi.dashboard(), crmApi.listSources()]
      if (activeSection.value !== 'activities') jobs.push(crmApi.listLeads({ page: 1, limit: 25, search: search.value || undefined, status: status.value || undefined }))
      if (activeSection.value === 'activities') jobs.push(crmApi.listActivities())
      if (activeSection.value === 'overview') jobs.push(crmApi.listTasks({ overdue: 'true' }))
      const results = await Promise.all(jobs)
      dashboard.value = unwrap(results[0])
      sources.value = unwrap(results[1]) || []
      if (activeSection.value === 'activities') activities.value = unwrap(results[2]) || []
      else {
        const page = unwrap(results[2])
        leads.value = page?.data || []
        leadMeta.value = page?.meta || leadMeta.value
        if (activeSection.value === 'overview') tasks.value = unwrap(results[3]) || []
      }
    }
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
const activePipeline = computed(() => pipelines.value.find((item) => item.isDefault) || pipelines.value[0] || null)
const pipelineStages = computed(() => activePipeline.value?.stages || [])
function opportunitiesFor(stageId) {
  return opportunities.value.filter((item) => item.stageId === stageId)
}
async function createOpportunity() {
  if (!activePipeline.value || !pipelineStages.value.length) return
  saving.value = true
  actionError.value = ''
  try {
    await crmApi.createOpportunity({ ...opportunityForm.value, accountId: Number(opportunityForm.value.accountId), pipelineId: activePipeline.value.id, stageId: pipelineStages.value[0].id, amount: String(opportunityForm.value.amount) })
    showOpportunityCreate.value = false
    opportunityForm.value = { accountId: '', title: '', amount: '0', currency: 'IRR', expectedCloseAt: '' }
    await load()
  } catch (err) { actionError.value = errorMessage(err) }
  finally { saving.value = false }
}
async function setOpportunityStage(item, stageId) {
  if (!stageId || Number(stageId) === item.stageId) return
  actionError.value = ''
  try {
    await crmApi.changeOpportunityStage(item.id, { stageId: Number(stageId), reason: 'به‌روزرسانی مرحله از برد CRM' })
    await load()
  } catch (err) {
    actionError.value = errorMessage(err)
  }
}
async function exportLeadList() {
  actionError.value = ''
  try {
    const response = await crmApi.exportLeads({ search: search.value || undefined, status: status.value || undefined })
    const blob = unwrap(response)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'crm-leads.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    actionError.value = errorMessage(err)
  }
}
async function createLead() {
  saving.value = true
  actionError.value = ''
  try {
    await crmApi.createLead({ ...form.value, score: Number(form.value.score), sourceId: form.value.sourceId ? Number(form.value.sourceId) : null })
    showCreate.value = false
    form.value = { displayName: '', companyName: '', email: '', phone: '', score: 0, sourceId: '' }
    await load()
  } catch (err) {
    actionError.value = errorMessage(err)
  } finally {
    saving.value = false
  }
}
async function changeStatus(lead, nextStatus) {
  actionError.value = ''
  try {
    await crmApi.changeLeadStatus(lead.id, nextStatus)
    await load()
  } catch (err) {
    actionError.value = errorMessage(err)
  }
}
async function convertLead(lead) {
  actionError.value = ''
  try {
    await crmApi.convertLead(lead.id)
    await load()
  } catch (err) {
    actionError.value = errorMessage(err)
  }
}
async function openLead(lead) {
  selectedLead.value = lead
  detailLoading.value = true
  leadTimeline.value = []
  duplicates.value = []
  try {
    const [timelineResponse, duplicateResponse] = await Promise.all([
      crmApi.getLeadTimeline(lead.id),
      crmApi.getLeadDuplicates(lead.id),
    ])
    leadTimeline.value = unwrap(timelineResponse) || []
    duplicates.value = unwrap(duplicateResponse) || []
  } catch (err) {
    actionError.value = errorMessage(err)
  } finally {
    detailLoading.value = false
  }
}
async function openAccount(account) {
  selectedAccount.value = account
  accountLoading.value = true
  try {
    const results = await Promise.all([crmApi.getAccount(account.id), crmApi.listContacts(account.id)])
    selectedAccount.value = unwrap(results[0])
    accountContacts.value = unwrap(results[1]) || []
  } catch (err) { actionError.value = errorMessage(err) }
  finally { accountLoading.value = false }
}
async function addAccountContact() {
  const name = window.prompt('نام مخاطب را وارد کنید:')
  if (!name?.trim() || !selectedAccount.value) return
  try {
    await crmApi.createContact(selectedAccount.value.id, { name: name.trim() })
    accountContacts.value = unwrap(await crmApi.listContacts(selectedAccount.value.id)) || []
  } catch (err) { actionError.value = errorMessage(err) }
}
async function mergeDuplicate(item) {
  const reason = window.prompt('دلیل ادغام این سرنخ در «' + selectedLead.value.displayName + '» را وارد کنید:')
  if (!reason?.trim()) return
  actionError.value = ''
  try {
    await crmApi.mergeLead(item.id, selectedLead.value.id, reason.trim())
    selectedLead.value = null
    await load()
  } catch (err) {
    actionError.value = errorMessage(err)
  }
}
async function finishTask(task) {
  actionError.value = ''
  try {
    await crmApi.completeTask(task.id)
    await load()
  } catch (err) {
    actionError.value = errorMessage(err)
  }
}
async function createFollowUp(lead) {
  const title = window.prompt('عنوان پیگیری بعدی را وارد کنید:')
  if (!title?.trim()) return
  actionError.value = ''
  try {
    await crmApi.createTask({ title: title.trim(), leadId: lead.id, priority: 'NORMAL' })
    await load()
  } catch (err) {
    actionError.value = errorMessage(err)
  }
}
watch([search, status, activeSection], load)
onMounted(load)
</script>

<template>
  <section class="crm-page" dir="rtl">
    <header class="crm-heading">
      <div>
        <span class="crm-eyebrow">CUSTOMER RELATIONSHIP MANAGEMENT</span>
        <h1>{{ ({ activities: 'تعاملات CRM', leads: 'سرنخ‌های فروش', accounts: 'حساب‌ها و مخاطبان CRM', tasks: 'وظایف و پیگیری‌های CRM', pipeline: 'قیف فرصت‌های فروش' })[activeSection] || 'مرکز ارتباط با مشتریان' }}</h1>
        <p>مدیریت سرنخ‌ها، حساب‌ها و پیگیری‌های تیم فروش بر پایه اطلاعات واقعی سامانه</p>
      </div>
      <button v-if="['overview', 'leads'].includes(activeSection)" class="crm-primary" type="button" @click="showCreate = true">
        <i class="pi pi-plus" aria-hidden="true"></i> ثبت سرنخ جدید
      </button>
    </header>

    <div v-if="error" class="crm-alert" role="alert">
      <span>{{ error }}</span><button type="button" @click="load">تلاش مجدد</button>
    </div>
    <div v-if="actionError" class="crm-alert" role="alert">{{ actionError }}</div>

    <div v-if="activeSection !== 'activities'" class="crm-stats">
      <article v-for="item in stats" :key="item.label" class="crm-stat">
        <span class="crm-stat-icon"><i :class="item.icon" aria-hidden="true"></i></span>
        <div><small>{{ item.label }}</small><strong>{{ item.value }}</strong></div>
      </article>
    </div>

    <section v-if="activeSection === 'overview'" class="crm-panel">
      <div class="crm-panel-head"><div><h2>پیگیری‌های معوق</h2><p>وظایفی که از موعد انجام آن‌ها گذشته است</p></div></div>
      <div v-if="loading" class="crm-state">در حال دریافت اطلاعات…</div>
      <div v-else-if="!tasks.length" class="crm-state">در حال حاضر پیگیری معوقی ثبت نشده است.</div>
      <div v-else class="crm-task-list">
        <article v-for="task in tasks" :key="task.id" class="crm-task">
          <div><strong>{{ task.title }}</strong><small>{{ task.lead?.displayName || task.account?.displayName || 'رکورد CRM' }}</small></div>
          <span>{{ formatDate(task.dueAt) }}</span><button type="button" class="crm-task-complete" @click="finishTask(task)">تکمیل شد</button>
        </article>
      </div>
    </section>

    <section v-else-if="activeSection === 'accounts'" class="crm-panel">
      <div class="crm-panel-head"><div><h2>حساب‌ها و مشتریان بالقوه</h2><p>{{ accounts.length }} حساب در این صفحه</p></div></div>
      <div v-if="loading" class="crm-state">در حال دریافت حساب‌ها…</div>
      <div v-else-if="!accounts.length" class="crm-state">حسابی ثبت نشده است.</div>
      <div v-else class="crm-account-grid">
        <button v-for="account in accounts" :key="account.id" type="button" class="crm-account-card" @click="openAccount(account)">
          <i class="pi pi-building" aria-hidden="true"></i><strong>{{ account.displayName }}</strong><small>{{ account.accountType }} · {{ account.lifecycle }}</small><span>{{ account.contacts?.length || 0 }} مخاطب</span>
        </button>
      </div>
    </section>

    <section v-else-if="activeSection === 'tasks'" class="crm-panel">
      <div class="crm-panel-head"><div><h2>برنامه پیگیری‌ها</h2><p>وظایف تخصیص‌یافته به کارکنان</p></div></div>
      <div v-if="loading" class="crm-state">در حال دریافت وظایف…</div>
      <div v-else-if="!tasks.length" class="crm-state">وظیفه‌ای برای نمایش وجود ندارد.</div>
      <article v-for="task in tasks" :key="task.id" class="crm-task">
        <div><strong>{{ task.title }}</strong><small>{{ task.lead?.displayName || task.account?.displayName || 'رکورد CRM' }}</small></div>
        <span>{{ formatDate(task.dueAt) }}</span>
        <button v-if="task.status !== 'COMPLETED'" type="button" class="crm-task-complete" @click="finishTask(task)">تکمیل شد</button>
      </article>
    </section>

    <section v-else-if="activeSection === 'pipeline'" class="crm-panel">
      <div class="crm-panel-head"><div><h2>قیف فرصت‌های فروش</h2><p>{{ activePipeline?.name || 'قیف فعالی تعریف نشده است' }}</p></div><button v-if="activePipeline && pipelineStages.length" class="crm-primary" type="button" @click="showOpportunityCreate = true">ایجاد فرصت</button></div>
      <div v-if="loading" class="crm-state">در حال دریافت فرصت‌ها…</div>
      <div v-else-if="!pipelineStages.length" class="crm-state">برای نمایش قیف، ابتدا مراحل فروش را تعریف کنید.</div>
      <div v-else class="crm-kanban">
        <section v-for="stage in pipelineStages" :key="stage.id" class="crm-kanban-column">
          <header><strong>{{ stage.label }}</strong><span>{{ opportunitiesFor(stage.id).length }}</span></header>
          <article v-for="item in opportunitiesFor(stage.id)" :key="item.id" class="crm-opportunity">
            <strong>{{ item.title }}</strong><small>{{ item.account?.displayName || 'حساب CRM' }}</small>
            <div>{{ Number(item.amount || 0).toLocaleString('fa-IR') }} {{ item.currency }}</div>
            <select v-if="!stage.isWon && !stage.isLost" :value="item.stageId" aria-label="تغییر مرحله فرصت" @change="setOpportunityStage(item, $event.target.value)"><option v-for="target in pipelineStages" :key="target.id" :value="target.id">{{ target.label }}</option></select>
          </article>
        </section>
      </div>
    </section>

    <section v-else-if="activeSection === 'activities'" class="crm-panel">
      <div class="crm-panel-head"><div><h2>تاریخچه تعاملات</h2><p>تماس‌ها، ایمیل‌ها و جلسات ثبت‌شده</p></div></div>
      <div v-if="loading" class="crm-state">در حال دریافت اطلاعات…</div>
      <div v-else-if="!activities.length" class="crm-state">هنوز تعاملی ثبت نشده است.</div>
      <article v-for="activity in activities" :key="activity.id" class="crm-activity">
        <span class="crm-activity-icon"><i class="pi pi-comments" aria-hidden="true"></i></span>
        <div><strong>{{ activity.subject }}</strong><p>{{ activity.body || 'بدون توضیحات' }}</p><small>{{ activity.type }} · {{ formatDate(activity.occurredAt) }}</small></div>
      </article>
    </section>

    <section v-else class="crm-panel">
      <div class="crm-panel-head">
        <div><h2>صندوق سرنخ‌ها</h2><p>{{ leadMeta.total }} سرنخ ثبت‌شده</p></div>
        <button type="button" class="crm-secondary" @click="exportLeadList">خروجی CSV</button>
        <div class="crm-filters">
          <input v-model="search" type="search" placeholder="جستجو در نام، شرکت، ایمیل یا تلفن" aria-label="جستجوی سرنخ‌ها">
          <select v-model="status" aria-label="فیلتر وضعیت">
            <option value="">همه وضعیت‌ها</option>
            <option value="NEW">جدید</option><option value="CONTACTED">تماس گرفته‌شده</option><option value="QUALIFIED">واجد شرایط</option>
            <option value="CONVERTED">تبدیل‌شده</option><option value="DISQUALIFIED">رد صلاحیت</option><option value="LOST">از دست‌رفته</option>
          </select>
        </div>
      </div>
      <div v-if="loading" class="crm-state">در حال دریافت سرنخ‌ها…</div>
      <div v-else-if="!leads.length" class="crm-state">سرنخی با این شرایط پیدا نشد.</div>
      <div v-else class="crm-table-wrap">
        <table class="crm-table">
          <thead><tr><th>سرنخ</th><th>منبع</th><th>مسئول</th><th>امتیاز</th><th>وضعیت</th><th>ثبت</th><th>اقدامات</th></tr></thead>
          <tbody>
            <tr v-for="lead in leads" :key="lead.id">
              <td><strong>{{ lead.displayName }}</strong><small>{{ lead.companyName || lead.email || lead.phone || lead.leadNumber }}</small></td>
              <td>{{ lead.source?.label || '—' }}</td><td>{{ lead.owner?.email || '—' }}</td><td>{{ lead.score }}/100</td>
              <td><span class="crm-status" :data-status="lead.status">{{ statusLabel(lead.status) }}</span></td>
              <td>{{ formatDate(lead.createdAt) }}</td>
              <td class="crm-actions">
                <button type="button" @click="openLead(lead)">جزئیات</button>
                <button v-if="lead.status === 'NEW'" type="button" @click="changeStatus(lead, 'CONTACTED')">ثبت تماس</button>
                <button v-if="lead.status === 'CONTACTED'" type="button" @click="changeStatus(lead, 'QUALIFIED')">واجد شرایط</button>
                <button v-if="lead.status === 'QUALIFIED'" type="button" @click="convertLead(lead)">تبدیل به حساب</button>
                <button v-if="!['CONVERTED','DISQUALIFIED','DUPLICATE','LOST'].includes(lead.status)" type="button" @click="createFollowUp(lead)">پیگیری</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showOpportunityCreate" class="crm-modal-backdrop" @click.self="showOpportunityCreate = false">
      <form class="crm-modal" @submit.prevent="createOpportunity">
        <div class="crm-panel-head"><div><h2>ایجاد فرصت فروش</h2><p>فرصت جدید را به یک حساب CRM متصل کنید</p></div><button type="button" aria-label="بستن" @click="showOpportunityCreate = false">×</button></div>
        <label>حساب CRM *<select v-model="opportunityForm.accountId" required><option value="">انتخاب حساب</option><option v-for="account in accounts" :key="account.id" :value="String(account.id)">{{ account.displayName }}</option></select></label>
        <label>عنوان فرصت *<input v-model="opportunityForm.title" required maxlength="240"></label>
        <div class="crm-form-grid"><label>مبلغ<input v-model="opportunityForm.amount" type="number" min="0"></label><label>ارز<input v-model="opportunityForm.currency" maxlength="3" required></label></div>
        <label>تاریخ پیش‌بینی‌شده<input v-model="opportunityForm.expectedCloseAt" type="date"></label>
        <div class="crm-modal-actions"><button type="button" class="crm-secondary" @click="showOpportunityCreate = false">انصراف</button><button class="crm-primary" type="submit" :disabled="saving">{{ saving ? 'در حال ثبت…' : 'ثبت فرصت' }}</button></div>
      </form>
    </div>

    <div v-if="selectedAccount" class="crm-modal-backdrop" @click.self="selectedAccount = null">
      <section class="crm-modal">
        <div class="crm-panel-head"><div><h2>{{ selectedAccount.displayName }}</h2><p>اطلاعات حساب و مخاطبان</p></div><button type="button" aria-label="بستن" @click="selectedAccount = null">×</button></div>
        <div v-if="accountLoading" class="crm-state">در حال دریافت اطلاعات…</div>
        <template v-else>
          <div class="crm-detail-grid"><span>نوع حساب: {{ selectedAccount.accountType }}</span><span>چرخه عمر: {{ selectedAccount.lifecycle }}</span><span>منبع: {{ selectedAccount.source || '—' }}</span></div>
          <div class="crm-panel-head"><h3>مخاطبان</h3><button type="button" class="crm-secondary" @click="addAccountContact">افزودن مخاطب</button></div>
          <div v-if="!accountContacts.length" class="crm-state">مخاطبی ثبت نشده است.</div>
          <article v-for="contact in accountContacts" :key="contact.id" class="crm-task"><div><strong>{{ contact.name }}</strong><small>{{ contact.title || contact.email || contact.phone || 'بدون اطلاعات تکمیلی' }}</small></div><span v-if="contact.isPrimary">مخاطب اصلی</span></article>
        </template>
      </section>
    </div>

    <div v-if="selectedLead" class="crm-modal-backdrop" @click.self="selectedLead = null">
      <section class="crm-modal crm-detail-modal">
        <div class="crm-panel-head"><div><h2>{{ selectedLead.displayName }}</h2><p>{{ selectedLead.companyName || selectedLead.leadNumber }}</p></div><button type="button" aria-label="بستن" @click="selectedLead = null">×</button></div>
        <div class="crm-detail-grid"><span>ایمیل: {{ selectedLead.email || '—' }}</span><span>تلفن: {{ selectedLead.phone || '—' }}</span><span>وضعیت: {{ statusLabel(selectedLead.status) }}</span><span>امتیاز: {{ selectedLead.score }}/100</span></div>
        <h3>موارد مشابه پیشنهادی</h3>
        <p v-if="!duplicates.length" class="crm-muted">مورد مشابهی پیدا نشد.</p>
        <ul v-else class="crm-duplicate-list"><li v-for="item in duplicates" :key="item.id"><span>{{ item.displayName }} — {{ item.matchReasons.join('، ') }}</span><button v-if="canMergeLeads" type="button" @click="mergeDuplicate(item)">ادغام در این سرنخ</button></li></ul>
        <h3>تاریخچه سرنخ</h3>
        <div v-if="detailLoading" class="crm-state">در حال دریافت تاریخچه…</div>
        <div v-else-if="!leadTimeline.length" class="crm-state">هنوز فعالیت یا یادداشتی ثبت نشده است.</div>
        <article v-for="item in leadTimeline" :key="item.kind + '-' + item.id" class="crm-timeline-item">
          <strong>{{ item.title || (item.kind === 'NOTE' ? 'یادداشت' : item.kind === 'TASK' ? 'وظیفه' : 'تعامل') }}</strong>
          <p>{{ item.body || item.status || '' }}</p><small>{{ item.kind }} · {{ formatDate(item.at) }}</small>
        </article>
      </section>
    </div>

    <div v-if="showCreate" class="crm-modal-backdrop" @click.self="showCreate = false">
      <form class="crm-modal" @submit.prevent="createLead">
        <div class="crm-panel-head"><div><h2>ثبت سرنخ جدید</h2><p>اطلاعات تماس و منبع آشنایی را وارد کنید</p></div><button type="button" aria-label="بستن" @click="showCreate = false">×</button></div>
        <label>نام مخاطب *<input v-model="form.displayName" required maxlength="240"></label>
        <label>نام شرکت<input v-model="form.companyName" maxlength="240"></label>
        <div class="crm-form-grid"><label>ایمیل<input v-model="form.email" type="email" maxlength="320"></label><label>تلفن<input v-model="form.phone" maxlength="40"></label></div>
        <div class="crm-form-grid">
          <label>منبع آشنایی<select v-model="form.sourceId"><option value="">انتخاب منبع</option><option v-for="source in sources" :key="source.id" :value="String(source.id)">{{ source.label }}</option></select></label>
          <label>امتیاز (۰ تا ۱۰۰)<input v-model.number="form.score" type="number" min="0" max="100"></label>
        </div>
        <div class="crm-modal-actions"><button type="button" class="crm-secondary" @click="showCreate = false">انصراف</button><button class="crm-primary" type="submit" :disabled="saving">{{ saving ? 'در حال ثبت…' : 'ثبت سرنخ' }}</button></div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.crm-page{display:grid;gap:20px;color:var(--text-color,#172033)}
.crm-heading,.crm-panel-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
.crm-heading h1{margin:5px 0;font-size:1.45rem;font-weight:750}.crm-heading p,.crm-panel-head p{margin:0;color:var(--text-color-secondary,#64748b);font-size:.88rem}
.crm-eyebrow{font-size:.68rem;letter-spacing:.12em;color:var(--primary-color,#0891b2);font-weight:700}
.crm-primary,.crm-secondary{border:0;border-radius:9px;padding:10px 15px;font:inherit;cursor:pointer}
.crm-primary{background:var(--primary-color,#0891b2);color:#fff}.crm-primary:disabled{opacity:.6;cursor:wait}.crm-secondary{background:var(--surface-100,#f1f5f9);color:inherit}
.crm-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.crm-stat,.crm-panel{background:var(--surface-card,#fff);border:1px solid var(--surface-border,#e2e8f0);border-radius:13px}
.crm-stat{display:flex;align-items:center;gap:12px;padding:16px}.crm-stat-icon,.crm-activity-icon{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:var(--primary-50,#ecfeff);color:var(--primary-color,#0891b2)}
.crm-stat small,.crm-stat strong{display:block}.crm-stat small{color:var(--text-color-secondary,#64748b)}.crm-stat strong{font-size:1.3rem;margin-top:4px}
.crm-panel{padding:18px;min-width:0}.crm-panel-head{margin-bottom:16px}.crm-panel-head h2{margin:0 0 4px;font-size:1.05rem}
.crm-filters{display:flex;gap:8px}.crm-filters input,.crm-filters select,.crm-modal input,.crm-modal select{min-width:0;border:1px solid var(--surface-border,#dbe2ea);background:var(--surface-ground,#fff);color:inherit;border-radius:8px;padding:9px 11px;font:inherit}
.crm-filters input{width:min(300px,35vw)}.crm-table-wrap{overflow:auto}.crm-table{width:100%;border-collapse:collapse;white-space:nowrap}.crm-table th,.crm-table td{text-align:right;padding:12px 10px;border-bottom:1px solid var(--surface-border,#e2e8f0);font-size:.84rem}.crm-table th{color:var(--text-color-secondary,#64748b);font-weight:650}.crm-table td small{display:block;color:var(--text-color-secondary,#64748b);margin-top:4px;max-width:220px;overflow:hidden;text-overflow:ellipsis}
.crm-status{display:inline-flex;border-radius:20px;padding:4px 9px;background:var(--surface-100,#f1f5f9);font-size:.75rem}.crm-status[data-status="QUALIFIED"]{background:#dcfce7;color:#166534}.crm-status[data-status="NEW"]{background:#e0f2fe;color:#075985}
.crm-actions{display:flex;gap:5px}.crm-actions button,.crm-alert button{border:0;background:transparent;color:var(--primary-color,#0891b2);cursor:pointer;font:inherit;font-size:.78rem}
.crm-state{padding:28px;text-align:center;color:var(--text-color-secondary,#64748b)}.crm-account-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}.crm-account-card{display:grid;gap:8px;text-align:right;border:1px solid var(--surface-border,#e2e8f0);border-radius:10px;background:var(--surface-card,#fff);color:inherit;padding:14px;cursor:pointer}.crm-account-card i{color:var(--primary-color,#0891b2)}.crm-account-card small,.crm-account-card span{color:var(--text-color-secondary,#64748b)}.crm-kanban{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(220px,1fr);gap:12px;overflow:auto;align-items:start}.crm-kanban-column{background:var(--surface-ground,#f8fafc);border:1px solid var(--surface-border,#e2e8f0);border-radius:10px;padding:10px;min-height:180px}.crm-kanban-column>header{display:flex;justify-content:space-between;padding:5px 3px 12px}.crm-opportunity{display:grid;gap:7px;background:var(--surface-card,#fff);border:1px solid var(--surface-border,#e2e8f0);border-radius:9px;padding:12px;margin-bottom:8px;font-size:.84rem}.crm-opportunity small{color:var(--text-color-secondary,#64748b)}.crm-opportunity button{justify-self:start;border:0;background:transparent;color:var(--primary-color,#0891b2);cursor:pointer;font:inherit}.crm-task,.crm-activity{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--surface-border,#e2e8f0)}.crm-task>div{display:grid;gap:4px;flex:1}.crm-task-complete{border:0;border-radius:7px;padding:6px 9px;background:var(--primary-50,#ecfeff);color:var(--primary-color,#0891b2);cursor:pointer;font:inherit;font-size:.78rem}.crm-task small,.crm-activity small{color:var(--text-color-secondary,#64748b)}.crm-activity p{margin:5px 0;font-size:.86rem}.crm-alert{padding:12px 15px;border-radius:9px;background:var(--red-50,#fef2f2);color:var(--red-700,#b91c1c);display:flex;justify-content:space-between;gap:12px}
.crm-modal-backdrop{position:fixed;inset:0;z-index:1000;background:#0f172a88;display:grid;place-items:center;padding:16px}.crm-modal{width:min(620px,100%);max-height:90vh;overflow:auto;background:var(--surface-card,#fff);color:inherit;border-radius:14px;padding:20px;display:grid;gap:14px}.crm-modal label{display:grid;gap:6px;font-size:.86rem}.crm-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.crm-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;background:var(--surface-ground,#f8fafc);border-radius:9px;font-size:.84rem}.crm-modal h3{font-size:.92rem;margin:8px 0 0}.crm-muted{color:var(--text-color-secondary,#64748b)}.crm-duplicate-list{margin:0;padding-inline-start:20px}.crm-duplicate-list li{display:flex;justify-content:space-between;gap:10px;padding:6px 0}.crm-duplicate-list button{border:0;background:transparent;color:var(--primary-color,#0891b2);cursor:pointer;font:inherit;font-size:.8rem}.crm-timeline-item{padding:9px 0;border-bottom:1px solid var(--surface-border,#e2e8f0)}.crm-timeline-item p{margin:4px 0;font-size:.84rem}.crm-timeline-item small{color:var(--text-color-secondary,#64748b)}.crm-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
@media(max-width:800px){.crm-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.crm-heading,.crm-panel-head{align-items:flex-start;flex-direction:column}.crm-filters{width:100%;flex-wrap:wrap}.crm-filters input{width:100%}}
@media(max-width:480px){.crm-form-grid{grid-template-columns:1fr}.crm-panel{padding:12px}.crm-stat{padding:12px}.crm-stat strong{font-size:1.1rem}}
</style>
