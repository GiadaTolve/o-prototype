const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

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
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
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
};
