import { Rem } from './money'

export type UserId = string

export type UserRole =
  | 'PLAYER'
  | 'MOD'
  | 'ADMIN'
  | 'MASTER'

export type BanState =
  | { type: 'NONE' }
  | { type: 'SHADOW' }
  | { type: 'FULL'; expiresAt: Date }

export interface User {
  id: UserId
  email: string
  passwordHash: string

  role: UserRole
  ban: BanState

  rem: Rem
}
