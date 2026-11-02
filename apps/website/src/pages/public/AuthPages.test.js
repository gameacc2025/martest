import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readPage(fileName) {
  const candidates = [
    resolve(process.cwd(), `apps/website/src/pages/public/${fileName}`),
    resolve(process.cwd(), `src/pages/public/${fileName}`),
  ]
  const filePath = candidates.find(existsSync)
  if (!filePath) throw new Error(`Could not locate ${fileName}`)
  return readFileSync(filePath, 'utf8')
}

const login = readPage('Login.vue')
const register = readPage('Register.vue')
const forgotPassword = readPage('ForgotPassword.vue')

describe('Website authentication page accessibility contracts', () => {
  it('associates login labels with phone and password controls', () => {
    expect(login).toContain('<label for="login-phone">')
    expect(login).toContain('id="login-phone"')
    expect(login).toContain('<label for="login-password">')
    expect(login).toContain('inputId="login-password"')
    expect(login).toContain('class="auth-error" role="alert"')
  })

  it('associates customer and company registration labels with their controls', () => {
    for (const id of [
      'register-first-name',
      'register-last-name',
      'register-email',
      'register-phone',
      'register-password',
      'register-confirm-password',
      'register-company-name',
      'register-company-name-en',
      'register-national-id',
      'register-registration-number',
      'register-company-email',
      'register-company-phone',
      'register-company-website',
      'register-company-address',
      'register-manager-first-name',
      'register-manager-last-name',
      'register-manager-email',
      'register-manager-phone',
      'register-company-password',
      'register-company-confirm-password',
    ]) {
      expect(register).toContain(id)
    }
    expect(register).toContain('role="radiogroup" aria-label="نوع حساب کاربری"')
    expect(register).toContain('for="acceptTerms"')
    expect(register).toContain('inputId="acceptTerms"')
  })

  it('provides a labelled password-reset email field and announced feedback', () => {
    expect(forgotPassword).toContain('<label for="forgot-password-email">')
    expect(forgotPassword).toContain('id="forgot-password-email"')
    expect(forgotPassword).toContain('role="alert"')
    expect(forgotPassword).toContain('role="status"')
  })

  it('keeps keyboard focus visible on authentication controls', () => {
    for (const source of [login, register, forgotPassword]) {
      expect(source).toContain('var(--ds-color-focus)')
      expect(source).toContain('focus-visible')
    }
  })
})
