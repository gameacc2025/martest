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
    :class="{
      'dash-sidebar--collapsed': collapsed,
      'dash-sidebar--mobile-open': mobileOpen,
    }"
  >
    <!-- Brand + collapse button -->
    <div class="dash-sidebar-brand">
      <div class="dash-sidebar-brand-main">
        <BrandMark class="dash-sidebar-brand-icon" :size="32" />
        <span class="dash-sidebar-brand-text">Telecom Market</span>
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

            <!-- Leaf: internal route -->
            <router-link
              v-else
              :to="{ name: item.route }"
              class="dash-sidebar-link"
              :class="{ 'dash-sidebar-link--active': isItemActive(item) }"
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
  </aside>
</template>

<style scoped>
.dash-sidebar {
  --dash-sidebar-expanded: 240px;
  --dash-sidebar-collapsed: 76px;

  display: flex;
  flex-direction: column;
  width: var(--dash-sidebar-expanded);
  height: 100%;
  background: var(--ds-sidebar-bg);
  color: var(--ds-sidebar-fg);
  border-inline-end: 1px solid var(--ds-sidebar-border);
  overflow-x: hidden;
  overflow-y: auto;
  transition: width 0.25s ease;
}

/* ---- Brand ---- */
.dash-sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0 1rem;
  height: var(--dash-header-height, 4rem);
  border-bottom: 1px solid var(--ds-sidebar-border);
  position: sticky;
  top: 0;
  background: var(--ds-sidebar-bg);
  z-index: 1;
}

.dash-sidebar-brand-main {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.dash-sidebar-brand-icon {
  flex-shrink: 0;
}

.dash-sidebar-brand-text {
  font-weight: 700;
  font-size: 1rem;
  color: var(--ds-sidebar-fg-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-sidebar-collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border: none;
  background: transparent;
  border-radius: var(--content-border-radius, 8px);
  color: var(--ds-sidebar-muted);
  cursor: pointer;
  transition: background-color 0.2s;
}

.dash-sidebar-collapse-btn:hover {
  background: var(--ds-sidebar-hover);
  color: var(--ds-sidebar-fg-strong);
}

/* ---- Nav ---- */
.dash-sidebar-nav {
  padding: 0.5rem 0.6rem 1.5rem;
}

.dash-sidebar-section {
  margin: 1rem 0.6rem 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--ds-sidebar-muted);
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s;
}

.dash-sidebar-list,
.dash-sidebar-sublist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dash-sidebar-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: none;
  background: transparent;
  border-radius: var(--content-border-radius, 10px);
  color: var(--ds-sidebar-fg);
  font-size: 0.9rem;
  font-weight: 500;
  font-family: inherit;
  text-align: start;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, padding-inline-start 0.2s;
}

.dash-sidebar-link:hover {
  background: var(--ds-sidebar-hover);
  color: var(--ds-sidebar-fg-strong);
}

/* Subtle inward nudge on hover (RTL-safe, expanded mode only). */
.dash-sidebar:not(.dash-sidebar--collapsed) .dash-sidebar-link:not(.dash-sidebar-link--active):hover {
  padding-inline-start: 1rem;
}


/* Active item: translucent brand wash + white text + brand-colored icon (never color alone: the bar marks it too). */
.dash-sidebar-link--active {
  background: var(--ds-sidebar-active-bg);
  color: var(--ds-sidebar-fg-strong);
}

.dash-sidebar-link--active .dash-sidebar-link-icon {
  color: var(--ds-sidebar-accent);
}

.dash-sidebar-link--active:hover {
  background: var(--ds-sidebar-active-bg);
  color: var(--ds-sidebar-fg-strong);
}

/* Active indicator bar (inline-start edge) */
.dash-sidebar-active-bar {
  position: absolute;
  inset-inline-start: -0.6rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  border-radius: 0 3px 3px 0;
  background: var(--ds-sidebar-accent);
}

.dash-sidebar-link-icon {
  font-size: 1.05rem;
  flex-shrink: 0;
  width: 1.4rem;
  text-align: center;
}

.dash-sidebar-link-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dash-sidebar-badge {
  flex-shrink: 0;
}

.dash-sidebar-caret {
  font-size: 0.75rem;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.dash-sidebar-caret--open {
  transform: rotate(180deg);
}

/* ---- Submenu ---- */
.dash-sidebar-sublist {
  margin-top: 0.15rem;
  padding-inline-start: 1.5rem;
}

.dash-sidebar-sublink {
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
}

/* Submenu expand/collapse transition */
.dash-submenu-enter-active,
.dash-submenu-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  overflow: hidden;
  max-height: 500px;
}
.dash-submenu-enter-from,
.dash-submenu-leave-to {
  opacity: 0;
  max-height: 0;
}

/* ============================================
   Collapsed (icon-only) — desktop only
   ============================================ */
@media (min-width: 992px) {
  .dash-sidebar--collapsed {
    width: var(--dash-sidebar-collapsed);
  }

  .dash-sidebar--collapsed .dash-sidebar-brand {
    justify-content: center;
    padding: 0;
  }

  .dash-sidebar--collapsed .dash-sidebar-brand-text,
  .dash-sidebar--collapsed .dash-sidebar-collapse-btn,
  .dash-sidebar--collapsed .dash-sidebar-section,
  .dash-sidebar--collapsed .dash-sidebar-link-text,
  .dash-sidebar--collapsed .dash-sidebar-badge,
  .dash-sidebar--collapsed .dash-sidebar-caret {
    display: none;
  }

  .dash-sidebar--collapsed .dash-sidebar-link {
    justify-content: center;
    padding: 0.7rem 0;
  }

  .dash-sidebar--collapsed .dash-sidebar-link-icon {
    width: auto;
  }
}

/* Desktop-only helper */
.dash-sidebar-desktop-only {
  display: inline-flex;
}
@media (max-width: 991px) {
  .dash-sidebar-desktop-only {
    display: none;
  }
}
</style>
