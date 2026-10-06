import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('presents email, Google, and Apple sign-in with a clear sign-up path', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apple' })).toBeVisible();

  await page.getByRole('button', { name: 'Create an account' }).click();
  await expect(page.getByRole('heading', { name: 'Create your account.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Forgot password?' })).toHaveCount(0);
});

for (const provider of ['google', 'apple'] as const) {
  test(`starts the ${provider} OAuth flow through Supabase`, async ({ page }) => {
    await page.route('https://test.supabase.co/auth/v1/authorize**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>OAuth provider</p>' });
    });
    await page.goto('/');

    const oauthRequest = page.waitForRequest((request) => (
      request.url().startsWith('https://test.supabase.co/auth/v1/authorize')
      && new URL(request.url()).searchParams.get('provider') === provider
    ));
    await page.getByRole('button', { name: provider === 'google' ? 'Google' : 'Apple' }).click();
    await oauthRequest;
  });
}

test('completes a password-recovery callback with a matching new password', async ({ page }) => {
  await page.route('https://test.supabase.co/auth/v1/user**', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      expect(body.password).toBe('New-password-9!');
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', email: 'student@example.com' }),
    });
  });

  await page.goto('/#access_token=test-access-token&refresh_token=test-refresh-token&expires_in=3600&token_type=bearer&type=recovery');
  await expect(page.getByRole('heading', { name: 'Choose a new password.' })).toBeVisible();
  await page.getByLabel('New password', { exact: true }).fill('New-password-9!');
  await page.getByLabel('Confirm new password').fill('New-password-9!');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByRole('heading', { name: 'Choose a new password.' })).toHaveCount(0);
});
