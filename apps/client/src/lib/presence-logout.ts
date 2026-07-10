import { api } from "@/lib/api";

/** Rimuove il personaggio dalla lista Presenti prima di cancellare il token. */
export async function logoutPresence(): Promise<void> {
  try {
    await api.post("/presence/logout", {});
  } catch {
    // ignore: logout locale procede comunque
  }
}
