/**
 * Accesso al pannello authoring waza (nuovo catalogo /admin/waza).
 *
 * TODO(Sprint 4): includere ruolo «proponente» (§8 spec) con permessi limitati
 * (bozze proprie, sandbox — no valida/pubblica).
 */
export function canAccessWazaAuthoring(char: {
  canAccessGestione?: boolean;
  userRole?: string;
} | null | undefined): boolean {
  if (!char) return false;
  const role = (char.userRole ?? "").toUpperCase();
  if (role === "ADMIN" || role === "MASTER") return true;
  return char.canAccessGestione === true;
}
