// apps/client/src/lib/api.ts

import { clearSessionHint, getAccessToken } from "@/lib/auth-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetcher(endpoint: string, options: RequestInit = {}) {
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
      cache: options.cache ?? "no-store",
    });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Server non raggiungibile. Verifica che il server sia in esecuzione su ${API_URL}`,
      );
    }
    throw error;
  }

  if (response.status === 401) {
    clearSessionHint();
    console.debug("Sessione scaduta o non autorizzato");
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  let data: unknown;
  if (isJson) {
    try {
      data = await response.json();
    } catch {
      throw new Error("Errore nella richiesta");
    }
  } else {
    const text = await response.text();
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Risorsa non trovata: ${endpoint}`);
      }
      throw new Error(text || `Errore ${response.status}`);
    }
    return text;
  }

  if (!response.ok) {
    let errorMessage = `Errore ${response.status}`;
    if (typeof data === "string") {
      errorMessage = data;
    } else if (data && typeof data === "object") {
      const o = data as Record<string, unknown>;
      if (Array.isArray(data)) {
        // Evita Error("[]") quando il server risponde 5xx con body array
        errorMessage = `Errore ${response.status}`;
      } else if (typeof o.error === "string") {
        errorMessage = o.error;
      } else if (o.message != null) {
        errorMessage = String(o.message);
      } else {
        errorMessage = JSON.stringify(data);
      }
    }
    throw new Error(errorMessage);
  }

  return data;
}

export const api = {
  get: (endpoint: string) => fetcher(endpoint, { method: "GET" }),
  post: (endpoint: string, body: unknown) =>
    fetcher(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) =>
    fetcher(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint: string, body?: unknown) =>
    fetcher(endpoint, {
      method: "PATCH",
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    }),
  delete: (endpoint: string) => fetcher(endpoint, { method: "DELETE" }),
};
