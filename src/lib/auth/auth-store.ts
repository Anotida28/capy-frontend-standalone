"use client";

type AuthState = {
  username: string | null;
  password: string | null;
  role: string | null;
};

const STORAGE_KEY = "ucms.auth";

export function getAuth(): AuthState {
  if (typeof window === "undefined") {
    return { username: null, password: null, role: null };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { username: null, password: null, role: null };
    const parsed = JSON.parse(raw) as AuthState;
    return {
      username: parsed.username ?? null,
      password: parsed.password ?? null,
      role: parsed.role ?? null
    };
  } catch {
    return { username: null, password: null, role: null };
  }
}

export function setAuth(next: AuthState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function isAuthenticated() {
  const auth = getAuth();
  return Boolean(auth.username && auth.password);
}
