import { useEffect, useState } from 'react';
import { getNoteFileUrl } from '../api';

const RENEW_AT_FRACTION = 0.7;
const MIN_RENEW_MS = 5_000;

interface Result {
  noteId: number;
  url: string | null;
  failed: boolean;
}

// Files are private, so we ask the server for a link and get a new one before
// it expires. Keep the link in state only.
export function useNoteFileUrl(noteId: number) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const { data } = await getNoteFileUrl(noteId);
        if (!active) return;
        setResult({ noteId, url: data.url, failed: false });
        timer = setTimeout(load, Math.max(data.expiresIn * 1000 * RENEW_AT_FRACTION, MIN_RENEW_MS));
      } catch {
        if (active) setResult({ noteId, url: null, failed: true });
      }
    };

    load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [noteId]);

  // Ignore a result that belongs to a different note.
  const current = result?.noteId === noteId ? result : null;
  return { url: current?.url ?? null, failed: current?.failed ?? false };
}
