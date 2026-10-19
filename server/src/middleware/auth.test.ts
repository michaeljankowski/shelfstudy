import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
vi.mock('../config/supabase.js', () => ({ supabase: { auth: { getUser } } }));
const { requireAuth } = await import('./auth.js');

describe('requireAuth', () => {
  beforeEach(() => getUser.mockReset());

  it('rejects a missing bearer token', async () => {
    const app = express();
    app.get('/', requireAuth, (_req, res) => res.sendStatus(204));
    expect((await request(app).get('/')).status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('attaches the verified Supabase user ID', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    const app = express();
    app.get('/', requireAuth, (req, res) => res.json({ userId: req.userId }));
    const response = await request(app).get('/').set('Authorization', 'Bearer signed-token');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'user-123' });
    expect(getUser).toHaveBeenCalledWith('signed-token');
  });
});
