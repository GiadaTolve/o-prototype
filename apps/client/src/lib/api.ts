// apps/client/src/lib/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

async function fetcher(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (error) {
    // Gestione errori di rete (server non raggiungibile, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Server non raggiungibile. Verifica che il server sia in esecuzione su ${API_URL}`)
    }
    throw error
  }

  // Se il token è scaduto (401), puliamo la sessione (opzionale: redirect)
  if (response.status === 401) {
    console.debug('Sessione scaduta o non autorizzato')
    // Non loggare come errore se è solo una richiesta non autenticata
  }

  // Controlla se la risposta è JSON
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')

  let data: unknown
  if (isJson) {
    try {
      data = await response.json()
    } catch {
      throw new Error('Errore nella richiesta')
    }
  } else {
    // Se non è JSON, leggi come testo
    const text = await response.text()
    if (!response.ok) {
      // Se è 404, potrebbe essere una route non trovata - gestisci meglio
      if (response.status === 404) {
        throw new Error(`Risorsa non trovata: ${endpoint}`)
      }
      throw new Error(text || `Errore ${response.status}`)
    }
    return text
  }

  if (!response.ok) {
    let errorMessage = `Errore ${response.status}`
    if (typeof data === 'string') {
      errorMessage = data
    } else if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>
      if (typeof o.error === 'string') {
        errorMessage = o.error
      } else if (o.message != null) {
        errorMessage = String(o.message)
      } else {
        errorMessage = JSON.stringify(data)
      }
    }
    throw new Error(errorMessage)
  }

  return data
}

export const api = {
  get: (endpoint: string) => fetcher(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: unknown) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) => fetcher(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint: string, body?: unknown) =>
    fetcher(endpoint, { method: 'PATCH', ...(body != null ? { body: JSON.stringify(body) } : {}) }),
  delete: (endpoint: string) => fetcher(endpoint, { method: 'DELETE' }),
}