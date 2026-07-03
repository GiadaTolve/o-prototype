import { and, desc, eq } from 'drizzle-orm'
import {
  isValidExclusiveSkiruRequest,
  isValidMadoshoRequest,
  isValidOrderRequest,
  isValidPremioRequest,
  isValidTenkanRequest,
  labelForPlayerRequest,
  type PlayerRequestKind,
} from '@domain/progression/player-requests'
import {
  applyExclusiveSkiru,
  canGrantExclusiveSkiru,
  exclusiveSkiruApprovalExpCost,
  getJigaMilestoneLabel,
  isJigaExclusiveSkiruId,
  resolvePremioToMilestoneId,
} from '@domain/skiru/exclusive-skiru'
import { grantSokaijuTenkan, isSokaijuGateOpen, validateSkiruSheet } from '@domain/skiru/progression'
import { db } from '../../plugins/db'
import { characterPlayerRequests, characters } from '../../db/schema'
import { resolveCharacterSkiruSheet } from '../characters/skiru-sheet'
import type { BaseStats } from '@domain/stats/calculator'

export type PlayerRequestRow = {
  id: string
  kind: PlayerRequestKind
  requestedValue: string
  requestedLabel: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  staffNote: string | null
  reviewedAt: string | null
  updatedAt: string
}

function mapRow(row: typeof characterPlayerRequests.$inferSelect): PlayerRequestRow {
  return {
    id: row.id,
    kind: row.kind,
    requestedValue: row.requestedValue,
    requestedLabel: labelForPlayerRequest(row.kind, row.requestedValue),
    status: row.status,
    staffNote: row.staffNote,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function validateRequestValue(kind: PlayerRequestKind, value: string) {
  switch (kind) {
    case 'MADOSHO':
      if (!isValidMadoshoRequest(value)) throw new Error('Madoshō non valida.')
      break
    case 'ORDER':
      if (!isValidOrderRequest(value)) throw new Error('Ordine non valido.')
      break
    case 'SKIRU_ESCLUSIVA':
      if (!isValidExclusiveSkiruRequest(value)) throw new Error('Skiru esclusiva non valida.')
      break
    case 'PREMIO':
      throw new Error('I Premi narrativi non sono ancora disponibili. Usa Skiru esclusive per le milestone Jiga.')
    case 'TENKAN':
      if (!isValidTenkanRequest(value)) throw new Error('Richiesta Tenkan non valida.')
      break
  }
}

function baseStatsFromChar(char: {
  strength: number
  constitution: number
  dexterity: number
  mind: number
  empathy: number
}): BaseStats {
  return {
    strength: char.strength,
    constitution: char.constitution,
    dexterity: char.dexterity,
    mind: char.mind,
    empathy: char.empathy,
  }
}

export class PlayerRequestsService {
  async listForCharacter(characterId: string): Promise<PlayerRequestRow[]> {
    const rows = await db.query.characterPlayerRequests.findMany({
      where: eq(characterPlayerRequests.characterId, characterId),
      orderBy: [desc(characterPlayerRequests.updatedAt)],
    })

    const legacyPremio = rows.filter((r) => r.kind === 'PREMIO')
    if (legacyPremio.length > 0) {
      const now = new Date()
      for (const row of legacyPremio) {
        await db
          .update(characterPlayerRequests)
          .set({ kind: 'SKIRU_ESCLUSIVA', updatedAt: now })
          .where(eq(characterPlayerRequests.id, row.id))
        row.kind = 'SKIRU_ESCLUSIVA'
      }
    }

    return rows.map(mapRow)
  }

  async upsertRequest(characterId: string, kind: PlayerRequestKind, requestedValue: string) {
    validateRequestValue(kind, requestedValue.trim())

    const existing = await db.query.characterPlayerRequests.findFirst({
      where: and(
        eq(characterPlayerRequests.characterId, characterId),
        eq(characterPlayerRequests.kind, kind),
      ),
    })

    const now = new Date()
    if (existing) {
      const [row] = await db
        .update(characterPlayerRequests)
        .set({
          requestedValue: requestedValue.trim(),
          status: 'PENDING',
          staffNote: null,
          reviewedByUserId: null,
          reviewedAt: null,
          updatedAt: now,
        })
        .where(eq(characterPlayerRequests.id, existing.id))
        .returning()
      return mapRow(row)
    }

    const [row] = await db
      .insert(characterPlayerRequests)
      .values({
        characterId,
        kind,
        requestedValue: requestedValue.trim(),
        status: 'PENDING',
        updatedAt: now,
      })
      .returning()
    return mapRow(row)
  }

  async listForStaff(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const rows = await db.query.characterPlayerRequests.findMany({
      ...(status ? { where: eq(characterPlayerRequests.status, status) } : {}),
      with: {
        character: {
          columns: {
            id: true,
            name: true,
            surname: true,
            madoshoId: true,
            order: true,
          },
        },
      },
      orderBy: [desc(characterPlayerRequests.updatedAt)],
    })

    return rows.map((row) => ({
      ...mapRow(row),
      character: row.character
        ? {
            id: row.character.id,
            name: row.character.name,
            surname: row.character.surname,
            madoshoId: row.character.madoshoId,
            order: row.character.order,
          }
        : null,
    }))
  }

  private async applyExclusiveSkiruApproval(characterId: string, skiruId: string) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: {
        skiruSheet: true,
        strength: true,
        constitution: true,
        dexterity: true,
        mind: true,
        empathy: true,
        experienceSpendable: true,
      },
    })
    if (!char) throw new Error('Personaggio non trovato.')

    if (!isJigaExclusiveSkiruId(skiruId)) {
      throw new Error(`«${skiruId}» non è una Skiru esclusiva valida.`)
    }

    const skiruSheet = resolveCharacterSkiruSheet(
      char.skiruSheet as Record<string, number> | undefined,
      baseStatsFromChar(char),
    )

    const grantCheck = canGrantExclusiveSkiru(skiruSheet, skiruId)
    if (!grantCheck.ok) {
      throw new Error(grantCheck.reason ?? 'Skiru esclusiva non concedibile.')
    }

    const expCost = exclusiveSkiruApprovalExpCost(skiruId, skiruSheet)
    const spendable = char.experienceSpendable ?? 0
    if (spendable < expCost) {
      throw new Error(
        `EXP spendibile insufficiente (${spendable}/${expCost}) per «${getJigaMilestoneLabel(skiruId)}».`,
      )
    }

    const newSheet = applyExclusiveSkiru(skiruSheet, skiruId)

    await db
      .update(characters)
      .set({
        skiruSheet: newSheet as Record<string, number>,
        experienceSpendable: spendable - expCost,
      })
      .where(eq(characters.id, characterId))
  }

  private async applyApprovedRequest(
    characterId: string,
    kind: PlayerRequestKind,
    requestedValue: string,
  ) {
    if (kind === 'MADOSHO') {
      await db
        .update(characters)
        .set({ madoshoId: requestedValue as typeof characters.$inferInsert.madoshoId })
        .where(eq(characters.id, characterId))
      return
    }

    if (kind === 'ORDER') {
      const orderIcon =
        requestedValue === 'MUGEN-TAI' ? 'mugen-tai' : 'chisen-tai'
      const char = await db.query.characters.findFirst({
        where: eq(characters.id, characterId),
        columns: { uiMetadata: true },
      })
      const meta = (char?.uiMetadata as Record<string, unknown> | null) ?? {}
      await db
        .update(characters)
        .set({
          order: requestedValue as 'MUGEN-TAI' | 'CHISEN-TAI',
          uiMetadata: { ...meta, orderIcon },
        })
        .where(eq(characters.id, characterId))
      return
    }

    if (kind === 'TENKAN') {
      const char = await db.query.characters.findFirst({
        where: eq(characters.id, characterId),
        columns: {
          skiruSheet: true,
          strength: true,
          constitution: true,
          dexterity: true,
          mind: true,
          empathy: true,
        },
      })
      if (!char) throw new Error('Personaggio non trovato.')

      const skiruSheet = resolveCharacterSkiruSheet(
        char.skiruSheet as Record<string, number> | undefined,
        baseStatsFromChar(char),
      )
      if (isSokaijuGateOpen(skiruSheet)) return

      const newSheet = grantSokaijuTenkan(skiruSheet)
      const validation = validateSkiruSheet(newSheet)
      if (!validation.ok) throw new Error(validation.errors.join('; '))

      await db
        .update(characters)
        .set({ skiruSheet: newSheet as Record<string, number> })
        .where(eq(characters.id, characterId))
      return
    }

    if (kind === 'SKIRU_ESCLUSIVA') {
      await this.applyExclusiveSkiruApproval(characterId, requestedValue.trim())
      return
    }

    if (kind === 'PREMIO') {
      const skiruId = resolvePremioToMilestoneId(requestedValue)
      if (!skiruId) {
        throw new Error(`Premio «${requestedValue}» non ancora implementato.`)
      }
      await this.applyExclusiveSkiruApproval(characterId, skiruId)
    }
  }

  async countPending(): Promise<number> {
    const rows = await db.query.characterPlayerRequests.findMany({
      where: eq(characterPlayerRequests.status, 'PENDING'),
      columns: { id: true },
    })
    return rows.length
  }

  async reviewRequest(
    requestId: string,
    reviewerUserId: string,
    decision: 'APPROVED' | 'REJECTED',
    staffNote?: string,
  ) {
    const row = await db.query.characterPlayerRequests.findFirst({
      where: eq(characterPlayerRequests.id, requestId),
    })
    if (!row) throw new Error('Richiesta non trovata.')
    if (row.status !== 'PENDING') throw new Error('Richiesta già gestita.')

    const now = new Date()
    const [updated] = await db
      .update(characterPlayerRequests)
      .set({
        status: decision,
        staffNote: staffNote?.trim() || null,
        reviewedByUserId: reviewerUserId,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(characterPlayerRequests.id, requestId))
      .returning()

    if (decision === 'APPROVED') {
      await this.applyApprovedRequest(row.characterId, row.kind, row.requestedValue)
    }

    return mapRow(updated)
  }
}

export const playerRequestsService = new PlayerRequestsService()
