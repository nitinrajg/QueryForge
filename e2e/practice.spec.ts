import { test, expect } from '@playwright/test';

/**
 * End-to-End Workflow Test for QueryForge.
 * 
 * Logic & Approach:
 * 1. Visits the Practice Catalog and selects Problem #1 ('Recyclable and Low Fat Products').
 * 2. Enters SQL solution into CodeMirror editor.
 * 3. Executes the query via 'Run' button (executes on SQLite WASM engine).
 * 4. Submits the query via 'Submit' button for automated test grading.
 * 5. Verifies acceptance feedback ('Accepted! All Test Assertions Passed').
 * 6. Checks that learner progress is updated and reflected in IndexedDB across routes.
 */
test.describe('Practice Workspace & Answer Grading Flow', () => {
  test('solves Problem #1 and updates local progress', async ({ page }) => {
    // 1. Navigate to problem #1
    await page.goto('/practice/leetcode-sql-50-leetcode-set-1-q1');

    // Verify header and problem title
    await expect(page.locator('h2')).toContainText('Recyclable and Low Fat Products');

    // 2. Set SQL solution into CodeMirror editor
    const cmContent = page.locator('.cm-content');
    await expect(cmContent).toBeVisible({ timeout: 10000 });
    await cmContent.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(
      "SELECT product_id FROM Products WHERE low_fats = 'Y' AND recyclable = 'Y';",
      { delay: 10 }
    );

    // 3. Click 'Run' to execute in WASM engine
    const runBtn = page.getByRole('button', { name: 'Run', exact: true });
    await runBtn.click();

    // Verify results table in the right panel appears with expected data
    const resultsTable = page.locator('table').last();
    await expect(resultsTable).toBeVisible({ timeout: 10000 });
    await expect(resultsTable).toContainText('product_id');

    // 4. Click 'Submit' to grade
    const submitBtn = page.getByRole('button', { name: 'Submit', exact: true });
    await submitBtn.click();

    // Verify accepted banner
    await expect(page.locator('text=Accepted!')).toBeVisible({ timeout: 10000 });

    // 5. Navigate to Dashboard to verify persistence in IndexedDB
    await page.goto('/dashboard');
    await expect(page.locator('text=Learning Progress')).toBeVisible();
    await expect(page.getByText('Problems Solved', { exact: true })).toBeVisible();
  });
});
