<script setup>
import BrandMark from '../common/BrandMark.vue'
/**
 * DashboardSidebar — the single, reusable enterprise sidebar.
 *
 * One component for every dashboard role (Super Admin + Company users). The
 * shell is identical; only the permission/role-filtered items differ.
 * There is intentionally no second sidebar component.
 *
 * Visual source: `tem/telecom.html` `.sd` — navy gradient rail, LTR wordmark,
 * cyan primary-action pill, compact icon+label items with a cyan count chip,
 * a support card and a copyright line.
 *
 * Features kept from the previous shell:
 *   - Expanded 256px / collapsed 76px (icon-only) rail.
 *   - Collapse button (desktop) with persisted state.
 *   - Tooltips on icons while collapsed (PrimeVue `v-tooltip`).
 *   - Nested submenus (expand/collapse) + section groups.
 *   - Active route indicator (also lights up a parent when a child is active).
 *   - Badges per item.
 *
 * Collapse is a desktop concept; on mobile the parent renders this as a full
 * drawer and passes `collapsed = false`.
 */
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  // Desktop collapsed (icon-only) state, owned by the parent/shared store.
  collapsed: { type: Boolean, default: false },
  // Mobile drawer open state (used only for a class hook).
  mobileOpen: { type: Boolean, default: false },
  // Pre-filtered menu items (array of section objects).
  menuItems: { type: Array, default: () => [] },
  user: { type: Object, default: null },
})

const emit = defineEmits(['navigate'])

const route = useRoute()

// Track which parent submenus are open (keyed by title).
const openGroups = ref({})

function isItemActive(item) {
  if (!item.route || route.name !== item.route) return false
  if (item.query?.status) return String(route.query.status || 'همه') === String(item.query.status)
  return true
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

function badgeText(badge) {
  if (badge === null || badge === undefined) return ''
  return typeof badge === 'object' ? badge.value : badge
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
    <!-- Brand: LTR wordmark -->
    <div class="dash-sidebar-brand">
      <BrandMark class="dash-sidebar-brand-icon" :size="34" />
      <span class="dash-sidebar-brand-text">Telecom<br />Market</span>
    </div>

    <nav class="dash-sidebar-nav" aria-label="منوی داشبورد">
      <template v-for="group in props.menuItems" :key="group.section">
        <p v-if="group.section" class="dash-sidebar-section">{{ group.section }}</p>

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
                <i :class="item.icon" class="dash-sidebar-link-icon"></i>
                <span class="dash-sidebar-link-text">{{ item.title }}</span>
                <span v-if="item.badge" class="dash-sidebar-count">{{ badgeText(item.badge) }}</span>
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
                      :to="{ name: child.route, query: child.query || undefined }"
                      class="dash-sidebar-link dash-sidebar-sublink"
                      :class="{ 'dash-sidebar-link--active': isItemActive(child) }"
                      :aria-current="isItemActive(child) ? 'page' : undefined"
                      @click="emit('navigate')"
                    >
                      <i :class="child.icon" class="dash-sidebar-link-icon"></i>
                      <span class="dash-sidebar-link-text">{{ child.title }}</span>
                      <span v-if="child.badge" class="dash-sidebar-count">{{ badgeText(child.badge) }}</span>
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
              <span v-if="item.badge" class="dash-sidebar-count">{{ badgeText(item.badge) }}</span>
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
              <i :class="item.icon" class="dash-sidebar-link-icon"></i>
              <span class="dash-sidebar-link-text">{{ item.title }}</span>
              <span v-if="item.badge" class="dash-sidebar-count">{{ badgeText(item.badge) }}</span>
            </router-link>
          </li>
        </ul>
      </template>
    </nav>

    <div class="dash-sidebar-copyright">2025 Telecom Market ©</div>
  </aside>
</template>

<style scoped>
.dash-sidebar {
  --dash-sidebar-expanded: var(--ds-sidebar-width);
  --dash-sidebar-collapsed: var(--ds-sidebar-collapsed-width);
  display: flex;
  flex-direction: column;
  width: var(--dash-sidebar-expanded);
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 26px 14px;
  background: var(--ds-sidebar-bg);
  color: var(--ds-sidebar-fg);
  transition: width 0.24s ease;
}

/* ---- Brand (tem `.lg`) ---- */
.dash-sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 6px 26px;
  direction: ltr;
  line-height: 1.1;
}
.dash-sidebar-brand-text {
  color: var(--ds-sidebar-fg-strong);
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
}

/* ---- Navigation (tem `.mi`) ---- */
.dash-sidebar-nav { padding: 0; }
.dash-sidebar-section {
  margin: 14px 6px 6px;
  color: var(--ds-sidebar-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.dash-sidebar-list,
.dash-sidebar-sublist {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dash-sidebar-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 44px;
  padding: 12px 16px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ds-sidebar-fg);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  text-align: start;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}
.dash-sidebar-link:hover { background: var(--ds-sidebar-hover); color: var(--ds-sidebar-fg-strong); }
.dash-sidebar-link--active {
  background: var(--ds-sidebar-active-bg);
  color: var(--ds-sidebar-active-fg);
  font-weight: 600;
  box-shadow: none;
}
.dash-sidebar-link-icon {
  width: 22px;
  flex-shrink: 0;
  color: var(--ds-sidebar-muted);
  font-size: 16px;
  text-align: center;
}
.dash-sidebar-link:hover .dash-sidebar-link-icon,
.dash-sidebar-link--active .dash-sidebar-link-icon { color: var(--ds-sidebar-active-fg); }
.dash-sidebar-link-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* tem `.mi .c` */
.dash-sidebar-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  margin-inline-start: auto;
  padding: 0 5px;
  border-radius: 50%;
  background: var(--ds-brand-primary);
  color: var(--ds-primary-button-text);
  font-size: 11px;
  font-weight: 700;
  flex: none;
}
.dash-sidebar-caret { font-size: 0.7rem; transition: transform 0.2s; }
.dash-sidebar-caret--open { transform: rotate(180deg); }
.dash-sidebar-link--planned { opacity: 0.52; cursor: default; }
.dash-sidebar-link--planned:hover { background: transparent; color: var(--ds-sidebar-fg); }
.dash-sidebar-planned-badge {
  padding: 0.1rem 0.35rem;
  border: 1px solid var(--ds-sidebar-border);
  border-radius: 999px;
  color: var(--ds-sidebar-muted);
  font-size: 0.6rem;
}
.dash-sidebar-sublist {
  margin: 4px 0 4px;
  padding-inline-start: 0.75rem;
  border-inline-start: 1px solid var(--ds-sidebar-border);
}
.dash-sidebar-sublink { min-height: 38px; padding-block: 8px; font-size: 13px; }
.dash-submenu-enter-active,
.dash-submenu-leave-active { overflow: hidden; max-height: 500px; transition: opacity 0.2s, max-height 0.25s; }
.dash-submenu-enter-from,
.dash-submenu-leave-to { max-height: 0; opacity: 0; }
.dash-sidebar-link:focus-visible { outline: 2px solid var(--ds-color-focus); outline-offset: 2px; }

.dash-sidebar-copyright {
  margin-top: auto;
  padding-top: 16px;
  color: var(--ds-sidebar-muted);
  font-size: 10px;
  text-align: center;
  direction: ltr;
}

@media (min-width: 992px) {
  .dash-sidebar--collapsed { width: var(--dash-sidebar-collapsed); padding-inline: 10px; }
  .dash-sidebar--collapsed .dash-sidebar-brand { justify-content: center; margin-inline: 0; }
  .dash-sidebar--collapsed .dash-sidebar-brand-text,
  .dash-sidebar--collapsed .dash-sidebar-section,
  .dash-sidebar--collapsed .dash-sidebar-link-text,
  .dash-sidebar--collapsed .dash-sidebar-count,
  .dash-sidebar--collapsed .dash-sidebar-planned-badge,
  .dash-sidebar--collapsed .dash-sidebar-caret,
  .dash-sidebar--collapsed .dash-sidebar-copyright { display: none; }
  .dash-sidebar--collapsed .dash-sidebar-link { justify-content: center; padding-inline: 0; }
  .dash-sidebar--collapsed .dash-sidebar-link-icon { width: auto; }
}
@media (max-width: 991px) {
  .dash-sidebar { width: var(--ds-sidebar-width); }
}

/* NewTemp navigation geometry shared by Admin and Company. */
.dash-sidebar{padding:16px 12px}
.dash-sidebar-brand{margin-bottom:18px}
.dash-sidebar-brand-text{font-size:16px;font-weight:700}
.dash-sidebar-list,.dash-sidebar-sublist{gap:4px}
.dash-sidebar-link{min-height:42px;padding:10px 12px;border-radius:8px}
.dash-sidebar-count{min-width:20px;height:20px;border-radius:6px}
@media(prefers-reduced-motion:reduce){.dash-sidebar,.dash-sidebar-link,.dash-sidebar-caret{transition:none}}
</style>