import { eq, ilike } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { users, characters } from '../../db/schema' 

// 👇 MODIFICA 1: Importiamo le funzioni dal file LOCALE, non dal dominio
import { hashPassword, comparePassword, signJwt } from './jwt'

// I tipi li prendiamo ancora dal dominio (va bene perché sono solo definizioni)
import type { UserRole, BanState } from '@domain/security/jwt'

// ==========================
// REGISTRAZIONE (User + Character)
// ==========================
export async function registerUser(
  email: string,
  pass: string,
  characterName: string,
  playerPreferences?: string,
) {
  
  // 1. Controllo se l'email esiste già
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email)
  })
  
  if (existingUser) {
    throw new Error('User already exists')
  }

  const existingChar = await db.query.characters.findFirst({
    where: ilike(characters.name, characterName.trim()),
  })

  if (existingChar) {
    throw new Error('Character name taken')
  }

  // 2. Criptiamo la password
  const passwordHash = await hashPassword(pass)

  // 3. Salviamo l'UTENTE (schema: no remBalance)
  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    role: 'PLAYER',
    banState: 'NONE',
    playerPreferences: playerPreferences?.trim() || null,
  }).returning()

  // 4. Salviamo il PERSONAGGIO attivo alla registrazione (nome PG; profilo e richieste dopo)
  const [newChar] = await db.insert(characters).values({
    userId: newUser.id,
    name: characterName,
    isRaw: false,
  }).returning()

  return { user: newUser, character: newChar }
}

// ==========================
// LOGIN (Aggiornato)
// ==========================
export async function loginUser(
  email: string,
  password: string
  // Nota: Ho rimosso 'jwtSecret' dagli argomenti perché ora è gestito dentro jwt.ts
): Promise<{ token: string }> {
  
  // 1. Cerca Utente
  const userRow = await db.query.users.findFirst({
    where: eq(users.email, email)
  })
  
  if (!userRow) throw new Error('Invalid credentials')

  // 2. Verifica Password 
  // 👇 USA 'comparePassword' invece di 'verifyPassword'
  const ok = await comparePassword(password, userRow.passwordHash)
  if (!ok) throw new Error('Invalid credentials')

  // 3. Genera Token
  // 👇 USA 'signJwt' ed è ASINCRONO (serve await)
  const token = await signJwt({ 
      sub: userRow.id, 
      role: userRow.role as UserRole,
      banState: userRow.banState as BanState 
  })

  return { token }
}