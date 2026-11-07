<script setup>
/**
 * PublicLayout — website shell.
 *
 * Visual language: unified "tem" system (navy utility strip, white command
 * header, cyan/blue accents, pale canvas, Vazirmatn RTL).
 *
 * All existing behaviour is preserved verbatim: PKCE panel handoff links,
 * customer/company/staff menu branching, notification unread count, search
 * routing, category loading for the mega menu and footer, and mobile nav.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { categoriesApi, inquiriesApi, endpoints } from '@telecom/api-client'
import { apiGet, apiGetPaginated } from '@telecom/shared-core/http/apiClient'
import PvButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import Drawer from 'primevue/drawer'
import MegaMenu from '@telecom/shared-ui/components/common/MegaMenu.vue'
import BrandMark from '@telecom/shared-ui/components/common/BrandMark.vue'

const authStore = useAuthStore()
const cartStore = useCartStore()
const cartItemCount = computed(() => cartStore.itemCount)
const cartDrawerOpen = ref(false)
const searchPanelOpen = ref(false)
const myInquiryCount = ref(null)
const router = useRouter()
const route = useRoute()

// Keep the responsive navigation in sync with route changes (including
// browser back/forward) so it never remains open over a new page.
