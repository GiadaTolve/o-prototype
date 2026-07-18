import { and, eq } from 'drizzle-orm'
import {
  canDismantleInventoryItem,
  DISMANTLE_DAILY_MAX,
  isArtigianoFromSkiruSheet,
  materialCatalogKey,
  resolveDismantleYields,
  type EconomyMaterialCost,
} from '@domain/economy/dismantle'
import type { ItemCategory } from '@domain/economy/types'
import { db } from '../../plugins/db'
import { characters, dismantleDailyUsage, inventory } from '../../db/schema'
import { addItemByCatalogKey, getCharacterInventory } from '../inventory/inventory.service'
import { broadcastInventoryUpdated } from '../realtime/ws.routes'

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

async function getDismantleCount(characterId: string, dayKey: string): Promise<number> {
  const row = await db.query.dismantleDailyUsage.findFirst({
    where: and(
      eq(dismantleDailyUsage.characterId, characterId),
      eq(dismantleDailyUsage.dayKey, dayKey),
    ),
  })
  return row?.count ?? 0
}

async function incrementDismantleCount(characterId: string, dayKey: string, by: number): Promise<number> {
  const existing = await db.query.dismantleDailyUsage.findFirst({
    where: and(
      eq(dismantleDailyUsage.characterId, characterId),
      eq(dismantleDailyUsage.dayKey, dayKey),
    ),
  })
  if (existing) {
    const next = (existing.count ?? 0) + by
    await db
      .update(dismantleDailyUsage)
      .set({ count: next })
      .where(
        and(
          eq(dismantleDailyUsage.characterId, characterId),
          eq(dismantleDailyUsage.dayKey, dayKey),
        ),
      )
    return next
  }
  await db.insert(dismantleDailyUsage).values({ characterId, dayKey, count: by })
  return by
}

export async function assertArtigiano(characterId: string): Promise<void> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { skiruSheet: true, socialClass: true },
  })
  const isArtigiano =
    char?.socialClass === 'shokunin' ||
    (char != null && isArtigianoFromSkiruSheet(char.skiruSheet ?? {}))
  if (!char || !isArtigiano) {
    throw new Error('Solo gli Artigiani (Shokunin) possono smantellare.')
  }
}

export async function getDismantleStatus(characterId: string) {
  await assertArtigiano(characterId)
  const dayKey = utcDayKey()
  const used = await getDismantleCount(characterId, dayKey)
  return {
    isArtigiano: true,
    dayKey,
    usedToday: used,
    remainingToday: Math.max(0, DISMANTLE_DAILY_MAX - used),
    dailyMax: DISMANTLE_DAILY_MAX,
  }
}

async function grantMaterials(
  characterId: string,
  yields: readonly EconomyMaterialCost[],
): Promise<Array<{ materialId: string; quantity: number; catalogKey: string }>> {
  const granted: Array<{ materialId: string; quantity: number; catalogKey: string }> = []
  for (const y of yields) {
    if (y.quantity <= 0) continue
    const catalogKey = materialCatalogKey(y.materialId)
    await addItemByCatalogKey(characterId, catalogKey, y.quantity, { origin: 'craftato' })
    granted.push({ materialId: y.materialId, quantity: y.quantity, catalogKey })
  }
  return granted
}

async function grantJunk(
  characterId: string,
  junk: ReadonlyArray<{ catalogKey: string; quantity: number }>,
): Promise<Array<{ catalogKey: string; quantity: number; name?: string }>> {
  const granted: Array<{ catalogKey: string; quantity: number; name?: string }> = []
  for (const row of junk) {
    if (row.quantity <= 0) continue
    await addItemByCatalogKey(characterId, row.catalogKey, row.quantity, { origin: 'craftato' })
    granted.push({ catalogKey: row.catalogKey, quantity: row.quantity })
  }
  return granted
}

async function consumeInventoryUnit(inventoryId: string, characterId: string): Promise<void> {
  const inv = await db.query.inventory.findFirst({
    where: and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)),
  })
  if (!inv) throw new Error('Oggetto non trovato nell\'inventario.')

  const qty = inv.quantity ?? 1
  if (qty <= 1) {
    await db.delete(inventory).where(eq(inventory.id, inventoryId))
  } else {
    await db.update(inventory).set({ quantity: qty - 1 }).where(eq(inventory.id, inventoryId))
  }
}

export interface DismantleResultLine {
  inventoryId: string
  itemName: string
  junk: Array<{ catalogKey: string; quantity: number }>
  materials: Array<{ materialId: string; quantity: number; catalogKey: string }>
}

export async function dismantleInventoryItems(
  characterId: string,
  inventoryIds: readonly string[],
): Promise<{
  dismantled: DismantleResultLine[]
  usedToday: number
  remainingToday: number
}> {
  await assertArtigiano(characterId)

  const uniqueIds = [...new Set(inventoryIds.filter(Boolean))]
  if (uniqueIds.length === 0) {
    throw new Error('Seleziona almeno un oggetto da smantellare.')
  }

  const dayKey = utcDayKey()
  const used = await getDismantleCount(characterId, dayKey)
  const remaining = DISMANTLE_DAILY_MAX - used
  if (uniqueIds.length > remaining) {
    throw new Error(
      `Puoi smantellare ancora ${remaining} oggetti oggi (limite ${DISMANTLE_DAILY_MAX}/giorno).`,
    )
  }

  const results: DismantleResultLine[] = []

  for (const inventoryId of uniqueIds) {
    const inv = await db.query.inventory.findFirst({
      where: and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)),
      with: { item: true },
    })
    if (!inv?.item) {
      throw new Error('Oggetto non trovato nell\'inventario.')
    }

    const category = (inv.item.category ?? 'junk') as ItemCategory
    const blueprintId = inv.blueprintId ?? inv.item.blueprintId

    const check = canDismantleInventoryItem({
      category,
      junkTemplateId: inv.item.junkTemplateId,
      blueprintId,
      integrityCurrent: inv.integrityCurrent,
      integrityMax: inv.item.integrityMax,
      isEquipped: inv.isEquipped ?? false,
      itemType: inv.item.type,
    })
    if (!check.ok) {
      throw new Error(`${inv.item.name}: ${check.reason ?? 'non smantellabile.'}`)
    }

    const yields = resolveDismantleYields({
      category,
      junkTemplateId: inv.item.junkTemplateId,
      blueprintId,
      integrityCurrent: inv.integrityCurrent,
      integrityMax: inv.item.integrityMax,
      itemType: inv.item.type,
    })
    if (yields.junk.length === 0 && yields.materials.length === 0) {
      throw new Error(`${inv.item.name}: nessuna resa recuperabile.`)
    }

    await consumeInventoryUnit(inventoryId, characterId)
    const junk = await grantJunk(characterId, yields.junk)
    const materials = await grantMaterials(characterId, yields.materials)
    results.push({
      inventoryId,
      itemName: inv.item.name,
      junk,
      materials,
    })
  }

  const newUsed = await incrementDismantleCount(characterId, dayKey, uniqueIds.length)

  broadcastInventoryUpdated(characterId)

  return {
    dismantled: results,
    usedToday: newUsed,
    remainingToday: Math.max(0, DISMANTLE_DAILY_MAX - newUsed),
  }
}

/** Inventario filtrato: flag `canDismantle` per UI tool Artigiano. */
export async function getArtigianoDismantleInventory(characterId: string) {
  await assertArtigiano(characterId)
  const inv = await getCharacterInventory(characterId)
  const itemsWithFlag = inv.items.map((row) => {
    const eco = row.economy
    const input = {
      category: eco.category,
      junkTemplateId: eco.junkTemplateId,
      blueprintId: eco.blueprintId,
      integrityCurrent: eco.integrityCurrent,
      integrityMax: eco.integrityMax,
      isEquipped: row.isEquipped,
      itemType: row.item.type,
    }
    const check = canDismantleInventoryItem(input)
    const preview = check.ok ? resolveDismantleYields(input) : null
    return {
      ...row,
      canDismantle: check.ok,
      dismantleBlockReason: check.ok ? undefined : check.reason,
      dismantlePreview: preview
        ? {
            junk: preview.junk.map((j) => ({ catalogKey: j.catalogKey, quantity: j.quantity })),
            materials: preview.materials.map((m) => ({
              materialId: m.materialId,
              quantity: m.quantity,
              catalogKey: materialCatalogKey(m.materialId),
            })),
          }
        : undefined,
    }
  })
  const status = await getDismantleStatus(characterId)
  return { ...inv, items: itemsWithFlag, dismantle: status }
}
