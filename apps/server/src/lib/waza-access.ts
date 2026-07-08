/**
 * Permessi pannello Catalogo Waza — matrice definitiva (§8 spec).
 *
 * Due livelli distinti (il ruolo "proponente" della vecchia spec NON esiste:
 * l'addetto alle waza è il Fixer):
 *
 * | Azione                                                        | Proprietario | Moderatore | Fixer | Shinigami / Capo Shinigami |
 * |---------------------------------------------------------------|:-:|:-:|:-:|:-:|
 * | Catalogo: vedere, creare, salvare bozze, validare, duplicare, archiviare | SÌ | SÌ | SÌ | NO |
 * | Pubblicare (Sprint 4)                                         | SÌ | SÌ | NO | NO |
 *
 * Mappatura ruoli → permessi:
 * - Manage  = accesso Sviluppo  (account ADMIN | roleIcon admin/moderatore/fixer)
 * - Publish = accesso Gestione  (account ADMIN | roleIcon admin/moderatore)
 *
 * Shinigami / Capo Shinigami e account MASTER sono esclusi da entrambi.
 */
import {
  resolveGestioneAccess,
  resolveSviluppoAccess,
  userHasGestioneAccess,
  userHasSviluppoAccess,
} from './gestione-access'

/**
 * Gestione catalogo waza (vedere, creare, salvare bozze, validare, duplicare,
 * archiviare). Proprietario, Moderatore, Fixer (+ account ADMIN).
 * Versione sincrona su (userRole, roleIcon) già noti.
 */
export function resolveCanManageWaza(userRole?: string | null, roleIcon?: string): boolean {
  return resolveSviluppoAccess(userRole, roleIcon)
}

/** Come sopra, ma risolve il roleIcon dal personaggio dell'utente (DB). */
export function userCanManageWaza(
  userId: string,
  userRole?: string | null,
): Promise<boolean> {
  return userHasSviluppoAccess(userId, userRole)
}

/**
 * Pubblicazione waza (Sprint 4): solo Proprietario, Moderatore (+ account ADMIN).
 * Fixer, Shinigami / Capo Shinigami e MASTER esclusi.
 * Versione sincrona su (userRole, roleIcon) già noti.
 */
export function resolveCanPublishWaza(userRole?: string | null, roleIcon?: string): boolean {
  return resolveGestioneAccess(userRole, roleIcon)
}

/** Come sopra, ma risolve il roleIcon dal personaggio dell'utente (DB). */
export function userCanPublishWaza(
  userId: string,
  userRole?: string | null,
): Promise<boolean> {
  return userHasGestioneAccess(userId, userRole)
}
