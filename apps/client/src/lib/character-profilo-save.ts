/**
 * Endpoint PUT profilo scheda — separato per testabilità (bug cross-PG staff).
 */
export function resolveProfiloSaveEndpoint(
  isRemoteCharacter: boolean,
  targetCharacterId?: string,
): string {
  if (isRemoteCharacter) {
    if (!targetCharacterId) {
      throw new Error('targetCharacterId mancante per salvataggio scheda altrui')
    }
    return `/characters/${targetCharacterId}/profilo`
  }
  return '/characters/me/profilo'
}
