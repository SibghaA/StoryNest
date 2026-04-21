import { test, expect } from '@playwright/test'

/**
 * Auth flow E2E tests.
 * These use the Playwright MCP server to drive a real Chromium browser
 * against the running dev server (npm run dev).
 */

test.describe('Authentication flow', () => {
  test('unauthenticated root redirects to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/auth/login')
  })

  test('unauthenticated /generate redirects to login', async ({ page }) => {
    await page.goto('/generate')
    await expect(page).toHaveURL('/auth/login')
  })

  test('unauthenticated /profiles redirects to login', async ({ page }) => {
    await page.goto('/profiles')
    await expect(page).toHaveURL('/auth/login')
  })

  test('login page renders email and password fields', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('login with wrong credentials shows an error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('nobody@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Wait for the async signIn call to complete and the error <p> to render
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 6000 })
  })

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /register|sign up|create/i })).toBeVisible()
  })

  test('registers with valid credentials and lands on /profiles', async ({ page }) => {
    const email = `reg-${Date.now()}@test.com`
    await page.goto('/auth/register')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill('Password123!')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page).toHaveURL('/profiles', { timeout: 10000 })
  })

  test('login with valid credentials redirects to /profiles', async ({ page }) => {
    const email = `login-${Date.now()}@test.com`
    // Register first so the user exists
    await page.request.post('/api/auth/register', {
      data: { email, password: 'Password123!' },
    })
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill('Password123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/profiles', { timeout: 10000 })
  })
})
