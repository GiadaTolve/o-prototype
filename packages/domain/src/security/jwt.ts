// ==========================================
//packages/domain/src/security/jwt.ts
// ==========================================

// Qui definiamo SOLO I TIPI.
// Nessuna logica di Bun, nessuna logica di jose.
// Questo file è sicuro per essere importato sia dal Client che dal Server.

export type UserId = string
export type UserRole = 'PLAYER' | 'ADMIN' | 'MASTER'
export type BanState = 'NONE' | 'SHADOW' | 'FULL'

export interface OyasumiJwtPayload {
  sub: UserId
  role: UserRole
  banState: BanState
  // Aggiungi qui altri campi se serviranno in futuro (es. nome pg)
}