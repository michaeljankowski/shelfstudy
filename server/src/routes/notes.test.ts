import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;

const notes: Row[] = [{
  id: 1,
  class_id: 10,
  owner_id: 'user-a',
  image_url: 'user-a/10/1700-a.pdf',
  file_type: 'application/pdf',
  filename: 'a.pdf',
  extracted_text: 'text',
  created_at: '2026-01-01T00:00:00Z',
}];

// A fake Supabase query builder that uses an in-memory list of notes.
// If the owner filter is missing, a test fails because the data leaks.
function queryBuilder() {
  const filters: [string, unknown][] = [];
  let columns = '*';
  const matches = () => notes.filter((row) => filters.every(([column, value]) => String(row[column]) === String(value)));
  const project = (row: Row) => columns === '*'
    ? row
    : Object.fromEntries(columns.split(',').map((c) => c.trim()).map((c) => [c, row[c]]));
  const builder: any = {
    select(selected: string) { columns = selected; return builder; },
    eq(column: string, value: unknown) { filters.push([column, value]); return builder; },
    order() { return builder; },
    maybeSingle: async () => ({ data: matches()[0] ? project(matches()[0]) : null, error: null }),
    single: async () => matches()[0]
      ? { data: project(matches()[0]), error: null }
      : { data: null, error: { message: 'no rows' } },
    then: (resolve: (value: unknown) => void) => resolve({ data: matches().map(project), error: null }),
  };
  return builder;
}

const signSourceUrl = vi.fn();
vi.mock('../config/supabase.js', () => ({ supabase: { from: () => queryBuilder() }, STORAGE_BUCKET: 'note-images' }));
vi.mock('../services/storage.js', () => ({
  BROWSER_URL_TTL_SECONDS: 300,
  signSourceUrl,
  deleteImage: vi.fn(),
  downloadSource: vi.fn(),
  uploadSource: vi.fn(),
}));
vi.mock('../services/officePreview.js', () => ({ createOfficePreview: vi.fn() }));
vi.mock('../services/sourceIngestion.js', () => ({ prepareSource: vi.fn() }));
vi.mock('../services/sourceValidation.js', () => ({ validateUploadedSource: vi.fn() }));

const { default: notesRouter } = await import('./notes.js');

function appAs(userId: string) {
  const app = express();
  app.use((req, _res, next) => { req.userId = userId; next(); });
  app.use('/api/notes', notesRouter);
  return app;
}

describe('GET /api/notes/:id/file', () => {
  beforeEach(() => {
    signSourceUrl.mockReset();
    signSourceUrl.mockResolvedValue('https://signed.example/token');
  });

  it('signs a short-lived URL for the owner and marks it uncacheable', async () => {
    const response = await request(appAs('user-a')).get('/api/notes/1/file');
    expect(response.status).toBe(200);
    expect(response.body.url).toBe('https://signed.example/token');
    expect(response.body.expiresIn).toBe(300);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(signSourceUrl).toHaveBeenCalledWith('user-a/10/1700-a.pdf', 300);
  });

  it('returns 404 for another user and never signs', async () => {
    const response = await request(appAs('user-b')).get('/api/notes/1/file');
    expect(response.status).toBe(404);
    expect(signSourceUrl).not.toHaveBeenCalled();
  });

  it('gives a foreign note and a missing note the identical response', async () => {
    const foreign = await request(appAs('user-b')).get('/api/notes/1/file');
    const missing = await request(appAs('user-a')).get('/api/notes/999/file');
    expect(foreign.status).toBe(missing.status);
    expect(foreign.body).toEqual(missing.body);
  });

  it('rejects a malformed id before touching storage', async () => {
    const response = await request(appAs('user-a')).get('/api/notes/abc/file');
    expect(response.status).toBe(400);
    expect(signSourceUrl).not.toHaveBeenCalled();
  });

  it('returns a generic 500 when signing fails, without storage detail', async () => {
    signSourceUrl.mockRejectedValue(new Error('Object not found at user-a/10/1700-a.pdf'));
    const response = await request(appAs('user-a')).get('/api/notes/1/file');
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('user-a/10');
  });
});

describe('note responses never expose the storage reference', () => {
  it('omits image_url and the object path from the class list', async () => {
    const response = await request(appAs('user-a')).get('/api/notes/class/10');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).not.toHaveProperty('image_url');
    expect(response.body[0]).not.toHaveProperty('owner_id');
    expect(JSON.stringify(response.body)).not.toContain('1700-a.pdf');
  });

  it('omits image_url from a single note', async () => {
    const response = await request(appAs('user-a')).get('/api/notes/1');
    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('image_url');
  });

  it("returns another user's list empty and their note as 404", async () => {
    const list = await request(appAs('user-b')).get('/api/notes/class/10');
    expect(list.body).toEqual([]);
    expect((await request(appAs('user-b')).get('/api/notes/1')).status).toBe(404);
  });
});
