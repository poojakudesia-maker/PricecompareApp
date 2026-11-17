import { CATALOG, type Product } from '../data/catalog';

export interface Suggestion {
  product: Product;
  score: number;
  /** [start, end) ranges in product.name to highlight. */
  highlights: [number, number][];
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ');

// True if `t` is within one edit of some prefix of `w` (handles "amil" → "amul", "magi" → "maggi").
function fuzzyPrefix(w: string, t: string): boolean {
  if (t.length < 3) return false;
  for (const len of [t.length - 1, t.length, t.length + 1]) {
    if (len < 1 || len > w.length) continue;
    const a = w.slice(0, len);
    const dp = Array.from({ length: t.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= t.length; j++) {
        const tmp = dp[j];
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === t[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    if (dp[t.length] <= 1) return true;
  }
  return false;
}

function rangesFor(name: string, tokens: string[]): [number, number][] {
  const lower = norm(name);
  const out: [number, number][] = [];
  for (const t of tokens) {
    // Prefer matches at word starts.
    const re = new RegExp(`(^|\\s)${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    const m = re.exec(lower);
    if (m) out.push([m.index + m[1].length, m.index + m[1].length + t.length]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

export function suggest(query: string, limit = 7): Suggestion[] {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  const results: Suggestion[] = [];
  for (const product of CATALOG) {
    const name = norm(product.name);
    const hay = norm([product.name, product.brand, product.category, ...(product.aliases ?? [])].join(' '));
    const words = hay.split(/\s+/);
    let score = 0;
    let matchedAll = true;

    for (const t of tokens) {
      if (words.some((w) => w === t)) score += 6;
      else if (words.some((w) => w.startsWith(t))) score += 4;
      else if (hay.includes(t)) score += 1;
      else if (words.some((w) => fuzzyPrefix(w, t))) score += 2;
      else {
        matchedAll = false;
        break;
      }
    }
    if (!matchedAll) continue;
    const firstWord = name.split(/\s+/)[0];
    if (name.startsWith(tokens[0]) || fuzzyPrefix(firstWord, tokens[0])) score += 3;
    if (norm(product.brand).startsWith(tokens[0])) score += 2;
    results.push({ product, score, highlights: rangesFor(product.name, tokens) });
  }

  return results.sort((a, b) => b.score - a.score || a.product.name.length - b.product.name.length).slice(0, limit);
}
