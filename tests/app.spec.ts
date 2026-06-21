import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

  test('should add a new transaction and update the balance sheet', async ({ page }) => {
    // Fill description
    await page.locator('#dt-tx-desc').fill('شراء معدات نقداً');

    // Select 'equipment' for first impact
    await page.locator('#dt-account-id-0').selectOption('equipment');
    // Click Debit (which is default, but just in case)
    await page.locator('button:has-text("مدين"), button:has-text("Debit")').first().click();
    // Fill amount for first impact
    await page.locator('#dt-amount-input-0').fill('5000');

    // Select 'cash' for second impact
    await page.locator('#dt-account-id-1').selectOption('cash');
    // Click Credit
    await page.locator('button:has-text("دائن"), button:has-text("Credit")').nth(1).click();
    // Fill amount for second impact
    await page.locator('#dt-amount-input-1').fill('5000');

    // Submit transaction
    await page.locator('button[type="submit"]').click();

    // Verify transaction appears in the list
    // Wait for the text to appear
    await expect(page.locator('text=شراء معدات نقداً').first()).toBeVisible();

    // Check if the balance is maintained
    await expect(page.locator('text=المعادلة متوازنة').first()).toBeAttached();
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['button-name', 'color-contrast', 'region'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have basic SEO meta tags', async ({ page }) => {
    // Check description meta tag
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();

    // Check charset
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset).toBeTruthy();
    
    // Check viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
  });
});
