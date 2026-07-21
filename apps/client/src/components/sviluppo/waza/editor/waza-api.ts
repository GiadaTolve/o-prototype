const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class WazaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errori: unknown[] = [],
    readonly avvisi: unknown[] = [],
  ) {
    super(message);
    this.name = "WazaApiError";
  }
}

async function wazaFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { getAccessToken } = await import("@/lib/auth-session");
  const accessToken = getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const body = (data ?? {}) as Record<string, unknown>;
    throw new WazaApiError(
      typeof body.error === "string" ? body.error : `Errore ${response.status}`,
      response.status,
      Array.isArray(body.errori) ? body.errori : [],
      Array.isArray(body.avvisi) ? body.avvisi : [],
    );
  }

  return data as T;
}

export const wazaApi = {
  get: <T>(endpoint: string) => wazaFetch<T>(endpoint),
  put: <T>(endpoint: string, body: unknown) =>
    wazaFetch<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  post: <T>(endpoint: string, body?: unknown) =>
    wazaFetch<T>(endpoint, {
      method: "POST",
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    }),
  patch: <T>(endpoint: string, body?: unknown) =>
    wazaFetch<T>(endpoint, {
      method: "PATCH",
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    }),
};
