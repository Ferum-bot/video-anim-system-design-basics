import {LINKS} from './places';

/**
 * Walks over the real backbone graph. The "how many routes are there" beat doesn't fake its
 * paths — it enumerates actual simple paths through the same links that are drawn on the
 * map, which is why they fan out the way a real routing table would.
 */

const ADJACENCY = (() => {
  const map = new Map<string, string[]>();
  const add = (a: string, b: string) => {
    const list = map.get(a);
    if (list) list.push(b);
    else map.set(a, [b]);
  };
  for (const link of LINKS) {
    add(link.from, link.to);
    add(link.to, link.from);
  }
  return map;
})();

/** Every simple path from `from` to `to` up to `maxHops` edges, shortest first, capped. */
export function findPaths(from: string, to: string, maxHops: number, limit: number): string[][] {
  const found: string[][] = [];
  const path: string[] = [from];
  const seen = new Set([from]);

  const walk = (node: string) => {
    if (found.length >= limit) return;
    if (node === to) {
      found.push([...path]);
      return;
    }
    if (path.length > maxHops) return;
    for (const next of ADJACENCY.get(node) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      path.push(next);
      walk(next);
      path.pop();
      seen.delete(next);
    }
  };

  walk(from);
  found.sort((a, b) => a.length - b.length);
  return found;
}

/**
 * Thins an ordered list down to `count` entries spread across its whole range, so the paths
 * that flare on screen aren't all the same three-hop variations of each other.
 */
export function spread<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];
  const step = items.length / count;
  return Array.from({length: count}, (_, i) => items[Math.floor(i * step)]);
}

/** The two named routes the scene contrasts — both are real corridors, not sketches. */
export const SHORT_ROUTE = ['msk', 'msq', 'waw', 'poz', 'ber', 'fra'] as const;
export const CHOSEN_ROUTE = ['msk', 'spb', 'hel', 'sto', 'cph', 'ham', 'ams', 'fra'] as const;
