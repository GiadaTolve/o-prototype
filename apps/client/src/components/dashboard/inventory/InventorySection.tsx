'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '@/lib/icons'
import { api } from '@/lib/api'
import { InventoryItemCard } from './InventoryItemCard'
import { InventoryItemDetailModal } from './InventoryItemDetailModal'
import type { CharacterInventoryResponse, InventoryItemRow } from './types'

function isLegacyEquipType(type: string): boolean {
  return type === 'WEAPON' || type === 'ARMOR' || type === 'ACCESSORY'
}

function isEquippableRow(inv: InventoryItemRow): boolean {
  if (inv.item.type === 'BAG' || isLegacyEquipType(inv.item.type)) return true
  return inv.economy?.category === 'equipaggiamento'
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

export function InventorySection({ characterId }: { characterId?: string }) {
  const [inventory, setInventory] = useState<CharacterInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailItem, setDetailItem] = useState<InventoryItemRow | null>(null)
  const [isMyCharacter, setIsMyCharacter] = useState(false)
  const [canStaffInventory, setCanStaffInventory] = useState(false)

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
    if (!characterId) {
      setLoading(false)
      return
    }
    reloadInventory()
      .catch((e) => {
        console.error('Errore caricamento inventario:', e)
        setInventory(null)
      })
      .finally(() => setLoading(false))
  }, [characterId, reloadInventory])

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

  if (loading) {
    return <div className="text-sm text-gray-500 p-4 animate__animated animate__fadeIn motion-reduce:animate-none">Caricamento inventario…</div>
  }

  if (!inventory) {
    return <div className="text-sm text-gray-500 p-4">Errore nel caricamento inventario.</div>
  }

  const carryItems = inventory.carryItems ?? []
  const housingItems = inventory.housingItems ?? []
  const marketItems = inventory.marketItems ?? []

  const equippedGear = carryItems.filter((inv) => inv.isEquipped && isEquippableRow(inv))
  const equippedBag = carryItems.find((inv) => inv.isEquipped && inv.item.type === 'BAG')
  const carryStorageItems = carryItems.filter((inv) => !inv.isEquipped)

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
        <div className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] p-4">
          <div
            className={`grid grid-cols-2 ${
              inventory.slots.housingOccupied !== undefined ? 'md:grid-cols-3 lg:grid-cols-7' : 'md:grid-cols-4'
            } gap-3 text-xs`}
          >
            <SlotStat label="Slot base" value={inventory.slots.baseSlots} accent="gold" />
            <SlotStat label="Slot zaino" value={inventory.slots.bagSlots} accent="violet" />
            <SlotStat
              label="Occupati"
              value={`${inventory.slots.occupied}/${inventory.slots.totalSlots}`}
              accent="white"
            />
            <SlotStat label="Disponibili" value={inventory.slots.available} accent="gold" />
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

        <InventoryPanel
          title="Equipaggiamento attivo"
          icon={icons.user}
          count={equippedGear.length}
          empty="Nessun oggetto equipaggiato."
          items={equippedGear}
          renderItem={(inv) => (
            <InventoryItemCard key={inv.id} inv={inv} showEquipButton showLocationButtons={false} {...cardActions} />
          )}
        />

        {equippedBag && (
          <div className="text-[10px] text-[var(--accent-gold)] px-1 font-display uppercase tracking-wider">
            Zaino attivo: {equippedBag.item.name} (+{inventory.slots.bagSlots} slot)
          </div>
        )}

        <InventoryPanel
          title={`Zaino${equippedBag ? ` · ${equippedBag.item.name}` : ''}`}
          icon={icons.shop}
          count={carryStorageItems.length}
          empty="Nessun oggetto nello zaino."
          items={carryStorageItems}
          renderItem={(inv) => (
            <InventoryItemCard key={inv.id} inv={inv} showEquipButton={false} showLocationButtons {...cardActions} />
          )}
        />

        {marketItems.length > 0 && (
          <InventoryPanel
            title="In vendita (Piazza)"
            icon={icons.banca}
            count={marketItems.length}
            empty=""
            items={marketItems}
            renderItem={(inv) => (
              <InventoryItemCard key={inv.id} inv={inv} readOnly onSelect={setDetailItem} />
            )}
          />
        )}

        <InventoryPanel
          title="Inventario abitazione"
          icon={icons.ordine}
          count={housingItems.length}
          empty="Nessun oggetto depositato in casa."
          items={housingItems}
          renderItem={(inv) => (
            <InventoryItemCard key={inv.id} inv={inv} showEquipButton={false} showLocationButtons {...cardActions} />
          )}
        />
      </div>

      <InventoryItemDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </>
  )
}

function SlotStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent: 'gold' | 'violet' | 'white'
}) {
  const color =
    accent === 'gold'
      ? 'text-[var(--accent-gold)]'
      : accent === 'violet'
        ? 'text-[var(--accent-violet)]'
        : 'text-white'
  return (
    <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">{label}</p>
      <p className={`text-sm font-display ${color}`}>{value}</p>
    </div>
  )
}

function InventoryPanel<T extends InventoryItemRow>({
  title,
  icon,
  count,
  empty,
  items,
  renderItem,
}: {
  title: string
  icon: (typeof icons)[keyof typeof icons]
  count: number
  empty: string
  items: T[]
  renderItem: (item: T) => ReactNode
}) {
  return (
    <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
      <header className="px-4 py-2.5 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
          <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">{title}</p>
        </div>
        <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
          {count} oggetti
        </p>
      </header>
      <div className="p-4">
        {count === 0 ? (
          empty ? (
            <div className="text-sm text-gray-500 italic text-center py-6">{empty}</div>
          ) : null
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{items.map(renderItem)}</div>
        )}
      </div>
    </section>
  )
}
