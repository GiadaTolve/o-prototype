import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../plugins/db'
import {
  supervisioneDeviceNotes,
  supervisioneIpNotes,
  userKnownDevices,
  userKnownIps,
  users,
} from '../../db/schema'
import { normalizeIp } from '../../lib/client-ip'

/**
 * Registra IP di sessione.
 * - Primo contatto: salva come registration_ip (+ riga is_registration).
 * - Stesso IP della registrazione: aggiorna solo last_seen, non aggiunge voci.
 * - IP diverso: upsert in user_known_ips (lista aggiuntiva).
 */
export async function recordSessionIp(input: {
  userId: string
  characterId?: string | null
  ip: string
  userAgent?: string | null
}): Promise<{ recorded: boolean; isNewAlternate: boolean; ip: string }> {
  const ip = normalizeIp(input.ip)
  if (!ip || ip === 'unknown') {
    return { recorded: false, isNewAlternate: false, ip }
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, input.userId),
    columns: { id: true, registrationIp: true },
  })
  if (!user) return { recorded: false, isNewAlternate: false, ip }

  const now = new Date()
  const ua = input.userAgent?.slice(0, 500) ?? null
  const characterId = input.characterId ?? null

  // Primo IP mai visto → baseline registrazione
  if (!user.registrationIp) {
    await db.update(users).set({ registrationIp: ip }).where(eq(users.id, user.id))
    await db
      .insert(userKnownIps)
      .values({
        userId: user.id,
        ip,
        userAgent: ua,
        characterId,
        firstSeenAt: now,
        lastSeenAt: now,
        isRegistration: true,
      })
      .onConflictDoUpdate({
        target: [userKnownIps.userId, userKnownIps.ip],
        set: {
          lastSeenAt: now,
          userAgent: ua,
          characterId,
          isRegistration: true,
        },
      })
    return { recorded: true, isNewAlternate: false, ip }
  }

  const baseline = normalizeIp(user.registrationIp)

  // Stesso IP della registrazione → solo touch last_seen
  if (ip === baseline) {
    await db
      .update(userKnownIps)
      .set({ lastSeenAt: now, userAgent: ua, characterId })
      .where(and(eq(userKnownIps.userId, user.id), eq(userKnownIps.ip, baseline)))
    return { recorded: true, isNewAlternate: false, ip }
  }

  // IP diverso → entra in lista (o aggiorna last_seen)
  const existing = await db.query.userKnownIps.findFirst({
    where: and(eq(userKnownIps.userId, user.id), eq(userKnownIps.ip, ip)),
    columns: { id: true },
  })

  await db
    .insert(userKnownIps)
    .values({
      userId: user.id,
      ip,
      userAgent: ua,
      characterId,
      firstSeenAt: now,
      lastSeenAt: now,
      isRegistration: false,
    })
    .onConflictDoUpdate({
      target: [userKnownIps.userId, userKnownIps.ip],
      set: {
        lastSeenAt: now,
        userAgent: ua,
        characterId,
      },
    })

  return { recorded: true, isNewAlternate: !existing, ip }
}

/**
 * Registra device fingerprint di sessione (ID browser persistente).
 * Match multi-account sullo stesso deviceId → segnale Supervisione.
 */
export async function recordSessionDevice(input: {
  userId: string
  characterId?: string | null
  deviceId: string
  signalHash?: string | null
  userAgent?: string | null
}): Promise<{ recorded: boolean; deviceId: string }> {
  const deviceId = (input.deviceId ?? '').trim().slice(0, 80)
  if (!deviceId || deviceId.length < 8) {
    return { recorded: false, deviceId }
  }
  const now = new Date()
  const ua = input.userAgent?.slice(0, 500) ?? null
  const signalHash = input.signalHash?.trim().slice(0, 128) || null
  const characterId = input.characterId ?? null

  await db
    .insert(userKnownDevices)
    .values({
      userId: input.userId,
      deviceId,
      signalHash,
      userAgent: ua,
      characterId,
      firstSeenAt: now,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: [userKnownDevices.userId, userKnownDevices.deviceId],
      set: {
        lastSeenAt: now,
        userAgent: ua,
        characterId,
        ...(signalHash ? { signalHash } : {}),
      },
    })

  return { recorded: true, deviceId }
}

export type SupervisioneIpRow = {
  ip: string
  isRegistration: boolean
  firstSeenAt: string
  lastSeenAt: string
  userAgent: string | null
}

export type SupervisioneUserRow = {
  userId: string
  email: string
  role: string
  banState: string
  registrationIp: string | null
  staffNote: string | null
  characters: Array<{ id: string; name: string; surname: string | null }>
  ips: SupervisioneIpRow[]
  devices: SupervisioneDeviceRow[]
  matchCount: number
  deviceMatchCount: number
}

export type SupervisioneDeviceRow = {
  deviceId: string
  signalHash: string | null
  firstSeenAt: string
  lastSeenAt: string
  userAgent: string | null
}

export type SupervisioneMatch = {
  ip: string
  staffNote: string | null
  noteUpdatedAt: string | null
  accounts: Array<{
    userId: string
    email: string
    characterLabel: string
  }>
}

export type SupervisioneDeviceMatch = {
  deviceId: string
  staffNote: string | null
  noteUpdatedAt: string | null
  accounts: Array<{
    userId: string
    email: string
    characterLabel: string
  }>
}

/** Snapshot Supervisione: utenti+IP e match multi-account sullo stesso IP (immediato, senza finestra temporale). */
export async function getSupervisioneSnapshot(): Promise<{
  users: SupervisioneUserRow[]
  matches: SupervisioneMatch[]
  deviceMatches: SupervisioneDeviceMatch[]
}> {
  const allUsers = await db.query.users.findMany({
    columns: {
      id: true,
      email: true,
      role: true,
      banState: true,
      registrationIp: true,
      supervisioneNote: true,
    },
    with: {
      characters: {
        columns: { id: true, name: true, surname: true },
      },
      knownIps: {
        orderBy: [desc(userKnownIps.lastSeenAt)],
      },
      knownDevices: {
        orderBy: [desc(userKnownDevices.lastSeenAt)],
      },
    },
    orderBy: [desc(users.createdAt)],
  })

  const ipNotes = await db.query.supervisioneIpNotes.findMany()
  const noteByIp = new Map(ipNotes.map((n) => [normalizeIp(n.ip), n]))
  const deviceNotes = await db.query.supervisioneDeviceNotes.findMany()
  const noteByDevice = new Map(deviceNotes.map((n) => [n.deviceId, n]))

  const matchResult = await db.execute(sql`
    SELECT ip, array_agg(DISTINCT user_id::text) AS user_ids
    FROM user_known_ips
    WHERE ip IS NOT NULL AND ip <> 'unknown'
    GROUP BY ip
    HAVING COUNT(DISTINCT user_id) >= 2
    ORDER BY COUNT(DISTINCT user_id) DESC, ip ASC
  `)

  const deviceMatchResult = await db.execute(sql`
    SELECT device_id, array_agg(DISTINCT user_id::text) AS user_ids
    FROM user_known_devices
    WHERE device_id IS NOT NULL AND length(device_id) >= 8
    GROUP BY device_id
    HAVING COUNT(DISTINCT user_id) >= 2
    ORDER BY COUNT(DISTINCT user_id) DESC, device_id ASC
  `)

  const matchRows = (matchResult.rows ?? []) as Array<{ ip: string; user_ids: string[] }>
  const deviceMatchRows = (deviceMatchResult.rows ?? []) as Array<{
    device_id: string
    user_ids: string[]
  }>
  const userById = new Map(allUsers.map((u) => [u.id, u]))

  const toIso = (value: unknown): string => {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString()
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
    }
    return new Date().toISOString()
  }

  const labelForUser = (uid: string) => {
    const u = userById.get(uid)
    const chars = u?.characters ?? []
    return chars.length > 0
      ? chars.map((c) => [c.name, c.surname].filter(Boolean).join(' ')).join(', ')
      : u?.email ?? uid.slice(0, 8)
  }

  const matches: SupervisioneMatch[] = matchRows.map((row) => {
    const ids = Array.isArray(row.user_ids) ? row.user_ids : []
    const ip = normalizeIp(row.ip)
    const noteRow = noteByIp.get(ip)
    return {
      ip,
      staffNote: noteRow?.note?.trim() ? noteRow.note : null,
      noteUpdatedAt: noteRow?.updatedAt ? toIso(noteRow.updatedAt) : null,
      accounts: ids.map((uid) => ({
        userId: uid,
        email: userById.get(uid)?.email ?? '—',
        characterLabel: labelForUser(uid),
      })),
    }
  })

  const deviceMatches: SupervisioneDeviceMatch[] = deviceMatchRows.map((row) => {
    const ids = Array.isArray(row.user_ids) ? row.user_ids : []
    const deviceId = row.device_id
    const noteRow = noteByDevice.get(deviceId)
    return {
      deviceId,
      staffNote: noteRow?.note?.trim() ? noteRow.note : null,
      noteUpdatedAt: noteRow?.updatedAt ? toIso(noteRow.updatedAt) : null,
      accounts: ids.map((uid) => ({
        userId: uid,
        email: userById.get(uid)?.email ?? '—',
        characterLabel: labelForUser(uid),
      })),
    }
  })

  const matchIpSet = new Set(matches.map((m) => m.ip))
  const matchDeviceSet = new Set(deviceMatches.map((m) => m.deviceId))

  const usersOut: SupervisioneUserRow[] = allUsers.map((u) => {
    const ips: SupervisioneIpRow[] = (u.knownIps ?? []).map((row) => ({
      ip: row.ip,
      isRegistration: row.isRegistration,
      firstSeenAt: toIso(row.firstSeenAt),
      lastSeenAt: toIso(row.lastSeenAt),
      userAgent: row.userAgent,
    }))
    if (u.registrationIp && !ips.some((i) => i.ip === normalizeIp(u.registrationIp!))) {
      ips.unshift({
        ip: normalizeIp(u.registrationIp),
        isRegistration: true,
        firstSeenAt: toIso(0),
        lastSeenAt: toIso(0),
        userAgent: null,
      })
    }
    const devices: SupervisioneDeviceRow[] = (u.knownDevices ?? []).map((row) => ({
      deviceId: row.deviceId,
      signalHash: row.signalHash,
      firstSeenAt: toIso(row.firstSeenAt),
      lastSeenAt: toIso(row.lastSeenAt),
      userAgent: row.userAgent,
    }))
    return {
      userId: u.id,
      email: u.email,
      role: u.role ?? 'PLAYER',
      banState: u.banState ?? 'NONE',
      registrationIp: u.registrationIp,
      staffNote: u.supervisioneNote?.trim() ? u.supervisioneNote : null,
      characters: (u.characters ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        surname: c.surname ?? null,
      })),
      ips,
      devices,
      matchCount: ips.filter((i) => matchIpSet.has(i.ip)).length,
      deviceMatchCount: devices.filter((d) => matchDeviceSet.has(d.deviceId)).length,
    }
  })

  return { users: usersOut, matches, deviceMatches }
}

/** Nota staff su IP (match / condivisione legittima). */
export async function upsertIpStaffNote(ipRaw: string, note: string, staffUserId: string) {
  const ip = normalizeIp(ipRaw)
  if (!ip || ip === 'unknown') throw new Error('IP non valido')
  const now = new Date()
  const body = note.trim()
  if (!body) {
    await db.delete(supervisioneIpNotes).where(eq(supervisioneIpNotes.ip, ip))
    return { ip, note: null as string | null }
  }
  await db
    .insert(supervisioneIpNotes)
    .values({
      ip,
      note: body,
      updatedByUserId: staffUserId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [supervisioneIpNotes.ip],
      set: {
        note: body,
        updatedByUserId: staffUserId,
        updatedAt: now,
      },
    })
  return { ip, note: body }
}

/** Nota staff su account. */
export async function upsertUserStaffNote(userId: string, note: string) {
  const body = note.trim() || null
  const [row] = await db
    .update(users)
    .set({ supervisioneNote: body })
    .where(eq(users.id, userId))
    .returning({ id: users.id, supervisioneNote: users.supervisioneNote })
  if (!row) throw new Error('Utente non trovato')
  return { userId: row.id, note: row.supervisioneNote }
}

/** Nota staff su deviceId condiviso. */
export async function upsertDeviceStaffNote(
  deviceIdRaw: string,
  note: string,
  staffUserId: string,
) {
  const deviceId = deviceIdRaw.trim().slice(0, 80)
  if (!deviceId) throw new Error('Device ID non valido')
  const now = new Date()
  const body = note.trim()
  if (!body) {
    await db.delete(supervisioneDeviceNotes).where(eq(supervisioneDeviceNotes.deviceId, deviceId))
    return { deviceId, note: null as string | null }
  }
  await db
    .insert(supervisioneDeviceNotes)
    .values({
      deviceId,
      note: body,
      updatedByUserId: staffUserId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [supervisioneDeviceNotes.deviceId],
      set: {
        note: body,
        updatedByUserId: staffUserId,
        updatedAt: now,
      },
    })
  return { deviceId, note: body }
}
