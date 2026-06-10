import { test, expect } from '@playwright/test';

test.describe('Motazin E2E Automation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local website
    await page.goto('/');
  });

  test('should load the page with the correct title', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toContainText('مُتّزِن');
  });

  test('should open and calculate depreciation in the modal', async ({ page }) => {
    // Find the Depreciation Modal button and click it
    const depBtn = page.getByRole('button', { name: 'حاسبة الإهلاك' });
    await expect(depBtn).toBeVisible();
    await depBtn.click();

    // Verify modal is open via data-testid
    const modal = page.getByTestId('depreciation-modal');
    await expect(modal).toBeVisible();

    // Fill in Cost
    const costInput = page.locator('#asset-cost');
    await costInput.fill('10000');

    // Fill in Salvage Value
    const salvageInput = page.locator('#salvage-value');
    await salvageInput.fill('2000');

    // Fill in Useful Life
    const lifeInput = page.locator('#useful-life');
    await lifeInput.fill('5');

    // Verify annual depreciation is calculated (10000 - 2000) / 5 = 1600
    // It is rendered inside the summary box as "1,600"
    const annualDepText = page.locator('text=1,600');
    await expect(annualDepText).toBeVisible();

    // Click the close button
    const closeBtn = modal.locator('button').first();
    await closeBtn.click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });
});
