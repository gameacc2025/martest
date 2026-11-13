<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supportApi } from '@telecom/api-client'
import TemPageHeader from '../ui/TemPageHeader.vue'
import TemStatCard from '../ui/TemStatCard.vue'
import TemStatusPill from '../ui/TemStatusPill.vue'

const props = defineProps({
  title: { type: String, required: true },
  eyebrow: { type: String, default: 'SUPPORT DESK' },
  description: { type: String, default: '' },
  showInternalNotes: { type: Boolean, default: false },
  showRequesterIdentity: { type: Boolean, default: true },
  canManageTickets: { type: Boolean, default: false },
})
const route = useRoute()
const tickets = ref([])
const categories = ref([])
const queues = ref([])
const selectedTicketId = ref(null)
const selectedTicket = ref(null)
const query = ref('')
const statusFilter = ref(['ALL', 'OPEN', 'CLOSED'].includes(route.query.status) ? route.query.status : 'ALL')
const loading = ref(false)
const detailLoading = ref(false)
const sending = ref(false)
const creating = ref(false)
const showCreate = ref(false)
const error = ref('')
const replyBody = ref('')
const internalNote = ref(false)
const selectedQueueId = ref('')
const newTicket = ref({ subject: '', body: '', categoryId: '' })

const statusLabels = {
  OPEN: ['باز', 'warning'],
  IN_PROGRESS: ['در حال رسیدگی', 'primary'],
  WAITING_CUSTOMER: ['در انتظار پاسخ شما', 'warning'],
  WAITING_COMPANY: ['در انتظار پاسخ شرکت', 'warning'],
  RESOLVED: ['حل‌شده', 'success'],
  CLOSED: ['بسته‌شده', 'success'],
  SPAM: ['هرزنامه', 'danger'],
}
const priorityLabels = { LOW: 'کم', NORMAL: 'عادی', HIGH: 'بالا', URGENT: 'فوری' }

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response
}
function unwrapPage(response) {
  const payload = response?.data && !Array.isArray(response.data) ? response.data : response
  return {
    data: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [],
    meta: payload?.meta || {},
  }
}
function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })
}
function mapTicket(ticket) {
  const [statusLabel, statusTone] = statusLabels[ticket.status] || [ticket.status, 'neutral']
  return {
    ...ticket,
    code: ticket.ticketNumber,
    category: ticket.category?.name || 'عمومی',
    statusLabel,
    statusTone,
    priorityLabel: priorityLabels[ticket.priority] || ticket.priority,
    requesterName: ticket.requesterCompany?.name || ticket.requester?.email || 'کاربر',
    requesterType: ticket.createdFrom === 'COMPANY' ? 'شرکت' : ticket.createdFrom === 'ADMIN' ? 'کارشناس' : 'مشتری',
    assignee: ticket.assignedUser?.email || ticket.assignedQueue?.name || 'تخصیص‌نیافته',
    updatedAt: formatDate(ticket.lastActivityAt || ticket.updatedAt),
    messages: (ticket.messages || []).map((message) => ({
      ...message,
      sender: message.sender?.email || (message.senderUserId === ticket.requesterUserId ? 'درخواست‌دهنده' : 'پشتیبانی'),
      timestamp: formatDate(message.createdAt),
      internal: message.visibility === 'INTERNAL',
      fromAgent: message.senderUserId !== ticket.requesterUserId,
      attachment: message.attachments?.map((item) => item.fileName).filter(Boolean).join('، ') || '',
    })),
  }
}
const filteredTickets = computed(() => tickets.value.filter((ticket) => {
  const text = [ticket.code, ticket.subject, ticket.category, ticket.requesterName].join(' ').toLocaleLowerCase()
  const matchesQuery = !query.value || text.includes(query.value.toLocaleLowerCase())
  const matchesStatus = statusFilter.value === 'ALL'
    || (statusFilter.value === 'OPEN' && !['CLOSED', 'RESOLVED', 'SPAM'].includes(ticket.status))
    || (statusFilter.value === 'CLOSED' && ['CLOSED', 'RESOLVED', 'SPAM'].includes(ticket.status))
  return matchesQuery && matchesStatus
}))
const visibleMessages = computed(() => (selectedTicket.value?.messages || []).filter((message) => props.showInternalNotes || !message.internal))
const stats = computed(() => {
  const open = tickets.value.filter((ticket) => !['CLOSED', 'RESOLVED', 'SPAM'].includes(ticket.status)).length
  const urgent = tickets.value.filter((ticket) => ['HIGH', 'URGENT'].includes(ticket.priority)).length
  const waiting = tickets.value.filter((ticket) => ['WAITING_CUSTOMER', 'WAITING_COMPANY'].includes(ticket.status)).length
  return [
    { label: 'تیکت‌های ثبت‌شده', value: tickets.value.length, icon: 'pi pi-inbox', tone: 'primary', meta: 'داده واقعی سامانه' },
    { label: 'تیکت‌های باز', value: open, icon: 'pi pi-clock', tone: 'warning', meta: 'نیازمند پیگیری' },
    { label: 'اولویت بالا', value: urgent, icon: 'pi pi-exclamation-triangle', tone: 'danger', meta: 'اولویت بالا یا فوری' },
    { label: 'در انتظار پاسخ', value: waiting, icon: 'pi pi-comments', tone: 'success', meta: 'منتظر پاسخ طرف مقابل' },
  ]
})

async function loadCategories() {
  const response = await supportApi.listCategories()
  const data = unwrap(response)
  categories.value = Array.isArray(data) ? data : []
}
async function loadQueues() {
  if (!props.canManageTickets) return
  const response = await supportApi.listQueues()
  const data = unwrap(response)
  queues.value = Array.isArray(data) ? data : []
}
async function loadTicket(id) {
  if (!id) {
    selectedTicket.value = null
    return
  }
  detailLoading.value = true
  try {
    const response = await supportApi.getTicket(id)
    selectedTicket.value = mapTicket(unwrap(response))
  } finally {
    detailLoading.value = false
  }
}
async function loadTickets() {
  loading.value = true
  error.value = ''
  try {
    const [ticketResponse, categoryResponse] = await Promise.all([
      supportApi.listTickets({ page: 1, limit: 100 }),
      supportApi.listCategories(),
    ])
    const page = unwrapPage(ticketResponse)
    tickets.value = page.data.map(mapTicket)
    const categoryData = unwrap(categoryResponse)
    categories.value = Array.isArray(categoryData) ? categoryData : []
    if (!tickets.value.some((ticket) => ticket.id === selectedTicketId.value)) {
      selectedTicketId.value = tickets.value[0]?.id ?? null
    }
    if (selectedTicketId.value) await loadTicket(selectedTicketId.value)
    else selectedTicket.value = null
  } catch (cause) {
    error.value = cause?.response?.data?.message || cause?.message || 'دریافت تیکت‌ها ناموفق بود.'
  } finally {
    loading.value = false
  }
}
async function selectTicket(ticket) {
  selectedTicketId.value = ticket.id
  error.value = ''
  try {
    await loadTicket(ticket.id)
  } catch (cause) {
    error.value = cause?.response?.data?.message || cause?.message || 'دریافت جزئیات تیکت ناموفق بود.'
  }
}
async function createTicket() {
  if (!newTicket.value.subject.trim() || !newTicket.value.body.trim()) return
  creating.value = true
  error.value = ''
  try {
    const response = await supportApi.createTicket({
      subject: newTicket.value.subject.trim(),
      body: newTicket.value.body.trim(),
      categoryId: newTicket.value.categoryId || undefined,
    })
    const created = unwrap(response)
    newTicket.value = { subject: '', body: '', categoryId: '' }
    showCreate.value = false
    await loadTickets()
    if (created?.id) await selectTicket({ id: created.id })
  } catch (cause) {
    error.value = cause?.response?.data?.message || cause?.message || 'ثبت تیکت ناموفق بود.'
  } finally {
    creating.value = false
  }
}
async function sendMessage() {
  if (!replyBody.value.trim() || !selectedTicketId.value) return
  sending.value = true
  error.value = ''
  try {
    await supportApi.addMessage(selectedTicketId.value, {
      body: replyBody.value.trim(),
      visibility: props.showInternalNotes && internalNote.value ? 'INTERNAL' : 'PUBLIC',
    })
    replyBody.value = ''
    internalNote.value = false
    await loadTickets()
  } catch (cause) {
    error.value = cause?.response?.data?.message || cause?.message || 'ارسال پاسخ ناموفق بود.'
  } finally {
    sending.value = false
  }
}
async function changeTicketStatus() {
  if (!selectedTicket.value) return
  const next = selectedTicket.value.status === 'RESOLVED' ? 'CLOSED' : 'RESOLVED'
  try {
    await supportApi.changeStatus(selectedTicketId.value, { status: next })
    await loadTickets()
  } catch (cause) {
    error.value = cause?.response?.data?.message || cause?.message || 'تغییر وضعیت تیکت ناموفق بود.'
  }
}
async function assignQueue() {
  if (!selectedTicketId.value || !selectedQueueId.value) return
  try {
    await supportApi.assignTicket(selectedTicketId.value, { queueId: Number(selectedQueueId.value) })
    selectedQueueId.value = ''
    await loadTickets()
  } catch (cause) {
    error.value = cause?.response?.data?.message || cause?.message || 'تخصیص صف ناموفق بود.'
  }
}
watch(() => route.query.status, (status) => {
  statusFilter.value = ['ALL', 'OPEN', 'CLOSED'].includes(status) ? status : 'ALL'
})
onMounted(async () => {
  try { await loadQueues() } catch { /* queue controls remain unavailable until retry */ }
  await loadTickets()
})
</script>

<template>
  <main class="tm-ticket-desk">
    <div v-if="error" class="tm-ticket-desk__notice tm-ticket-desk__notice--error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i><span>{{ error }}</span>
      <button type="button" @click="loadTickets">تلاش مجدد</button>
    </div>
    <TemPageHeader :title="title" :description="description" />

    <section class="tm-ticket-desk__stats" aria-label="شاخص‌های پشتیبانی">
      <TemStatCard v-for="item in stats" :key="item.label" v-bind="item" />
    </section>

    <form v-if="showCreate" class="tm-ticket-desk__create" @submit.prevent="createTicket">
      <header><strong>ثبت تیکت جدید</strong><button type="button" @click="showCreate = false" aria-label="بستن">×</button></header>
      <label>موضوع تیکت<input v-model="newTicket.subject" maxlength="200" required placeholder="موضوع درخواست را بنویسید"></label>
      <label>دسته‌بندی<select v-model="newTicket.categoryId"><option value="">عمومی</option><option v-for="item in categories" :key="item.id" :value="String(item.id)">{{ item.name }}</option></select></label>
      <label>شرح درخواست<textarea v-model="newTicket.body" rows="4" maxlength="10000" required placeholder="شرح درخواست خود را وارد کنید"></textarea></label>
      <button type="submit" class="tm-ticket-desk__primary" :disabled="creating">{{ creating ? 'در حال ثبت…' : 'ثبت تیکت' }}</button>
    </form>

    <section class="tm-ticket-desk__layout">
      <aside class="tm-ticket-desk__inbox">
        <header class="tm-ticket-desk__inbox-head">
          <div><strong>صندوق تیکت‌ها</strong><small>{{ filteredTickets.length.toLocaleString('fa-IR') }} مورد</small></div>
          <span class="tm-ticket-desk__inbox-icon"><i class="pi pi-inbox" aria-hidden="true"></i></span>
        </header>
        <label class="tm-ticket-desk__search"><i class="pi pi-search" aria-hidden="true"></i><input v-model="query" type="search" placeholder="جستجو در تیکت‌ها..." aria-label="جستجو در تیکت‌ها"></label>
        <div class="tm-ticket-desk__filters" aria-label="فیلتر تیکت">
          <button type="button" :class="{ active: statusFilter === 'ALL' }" @click="statusFilter = 'ALL'">همه</button>
          <button type="button" :class="{ active: statusFilter === 'OPEN' }" @click="statusFilter = 'OPEN'">باز</button>
          <button type="button" :class="{ active: statusFilter === 'CLOSED' }" @click="statusFilter = 'CLOSED'">بسته</button>
        </div>
        <div class="tm-ticket-desk__ticket-list" :aria-busy="loading">
          <div v-if="loading" class="tm-ticket-desk__empty">در حال دریافت تیکت‌ها…</div>
          <button v-for="ticket in filteredTickets" :key="ticket.id" type="button" class="tm-ticket-desk__ticket" :class="{ selected: selectedTicketId === ticket.id }" :aria-pressed="selectedTicketId === ticket.id" @click="selectTicket(ticket)">
            <span class="tm-ticket-desk__ticket-top"><strong>{{ ticket.code }}</strong><time>{{ ticket.updatedAt }}</time></span>
            <span class="tm-ticket-desk__ticket-subject">{{ ticket.subject }}</span>
            <span class="tm-ticket-desk__ticket-meta"><span>{{ ticket.category }}</span><TemStatusPill :label="ticket.statusLabel" :tone="ticket.statusTone" /></span>
            <span v-if="showRequesterIdentity" class="tm-ticket-desk__requester">{{ ticket.requesterName }} · {{ ticket.requesterType }}</span>
          </button>
          <div v-if="!loading && !filteredTickets.length" class="tm-ticket-desk__empty">تیکتی با این مشخصات پیدا نشد.</div>
        </div>
        <footer class="tm-ticket-desk__inbox-foot">
          <span>ایجاد تیکت جدید</span>
          <button type="button" aria-label="ایجاد تیکت جدید" @click="showCreate = !showCreate"><i class="pi pi-plus" aria-hidden="true"></i></button>
        </footer>
      </aside>

      <section v-if="selectedTicket" class="tm-ticket-desk__conversation" :aria-busy="detailLoading">
        <header class="tm-ticket-desk__conversation-head">
          <div class="tm-ticket-desk__subject">
            <div><span>{{ selectedTicket.code }}</span><TemStatusPill :label="selectedTicket.statusLabel" :tone="selectedTicket.statusTone" /></div>
            <h2>{{ selectedTicket.subject }}</h2><p>{{ selectedTicket.category }} · آخرین بروزرسانی {{ selectedTicket.updatedAt }}</p>
          </div>
          <div class="tm-ticket-desk__actions" v-if="canManageTickets">
            <select v-if="queues.length" v-model="selectedQueueId" aria-label="انتخاب صف"><option value="">انتخاب صف</option><option v-for="queue in queues" :key="queue.id" :value="String(queue.id)">{{ queue.name }}</option></select>
            <button v-if="selectedQueueId" type="button" title="تخصیص صف" @click="assignQueue"><i class="pi pi-share-alt" aria-hidden="true"></i></button>
            <button v-if="!['CLOSED','SPAM'].includes(selectedTicket.status)" type="button" title="تغییر وضعیت" @click="changeTicketStatus"><i class="pi pi-check" aria-hidden="true"></i>{{ selectedTicket.status === 'RESOLVED' ? 'بستن' : 'حل‌شده' }}</button>
          </div>
        </header>

        <div class="tm-ticket-desk__context">
          <div v-if="showRequesterIdentity"><span>درخواست‌دهنده</span><strong>{{ selectedTicket.requesterName }}</strong></div>
          <div><span>اولویت</span><strong>{{ selectedTicket.priorityLabel }}</strong></div>
          <div><span>کارشناس مسئول</span><strong>{{ selectedTicket.assignee }}</strong></div>
        </div>
        <div class="tm-ticket-desk__messages" aria-label="مکالمه تیکت">
          <article v-for="message in visibleMessages" :key="message.id" class="tm-ticket-desk__message" :class="{ 'from-agent': message.fromAgent, internal: message.internal }">
            <div class="tm-ticket-desk__message-meta"><strong>{{ message.sender }}</strong><span v-if="message.internal" class="tm-ticket-desk__internal-label">یادداشت داخلی</span><time>{{ message.timestamp }}</time></div>
            <p>{{ message.body }}</p>
            <small v-if="message.attachment"><i class="pi pi-paperclip" aria-hidden="true"></i> {{ message.attachment }}</small>
          </article>
          <div v-if="!visibleMessages.length" class="tm-ticket-desk__empty">هنوز پیامی برای این تیکت ثبت نشده است.</div>
        </div>
        <footer class="tm-ticket-desk__composer">
          <div class="tm-ticket-desk__composer-note"><i class="pi pi-lock" aria-hidden="true"></i> پاسخ‌ها به‌صورت امن در تیکت ثبت می‌شوند.</div>
          <label v-if="showInternalNotes" class="tm-ticket-desk__internal-toggle"><input v-model="internalNote" type="checkbox"> ثبت یادداشت داخلی (فقط کارکنان)</label>
          <textarea v-model="replyBody" rows="3" maxlength="10000" placeholder="پاسخ خود را بنویسید..." aria-label="متن پاسخ"></textarea>
          <div><button type="button" class="send" :disabled="sending || !replyBody.trim()" @click="sendMessage"><i class="pi pi-send" aria-hidden="true"></i>{{ sending ? 'در حال ارسال…' : internalNote ? 'ثبت یادداشت داخلی' : 'ارسال پاسخ' }}</button></div>
        </footer>
      </section>
      <section v-else class="tm-ticket-desk__no-selection">
        <i class="pi pi-comments" aria-hidden="true"></i><strong>{{ loading ? 'در حال بارگذاری…' : 'تیکتی انتخاب نشده است' }}</strong>
        <span>برای مشاهده مکالمه، یکی از تیکت‌های صندوق را انتخاب کنید.</span>
      </section>
    </section>
  </main>
</template>

<style scoped>
.tm-ticket-desk{display:flex;flex-direction:column;gap:17px;min-width:0}
.tm-ticket-desk__notice{display:flex;align-items:center;gap:9px;padding:10px 13px;border:1px solid var(--tm-cyan);border-radius:10px;background:var(--tm-cyan-soft);color:var(--tm-cyan-deep);font-size:12px}
.tm-ticket-desk__notice strong{margin-inline-start:auto;color:var(--tm-muted);font-size:10px;white-space:nowrap}
.tm-ticket-desk__stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.tm-ticket-desk__layout{display:grid;grid-template-columns:minmax(270px,340px) minmax(0,1fr);gap:13px;min-height:620px}
.tm-ticket-desk__inbox,.tm-ticket-desk__conversation,.tm-ticket-desk__no-selection{min-width:0;border:1px solid var(--tm-line);border-radius:13px;background:var(--tm-surface);overflow:hidden}
.tm-ticket-desk__inbox{display:flex;flex-direction:column}
.tm-ticket-desk__inbox-head{display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid var(--tm-line)}
.tm-ticket-desk__inbox-head strong{display:block;font-size:13px}.tm-ticket-desk__inbox-head small{display:block;margin-top:4px;color:var(--tm-muted);font-size:10px}
.tm-ticket-desk__inbox-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:var(--tm-blue-soft);color:var(--tm-blue)}
.tm-ticket-desk__search{display:flex;align-items:center;gap:8px;margin:12px 13px 8px;padding:9px 10px;border:1px solid var(--tm-line);border-radius:8px;color:var(--tm-muted)}
.tm-ticket-desk__search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--tm-ink);font:inherit;font-size:11px}
.tm-ticket-desk__filters{display:flex;gap:5px;padding:0 13px 10px}
.tm-ticket-desk__filters button{border:0;border-radius:6px;padding:6px 11px;background:var(--tm-surface-sunk);color:var(--tm-muted);font:inherit;font-size:10px;cursor:pointer}
.tm-ticket-desk__filters button.active{background:var(--tm-blue-soft);color:var(--tm-blue);font-weight:700}
.tm-ticket-desk__ticket-list{flex:1;overflow:auto}
.tm-ticket-desk__ticket{display:flex;flex-direction:column;gap:7px;width:100%;padding:13px 14px;border:0;border-bottom:1px solid var(--tm-line);border-inline-start:3px solid transparent;background:transparent;text-align:start;color:var(--tm-ink);font:inherit;cursor:pointer}
.tm-ticket-desk__ticket.selected{border-inline-start-color:var(--tm-blue);background:var(--tm-surface-sunk)}
.tm-ticket-desk__ticket.unread .tm-ticket-desk__ticket-subject{font-weight:800}
.tm-ticket-desk__ticket-top,.tm-ticket-desk__ticket-meta{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tm-ticket-desk__ticket-top strong{font-size:10px;color:var(--tm-blue)}.tm-ticket-desk__ticket-top time,.tm-ticket-desk__requester{font-size:9px;color:var(--tm-muted)}
.tm-ticket-desk__ticket-subject{font-size:12px;font-weight:600;line-height:1.7}
.tm-ticket-desk__ticket-meta>span:first-child{font-size:10px;color:var(--tm-muted)}
.tm-ticket-desk__inbox-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-top:1px solid var(--tm-line);font-size:11px;color:var(--tm-muted)}
.tm-ticket-desk__inbox-foot button,.tm-ticket-desk__actions button{width:30px;height:30px;border:1px solid var(--tm-line);border-radius:7px;background:var(--tm-surface);color:var(--tm-muted)}
.tm-ticket-desk__conversation{display:flex;flex-direction:column}
.tm-ticket-desk__conversation-head{display:flex;justify-content:space-between;gap:12px;padding:19px 20px 15px;border-bottom:1px solid var(--tm-line)}
.tm-ticket-desk__subject>div{display:flex;align-items:center;gap:9px}.tm-ticket-desk__subject>div>span{font-size:10px;color:var(--tm-blue);font-weight:700}
.tm-ticket-desk__subject h2{margin:9px 0 4px;font-size:15px;font-weight:700;color:var(--tm-ink)}
.tm-ticket-desk__subject p{margin:0;color:var(--tm-muted);font-size:10px}
.tm-ticket-desk__actions{display:flex;gap:6px}.tm-ticket-desk__context{display:flex;flex-wrap:wrap;gap:24px;padding:12px 20px;background:var(--tm-surface-sunk);border-bottom:1px solid var(--tm-line)}
.tm-ticket-desk__context div{display:flex;flex-direction:column;gap:4px}.tm-ticket-desk__context span{font-size:9px;color:var(--tm-muted)}.tm-ticket-desk__context strong{font-size:10px;color:var(--tm-ink)}
.tm-ticket-desk__messages{display:flex;flex:1;flex-direction:column;gap:13px;padding:20px;overflow:auto;background:var(--tm-canvas)}
.tm-ticket-desk__message{align-self:flex-start;max-width:min(82%,620px);padding:12px 14px;border:1px solid var(--tm-line);border-radius:11px 11px 11px 3px;background:var(--tm-surface);box-shadow:var(--tm-shadow-xs)}
.tm-ticket-desk__message.from-agent{align-self:flex-end;border-color:var(--tm-blue-soft);border-radius:11px 11px 3px 11px;background:var(--tm-blue-soft)}
.tm-ticket-desk__message.internal{align-self:stretch;max-width:100%;border-style:dashed;border-color:var(--tm-amber);background:var(--tm-amber-soft)}
.tm-ticket-desk__message-meta{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.tm-ticket-desk__message-meta strong{font-size:10px;color:var(--tm-ink)}.tm-ticket-desk__message-meta time{margin-inline-start:auto;font-size:9px;color:var(--tm-muted)}
.tm-ticket-desk__message p{margin:8px 0 0;font-size:11px;line-height:1.9;color:var(--tm-ink-soft);white-space:pre-wrap}
.tm-ticket-desk__message small{display:block;margin-top:8px;color:var(--tm-blue);font-size:10px}.tm-ticket-desk__internal-label{padding:2px 6px;border-radius:5px;background:var(--tm-amber-soft);color:var(--tm-amber);font-size:9px}
.tm-ticket-desk__composer{padding:13px 16px;border-top:1px solid var(--tm-line);background:var(--tm-surface)}
.tm-ticket-desk__composer-note{display:flex;align-items:center;gap:6px;margin-bottom:8px;color:var(--tm-muted);font-size:10px}
.tm-ticket-desk__composer textarea{width:100%;resize:vertical;padding:10px;border:1px solid var(--tm-line);border-radius:8px;background:var(--tm-surface-sunk);color:var(--tm-muted);font:inherit;font-size:11px}
.tm-ticket-desk__composer>div:last-child{display:flex;justify-content:flex-end;gap:7px;margin-top:8px}
.tm-ticket-desk__composer button{padding:7px 10px;border:1px solid var(--tm-line);border-radius:7px;background:var(--tm-surface);color:var(--tm-muted);font:inherit;font-size:10px}
.tm-ticket-desk__composer button.send{background:var(--tm-blue);border-color:var(--tm-blue);color:white}
.tm-ticket-desk__empty,.tm-ticket-desk__no-selection{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;padding:28px;color:var(--tm-muted);font-size:11px;text-align:center}
.tm-ticket-desk__no-selection{min-height:420px}.tm-ticket-desk__no-selection i{font-size:28px;color:var(--tm-blue)}
@media(max-width:1100px){.tm-ticket-desk__stats{grid-template-columns:repeat(2,minmax(0,1fr))}.tm-ticket-desk__layout{grid-template-columns:280px minmax(0,1fr)}}
@media(max-width:760px){.tm-ticket-desk__stats{grid-template-columns:1fr 1fr}.tm-ticket-desk__layout{grid-template-columns:1fr}.tm-ticket-desk__ticket-list{max-height:310px}.tm-ticket-desk__message{max-width:94%}}
@media(max-width:480px){.tm-ticket-desk__stats{grid-template-columns:1fr}.tm-ticket-desk__conversation-head{padding:14px}.tm-ticket-desk__messages{padding:12px}.tm-ticket-desk__context{gap:14px;padding:10px 14px}}

.tm-ticket-desk__notice--error{border-color:var(--tm-danger);background:var(--tm-danger-soft);color:var(--tm-danger)}
.tm-ticket-desk__notice button,.tm-ticket-desk__create button,.tm-ticket-desk__actions button,.tm-ticket-desk__actions select,.tm-ticket-desk__composer button{font:inherit;cursor:pointer}
.tm-ticket-desk__create{display:grid;gap:12px;padding:16px;border:1px solid var(--tm-line);border-radius:12px;background:var(--tm-surface)}
.tm-ticket-desk__create header{display:flex;justify-content:space-between;align-items:center}
.tm-ticket-desk__create label{display:grid;gap:6px;font-size:12px;color:var(--tm-muted)}
.tm-ticket-desk__create input,.tm-ticket-desk__create select,.tm-ticket-desk__create textarea,.tm-ticket-desk__composer textarea{width:100%;min-width:0;border:1px solid var(--tm-line);border-radius:8px;padding:10px;background:var(--tm-surface-sunk);color:var(--tm-ink);font:inherit}
.tm-ticket-desk__create .tm-ticket-desk__primary{justify-self:start;border:0;border-radius:8px;padding:9px 18px;background:var(--tm-blue);color:white}
.tm-ticket-desk__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tm-ticket-desk__actions button{display:flex;align-items:center;gap:6px;border:1px solid var(--tm-line);border-radius:8px;padding:8px 10px;background:var(--tm-surface);color:var(--tm-ink);font-size:11px}
.tm-ticket-desk__actions select{max-width:150px;border:1px solid var(--tm-line);border-radius:8px;padding:8px;background:var(--tm-surface);color:var(--tm-ink)}
.tm-ticket-desk__internal-toggle{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--tm-muted)}
.tm-ticket-desk__composer textarea{resize:vertical}
.tm-ticket-desk__composer button.send{display:flex;align-items:center;gap:7px;margin-inline-start:auto;border:0;border-radius:8px;padding:9px 14px;background:var(--tm-blue);color:#fff}
.tm-ticket-desk__composer button:disabled{opacity:.55;cursor:not-allowed}
.tm-ticket-desk__notice--error button{margin-inline-start:auto;border:1px solid currentColor;border-radius:7px;padding:5px 9px;background:transparent;color:inherit}
@media(max-width:760px){.tm-ticket-desk__layout{grid-template-columns:minmax(0,1fr);min-height:0}.tm-ticket-desk__inbox{max-height:480px}.tm-ticket-desk__stats{grid-template-columns:repeat(2,minmax(0,1fr))}.tm-ticket-desk__actions{width:100%}}
</style>