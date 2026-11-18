import { test, expect } from '@playwright/test';

test.describe('Multi-User Auth, Sync Status, and Dashboard Integration', () => {
  test('Navbar displays guest status and opens accessible auth modal', async ({ page }) => {
    await page.goto('/practice');

    // 1. Verify Guest sync status indicator in Navbar
    const guestPill = page.getByTitle(/Guest mode: All progress is stored locally/i).first();
    await expect(guestPill).toBeVisible();
    await expect(guestPill).toContainText('Guest (Local)');

    // 2. Open Auth Modal
    const signInBtn = page.getByRole('button', { name: 'Sign In' }).first();
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // 3. Verify Auth Dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Welcome back to QueryForge');

    // 4. Test client-side validation
    const submitBtn = dialog.getByRole('button', { name: 'Sign In' });
    await submitBtn.click();
    await expect(dialog.getByText(/Please enter a valid email address/i)).toBeVisible();

    // 5. Switch to Create Account tab
    const createAccountLink = dialog.getByRole('button', { name: 'Create one now' });
    await createAccountLink.click();
    await expect(dialog).toContainText('Create your QueryForge account');
    await expect(dialog.getByPlaceholder('Ada Lovelace')).toBeVisible();

    // 6. Switch to Forgot Password
    const returnToSignIn = dialog.getByRole('button', { name: 'Sign in' });
    await returnToSignIn.click();
    const forgotLink = dialog.getByRole('button', { name: 'Forgot password?' });
    await forgotLink.click();
    await expect(dialog).toContainText('Reset your password');

    // 7. Close dialog with close button
    const closeBtn = dialog.getByLabel('Close dialog');
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });

  test('Dashboard displays streak, submission calendar, and topic recommendations', async ({ page }) => {
    await page.goto('/dashboard');

    // 1. Title & Guest indicator
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Learning Progress');
    await expect(page.getByText('IndexedDB Private Storage')).toBeVisible();

    // 2. Active Streak KPI
    const streakKpi = page.getByRole('button', { name: /Active Streak/i });
    await expect(streakKpi).toBeVisible();
    await expect(streakKpi).toContainText('consecutive days');

    // 3. 24-Week Submission Calendar Heatmap
    await expect(page.getByText('Submission Calendar')).toBeVisible();
    await expect(page.getByText('Activity heatmap over the past 24 weeks.')).toBeVisible();

    // 4. Guest Mode Banner
    await expect(page.getByText('You are practicing in Guest Mode')).toBeVisible();

    // 5. Practice Focus Recommendations
    await expect(page.getByText('Recommended Practice Focus')).toBeVisible();
  });
});
