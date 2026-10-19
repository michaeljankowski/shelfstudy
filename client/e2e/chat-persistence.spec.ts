import { expect, test } from '@playwright/test';

const authSession = {
  access_token: 'test-access-token', refresh_token: 'test-refresh-token', token_type: 'bearer',
  expires_in: 3600, expires_at: 4_102_444_800,
  user: { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'student@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((session) => localStorage.setItem('sb-test-auth-token', JSON.stringify(session)), authSession);
  await page.route('**/auth/v1/**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: authSession.user }) }));
  await page.route('**/api/classes/7', async (route) => route.fulfill({ json: { id: 7, name: 'Biology', folder_id: 3, created_at: '2026-01-01T00:00:00Z' } }));
  await page.route('**/api/classes', async (route) => route.fulfill({ json: [{ id: 7, name: 'Biology', folder_id: 3, created_at: '2026-01-01T00:00:00Z' }] }));
  await page.route('**/api/notes/class/7', async (route) => route.fulfill({ json: [] }));
  await page.route('**/api/chat/sessions?classId=7', async (route) => route.fulfill({ json: [
    { id: '10000000-0000-4000-8000-000000000001', class_id: 7, kind: 'study_plan', title: null, study_plan: { outline: '# Cells', instructions: 'Quiz me', guideName: 'cells.pdf' }, status: 'active', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
    { id: '10000000-0000-4000-8000-000000000002', class_id: 7, kind: 'general', title: null, study_plan: null, status: 'active', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ] }));
  await page.route('**/api/chat/sessions/10000000-0000-4000-8000-000000000001/messages', async (route) => route.fulfill({ json: [
    { id: 1, session_id: '10000000-0000-4000-8000-000000000001', role: 'user', content: 'Start my study plan.', created_at: '2026-01-02T00:00:00Z' },
    { id: 2, session_id: '10000000-0000-4000-8000-000000000001', role: 'assistant', content: 'What is the role of the cell membrane?', created_at: '2026-01-02T00:00:01Z' },
  ] }));
  await page.route('**/api/chat/sessions/10000000-0000-4000-8000-000000000002/messages', async (route) => route.fulfill({ json: [] }));
  await page.route('**/api/chat/sessions/10000000-0000-4000-8000-000000000001', async (route) => {
    const body = route.request().postDataJSON() as { status?: 'active' | 'paused' | 'archived'; studyPlan?: { outline: string; instructions: string; guideName?: string } };
    await route.fulfill({ json: {
      id: '10000000-0000-4000-8000-000000000001', class_id: 7, kind: 'study_plan', title: null,
      study_plan: body.studyPlan ?? { outline: '# Cells', instructions: 'Quiz me', guideName: 'cells.pdf' }, status: body.status ?? 'active',
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
    } });
  });
});

test('pauses without deleting and resumes the same Study Guide session', async ({ page }) => {
  await page.goto('/folders/3/classes/7');
  await page.getByRole('button', { name: 'Pause study chat' }).click();
  await expect(page.getByText('Study chat paused')).toBeVisible();
  await page.getByRole('button', { name: 'Resume study chat' }).click();
  await expect(page.getByText('Study plan active')).toBeVisible();
  await expect(page.getByText('What is the role of the cell membrane?')).toBeVisible();
});

test('restores the active Study Guide plan and transcript after reload', async ({ page }) => {
  await page.goto('/folders/3/classes/7');
  await expect(page.getByText('Study plan active')).toBeVisible();
  await expect(page.getByText('What is the role of the cell membrane?')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Using cells.pdf and relevant class notes.')).toBeVisible();
  await expect(page.getByText('What is the role of the cell membrane?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause study chat' })).toBeVisible();
});

test('saves edits to the active Study Guide without starting another session', async ({ page }) => {
  await page.goto('/folders/3/classes/7');
  await page.getByRole('button', { name: 'Study Guide' }).click();
  await expect(page.getByRole('button', { name: 'Save plan' })).toBeVisible();
  await page.locator('#study-plan-outline').fill('# Updated cells plan');
  const updateRequest = page.waitForRequest((request) => (
    request.method() === 'PATCH'
    && request.url().endsWith('/api/chat/sessions/10000000-0000-4000-8000-000000000001')
  ));
  await page.getByRole('button', { name: 'Save plan' }).click();
  const request = await updateRequest;
  expect(request.postDataJSON()).toEqual({ studyPlan: {
    outline: '# Updated cells plan', instructions: 'Quiz me', guideName: 'cells.pdf',
  } });
  await expect(page.getByText('What is the role of the cell membrane?')).toBeVisible();
  await expect(page.getByText('Study plan active')).toBeVisible();
});
