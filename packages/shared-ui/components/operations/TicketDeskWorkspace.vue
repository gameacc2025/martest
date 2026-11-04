<script setup>
import { computed, ref, watch } from 'vue'
import TemPageHeader from '../ui/TemPageHeader.vue'
import TemStatCard from '../ui/TemStatCard.vue'
import TemStatusPill from '../ui/TemStatusPill.vue'

const props = defineProps({
  title: { type: String, required: true },
  eyebrow: { type: String, default: 'SUPPORT DESK' },
  description: { type: String, default: '' },
  stats: { type: Array, default: () => [] },
  tickets: { type: Array, default: () => [] },
  showInternalNotes: { type: Boolean, default: false },
  showRequesterIdentity: { type: Boolean, default: true },
})

const selectedTicketId = ref(props.tickets[0]?.id ?? null)
const query = ref('')
const statusFilter = ref('ALL')

watch(() => props.tickets, (items) => {
  if (!items.some((ticket) => ticket.id === selectedTicketId.value)) {
    selectedTicketId.value = items[0]?.id ?? null
  }
}, { deep: true })

const filteredTickets = computed(() => props.tickets.filter((ticket) => {
  const text = [ticket.code, ticket.subject, ticket.category, ticket.requesterName].join(' ').toLocaleLowerCase()
  const matchesQuery = !query.value || text.includes(query.value.toLocaleLowerCase())
  const matchesStatus = statusFilter.value === 'ALL'
    || (statusFilter.value === 'OPEN' && ticket.status !== 'CLOSED')
    || (statusFilter.value === 'CLOSED' && ticket.status === 'CLOSED')
  return matchesQuery && matchesStatus
}))

watch(filteredTickets, (items) => {
  if (!items.some((ticket) => ticket.id === selectedTicketId.value)) {
    selectedTicketId.value = items[0]?.id ?? null
  }
}, { immediate: true })

const selectedTicket = computed(() => props.tickets.find((ticket) => ticket.id === selectedTicketId.value) || null)
const visibleMessages = computed(() => (selectedTicket.value?.messages || []).filter((message) => props.showInternalNotes || !message.internal))
</script>

<template>
  <main class="tm-ticket-desk">
    <div class="tm-ticket-desk__notice" role="note">
      <i class="pi pi-info-circle" aria-hidden="true"></i>
      <span>پیش‌نمایش مرکز پشتیبانی — اطلاعات و مکالمات این صفحه نمونه هستند و هنوز به API تیکت متصل نیستند.</span>
      <strong>{{ eyebrow }}</strong>
    </div>

    <TemPageHeader :title="title" :description="description" />

    <section v-if="stats.length" class="tm-ticket-desk__stats" aria-label="شاخص‌های پشتیبانی">
      <TemStatCard v-for="item in stats" :key="item.label" v-bind="item" />
    </section>

    <section class="tm-ticket-desk__layout">
      <aside class="tm-ticket-desk__inbox">
        <header class="tm-ticket-desk__inbox-head">
          <div><strong>صندوق تیکت‌ها</strong><small>{{ filteredTickets.length.toLocaleString('fa-IR') }} مورد</small></div>
          <span class="tm-ticket-desk__inbox-icon"><i class="pi pi-inbox" aria-hidden="true"></i></span>
        </header>
        <label class="tm-ticket-desk__search">
          <i class="pi pi-search" aria-hidden="true"></i>
          <input v-model="query" type="search" placeholder="جستجو در تیکت‌ها..." aria-label="جستجو در تیکت‌ها">
        </label>
        <div class="tm-ticket-desk__filters" aria-label="فیلتر تیکت">
          <button type="button" :class="{ active: statusFilter === 'ALL' }" @click="statusFilter = 'ALL'">همه</button>
          <button type="button" :class="{ active: statusFilter === 'OPEN' }" @click="statusFilter = 'OPEN'">باز</button>
          <button type="button" :class="{ active: statusFilter === 'CLOSED' }" @click="statusFilter = 'CLOSED'">بسته</button>
        </div>
        <div class="tm-ticket-desk__ticket-list">
          <button
            v-for="ticket in filteredTickets"
            :key="ticket.id"
            type="button"
            class="tm-ticket-desk__ticket"
            :class="{ selected: selectedTicketId === ticket.id, unread: ticket.unread }"
            :aria-pressed="selectedTicketId === ticket.id"
            @click="selectedTicketId = ticket.id"
          >
            <span class="tm-ticket-desk__ticket-top"><strong>{{ ticket.code }}</strong><time>{{ ticket.updatedAt }}</time></span>
            <span class="tm-ticket-desk__ticket-subject">{{ ticket.subject }}</span>
            <span class="tm-ticket-desk__ticket-meta">
              <span>{{ ticket.category }}</span>
              <TemStatusPill :label="ticket.statusLabel" :tone="ticket.statusTone || 'neutral'" />
            </span>
            <span v-if="showRequesterIdentity" class="tm-ticket-desk__requester">{{ ticket.requesterName }} · {{ ticket.requesterType }}</span>
          </button>
          <div v-if="!filteredTickets.length" class="tm-ticket-desk__empty">تیکتی با این مشخصات پیدا نشد.</div>
        </div>
        <footer class="tm-ticket-desk__inbox-foot">
          <span>ایجاد تیکت جدید</span>
          <button type="button" disabled aria-label="ایجاد تیکت جدید در فاز API"><i class="pi pi-plus" aria-hidden="true"></i></button>
        </footer>
      </aside>

      <section v-if="selectedTicket" class="tm-ticket-desk__conversation">
        <header class="tm-ticket-desk__conversation-head">
          <div class="tm-ticket-desk__subject">
            <div><span>{{ selectedTicket.code }}</span><TemStatusPill :label="selectedTicket.statusLabel" :tone="selectedTicket.statusTone || 'neutral'" /></div>
            <h2>{{ selectedTicket.subject }}</h2>
            <p>{{ selectedTicket.category }} · آخرین بروزرسانی {{ selectedTicket.updatedAt }}</p>
          </div>
          <div class="tm-ticket-desk__actions">
            <button type="button" disabled title="در فاز API فعال می‌شود"><i class="pi pi-ellipsis-h" aria-hidden="true"></i></button>
            <button type="button" disabled title="در فاز API فعال می‌شود"><i class="pi pi-check" aria-hidden="true"></i></button>
          </div>
        </header>

        <div class="tm-ticket-desk__context">
          <div v-if="showRequesterIdentity"><span>درخواست‌دهنده</span><strong>{{ selectedTicket.requesterName }}</strong></div>
          <div><span>اولویت</span><strong>{{ selectedTicket.priorityLabel || 'عادی' }}</strong></div>
          <div><span>کارشناس مسئول</span><strong>{{ selectedTicket.assignee || 'تخصیص‌نیافته' }}</strong></div>
        </div>

        <div class="tm-ticket-desk__messages" aria-label="مکالمه تیکت">
          <article
            v-for="message in visibleMessages"
            :key="message.id"
            class="tm-ticket-desk__message"
            :class="{ 'from-agent': message.fromAgent, internal: message.internal }"
          >
            <div class="tm-ticket-desk__message-meta">
              <strong>{{ message.sender }}</strong>
              <span v-if="message.internal" class="tm-ticket-desk__internal-label">یادداشت داخلی</span>
              <time>{{ message.timestamp }}</time>
            </div>
            <p>{{ message.body }}</p>
            <small v-if="message.attachment"><i class="pi pi-paperclip" aria-hidden="true"></i> {{ message.attachment }}</small>
          </article>
          <div v-if="!visibleMessages.length" class="tm-ticket-desk__empty">هنوز پیامی برای این تیکت ثبت نشده است.</div>
        </div>

        <footer class="tm-ticket-desk__composer">
          <div class="tm-ticket-desk__composer-note"><i class="pi pi-lock" aria-hidden="true"></i> ارسال پاسخ پس از اتصال API تیکت فعال می‌شود.</div>
          <textarea rows="3" disabled placeholder="پاسخ خود را بنویسید..."></textarea>
          <div><button type="button" disabled><i class="pi pi-paperclip" aria-hidden="true"></i> پیوست</button><button type="button" disabled class="send"><i class="pi pi-send" aria-hidden="true"></i> ارسال پاسخ</button></div>
        </footer>
      </section>

      <section v-else class="tm-ticket-desk__no-selection">
        <i class="pi pi-comments" aria-hidden="true"></i>
        <strong>تیکتی انتخاب نشده است</strong>
        <span>برای مشاهده مکالمه، یکی از تیکت‌های صندوق را انتخاب کنید.</span>
      </section>
    </section>
  </main>
</template>

<style scoped>
.tm-ticket-desk{display:flex;flex-direction:column;gap:17px;min-width:0}
.tm-ticket-desk__notice{display:flex;align-items:center;gap:9px;padding:10px 13px;border:1px solid #d8e8f1;border-radius:10px;background:#f2f8fc;color:#34556b;font-size:12px}
.tm-ticket-desk__notice strong{margin-inline-start:auto;color:#627d90;font-size:10px;white-space:nowrap}
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
.tm-ticket-desk__message{align-self:flex-start;max-width:min(82%,620px);padding:12px 14px;border:1px solid var(--tm-line);border-radius:11px 11px 11px 3px;background:var(--tm-surface);box-shadow:0 2px 8px #10243a08}
.tm-ticket-desk__message.from-agent{align-self:flex-end;border-color:var(--tm-blue-soft);border-radius:11px 11px 3px 11px;background:var(--tm-blue-soft)}
.tm-ticket-desk__message.internal{align-self:stretch;max-width:100%;border-style:dashed;border-color:#e8c982;background:#fff9e9}
.tm-ticket-desk__message-meta{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.tm-ticket-desk__message-meta strong{font-size:10px;color:var(--tm-ink)}.tm-ticket-desk__message-meta time{margin-inline-start:auto;font-size:9px;color:var(--tm-muted)}
.tm-ticket-desk__message p{margin:8px 0 0;font-size:11px;line-height:1.9;color:var(--tm-ink-soft);white-space:pre-wrap}
.tm-ticket-desk__message small{display:block;margin-top:8px;color:var(--tm-blue);font-size:10px}.tm-ticket-desk__internal-label{padding:2px 6px;border-radius:5px;background:#f6e7bf;color:#8d6314;font-size:9px}
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
</style>