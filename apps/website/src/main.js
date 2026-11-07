import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import MultiSelect from 'primevue/multiselect'
import InputSwitch from 'primevue/inputswitch'
import Select from 'primevue/select'
import Card from 'primevue/card'
import Panel from 'primevue/panel'
import Toolbar from 'primevue/toolbar'
import Textarea from 'primevue/textarea'
import Password from 'primevue/password'
import Badge from 'primevue/badge'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import ConfirmDialog from 'primevue/confirmdialog'
import Message from 'primevue/message'
import Avatar from 'primevue/avatar'
import Tooltip from 'primevue/tooltip'

import App from './App.vue'
import router from './router'
import { createPageLoadingController } from './utils/pageLoading'
import '@telecom/shared-ui/assets/main.scss'
import '@telecom/shared-ui/assets/design-system/tem.scss'

import { theme as TelecomPreset } from '@telecom/shared-ui'

const app = createApp(App)
const pageLoading = createPageLoadingController()
let appBooted = false

// Keep the fiber-optic overlay in sync with async route resolution after the
// initial session + router bootstrap. The minimum display duration prevents
// a distracting flash on fast transitions.
router.beforeEach(() => {
  if (appBooted) pageLoading.show()
})
router.afterEach(() => {
  if (appBooted) pageLoading.hide()
})
router.onError(() => {
  if (appBooted) pageLoading.hide({ immediate: true })
})

app.use(createPinia())
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: TelecomPreset,
    options: {
      darkModeSelector: '.app-dark',
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue'
      }
    }
  },
  rtl: true,
  inputStyle: 'outlined'
})

app.use(ToastService)
app.use(ConfirmationService)

app.component('Button', Button)
app.component('InputText', InputText)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Tag', Tag)
app.component('Dialog', Dialog)
app.component('MultiSelect', MultiSelect)
app.component('InputSwitch', InputSwitch)
app.component('Select', Select)
app.component('Card', Card)
app.component('Panel', Panel)
app.component('Toolbar', Toolbar)
app.component('Textarea', Textarea)
app.component('Password', Password)
app.component('Badge', Badge)
app.component('Paginator', Paginator)
app.component('ProgressSpinner', ProgressSpinner)
app.component('ToggleSwitch', ToggleSwitch)
app.component('Checkbox', Checkbox)
app.component('ConfirmDialog', ConfirmDialog)
app.component('Message', Message)
app.component('Avatar', Avatar)

app.directive('tooltip', Tooltip)

// The access token is memory-only, so every reload starts with none even
// when the httpOnly refresh cookie is alive. Keep the static loader visible
// until session restoration and the initial route have both settled.
async function bootstrap() {
  try {
    await useAuthStore().restoreSession()
  } catch {
    // Session restoration is best-effort; the public website must still boot.
  }

  try {
    await router.isReady()
  } catch {
    // A failed initial navigation must not leave the loading overlay stuck.
  }

  app.mount('#app')
  appBooted = true
  pageLoading.hide()
}

bootstrap()
