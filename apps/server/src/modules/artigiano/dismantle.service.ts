import { and, eq } from 'drizzle-orm'
import {
  canDismantleInventoryItem,
  DISMANTLE_DAILY_MAX,
  isArtigianoFromSkiruSheet,
  materialCatalogKey,
  resolveJunkDismantleYields,
  yieldFromBrokenEquipment,
  type EconomyMaterialCost,
} from '@domain/economy/dismantle'
import type { ItemCategory } from '@domain/economy/types'
import { getSocialBlueprint } from '@domain/shakai-kaikyu/blueprint-catalog'
import { db } from '../../plugins/db'
import { characters, dismantleDailyUsage, inventory } from '../../db/schema'
import { addItemByCatalogKey, getCharacterInventory } from '../inventory/inventory.service'

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
    columns: { skiruSheet: true },
  })
  if (!char || !isArtigianoFromSkiruSheet(char.skiruSheet ?? {})) {
    throw new Error('Solo gli Artigiani (Shokunin in scheda Skiru) possono smantellare.')
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

function resolveYieldsForItem(
  category: ItemCategory,
  junkTemplateId: string | null | undefined,
  blueprintId: string | null | undefined,
): EconomyMaterialCost[] {
  if (category === 'junk' && junkTemplateId) {
    return [...resolveJunkDismantleYields(junkTemplateId)]
  }
  if (category === 'equipaggiamento' || category === 'costrutto_materiale') {
    const bpId = blueprintId
    if (!bpId) return []
    const blueprint = getSocialBlueprint(bpId)
    if (!blueprint?.materials?.length) return []
    return yieldFromBrokenEquipment(blueprint.materials)
  }
  return []
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
    })
    if (!check.ok) {
      throw new Error(`${inv.item.name}: ${check.reason ?? 'non smantellabile.'}`)
    }

    const yields = resolveYieldsForItem(category, inv.item.junkTemplateId, blueprintId)
    if (yields.length === 0) {
      throw new Error(`${inv.item.name}: nessun materiale recuperabile.`)
    }

    await consumeInventoryUnit(inventoryId, characterId)
    const materials = await grantMaterials(characterId, yields)
    results.push({
      inventoryId,
      itemName: inv.item.name,
      materials,
    })
  }

  const newUsed = await incrementDismantleCount(characterId, dayKey, uniqueIds.length)

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
    const check = canDismantleInventoryItem({
      category: eco.category,
      junkTemplateId: eco.junkTemplateId,
      blueprintId: eco.blueprintId,
      integrityCurrent: eco.integrityCurrent,
      integrityMax: eco.integrityMax,
      isEquipped: row.isEquipped,
    })
    return { ...row, canDismantle: check.ok, dismantleBlockReason: check.ok ? undefined : check.reason }
  })
  const status = await getDismantleStatus(characterId)
  return { ...inv, items: itemsWithFlag, dismantle: status }
}
