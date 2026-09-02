const STORAGE_KEY = 'shelfstudy:class-last-opened';

type ClassLastOpened = Record<number, string>;

export function readClassLastOpened(): ClassLastOpened {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, string] => (
        typeof entry[1] === 'string' && !Number.isNaN(Date.parse(entry[1]))
      )),
    );
  } catch {
    return {};
  }
}

export function markClassOpened(classId: number, openedAt = new Date()): void {
  const lastOpened = readClassLastOpened();
  lastOpened[classId] = openedAt.toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lastOpened));
}

export function formatClassLastOpened(value?: string): string {
  if (!value) return 'Not opened yet';

  const openedAt = new Date(value);
  if (Number.isNaN(openedAt.getTime())) return 'Not opened yet';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(openedAt);
}
