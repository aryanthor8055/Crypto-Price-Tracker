const STORAGE_KEY = "crypto-tracker-favorites";

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

export function setFavorites(favorites: Set<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
}

export function toggleFavorite(symbol: string): Set<string> {
  const next = getFavorites();
  if (next.has(symbol)) {
    next.delete(symbol);
  } else {
    next.add(symbol);
  }
  setFavorites(next);
  return new Set(next);
}

export function isFavorite(symbol: string): boolean {
  return getFavorites().has(symbol);
}
