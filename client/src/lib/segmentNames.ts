const STORAGE_KEY = "interval_segment_names";

export function getSavedSegmentNames(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveSegmentName(name: string): void {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const existing = getSavedSegmentNames();
  if (!existing.includes(trimmedName)) {
    const updated = [...existing, trimmedName];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function removeSegmentName(name: string): void {
  const existing = getSavedSegmentNames();
  const updated = existing.filter((n) => n !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
