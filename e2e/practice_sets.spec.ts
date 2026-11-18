import { test, expect } from '@playwright/test';

test.describe('Practice Problem Catalog Set Filtering & Clean Rows', () => {
  test('set dropdown, clean row tags, URL sync, and combined filters', async ({ page }) => {
    // 1. Navigate to /practice?track=all
    await page.goto('/practice?track=all');
    await page.waitForLoadState('networkidle');

    // Verify Title & Problem Catalog
    await expect(page.locator('text=SQL Practice Catalog')).toBeVisible();

    // 2. Critical Check: Ensure NO raw "leetcode-set-" text appears on any row
    const rawSetTags = page.locator('text=/leetcode-set-\\d+/i');
    await expect(rawSetTags).toHaveCount(0);

    // Take screenshot of clean catalog rows (All Sets selected)
    await page.screenshot({
      path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/practice_all_sets_clean.png',
      fullPage: true,
    });

    // 3. Open the Set Dropdown
    const setDropdownTrigger = page.getByRole('combobox', { name: 'Filter problems by set', exact: true });
    await expect(setDropdownTrigger).toBeVisible();
    await setDropdownTrigger.click();

    // Verify Dropdown Options & Natural Ordering
    const leetcodeSet1Option = page.getByRole('option', { name: /LeetCode Set 1/i });
    await expect(leetcodeSet1Option).toBeVisible();
    await expect(leetcodeSet1Option).toContainText('10');

    // Take screenshot with Set Dropdown open
    await page.screenshot({
      path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/practice_set_dropdown_open.png',
    });

    // 4. Select "LeetCode Set 1"
    await leetcodeSet1Option.click();

    // Verify URL synced
    await expect(page).toHaveURL(/set=leetcode-set-1/);

    // Verify Active Filter Chip appears
    await expect(page.locator('text=Showing: LeetCode Set 1')).toBeVisible();

    // Verify problem rows are filtered to only 10 problems
    const rows = page.locator('a[href^="/practice/leetcode-sql-50-"]');
    await expect(rows).toHaveCount(10);

    // Ensure even when a set is active, rows remain clean with NO set badges
    await expect(page.locator('text=/leetcode-set-\\d+/i')).toHaveCount(0);

    // Take screenshot of filtered set view
    await page.screenshot({
      path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/practice_set_1_filtered.png',
      fullPage: true,
    });

    // 5. Test 1-Click Clear on the Active Filter Chip
    const clearSetBtn = page.getByRole('button', { name: /Clear set filter/i });
    await clearSetBtn.click();

    // Verify reset to All Sets and chip dismissed
    await expect(page.locator('text=Showing: LeetCode Set 1')).toHaveCount(0);
    await expect(page).not.toHaveURL(/set=/);

    // 6. Test Direct URL Navigation with ?set=leetcode-set-3
    await page.goto('/practice?track=all&set=leetcode-set-3');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Showing: LeetCode Set 3')).toBeVisible();

    // 7. Test Combined Filtering (Set + Difficulty)
    const mediumBtn = page.getByRole('button', { name: 'medium', exact: true });
    await mediumBtn.click();
    await expect(page.locator('text=No Problems Match Your Filter').or(rows.first())).toBeVisible();

    // 8. Test Mobile Viewport at 360px
    await page.setViewportSize({ width: 360, height: 740 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=SQL Practice Catalog')).toBeVisible();
    await page.screenshot({
      path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/practice_mobile_360_set_filter.png',
      fullPage: true,
    });
  });
});
