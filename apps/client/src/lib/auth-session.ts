/**
 * Sessione client:
 * - cookie httpOnly (stesso sito / quando il browser lo accetta)
 * - JWT in sessionStorage come fallback cross-site (Vercel ↔ Render su Safari iOS)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const HINT_KEY = "oyasumi_authed";
/** Fallback Bearer quando il cookie third-party non viene salvato/inviato. */
const ACCESS_TOKEN_KEY = "oyasumi_access_token";
const LEGACY_TOKEN_KEY = "token";

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Token da mandare come Authorization Bearer (sessionStorage, poi legacy localStorage). */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (fromSession) return fromSession;
  } catch {
    /* ignore */
  }
  try {
    return localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** @deprecated usa getAccessToken */
export function getLegacyToken(): string | null {
  return getAccessToken();
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  const t = token.trim();
  if (!t) return;
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, t);
  } catch {
    /* ignore */
  }
  // Migrazione: non tenere più JWT in localStorage
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated usa clearAccessToken */
export function clearLegacyToken(): void {
  clearAccessToken();
}

/** Dopo login/register: hint UI + token Bearer di fallback (necessario su Safari mobile). */
export function markSession(token?: string | null): void {
  if (typeof window === "undefined") return;
  if (token) setAccessToken(token);
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
  clearAccessToken();
}

/** Hint UI veloce (non è prova di auth — verificare con /auth/me se serve). */
export function hasSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(HINT_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return Boolean(getAccessToken());
}

export async function fetchAuthMe(): Promise<boolean> {
  try {
    const token = getAccessToken();
    const res = await fetch(apiUrl("/auth/me"), {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) {
      markSession(token);
      return true;
    }
    if (res.status === 401) clearSessionHint();
    return false;
  } catch {
    return false;
  }
}

export async function fetchWsTicket(): Promise<string | null> {
  const existing = getAccessToken();
  if (existing) return existing;
  try {
    const res = await fetch(apiUrl("/auth/ws-ticket"), { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    if (typeof data.token === "string" && data.token) {
      setAccessToken(data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(apiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include",
      headers: (() => {
        const t = getAccessToken();
        return t ? { Authorization: `Bearer ${t}` } : undefined;
      })(),
    });
  } catch {
    /* ignore */
  }
  clearSessionHint();
}
