// Recently compared products, per device. Storage can be unavailable (private mode), so every access is guarded.
const KEY = 'qh.recent.v2';

export interface RecentItem {
  id: string;
  name: string;
  emoji: string;
}

export function getRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

export function pushRecent(item: RecentItem) {
  try {
    const next = [item, ...getRecent().filter((x) => x.id !== item.id)].slice(0, 6);
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
