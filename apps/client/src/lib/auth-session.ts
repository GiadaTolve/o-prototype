/**
 * Sessione client: cookie httpOnly lato API + hint leggero in sessionStorage
 * (niente JWT persistente in localStorage — resta solo un ponte di migrazione).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const HINT_KEY = "oyasumi_authed";
const LEGACY_TOKEN_KEY = "token";

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** JWT legacy ancora in localStorage (pre-cookie). */
export function getLegacyToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Rimuove il JWT legacy da localStorage (migrazione). */
export function clearLegacyToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function markSession(): void {
  if (typeof window === "undefined") return;
  clearLegacyToken();
  try {
    sessionStorage.setItem(HINT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearSessionHint(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(HINT_KEY);
  } catch {
    /* ignore */
  }
  clearLegacyToken();
}

/** Hint UI veloce (non è prova di auth — verificare con /auth/me se serve). */
export function hasSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(HINT_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return Boolean(getLegacyToken());
}

export async function fetchAuthMe(): Promise<boolean> {
  try {
    const legacy = getLegacyToken();
    const res = await fetch(apiUrl("/auth/me"), {
      credentials: "include",
      headers: legacy ? { Authorization: `Bearer ${legacy}` } : undefined,
    });
    if (res.ok) {
      markSession();
      return true;
    }
    if (res.status === 401) clearSessionHint();
    return false;
  } catch {
    return false;
  }
}

export async function fetchWsTicket(): Promise<string | null> {
  const legacy = getLegacyToken();
  if (legacy) return legacy;
  try {
    const res = await fetch(apiUrl("/auth/ws-ticket"), { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return typeof data.token === "string" ? data.token : null;
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(apiUrl("/auth/logout"), { method: "POST", credentials: "include" });
  } catch {
    /* ignore */
  }
  clearSessionHint();
}
