import { test, expect } from '@playwright/test';

test('guest user can navigate key pages and open auth screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Absolute Cinema' })).toBeVisible();

  await page.getByRole('link', { name: 'Movies' }).click();
  await expect(page).toHaveURL(/\/movies$/);

  await page.getByRole('link', { name: 'Showtime' }).click();
  await expect(page).toHaveURL(/\/showtime$/);

  await page.goto('/profile?mode=login');
  await expect(page).toHaveURL(/\/profile\?mode=login/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});
