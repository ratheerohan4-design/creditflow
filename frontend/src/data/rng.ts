/**
 * Deterministic pseudo-random numbers. The demo data has to look the same on
 * every machine and every reload, so nothing is generated with Math.random.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seedFrom(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function between(next: () => number, min: number, max: number): number {
  return min + next() * (max - min)
}

export function intBetween(next: () => number, min: number, max: number): number {
  return Math.round(between(next, min, max))
}

export function pickOne<T>(next: () => number, items: readonly T[]): T {
  return items[Math.floor(next() * items.length) % items.length]
}
