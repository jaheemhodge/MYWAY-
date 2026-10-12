const KEY = "mobility.demo.v1";

export async function loadState<T>(): Promise<T | null> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const result = await Preferences.get({ key: KEY });
    if (result.value) return JSON.parse(result.value) as T;
  } catch {
    // Browser or missing plugin — fall through to localStorage.
  }
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function saveState<T>(value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  localStorage.setItem(KEY, serialized);
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: KEY, value: serialized });
  } catch {
    // localStorage is enough in web preview.
  }
}

export async function clearState(): Promise<void> {
  localStorage.removeItem(KEY);
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key: KEY });
  } catch {
    // ignore
  }
}
