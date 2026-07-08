/**
 * Permessi pannello Catalogo Waza (nuovo catalogo /admin/waza) — matrice §8.
 *
 * Due livelli distinti (nessun ruolo «proponente»: l'addetto alle waza è il Fixer):
 * - Gestire (vedere, creare, salvare bozze, validare, duplicare, archiviare):
 *   Proprietario, Moderatore, Fixer  → accesso Sviluppo.
 * - Pubblicare (Sprint 4): solo Proprietario, Moderatore → accesso Gestione.
 *
 * Shinigami / Capo Shinigami e account MASTER: nessun accesso.
 */
type WazaAccessChar = {
  canAccessSviluppo?: boolean;
  canAccessGestione?: boolean;
  userRole?: string;
} | null | undefined;

/** Gestione catalogo waza: Proprietario, Moderatore, Fixer (+ account ADMIN). */
export function canManageWaza(char: WazaAccessChar): boolean {
  if (!char) return false;
  if ((char.userRole ?? "").toUpperCase() === "ADMIN") return true;
  return char.canAccessSviluppo === true;
}

/** Pubblicazione waza (Sprint 4): solo Proprietario, Moderatore (+ account ADMIN). */
export function canPublishWaza(char: WazaAccessChar): boolean {
  if (!char) return false;
  if ((char.userRole ?? "").toUpperCase() === "ADMIN") return true;
  return char.canAccessGestione === true;
}
