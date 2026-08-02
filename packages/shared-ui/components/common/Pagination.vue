<script setup>
import { computed } from 'vue'
import Paginator from 'primevue/paginator'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  totalItems: {
    type: Number,
    default: 0
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:currentPage'])

const first = computed(() => (props.currentPage - 1) * props.itemsPerPage)

function onPageChange(event) {
  emit('update:currentPage', event.page + 1)
}
</script>

<template>
  <Paginator
    v-if="totalPages > 1"
    :first="first"
    :rows="itemsPerPage"
    :totalRecords="totalItems"
    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
    currentPageReportTemplate="نمایش {first} تا {last} از {totalRecords} مورد"
    @page="onPageChange"
    class="app-pagination"
  />
</template>
