import { and, eq, gt } from 'drizzle-orm'
import {
  encodeItemUseCard,
  INTEGRITY_PER_CHAT_USE,
  parseItemUseRequest,
  validateItemUseInChat,
  type ItemUseCardData,
} from '@domain/economy/item-use-chat'
import { isEquippableItem, usesIntegrity } from '@domain/economy/items'
import type { ItemCategory } from '@domain/economy/types'
import { db } from '../../plugins/db'
import { inventory } from '../../db/schema'

async function notifyInventoryUpdated(characterId: string): Promise<void> {
  const { broadcastInventoryUpdated } = await import('../realtime/ws.routes')
  broadcastInventoryUpdated(characterId)
}

type IntegrityDeductResult = {
  integrityBefore: number | null
  integrityAfter: number | null
  ammoLabel: string | null
}

async function countAmmoInCarry(characterId: string, ammoKind: string): Promise<number> {
  const rows = await db.query.inventory.findMany({
    where: and(eq(inventory.characterId, characterId), eq(inventory.location, 'CARRY'), gt(inventory.quantity, 0)),
    with: { item: { columns: { ammoKind: true, category: true } } },
  })
  return rows
    .filter((r) => r.item.category === 'consumabile' && r.item.ammoKind === ammoKind)
    .reduce((sum, r) => sum + (r.quantity ?? 0), 0)
}

async function consumeAmmo(characterId: string, ammoKind: string): Promise<{ name: string } | null> {
  const rows = await db.query.inventory.findMany({
    where: and(eq(inventory.characterId, characterId), eq(inventory.location, 'CARRY'), gt(inventory.quantity, 0)),
    with: { item: true },
    orderBy: (inv, { desc }) => [desc(inv.isEquipped), desc(inv.quantity)],
  })
  const ammoRow = rows.find(
    (r) => r.item.category === 'consumabile' && r.item.ammoKind === ammoKind && (r.quantity ?? 0) > 0,
  )
  if (!ammoRow) return null

  const nextQty = (ammoRow.quantity ?? 1) - 1
  if (nextQty <= 0) {
    await db.delete(inventory).where(eq(inventory.id, ammoRow.id))
  } else {
    await db.update(inventory).set({ quantity: nextQty }).where(eq(inventory.id, ammoRow.id))
  }
  return { name: ammoRow.item.name }
}

async function resolveInventoryRowById(characterId: string, inventoryId: string) {
  const inv = await db.query.inventory.findFirst({
    where: and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)),
    with: { item: true },
  })
  if (!inv) throw new Error('Oggetto non trovato nello zaino.')
  return inv
}

async function deductIntegrityAndAmmo(
  characterId: string,
  inv: Awaited<ReturnType<typeof resolveInventoryRowById>>,
  category: ItemCategory,
): Promise<IntegrityDeductResult> {
  const item = inv.item
  let integrityBefore: number | null = null
  let integrityAfter: number | null = null
  let ammoLabel: string | null = null

  const ammoKindRequired =
    item.ammoKind && (category === 'equipaggiamento' || item.type === 'WEAPON') ? item.ammoKind : null

  if (usesIntegrity(category)) {
    integrityBefore = inv.integrityCurrent ?? item.integrityMax ?? 0
    integrityAfter = Math.max(0, integrityBefore - INTEGRITY_PER_CHAT_USE)
    await db
      .update(inventory)
      .set({ integrityCurrent: integrityAfter })
      .where(eq(inventory.id, inv.id))

    if (ammoKindRequired) {
      const consumed = await consumeAmmo(characterId, ammoKindRequired)
      if (!consumed) throw new Error(`Servono munizioni (${ammoKindRequired}) nello zaino.`)
      ammoLabel = `${consumed.name} ×1`
    }
  }

  return { integrityBefore, integrityAfter, ammoLabel }
}

export async function executeItemUseByInventoryId(
  characterId: string,
  inventoryId: string,
): Promise<ItemUseCardData> {
  const inv = await resolveInventoryRowById(characterId, inventoryId)
  const item = inv.item
  const category = (item.category ?? 'junk') as ItemCategory

  const ammoKindRequired =
    item.ammoKind && (category === 'equipaggiamento' || item.type === 'WEAPON') ? item.ammoKind : null
  const ammoAvailable = ammoKindRequired ? await countAmmoInCarry(characterId, ammoKindRequired) : undefined

  const check = validateItemUseInChat({
    category,
    type: item.type,
    isEquipped: inv.isEquipped ?? false,
    location: inv.location,
    integrityCurrent: inv.integrityCurrent,
    integrityMax: item.integrityMax,
    quantity: inv.quantity ?? 1,
    ammoKindRequired,
    ammoAvailable,
  })
  if (!check.ok) throw new Error(check.reason)

  let integrityBefore: number | null = null
  let integrityAfter: number | null = null
  let consumableRemaining: number | null = null
  let ammoLabel: string | null = null

  if (category === 'consumabile') {
    const qty = inv.quantity ?? 1
    consumableRemaining = qty - 1
    if (consumableRemaining <= 0) {
      await db.delete(inventory).where(eq(inventory.id, inv.id))
      consumableRemaining = 0
    } else {
      await db.update(inventory).set({ quantity: consumableRemaining }).where(eq(inventory.id, inv.id))
    }
  } else if (usesIntegrity(category)) {
    const deducted = await deductIntegrityAndAmmo(characterId, inv, category)
    integrityBefore = deducted.integrityBefore
    integrityAfter = deducted.integrityAfter
    ammoLabel = deducted.ammoLabel
  } else if (isEquippableItem(item.type, category)) {
    throw new Error('Oggetto non configurato per l\'uso in chat.')
  }

  await notifyInventoryUpdated(characterId)

  return {
    itemName: item.name,
    category,
    integrityBefore,
    integrityAfter,
    consumableRemaining,
    ammoLabel,
    isBroken: integrityAfter != null && integrityAfter <= 0,
    effectText: item.effectText ?? item.description ?? null,
  }
}

/** Colpisci (arma impugnata): −1 integrità + munizione da inventario se applicabile. */
export async function applyWeaponStrikeInventory(
  characterId: string,
  inventoryId: string,
): Promise<void> {
  const inv = await resolveInventoryRowById(characterId, inventoryId)
  const item = inv.item
  const category = (item.category ?? 'junk') as ItemCategory

  if (item.type !== 'WEAPON' && category !== 'equipaggiamento') {
    throw new Error('Colpisci disponibile solo per armi equipaggiate.')
  }
  if (!inv.isEquipped) {
    throw new Error('Impugna l\'arma prima di colpire.')
  }
  if (inv.location !== 'CARRY') {
    throw new Error('L\'arma deve essere nello zaino.')
  }

  const ammoKindRequired =
    item.ammoKind && (category === 'equipaggiamento' || item.type === 'WEAPON') ? item.ammoKind : null
  const ammoAvailable = ammoKindRequired ? await countAmmoInCarry(characterId, ammoKindRequired) : undefined

  const check = validateItemUseInChat({
    category,
    type: item.type,
    isEquipped: true,
    location: inv.location,
    integrityCurrent: inv.integrityCurrent,
    integrityMax: item.integrityMax,
    quantity: inv.quantity ?? 1,
    ammoKindRequired,
    ammoAvailable,
  })
  if (!check.ok) throw new Error(check.reason)

  if (usesIntegrity(category)) {
    await deductIntegrityAndAmmo(characterId, inv, category)
  }

  await notifyInventoryUpdated(characterId)
}

/** Risolve richiesta pannello `[OGGETTO]{inventoryId}` → contenuto card persistito. */
export async function resolveItemUsePanelMessage(characterId: string, text: string): Promise<string> {
  const req = parseItemUseRequest(text.trim())
  if (!req) throw new Error('Richiesta oggetto non valida.')
  const card = await executeItemUseByInventoryId(characterId, req.inventoryId)
  return encodeItemUseCard(card)
}
