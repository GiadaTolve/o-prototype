'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '@/lib/icons'
import { api } from '@/lib/api'
import { useInventoryUpdatedListener } from '@/hooks/useInventoryUpdatedListener'
import { InventoryItemCard } from './InventoryItemCard'
import { InventoryItemDetailModal } from './InventoryItemDetailModal'
import type { CharacterInventoryResponse, InventoryItemRow } from './types'
import { isAmmoConsumable } from '@domain/economy/items'

function isLegacyEquipType(type: string): boolean {
  return type === 'WEAPON' || type === 'ARMOR' || type === 'ACCESSORY'
}

function isEquippableRow(inv: InventoryItemRow): boolean {
  if (inv.item.type === 'BAG' || isLegacyEquipType(inv.item.type)) return true
  if (isAmmoConsumable(inv.economy?.category, inv.item.ammoKind)) return true
  return inv.economy?.category === 'equipaggiamento'
}

function isGearEquippedRow(inv: InventoryItemRow): boolean {
  return (
    inv.isEquipped &&
    inv.item.type !== 'BAG' &&
    !isAmmoConsumable(inv.economy?.category, inv.item.ammoKind)
  )
}

function normalizeInventory(data: CharacterInventoryResponse): CharacterInventoryResponse {
  const items = data.items ?? []
  return {
    ...data,
    items,
    carryItems: data.carryItems ?? items.filter((i) => i.location === 'CARRY'),
    housingItems: data.housingItems ?? items.filter((i) => i.location === 'HOUSING'),
    marketItems: data.marketItems ?? items.filter((i) => i.location === 'MARKET'),
  }
}

// ─── Equipment Slot UI ───────────────────────────────────────────────────────

function EquipSlot({
  index,
  item,
  onUnequip,
  onSelect,
  onDrop,
  isOver,
  onDragOver,
  onDragLeave,
}: {
  index: number
  item: InventoryItemRow | null
  onUnequip: (id: string) => void
  onSelect: (inv: InventoryItemRow) => void
  onDrop: (e: React.DragEvent, slotIndex: number) => void
  isOver: boolean
  onDragOver: (e: React.DragEvent, slotIndex: number) => void
  onDragLeave: () => void
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, index) }}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      className={`relative rounded-lg border transition-all min-h-[64px] flex items-center p-2 gap-2 ${
        item
          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
          : isOver
            ? 'border-[var(--accent-violet)] bg-[var(--accent-violet)]/10 border-dashed'
            : 'border-[var(--border-color)]/50 bg-black/20 border-dashed'
      }`}
    >
      <span className="text-[9px] text-gray-600 font-display shrink-0 w-4 text-center">{index + 1}</span>
      {item ? (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-display text-white truncate">{item.item.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {item.item.damage != null && (
                <span className="text-[8px] text-red-400">DMG {item.item.damage}</span>
              )}
              {item.item.resistance != null && (
                <span className="text-[8px] text-blue-400">ARM {item.item.resistance}</span>
              )}
              {item.item.bonus != null && (
                <span className="text-[8px] text-[var(--accent-gold)]">+{item.item.bonus} bonus</span>
              )}
              {item.economy?.integrityMax != null && item.economy.integrityMax > 0 && (
                <span className={`text-[8px] ${item.economy.isBroken ? 'text-red-400' : 'text-gray-500'}`}>
                  INT {item.economy.integrityCurrent ?? item.economy.integrityMax}/{item.economy.integrityMax}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="p-1 rounded border border-[var(--border-color)] text-gray-400 hover:text-white transition-colors"
              title="Dettaglio"
            >
              <FontAwesomeIcon icon={icons.info} className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => onUnequip(item.id)}
              className="p-1 rounded border border-[var(--border-color)] text-gray-400 hover:text-red-400 transition-colors"
              title="Rimuovi"
            >
              <FontAwesomeIcon icon={icons.close} className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[9px] text-gray-600 italic flex-1">slot vuoto — trascina un oggetto</p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InventorySection({ characterId }: { characterId?: string }) {
  const [inventory, setInventory] = useState<CharacterInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailItem, setDetailItem] = useState<InventoryItemRow | null>(null)
  const [isMyCharacter, setIsMyCharacter] = useState(false)
  const [canStaffInventory, setCanStaffInventory] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const dragOverSlotRef = useRef<number | null>(null)

  const reloadInventory = useCallback(async () => {
    if (!characterId) return null
    const myChar = (await api.get('/characters/me')) as { id?: string; canAccessGestione?: boolean }
    const mine = myChar?.id === characterId
    setIsMyCharacter(mine)
    setCanStaffInventory(Boolean(myChar?.canAccessGestione))
    const data = mine
      ? ((await api.get('/inventory/me')) as CharacterInventoryResponse)
      : ((await api.get(`/inventory/character/${characterId}`)) as CharacterInventoryResponse)
    const normalized = normalizeInventory(data)
    setInventory(normalized)
    return normalized
  }, [characterId])

  useEffect(() => {
    if (!characterId) { setLoading(false); return }
    reloadInventory()
      .catch((e) => { console.error('Errore caricamento inventario:', e); setInventory(null) })
      .finally(() => setLoading(false))
  }, [characterId, reloadInventory])

  useInventoryUpdatedListener(characterId, reloadInventory)

  const toggleEquip = async (inventoryId: string) => {
    try {
      await api.post(`/inventory/me/${inventoryId}/toggle-equip`, {})
      await reloadInventory()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Errore')
    }
  }

  const removeItem = async (inventoryId: string) => {
    if (!confirm('Rimuovere questo oggetto dall\'inventario?')) return
    try {
      await api.delete(`/inventory/me/${inventoryId}`)
      await reloadInventory()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Errore')
    }
  }

  const moveToHousing = async (inventoryId: string) => {
    try {
      await api.post(`/inventory/me/${inventoryId}/move-to-housing`, {})
      await reloadInventory()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Errore durante lo spostamento in casa')
    }
  }

  const moveToCarry = async (inventoryId: string) => {
    try {
      await api.post(`/inventory/me/${inventoryId}/move-to-carry`, {})
      await reloadInventory()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Errore durante lo spostamento nello zaino')
    }
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, inventoryId: string) => {
    setDraggedId(inventoryId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverSlot(null)
    dragOverSlotRef.current = null
  }

  const handleSlotDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    if (dragOverSlotRef.current !== slotIndex) {
      dragOverSlotRef.current = slotIndex
      setDragOverSlot(slotIndex)
    }
  }

  const handleSlotDragLeave = () => {
    dragOverSlotRef.current = null
    setDragOverSlot(null)
  }

  const handleSlotDrop = async (_e: React.DragEvent, _slotIndex: number) => {
    setDragOverSlot(null)
    dragOverSlotRef.current = null
    if (!draggedId) return
    const item = inventory?.carryItems?.find((i) => i.id === draggedId)
    if (!item || item.isEquipped) return
    await toggleEquip(draggedId)
    setDraggedId(null)
  }

  if (loading) {
    return <div className="text-sm text-gray-500 p-4 animate__animated animate__fadeIn motion-reduce:animate-none">Caricamento inventario…</div>
  }
  if (!inventory) {
    return <div className="text-sm text-gray-500 p-4">Errore nel caricamento inventario.</div>
  }

  const carryItems = inventory.carryItems ?? []
  const housingItems = inventory.housingItems ?? []
  const marketItems = inventory.marketItems ?? []

  const equipSlots = inventory.slots.equipSlots ?? 3
  const equipSlotsUsed = inventory.slots.equipSlotsUsed ?? 0

  // Equipped non-bag items fill slots 0..N-1
  const equippedGear = carryItems.filter(isGearEquippedRow)
  const equippedAmmo = carryItems.filter(
    (i) => i.isEquipped && isAmmoConsumable(i.economy?.category, i.item.ammoKind),
  )
  const equippedBag = carryItems.find((i) => i.isEquipped && i.item.type === 'BAG')
  const carryStorageItems = carryItems.filter((i) => !i.isEquipped)

  // Build slot array
  const slotItems: (InventoryItemRow | null)[] = Array.from({ length: equipSlots }, (_, idx) =>
    equippedGear[idx] ?? null
  )

  const cardActions = isMyCharacter
    ? {
        onSelect: setDetailItem,
        onToggleEquip: toggleEquip,
        ...(canStaffInventory ? { onRemove: removeItem } : {}),
        onMoveToHousing: moveToHousing,
        onMoveToCarry: moveToCarry,
      }
    : { onSelect: setDetailItem, readOnly: true }

  return (
    <>
      <div className="space-y-6 animate__animated animate__fadeIn motion-reduce:animate-none">

        {/* Slot info header */}
        <div className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
            <SlotStat label="Slot zaino" value={`${inventory.slots.occupied}/${inventory.slots.totalSlots}`} accent="white" />
            <SlotStat label="Disponibili" value={inventory.slots.available} accent="gold" />
            <SlotStat label="Slot equip." value={`${equipSlotsUsed}/${equipSlots}`} accent="violet" />
            {inventory.slots.bagSlots > 0 && (
              <SlotStat label="Bonus zaino" value={`+${inventory.slots.bagSlots}`} accent="gold" />
            )}
            {inventory.slots.marketListed != null && inventory.slots.marketListed > 0 && (
              <SlotStat label="In vendita" value={inventory.slots.marketListed} accent="violet" />
            )}
            {inventory.slots.housingOccupied !== undefined && (
              <>
                <SlotStat label="Casa occ." value={inventory.slots.housingOccupied ?? 0} accent="white" />
                <SlotStat label="Casa lib." value={inventory.slots.housingAvailable ?? 0} accent="violet" />
              </>
            )}
          </div>
        </div>

        {/* Equipment slots (drag-and-drop) */}
        <section>
          <SectionHeader icon={icons.user} title="Equipaggiamento" count={`${equipSlotsUsed}/${equipSlots}`} />
          <div className="space-y-2 mt-2">
            {slotItems.map((item, idx) => (
              <EquipSlot
                key={idx}
                index={idx}
                item={item}
                onUnequip={isMyCharacter ? toggleEquip : () => {}}
                onSelect={setDetailItem}
                onDrop={isMyCharacter ? handleSlotDrop : () => {}}
                isOver={dragOverSlot === idx}
                onDragOver={isMyCharacter ? handleSlotDragOver : () => {}}
                onDragLeave={isMyCharacter ? handleSlotDragLeave : () => {}}
              />
            ))}
          </div>
          {equippedBag && (
            <div className="mt-2 text-[10px] text-[var(--accent-gold)] px-1 font-display uppercase tracking-wider flex items-center gap-2">
              <FontAwesomeIcon icon={icons.shop} className="w-3 h-3" />
              Zaino: {equippedBag.item.name} (+{inventory.slots.bagSlots} slot)
            </div>
          )}
        </section>

        {equippedAmmo.length > 0 && (
          <section>
            <SectionHeader icon={icons.waza} title="Munizioni addosso" count={equippedAmmo.length} />
            <ul className="space-y-2 mt-2">
              {equippedAmmo.map((inv) => (
                <li key={inv.id}>
                  <InventoryItemCard
                    inv={inv}
                    showEquipButton={isMyCharacter}
                    showLocationButtons={false}
                    {...cardActions}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Zaino */}
        <section>
          <SectionHeader
            icon={icons.shop}
            title={`Zaino${equippedBag ? ` · ${equippedBag.item.name}` : ''}`}
            count={carryStorageItems.length}
          />
          {carryStorageItems.length === 0 ? (
            <p className="text-[11px] text-gray-600 italic px-1 mt-2">Nessun oggetto nello zaino.</p>
          ) : (
            <ul className="space-y-2 mt-2">
              {carryStorageItems.map((inv) => (
                <li
                  key={inv.id}
                  draggable={isMyCharacter && isEquippableRow(inv)}
                  onDragStart={isMyCharacter ? (e) => handleDragStart(e, inv.id) : undefined}
                  onDragEnd={isMyCharacter ? handleDragEnd : undefined}
                  className={isMyCharacter && isEquippableRow(inv) ? 'cursor-grab active:cursor-grabbing' : ''}
                >
                  <InventoryItemCard
                    inv={inv}
                    showEquipButton={isMyCharacter && isEquippableRow(inv)}
                    showLocationButtons={isMyCharacter}
                    {...cardActions}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* In vendita */}
        {marketItems.length > 0 && (
          <section>
            <SectionHeader icon={icons.banca} title="In vendita (Piazza)" count={marketItems.length} />
            <ul className="space-y-2 mt-2">
              {marketItems.map((inv) => (
                <li key={inv.id}>
                  <InventoryItemCard inv={inv} readOnly onSelect={setDetailItem} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Inventario abitazione */}
        {housingItems.length > 0 && (
          <section>
            <SectionHeader icon={icons.ordine} title="Inventario abitazione" count={housingItems.length} />
            <ul className="space-y-2 mt-2">
              {housingItems.map((inv) => (
                <li key={inv.id}>
                  <InventoryItemCard
                    inv={inv}
                    showEquipButton={false}
                    showLocationButtons={isMyCharacter}
                    {...cardActions}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <InventoryItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </>
  )
}

function SlotStat({ label, value, accent }: { label: string; value: string | number; accent: 'gold' | 'violet' | 'white' }) {
  return (
    <div className="text-center">
      <p className={`font-display font-bold text-sm ${
        accent === 'gold' ? 'text-[var(--accent-gold)]'
        : accent === 'violet' ? 'text-[var(--accent-violet-light)]'
        : 'text-white'
      }`}>
        {value}
      </p>
      <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

function SectionHeader({ icon, title, count }: { icon: unknown; title: string; count: string | number }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <FontAwesomeIcon icon={icon as Parameters<typeof FontAwesomeIcon>[0]['icon']} className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
      <span className="text-xs font-display text-[var(--accent-gold)] uppercase tracking-wider">{title}</span>
      <span className="text-[9px] text-gray-600 ml-auto">{count}</span>
    </div>
  )
}
