import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { aiRateLimit } from './rateLimits.js';

describe('AI rate limiting', () => {
  it('returns 429 after the authenticated-user allowance is exhausted', async () => {
    const app = express();
    app.use((req, _res, next) => { req.userId = 'rate-test-user'; next(); });
    app.get('/', aiRateLimit, (_req, res) => res.json({ ok: true }));

    for (let index = 0; index < 30; index += 1) {
      expect((await request(app).get('/')).status).toBe(200);
    }
    const blocked = await request(app).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many requests/i);
    expect(blocked.headers['ratelimit-policy']).toBeDefined();
  });
});
