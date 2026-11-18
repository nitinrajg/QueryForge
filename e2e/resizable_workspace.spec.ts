import { test, expect } from '@playwright/test';

test.describe('LeetCode Resizable Workspace & Split-Pane Suite', () => {
  test('drag vertical and horizontal dividers, verify persistence & double-click reset', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/practice/leetcode-sql-50-leetcode-set-1-q1');

    // 1. Verify dividers exist
    const verticalHandle = page.locator('[aria-label="Resize problem description panel"]');
    const horizontalHandle = page.locator('[aria-label="Resize SQL code editor panel"]');
    await expect(verticalHandle).toBeVisible();
    await expect(horizontalHandle).toBeVisible();

    // Initial aria value
    const initialVerticalVal = await verticalHandle.getAttribute('aria-valuenow');
    console.log('Initial vertical width percentage:', initialVerticalVal);

    // 2. Drag vertical divider to the right by 100px
    const vBox = await verticalHandle.boundingBox();
    expect(vBox).not.toBeNull();
    if (vBox) {
      await page.mouse.move(vBox.x + vBox.width / 2, vBox.y + vBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(vBox.x + 120, vBox.y + vBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    const draggedVerticalVal = await verticalHandle.getAttribute('aria-valuenow');
    console.log('Dragged vertical width percentage:', draggedVerticalVal);
    expect(Number(draggedVerticalVal)).toBeGreaterThan(Number(initialVerticalVal));

    // 3. Drag horizontal divider down by 60px
    const hBox = await horizontalHandle.boundingBox();
    expect(hBox).not.toBeNull();
    if (hBox) {
      await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + hBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(hBox.x + hBox.width / 2, hBox.y + 60, { steps: 10 });
      await page.mouse.up();
    }

    // Take screenshot of resized workspace
    await page.screenshot({ path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/workspace_resized_desktop.png' });

    // 4. Test Persistence: reload page and confirm stored sizes
    await page.reload();
    await expect(verticalHandle).toBeVisible();
    const persistedVal = await verticalHandle.getAttribute('aria-valuenow');
    console.log('Persisted vertical width after reload:', persistedVal);
    expect(persistedVal).toBe(draggedVerticalVal);

    // 5. Test Double-Click Reset
    await verticalHandle.dblclick();
    const resetVerticalVal = await verticalHandle.getAttribute('aria-valuenow');
    console.log('Reset vertical width after dblclick:', resetVerticalVal);
    expect(resetVerticalVal).toBe('45');

    // 6. Test Keyboard Resizing (Arrow keys)
    await verticalHandle.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const kbVal = await verticalHandle.getAttribute('aria-valuenow');
    console.log('Vertical width after ArrowRight x2:', kbVal);
    expect(Number(kbVal)).toBe(49);

    // 7. Test Maximize Problem Panel
    const maxProblemBtn = page.getByTitle('Maximize Problem Panel');
    await maxProblemBtn.click();
    // In maximized mode, vertical divider should be hidden
    await expect(verticalHandle).toBeHidden();
    // Restore
    const restoreProblemBtn = page.getByTitle('Restore Panel');
    await restoreProblemBtn.click();
    await expect(verticalHandle).toBeVisible();
  });

  test('responsive layout on tablet and mobile (<900px)', async ({ page }) => {
    // 768px tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/practice/leetcode-sql-50-leetcode-set-1-q1');

    // Dividers should be hidden on mobile/tablet
    const verticalHandle = page.locator('[aria-label="Resize problem description panel"]');
    await expect(verticalHandle).toBeHidden();

    // Mobile tabs switcher should be visible
    const descTab = page.getByRole('button', { name: 'Description', exact: true }).first();
    const codeTab = page.getByRole('button', { name: 'Code', exact: true }).first();
    const consoleTab = page.getByRole('button', { name: 'Console', exact: true }).first();
    await expect(descTab).toBeVisible();
    await expect(codeTab).toBeVisible();
    await expect(consoleTab).toBeVisible();

    // Click Code tab
    await codeTab.click();
    const cmContent = page.locator('.cm-content');
    await expect(cmContent).toBeVisible();

    await page.screenshot({ path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/workspace_mobile_768.png' });

    // 360px mobile
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: 'C:/Users/vishw/.gemini/antigravity/brain/cb0e7b5e-f910-47f8-9c2a-8b3e2a33245a/workspace_mobile_360.png' });
  });
});
