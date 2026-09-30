import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('creates a task and filters by status and priority', async ({ page }) => {
    await login(page, 'alice@example.com')

    const boardName = `MVP ${Date.now()}`
    const taskTitle = `Review requirements ${Date.now()}`
    await page.getByRole('button', { name: '+ Create a board' }).click()
    await page.getByLabel('Board name').fill(boardName)
    await page.getByRole('button', { name: 'Create board' }).click()
    await page.waitForURL('**/boards/*')

    await page.getByRole('button', { name: '+ Add a card' }).first().click()
    await page.getByPlaceholder('Card title').fill(taskTitle)
    await page.getByRole('button', { name: 'Add card' }).click()
    await page.getByRole('link', { name: taskTitle }).click()
    await page.waitForURL('**/cards/*')
    await page.getByLabel('Priority').selectOption('high')
    await page.getByLabel('Due date').fill('2099-12-31')

    await page.goBack()
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Filter by status').selectOption({ label: 'To do' })
    await page.getByLabel('Filter by priority').selectOption('high')
    await page.getByRole('button', { name: 'Apply' }).click()
    await expect(page.getByRole('link', { name: taskTitle })).toBeVisible()
})

test('new accounts cannot access another user\'s board', async ({
    page,
    browser,
}) => {
    await login(page, 'alice@example.com')
    await page.getByRole('link', { name: 'Personal Tasks' }).click()
    await page.waitForURL('**/boards/*')
    const boardUrl = page.url()

    const outsiderContext = await browser.newContext()
    const outsiderPage = await outsiderContext.newPage()
    await outsiderPage.goto('/signup')
    await outsiderPage.getByLabel('Name').fill('New User')
    await outsiderPage
        .getByLabel('Email')
        .fill(`outsider-${Date.now()}@example.com`)
    await outsiderPage.getByLabel('Password').fill('password123')
    await outsiderPage.getByRole('button', { name: 'Sign up for free' }).click()
    await outsiderPage.waitForURL('**/boards')
    await outsiderPage.goto(boardUrl)
    await expect(
        outsiderPage.getByText("You don't have access to this board")
    ).toBeVisible()
    await outsiderContext.close()
})

test('dashboard shows status totals and upcoming tasks', async ({ page }) => {
    await login(page, 'alice@example.com')
    await page.getByRole('link', { name: 'Personal Tasks' }).click()
    await page.waitForURL('**/boards/*')
    await page.getByRole('button', { name: 'Board dashboard' }).click()

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Total tasks')).toBeVisible()
    await expect(page.getByText('Due in the next 7 days')).toBeVisible()
    await expect(
        page.getByRole('link', { name: 'Review the project requirements' })
    ).toBeVisible()
})

test.describe('mobile viewport', () => {
    test.use({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
    })

    test('board and task detail are usable on a small screen', async ({
        page,
    }) => {
        await login(page, 'alice@example.com')
        await page.getByRole('link', { name: 'Personal Tasks' }).click()
        await page.waitForURL('**/boards/*')
        await expect(
            page.getByRole('heading', { name: 'Personal Tasks' })
        ).toBeVisible()

        await page
            .getByRole('link', { name: 'Review the project requirements' })
            .click()
        await page.waitForURL('**/cards/*')
        await expect(
            page.getByRole('textbox', { name: 'Card title' })
        ).toHaveValue('Review the project requirements')
    })
})