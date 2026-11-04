<script setup>
import BrandMark from '../common/BrandMark.vue'
/**
 * DashboardSidebar — the single, reusable enterprise sidebar.
 *
 * One component for every dashboard role (Super Admin + Company users). The
 * shell is identical; only the permission/role-filtered items differ.
 * There is intentionally no second sidebar component.
 *
 * Features:
 *   - Expanded 240px / collapsed 76px (icon-only) rail.
 *   - Collapse button (desktop) with persisted state.
 *   - Tooltips on icons while collapsed (PrimeVue `v-tooltip`).
 *   - Nested submenus (expand/collapse) + section groups.
 *   - Active route indicator (also lights up a parent when a child is active).
 *   - Badges per item.
 *   - Smooth width/rotation/expand transitions.
 *
 * Collapse is a desktop concept; on mobile the parent renders this as a full
 * drawer and passes `collapsed = false`.
 */
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Badge from 'primevue/badge'

const props = defineProps({
  // Desktop collapsed (icon-only) state, owned by the parent/shared store.
  collapsed: { type: Boolean, default: false },
  // Mobile drawer open state (used only for a class hook).
  mobileOpen: { type: Boolean, default: false },
  // Pre-filtered menu items (array of section objects).
  menuItems: { type: Array, default: () => [] },
  user: { type: Object, default: null },
})

const emit = defineEmits(['navigate', 'toggle-collapse'])

const route = useRoute()

// Track which parent submenus are open (keyed by title).
const openGroups = ref({})

function isItemActive(item) {
  return item.route && route.name === item.route
}

function isParentActive(item) {
  return Array.isArray(item.children) && item.children.some(isItemActive)
}

function isGroupOpen(item) {
  return !!openGroups.value[item.title]
}

function toggleGroup(item) {
  // In collapsed (icon) mode we don't expand inline; hovering shows tooltip.
  if (props.collapsed) return
  openGroups.value = { ...openGroups.value, [item.title]: !openGroups.value[item.title] }
}

function onExternal(item, event) {
  event.preventDefault()
  window.open(item.url, '_blank', 'noopener,noreferrer')
  emit('navigate')
}

// Auto-open the submenu that contains the active route.
watch(
  () => route.name,
  () => {
    for (const group of props.menuItems) {
      for (const item of group.items) {
        if (isParentActive(item)) {
          openGroups.value = { ...openGroups.value, [item.title]: true }
        }
      }
    }
  },
  { immediate: true }
)

// When expanding from collapsed mode, reopen any submenu holding the active route.
watch(
  () => props.collapsed,
  (isCollapsed) => {
    if (!isCollapsed) {
      for (const group of props.menuItems) {
        for (const item of group.items) {
          if (isParentActive(item)) {
            openGroups.value = { ...openGroups.value, [item.title]: true }
          }
        }
      }
    }
  }
)

const tooltipOptions = computed(() => ({ position: 'left' }))
</script>

<template>
  <aside
    class="dash-sidebar"
    :role="mobileOpen ? 'dialog' : null"
    :aria-modal="mobileOpen ? 'true' : null"
    :aria-label="mobileOpen ? 'منوی ناوبری پنل' : 'ناوبری پنل'"
    :class="{
      'dash-sidebar--collapsed': collapsed,
      'dash-sidebar--mobile-open': mobileOpen,
    }"
  >
    <!-- Brand + collapse button -->
    <div class="dash-sidebar-brand">
      <div class="dash-sidebar-brand-main">
        <BrandMark class="dash-sidebar-brand-icon" :size="32" />
        <span class="dash-sidebar-brand-copy">
          <span class="dash-sidebar-brand-text">Telecom Market</span>
          <span class="dash-sidebar-brand-tagline">تجهیزات مخابراتی و شبکه</span>
        </span>
      </div>
      <button
        type="button"
        class="dash-sidebar-collapse-btn dash-sidebar-desktop-only"
        :aria-label="collapsed ? 'باز کردن منو' : 'جمع کردن منو'"
        @click="emit('toggle-collapse')"
      >
        <i class="pi" :class="collapsed ? 'pi-angle-double-left' : 'pi-angle-double-right'"></i>
      </button>
    </div>

    <nav class="dash-sidebar-nav" aria-label="منوی داشبورد">
      <template v-for="group in props.menuItems" :key="group.section">
        <p class="dash-sidebar-section">{{ group.section }}</p>

        <ul class="dash-sidebar-list">
          <li v-for="item in group.items" :key="item.route || item.url || item.title">
            <!-- Parent with nested children -->
            <template v-if="item.children">
              <button
                type="button"
                class="dash-sidebar-link dash-sidebar-parent"
                :class="{ 'dash-sidebar-link--active': isParentActive(item) }"
                v-tooltip="collapsed ? { value: item.title, ...tooltipOptions } : null"
                :aria-expanded="isGroupOpen(item)"
                @click="toggleGroup(item)"
              >
                <span class="dash-sidebar-active-bar" v-if="isParentActive(item)"></span>
                <i :class="item.icon" class="dash-sidebar-link-icon"></i>
                <span class="dash-sidebar-link-text">{{ item.title }}</span>
                <Badge
                  v-if="item.badge"
                  :value="item.badge.value"
                  :severity="item.badge.severity"
                  class="dash-sidebar-badge"
                />
                <i
                  class="pi pi-chevron-down dash-sidebar-caret"
                  :class="{ 'dash-sidebar-caret--open': isGroupOpen(item) }"
                ></i>
              </button>

              <!-- Submenu (hidden when collapsed) -->
              <transition name="dash-submenu">
                <ul
                  v-show="isGroupOpen(item) && !collapsed"
                  class="dash-sidebar-sublist"
                >
                  <li v-for="child in item.children" :key="child.route || child.url || child.title">
                    <a
                      v-if="child.external"
                      :href="child.url"
                      class="dash-sidebar-link dash-sidebar-sublink"
                      @click="onExternal(child, $event)"
                    >
                      <i :class="child.icon" class="dash-sidebar-link-icon"></i>
                      <span class="dash-sidebar-link-text">{{ child.title }}</span>
                    </a>
                    <router-link
                      v-else
                      :to="{ name: child.route }"
                      class="dash-sidebar-link dash-sidebar-sublink"
                      :class="{ 'dash-sidebar-link--active': isItemActive(child) }"
                      :aria-current="isItemActive(child) ? 'page' : undefined"
                      @click="emit('navigate')"
                    >
                      <span class="dash-sidebar-active-bar" v-if="isItemActive(child)"></span>
                      <i :class="child.icon" class="dash-sidebar-link-icon"></i>
                      <span class="dash-sidebar-link-text">{{ child.title }}</span>
                      <Badge
                        v-if="child.badge"
                        :value="child.badge.value"
                        :severity="child.badge.severity"
                        class="dash-sidebar-badge"
                      />
                    </router-link>
                  </li>
                </ul>
              </transition>
            </template>

            <!-- Leaf: external link -->
            <a
              v-else-if="item.external"
              :href="item.url"
              class="dash-sidebar-link"
              v-tooltip="collapsed ? { value: item.title, ...tooltipOptions } : null"
              @click="onExternal(item, $event)"
            >
              <i :class="item.icon" class="dash-sidebar-link-icon"></i>
              <span class="dash-sidebar-link-text">{{ item.title }}</span>
              <Badge
                v-if="item.badge"
                :value="item.badge.value"
                :severity="item.badge.severity"
                class="dash-sidebar-badge"
              />
            </a>

            <!-- Planned modules are intentionally visible but non-interactive until implemented. -->
            <span
              v-else-if="item.planned"
              class="dash-sidebar-link dash-sidebar-link--planned"
              role="note"
              aria-disabled="true"
              v-tooltip="collapsed ? { value: item.title + ' — در برنامه توسعه', ...tooltipOptions } : null"
            >
              <i :class="item.icon" class="dash-sidebar-link-icon"></i>
              <span class="dash-sidebar-link-text">{{ item.title }}</span>
              <span class="dash-sidebar-planned-badge">آینده</span>
            </span>

            <!-- Leaf: internal route -->
            <router-link
              v-else
              :to="{ name: item.route }"
              class="dash-sidebar-link"
              :class="{ 'dash-sidebar-link--active': isItemActive(item) }"
              :aria-current="isItemActive(item) ? 'page' : undefined"
              v-tooltip="collapsed ? { value: item.title, ...tooltipOptions } : null"
              @click="emit('navigate')"
            >
              <span class="dash-sidebar-active-bar" v-if="isItemActive(item)"></span>
              <i :class="item.icon" class="dash-sidebar-link-icon"></i>
              <span class="dash-sidebar-link-text">{{ item.title }}</span>
              <Badge
                v-if="item.badge"
                :value="item.badge.value"
                :severity="item.badge.severity"
                class="dash-sidebar-badge"
              />
            </router-link>
          </li>
        </ul>
      </template>
    </nav>
    <footer class="dash-sidebar-profile">
      <span class="dash-sidebar-profile-avatar">{{ (user?.displayName || user?.fullName || user?.username || 'ک').charAt(0) }}</span>
      <span class="dash-sidebar-profile-meta">
        <strong>{{ user?.displayName || user?.fullName || user?.username || 'کاربر پنل' }}</strong>
        <small>{{ user?.company?.name || 'مدیریت سامانه' }}</small>
      </span>
    </footer>
  </aside>
</template>

<style scoped>

.dash-sidebar{--dash-sidebar-expanded:208px;--dash-sidebar-collapsed:68px;display:flex;flex-direction:column;width:var(--dash-sidebar-expanded);height:100%;overflow-x:hidden;overflow-y:auto;background:linear-gradient(180deg,var(--tm-navy) 0%,var(--tm-navy-deep) 100%);color:rgba(255,255,255,.86);border-inline-end:1px solid rgba(255,255,255,.08);transition:width .24s ease}
.dash-sidebar-brand{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:flex-start;min-height:76px;padding:0 1.1rem;background:linear-gradient(180deg,var(--tm-navy) 0%,var(--tm-navy) 100%);border-bottom:1px solid rgba(255,255,255,.09)}
.dash-sidebar-brand-main{display:flex;align-items:center;gap:.7rem;min-width:0}.dash-sidebar-brand-icon{flex-shrink:0}.dash-sidebar-brand-copy{display:flex;flex-direction:column;gap:.15rem;min-width:0}
.dash-sidebar-brand-text{color:#fff;font-size:.96rem;font-weight:800;line-height:1.2;white-space:nowrap}.dash-sidebar-brand-tagline{color:rgba(255,255,255,.55);font-size:.62rem;white-space:nowrap}
.dash-sidebar-collapse-btn{display:none}
.dash-sidebar-nav{padding:.8rem .65rem 1.25rem}.dash-sidebar-section{margin:1.1rem .7rem .45rem;color:rgba(255,255,255,.45);font-size:.65rem;font-weight:700;letter-spacing:.04em;white-space:nowrap}
.dash-sidebar-list,.dash-sidebar-sublist{display:flex;flex-direction:column;gap:.28rem;margin:0;padding:0;list-style:none}
.dash-sidebar-link{position:relative;display:flex;align-items:center;gap:.8rem;width:100%;min-height:2.65rem;padding:.58rem .85rem;border:0;border-radius:9px;background:transparent;color:rgba(255,255,255,.80);font-family:inherit;font-size:.82rem;font-weight:500;text-align:start;text-decoration:none;cursor:pointer;transition:background .18s,color .18s}
.dash-sidebar-link:hover{background:rgba(255,255,255,.075);color:#fff}.dash-sidebar-link--active{background:linear-gradient(105deg,var(--tm-cyan-strong) 0%,var(--tm-cyan) 100%);color:#fff;box-shadow:0 5px 14px rgba(0,174,204,.2)}.dash-sidebar-link--active .dash-sidebar-link-icon{color:#fff}
.dash-sidebar-active-bar{display:none}.dash-sidebar-link-icon{width:1.3rem;flex-shrink:0;color:rgba(255,255,255,.62);font-size:1rem;text-align:center}.dash-sidebar-link--active .dash-sidebar-link-icon{color:#fff}
.dash-sidebar-link-text{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dash-sidebar-badge{flex-shrink:0}.dash-sidebar-caret{font-size:.7rem;transition:transform .2s}.dash-sidebar-caret--open{transform:rotate(180deg)}
.dash-sidebar-link--planned{opacity:.52;cursor:default}.dash-sidebar-link--planned:hover{background:transparent;color:rgba(255,255,255,.80)}.dash-sidebar-planned-badge{padding:.1rem .35rem;border:1px solid rgba(255,255,255,.16);border-radius:999px;color:rgba(255,255,255,.55);font-size:.6rem}
.dash-sidebar-sublist{margin:.2rem .35rem .35rem;padding-inline-start:.75rem;border-inline-start:1px solid rgba(255,255,255,.12)}.dash-sidebar-sublink{min-height:2.35rem;font-size:.77rem}
.dash-submenu-enter-active,.dash-submenu-leave-active{overflow:hidden;max-height:500px;transition:opacity .2s,max-height .25s}.dash-submenu-enter-from,.dash-submenu-leave-to{max-height:0;opacity:0}
.dash-sidebar-link:focus-visible{outline:2px solid var(--tm-cyan);outline-offset:2px}
.dash-sidebar-profile{position:sticky;bottom:0;display:flex;align-items:center;gap:.65rem;margin-top:auto;padding:.85rem .8rem;border-top:1px solid rgba(255,255,255,.1);background:var(--tm-navy-deep)}
.dash-sidebar-profile-avatar{display:grid;width:2.25rem;height:2.25rem;flex:0 0 auto;place-items:center;border:2px solid rgba(255,255,255,.18);border-radius:50%;background:linear-gradient(135deg,var(--tm-cyan),var(--tm-blue));color:#fff;font-size:.8rem;font-weight:900}
.dash-sidebar-profile-meta{display:flex;min-width:0;flex-direction:column;gap:.08rem}
.dash-sidebar-profile-meta strong{overflow:hidden;color:#fff;font-size:.72rem;font-weight:800;text-overflow:ellipsis;white-space:nowrap}
.dash-sidebar-profile-meta small{overflow:hidden;color:rgba(255,255,255,.55);font-size:.62rem;text-overflow:ellipsis;white-space:nowrap}

@media(min-width:992px){.dash-sidebar--collapsed{width:var(--dash-sidebar-collapsed)}.dash-sidebar--collapsed .dash-sidebar-brand{justify-content:center;padding:0}.dash-sidebar--collapsed .dash-sidebar-profile-meta,.dash-sidebar--collapsed .dash-sidebar-section,.dash-sidebar--collapsed .dash-sidebar-link-text,.dash-sidebar--collapsed .dash-sidebar-badge,.dash-sidebar--collapsed .dash-sidebar-planned-badge,.dash-sidebar--collapsed .dash-sidebar-caret{display:none}.dash-sidebar--collapsed .dash-sidebar-link{justify-content:center;padding:.7rem 0}.dash-sidebar--collapsed .dash-sidebar-link-icon{width:auto}.dash-sidebar-desktop-only{display:none}}
@media(max-width:991px){.dash-sidebar{width:208px}.dash-sidebar-brand{min-height:68px}.dash-sidebar-desktop-only{display:none}}

</style>
