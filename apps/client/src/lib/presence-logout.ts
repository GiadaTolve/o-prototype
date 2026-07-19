import { api } from "@/lib/api";
import { logoutSession } from "@/lib/auth-session";

/** Rimuove il personaggio dalla lista Presenti e chiude la sessione cookie. */
export async function logoutPresence(): Promise<void> {
  try {
    await api.post("/presence/logout", {});
  } catch {
    // ignore: logout locale procede comunque
  }
  await logoutSession();
}
