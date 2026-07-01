/** Messaggio leggibile quando `fetch` fallisce (server spento, rete, ecc.). */
export function formatFetchError(err: unknown, apiBase: string): string {
  if (err instanceof Error && err.name === "AbortError") {
    return `Timeout: l'API non risponde. Verifica che il server sia avviato e raggiungibile su ${apiBase}.`;
  }
  const msg = err instanceof Error ? err.message : "";
  const isNetwork =
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
  if (isNetwork) {
    return `Impossibile contattare l'API su ${apiBase}. Avvia il backend dalla root del repo: \`bun run dev:server\`, oppure \`bun run dev\` per client e server insieme. Poi verifica: \`curl ${apiBase}/health\`.`;
  }
  return err instanceof Error ? err.message : "Errore";
}
