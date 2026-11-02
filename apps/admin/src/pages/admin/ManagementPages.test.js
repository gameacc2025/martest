import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readPage(relativePath) {
  const candidates = [
    resolve(process.cwd(), `apps/admin/src/pages/admin/${relativePath}`),
    resolve(process.cwd(), relativePath),
  ]
  const filePath = candidates.find(existsSync)
  if (!filePath) throw new Error(`Could not locate ${relativePath}`)
  return readFileSync(filePath, 'utf8')
}

const categories = readPage('categories/CategoryList.vue')
const roles = readPage('roles/RoleList.vue')
const permissions = readPage('permissions/PermissionList.vue')
const orders = readPage('orders/OrderList.vue')

describe('Admin management page accessibility contracts', () => {
  it('labels category, role and permission search and row actions', () => {
    expect(categories).toContain('aria-label="جستجو در دسته‌بندی‌ها"')
    expect(categories).toContain('aria-label="ویرایش دسته‌بندی"')
    expect(categories).toContain('aria-label="حذف دسته‌بندی"')
    expect(roles).toContain('aria-label="جستجو در نقش‌ها"')
    expect(roles).toContain('aria-label="ویرایش نقش"')
    expect(permissions).toContain('aria-label="جستجو در مجوزها"')
    expect(permissions).toContain('aria-label="ویرایش مجوز"')
  })

  it('uses a real keyboard-operable control for permission group disclosure', () => {
    expect(roles).toContain('class="permission-group-toggle"')
    expect(roles).toContain(':aria-expanded="Boolean(expandedGroups[groupName])"')
    expect(roles).toContain(':aria-controls="`permission-group-items-${groupName}`"')
    expect(roles).toContain('class="permission-group-select"')
  })

  it('keeps order search, status filter and row actions named', () => {
    expect(orders).toContain('aria-label="جستجو در سفارش‌ها"')
    expect(orders).toContain('aria-label="فیلتر وضعیت سفارش"')
    expect(orders).toContain('aria-label="مشاهده سفارش"')
    expect(orders).toContain('aria-label="تغییر وضعیت سفارش"')
  })

  it('sets 44px action and pagination targets on management tables', () => {
    for (const source of [categories, roles, permissions, orders]) {
      expect(source).toContain('min-height: 2.75rem')
      expect(source).toContain('min-width: 2.75rem')
    }
  })
})
