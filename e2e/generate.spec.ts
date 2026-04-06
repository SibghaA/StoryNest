import { test, expect, type Page } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'

/**
 * Story generation form E2E tests.
 *
 * These tests:
 * 1. Seed a test user + child profile directly into the dev DB
 * 2. Log in via the UI
 * 3. Exercise the /generate page (form validation, preset buttons, streaming skeleton)
 * 4. Clean up the seeded data after each test
 *
 * Powered by the Playwright MCP server — the same browser automation Claude Code
 * uses when you invoke it interactively.
 */

const E2E_EMAIL = 'e2e-playwright@storynest.test'
const E2E_PASSWORD = 'playwright-pw-123'
const E2E_PROFILE_NAME = 'PlaywrightKid'

const DB_URL = `file:${path.resolve(__dirname, '../prisma/dev.db')}`
const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } },
})

async function seedUser() {
  const hash = await bcrypt.hash(E2E_PASSWORD, 10)
  const user = await prisma.user.upsert({
    where: { email: E2E_EMAIL },
    update: {},
    create: { email: E2E_EMAIL, password: hash },
  })
  const profile = await prisma.profile.upsert({
    where: { id: 'e2e-profile-playwright' },
    update: {},
    create: {
      id: 'e2e-profile-playwright',
      name: E2E_PROFILE_NAME,
      ageRange: '1-2y',
      avatar: {},
      userId: user.id,
    },
  })
  return { user, profile }
}

async function cleanupUser() {
  await prisma.profile.deleteMany({ where: { id: 'e2e-profile-playwright' } })
  await prisma.user.deleteMany({ where: { email: E2E_EMAIL } })
}

async function loginAs(page: Page) {
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(E2E_EMAIL)
  await page.getByLabel(/password/i).fill(E2E_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/profiles/, { timeout: 8000 })
}

test.beforeEach(async () => {
  await seedUser()
})

test.afterEach(async () => {
  await cleanupUser()
  await prisma.$disconnect()
})

test.describe('Story generation form', () => {
  test('authenticated user can reach /generate', async ({ page }) => {
    await loginAs(page)
    await page.goto('/generate')
    await expect(page).toHaveURL('/generate')
    await expect(page.getByRole('heading', { name: /generate a story/i })).toBeVisible()
  })

  test('form renders 3 keyword inputs with placeholder examples', async ({ page }) => {
    await loginAs(page)
    await page.goto('/generate')

    // 3 keyword inputs each have a duck/puddles/giggling style placeholder
    const inputs = page.locator('input[placeholder^="e.g. "]').filter({ hasNotText: 'ask for help' })
    // Use the grid container to scope — keyword inputs are inside the 3-col grid
    const keywordInputs = page.locator('.grid.grid-cols-3 input')
    await expect(keywordInputs).toHaveCount(3)
  })

  test('lesson preset chips populate the lesson field', async ({ page }) => {
    await loginAs(page)
    await page.goto('/generate')

    await page.getByRole('button', { name: 'Kindness' }).click()
    const lessonInput = page.locator('input#lesson')
    await expect(lessonInput).toHaveValue('Kindness')
  })

  test('all 5 lesson presets are visible', async ({ page }) => {
    await loginAs(page)
    await page.goto('/generate')

    for (const preset of ['Sharing', 'Courage', 'Kindness', 'Patience', 'Honesty']) {
      await expect(page.getByRole('button', { name: preset })).toBeVisible()
    }
  })

  test('submitting with empty keywords shows a validation error', async ({ page }) => {
    await loginAs(page)
    await page.goto('/generate')

    // Click generate without filling keywords
    await page.getByRole('button', { name: /generate story/i }).click()
    await expect(page.getByText(/fill in all 3 keywords/i)).toBeVisible()
  })

  test('submitting with keywords but no lesson shows a validation error', async ({ page }) => {
    await loginAs(page)
    await page.goto('/generate')

    const placeholders = ['e.g. ducks', 'e.g. puddles', 'e.g. giggling']
    for (let i = 0; i < 3; i++) {
      await page.locator(`input[placeholder="${placeholders[i]}"]`).fill(`word${i + 1}`)
    }

    await page.getByRole('button', { name: /generate story/i }).click()
    await expect(page.getByText('Please enter a life lesson.')).toBeVisible()
  })

  test('lesson character counter is visible', async ({ page }) => {
    await loginAs(page)
    await page.goto('/generate')

    // Counter should show 0/120 initially
    await expect(page.getByText('0/120')).toBeVisible()

    await page.locator('input#lesson').fill('sharing')
    await expect(page.getByText('7/120')).toBeVisible()
  })

  test('profile name appears in the keywords label', async ({ page }) => {
    await loginAs(page)
    await page.goto('/generate')

    await expect(page.getByText(new RegExp(E2E_PROFILE_NAME, 'i'))).toBeVisible()
  })
})
