const STORAGE_KEY = "ilivepdf.gemini.apiKey";

export function loadRememberedApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function saveRememberedApiKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, key.trim());
  } catch {
    // ignore quota / private mode
  }
}

export function clearRememberedApiKey() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const GEMINI_KEY_URL = "https://makersuite.google.com/app/apikey";
