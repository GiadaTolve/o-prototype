import { SignJWT, jwtVerify } from 'jose'

// 1. DEFINIZIONE TIPI
export type UserId = string
export type UserRole = 'PLAYER' | 'ADMIN' | 'MASTER'
export type BanState = 'NONE' | 'SHADOW' | 'FULL'

export interface OyasumiJwtPayload {
  sub: UserId
  role: UserRole
  banState: BanState
}

// 2. CONFIGURAZIONE SEGRETA (Fissa)
const SECRET_KEY = "CHIAVE_SEGRETA_DI_SVILUPPO_OYASUMI_RPG_2025"
const SECRET = new TextEncoder().encode(SECRET_KEY)

// 3. JWT LOGIC
export async function signJwt(payload: OyasumiJwtPayload) {
  try {
    const token = await new SignJWT({
      sub: payload.sub,
      role: payload.role,
      banState: payload.banState
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(SECRET)
    
    // console.log(`[JWT] ✍️ Token creato:`, token.slice(0, 20) + "...")
    return token
  } catch (err) {
    console.error(`[JWT] ❌ Errore creazione token:`, err)
    throw err
  }
}

export async function verifyJwt(token: string) {
  try {
    // 👇 MODIFICA IMPORTANTE: clockTolerance: 10 secondi
    const { payload } = await jwtVerify(token, SECRET, {
      clockTolerance: 10 
    })
    return payload
  } catch (error: any) {
    // 👇 LEGGI QUESTO NEL TERMINALE DEL SERVER SE FALLISCE
    console.error(`[JWT] 💥 ERRORE VERIFICA:`, error.message)
    console.error(`[JWT] Token ricevuto (primi 20 char):`, token.slice(0, 20))
    return null
  }
}

// 4. PASSWORD
export async function hashPassword(plainText: string): Promise<string> {
  return await Bun.password.hash(plainText)
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(plainText, hash)
}