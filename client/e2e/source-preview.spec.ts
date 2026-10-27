import { expect, test } from '@playwright/test';

const authSession = {
  access_token: 'test-access-token', refresh_token: 'test-refresh-token', token_type: 'bearer',
  expires_in: 3600, expires_at: 4_102_444_800,
  user: { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'student@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
};

const SIGNED_URL = 'https://storage.test/object/sign/note-images/u/7/diagram.png?token=abc';
// 1x1 transparent PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

test.beforeEach(async ({ page }) => {
  await page.addInitScript((session) => localStorage.setItem('sb-test-auth-token', JSON.stringify(session)), authSession);
  await page.route('**/auth/v1/**', (route) => route.fulfill({ json: { user: authSession.user } }));
  await page.route('**/api/classes/7', (route) => route.fulfill({ json: { id: 7, name: 'Biology', folder_id: 3, created_at: '2026-01-01T00:00:00Z' } }));
  await page.route('**/api/classes', (route) => route.fulfill({ json: [{ id: 7, name: 'Biology', folder_id: 3, created_at: '2026-01-01T00:00:00Z' }] }));
  await page.route('**/api/chat/sessions?classId=7', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/notes/class/7', (route) => route.fulfill({ json: [
    { id: 5, class_id: 7, file_type: 'image/png', filename: 'diagram.png', extracted_text: null, created_at: '2026-01-01T00:00:00Z' },
  ] }));
  await page.route(SIGNED_URL, (route) => route.fulfill({ contentType: 'image/png', body: PNG }));
});

async function openPreview(page: import('@playwright/test').Page) {
  await page.goto('/folders/3/classes/7');
  await page.getByRole('button', { name: 'View all sources' }).click();
  await page.getByRole('button', { name: /Photos/ }).click();
  await page.getByRole('button', { name: /diagram\.png/ }).dblclick();
}

test('opens a source through a short-lived signed URL', async ({ page }) => {
  await page.route('**/api/notes/5/file', (route) => route.fulfill({
    headers: { 'Cache-Control': 'no-store' },
    json: { url: SIGNED_URL, expiresIn: 300 },
  }));

  await openPreview(page);

  const image = page.getByRole('dialog').getByRole('img', { name: 'diagram.png' });
  await expect(image).toHaveAttribute('src', SIGNED_URL);
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
});

test('shows a failure message when the file URL cannot be issued', async ({ page }) => {
  await page.route('**/api/notes/5/file', (route) => route.fulfill({ status: 404, json: { error: 'Note not found' } }));

  await openPreview(page);

  await expect(page.getByText('This file could not be opened')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('img')).toHaveCount(0);
});
