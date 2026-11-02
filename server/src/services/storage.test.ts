import { beforeEach, describe, expect, it, vi } from 'vitest';

const upload = vi.fn();
const createSignedUrl = vi.fn();
vi.mock('../config/supabase.js', () => ({
  STORAGE_BUCKET: 'note-images',
  supabase: { storage: { from: () => ({ upload, createSignedUrl }) } },
}));
const { objectPathFromStored, sanitizeFilename, signSourceUrl, uploadSource } = await import('./storage.js');

describe('sanitizeFilename', () => {
  it.each([
    ['notes.pdf', 'notes.pdf'],
    ['../../etc/passwd', 'passwd'],
    ['C:\\Users\\me\\lecture 1.pptx', 'lecture-1.pptx'],
    ['résumé (final).docx', 'resume-final.docx'],
    ['', 'file'],
    ['...', 'file'],
  ])('%s -> %s', (input, expected) => {
    expect(sanitizeFilename(input)).toBe(expected);
  });

  it('caps length but keeps the extension', () => {
    const result = sanitizeFilename(`${'a'.repeat(300)}.pdf`);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith('.pdf')).toBe(true);
  });
});

describe('objectPathFromStored', () => {
  it('returns a bare object path unchanged', () => {
    expect(objectPathFromStored('user-1/5/1700-a.pdf')).toBe('user-1/5/1700-a.pdf');
  });

  it('extracts the path from a legacy public URL', () => {
    const legacy = 'https://x.supabase.co/storage/v1/object/public/note-images/user-1/5/1700-my%20file.pdf';
    expect(objectPathFromStored(legacy)).toBe('user-1/5/1700-my file.pdf');
  });

  it('rejects a URL that does not reference the bucket', () => {
    expect(() => objectPathFromStored('https://example.com/other')).toThrow('Invalid source URL');
  });
});

describe('uploadSource', () => {
  beforeEach(() => upload.mockReset());

  it('stores a sanitized path and returns the path, not a URL', async () => {
    upload.mockResolvedValue({ error: null });
    const file = { originalname: '../../evil name.pdf', buffer: Buffer.from('x'), mimetype: 'application/pdf' } as Express.Multer.File;
    const stored = await uploadSource(file, 7, 'user-1');
    expect(stored).toMatch(/^user-1\/7\/\d+-evil-name\.pdf$/);
    expect(stored).not.toMatch(/^https?:/);
    expect(upload.mock.calls[0][0]).toBe(stored);
  });
});

describe('signSourceUrl', () => {
  beforeEach(() => createSignedUrl.mockReset());

  it('signs the resolved object path with the requested lifetime', async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.example/t' }, error: null });
    await expect(signSourceUrl('user-1/5/a.pdf', 300)).resolves.toBe('https://signed.example/t');
    expect(createSignedUrl).toHaveBeenCalledWith('user-1/5/a.pdf', 300);
  });

  it('throws a generic error without leaking storage detail', async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: { message: 'Object not found at user-1/5/a.pdf' } });
    await expect(signSourceUrl('user-1/5/a.pdf', 300)).rejects.toThrow('Could not sign source URL');
  });
});
