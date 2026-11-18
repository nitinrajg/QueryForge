import { test, expect } from '@playwright/test';

test.describe('LeetCode Testcase Builder & Rich Verdicts Suite', () => {
  test('testcase management, custom case creation, and grading verdicts', async ({ page }) => {
    // 1. Navigate to problem #1
    await page.goto('/practice/leetcode-sql-50-leetcode-set-1-q1');
    await page.waitForLoadState('networkidle');

    // 2. Verify Left Pane LeetCode spec structure
    await expect(page.locator('text=Recyclable and Low Fat Products')).toBeVisible();
    await expect(page.locator('text=Table: Products')).toBeVisible();
    await expect(page.locator('text=Column Name')).toBeVisible();

    // 3. Switch to Testcase Tab
    const testcaseTabBtn = page.getByRole('button', { name: /Testcase/i }).first();
    await testcaseTabBtn.click();
    await expect(page.getByRole('button', { name: /Case 1/i }).first()).toBeVisible();
    await expect(page.locator('text=Read-only')).toBeVisible();

    // 4. Add a Custom Case
    const addCaseBtn = page.getByRole('button', { name: /Add Case/i });
    await expect(addCaseBtn).toBeVisible();
    await addCaseBtn.click();

    // Verify Case 2 appeared and is active
    await expect(page.getByRole('button', { name: /Case 2/i }).first()).toBeVisible();

    // Take screenshot of Testcase Workbench with custom case
    await page.screenshot({
      path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/testcase_custom_workbench.png',
      fullPage: true,
    });

    // 5. Enter correct SQL solution and Run Query against Case 1
    const cmEditor = page.locator('.cm-content');
    await cmEditor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type("SELECT product_id FROM Products WHERE low_fats = 'Y' AND recyclable = 'Y';");

    const case1Pill = page.getByRole('button', { name: /Case 1/i }).first();
    await case1Pill.click();

    const runBtn = page.getByRole('button', { name: /^Run$/i });
    await runBtn.click();

    // Verify automatically switches to Test Result tab and displays Accepted
    await expect(page.locator('text=Accepted!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Your Output')).toBeVisible();

    // Take screenshot of Accepted Verdict
    await page.screenshot({
      path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/verdict_accepted_view.png',
      fullPage: true,
    });

    // 6. Test Error Handling with Fuzzy Schema Suggestion
    // Load incorrect SQL with typo: 'SELECT produc_id FROM Products;'
    await cmEditor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('SELECT produc_id FROM Products;');

    await runBtn.click();

    // Verify Error diagnostic with Levenshtein fuzzy suggestion
    await expect(page.locator('text=Unknown Column')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Did you mean').first()).toBeVisible();
    await expect(page.locator('text=product_id').first()).toBeVisible();

    // 7. Test Wrong Answer with Mismatch Badge and Side-by-Side Diff
    await cmEditor.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type("SELECT product_id FROM Products WHERE low_fats = 'N';");

    await runBtn.click();

    // Verify Wrong Answer banner and Mismatch Badge
    await expect(page.locator('text=Wrong Answer')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Expected Output')).toBeVisible();

    // Take screenshot of Wrong Answer Diff View
    await page.screenshot({
      path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/verdict_wrong_answer_diff.png',
      fullPage: true,
    });
  });
});
