// Recently viewed products, per device. Storage can be unavailable (private mode), so every access is guarded.
const KEY = 'qh.recent';

export function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecent(id: string) {
  try {
    const next = [id, ...getRecent().filter((x) => x !== id)].slice(0, 6);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
