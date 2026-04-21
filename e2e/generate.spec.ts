import { test, expect, type Browser } from '@playwright/test'

/**
 * Generate page E2E tests.
 *
 * beforeAll registers a test user, logs in via the real NextAuth credentials
 * form, and creates a child profile — then saves the browser session so every
 * test starts already authenticated with a profile in place.
 */

const AUTH_STATE = 'e2e/.auth-generate.json'
const TEST_EMAIL = 'e2e-generate@test.com'
const TEST_PASSWORD = 'E2ePassword1!'

async function setupAuthState(browser: Browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  // Register (ignore 400 — user may already exist from a previous local run)
  await page.request.post('/api/auth/register', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })

  // Login via the real form to establish the NextAuth session cookie
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('/profiles', { timeout: 10000 })

  // Create a child profile so the generate page renders the form
  await page.request.post('/api/profiles', {
    data: { name: 'Luna', ageRange: '1-2y' },
  })

  await ctx.storageState({ path: AUTH_STATE })
  await ctx.close()
}

test.describe.configure({ mode: 'serial' })

test.describe('Generate page', () => {
  test.beforeAll(async ({ browser }) => {
    await setupAuthState(browser)
  })

  test.use({ storageState: AUTH_STATE })

  // ── Layout ──────────────────────────────────────────────────────────────────

  test('renders scenario cards and lesson presets when logged in with a profile', async ({
    page,
  }) => {
    await page.goto('/generate')
    // Scenario grid
    await expect(page.getByRole('button', { name: /forest friends/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /under the sea/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /my own idea/i })).toBeVisible()
    // Lesson presets
    await expect(page.getByRole('button', { name: /sharing/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /courage/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /kindness/i })).toBeVisible()
  })

  test('generate button shows child name from profile', async ({ page }) => {
    await page.goto('/generate')
    await expect(page.getByRole('button', { name: /generate story for luna/i })).toBeVisible()
  })

  // ── Lesson preset chips ─────────────────────────────────────────────────────

  test('clicking a lesson preset fills the lesson input', async ({ page }) => {
    await page.goto('/generate')
    await page.getByRole('button', { name: /courage/i }).click()
    const lessonInput = page.getByPlaceholder(/or type your own lesson/i)
    await expect(lessonInput).toHaveValue('Courage')
  })

  test('clicking a different preset replaces the previous selection', async ({ page }) => {
    await page.goto('/generate')
    await page.getByRole('button', { name: /sharing/i }).click()
    await page.getByRole('button', { name: /honesty/i }).click()
    const lessonInput = page.getByPlaceholder(/or type your own lesson/i)
    await expect(lessonInput).toHaveValue('Honesty')
  })

  // ── Validation — edge cases ─────────────────────────────────────────────────

  test('submitting with no scenario shows validation error', async ({ page }) => {
    await page.goto('/generate')
    // Fill lesson but leave scenario empty
    await page.getByRole('button', { name: /kindness/i }).click()
    await page.getByRole('button', { name: /generate story for/i }).click()
    await expect(page.getByText(/please choose a scenario/i)).toBeVisible()
  })

  test('submitting with no lesson shows validation error', async ({ page }) => {
    await page.goto('/generate')
    // Pick a scenario but leave lesson empty
    await page.getByRole('button', { name: /starry night/i }).click()
    await page.getByRole('button', { name: /generate story for/i }).click()
    await expect(page.getByText(/please choose or type a life lesson/i)).toBeVisible()
  })

  // ── Custom scenario ─────────────────────────────────────────────────────────

  test('selecting "My Own Idea" reveals three keyword inputs', async ({ page }) => {
    await page.goto('/generate')
    await page.getByRole('button', { name: /my own idea/i }).click()
    const inputs = page.getByPlaceholder(/e\.g\. dinosaurs|e\.g\. rockets|e\.g\. rain/i)
    await expect(inputs).toHaveCount(3)
  })

  test('submitting custom scenario with empty keywords shows validation error', async ({
    page,
  }) => {
    await page.goto('/generate')
    await page.getByRole('button', { name: /my own idea/i }).click()
    await page.getByRole('button', { name: /kindness/i }).click()
    // Leave all keyword inputs empty and submit
    await page.getByRole('button', { name: /generate story for/i }).click()
    await expect(page.getByText(/please fill in all 3 keywords/i)).toBeVisible()
  })

  test('filling custom keywords and lesson enables submission without validation errors', async ({
    page,
  }) => {
    await page.goto('/generate')
    await page.getByRole('button', { name: /my own idea/i }).click()
    // Fill the three keyword inputs
    await page.getByPlaceholder(/e\.g\. dinosaurs/i).fill('dinosaurs')
    await page.getByPlaceholder(/e\.g\. rockets/i).fill('rockets')
    await page.getByPlaceholder(/e\.g\. rain/i).fill('puddles')
    // Choose a lesson preset
    await page.getByRole('button', { name: /patience/i }).click()
    // No validation error visible before submit
    await expect(page.getByText(/please fill in all 3 keywords/i)).not.toBeVisible()
    await expect(page.getByText(/please choose a scenario/i)).not.toBeVisible()
    await expect(page.getByText(/please choose or type a life lesson/i)).not.toBeVisible()
  })
})
