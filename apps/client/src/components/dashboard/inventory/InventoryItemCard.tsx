'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '@/lib/icons'
import type { InventoryItemRow } from './types'
import { categoryAccentClass, formatItemCategory } from './labels'
import { isAmmoConsumable } from '@domain/economy/items'

type Props = {
  inv: InventoryItemRow
  showEquipButton?: boolean
  showLocationButtons?: boolean
  readOnly?: boolean
  onSelect?: (inv: InventoryItemRow) => void
  onToggleEquip?: (inventoryId: string) => void
  onRemove?: (inventoryId: string) => void
  onMoveToHousing?: (inventoryId: string) => void
  onMoveToCarry?: (inventoryId: string) => void
}

function isLegacyEquipType(type: string): boolean {
  return type === 'WEAPON' || type === 'ARMOR' || type === 'ACCESSORY'
}

function canShowEquipButton(inv: InventoryItemRow): boolean {
  if (inv.item.type === 'BAG' || isLegacyEquipType(inv.item.type)) return true
  if (isAmmoConsumable(inv.economy?.category, inv.item.ammoKind)) return true
  return inv.economy?.category === 'equipaggiamento'
}

export function InventoryItemCard({
  inv,
  showEquipButton = true,
  showLocationButtons = false,
  readOnly = false,
  onSelect,
  onToggleEquip,
  onRemove,
  onMoveToHousing,
  onMoveToCarry,
}: Props) {
  const economy = inv.economy
  const category = economy?.category
  const showLegacyType = !category || category === 'equipaggiamento'

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        inv.isEquipped
          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 shadow-[0_0_8px_rgba(212,175,55,0.2)]'
          : inv.location === 'MARKET'
            ? 'border-[var(--accent-violet)]/50 bg-[var(--accent-violet)]/5'
            : economy?.isBroken
              ? 'border-red-500/40 bg-red-950/20'
              : 'border-[var(--border-color)] bg-black/30 hover:border-[var(--border-color)]/80 hover:bg-black/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={() => onSelect?.(inv)}
          title="Apri scheda oggetto"
        >
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <p className="text-xs font-display text-white truncate">{inv.item.name}</p>
            {inv.isEquipped && (
              <span className="text-[8px] uppercase tracking-wider text-[var(--accent-gold)] bg-[var(--accent-gold)]/20 px-1.5 py-0.5 rounded">
                {isAmmoConsumable(economy?.category, inv.item.ammoKind) ? 'ADD' : 'EQP'}
              </span>
            )}
            {inv.item.ammoKind && economy?.category === 'consumabile' && (
              <span className="text-[8px] uppercase tracking-wider text-[var(--accent-violet-light)] bg-[var(--accent-violet)]/15 px-1.5 py-0.5 rounded">
                {inv.item.ammoKind}
              </span>
            )}
            {inv.location === 'MARKET' && (
              <span className="text-[8px] uppercase tracking-wider text-[var(--accent-violet-light)] bg-[var(--accent-violet)]/20 px-1.5 py-0.5 rounded">
                Vendita
              </span>
            )}
            {economy?.isBroken && (
              <span className="text-[8px] uppercase tracking-wider text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                Rotto
              </span>
            )}
          </div>
          {inv.item.description && (
            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{inv.item.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {category ? (
              <span
                className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${categoryAccentClass(category)}`}
              >
                {formatItemCategory(category)}
              </span>
            ) : showLegacyType ? (
              <span className="text-[9px] uppercase tracking-wider text-gray-600 bg-black/50 px-2 py-0.5 rounded">
                {inv.item.type}
              </span>
            ) : null}
            {inv.quantity > 1 && (
              <span className="text-[9px] text-[var(--accent-violet)] font-display">×{inv.quantity}</span>
            )}
            {economy?.inventorySlotCost != null && economy.inventorySlotCost > 1 && (
              <span className="text-[9px] text-gray-500">{economy.inventorySlotCost} slot</span>
            )}
            {economy?.craftedByName && (
              <span className="text-[9px] text-[var(--accent-gold)] truncate max-w-[120px]">
                {economy.craftedByName}
              </span>
            )}
            {economy?.integrityMax != null && economy.integrityMax > 0 && (
              <span className="text-[9px] text-[var(--accent-violet-light)]">
                INT {economy.integrityCurrent ?? economy.integrityMax}/{economy.integrityMax}
              </span>
            )}
            {inv.item.slotsBonus > 0 && (
              <span className="text-[9px] text-[var(--accent-gold)]">+{inv.item.slotsBonus} slot</span>
            )}
          </div>
        </button>

        {!readOnly && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {showEquipButton && canShowEquipButton(inv) && onToggleEquip && (
                <button
                  type="button"
                  onClick={() => onToggleEquip(inv.id)}
                  className="px-2.5 py-1 rounded border border-[var(--accent-gold)] text-[10px] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 transition-colors whitespace-nowrap"
                >
                  {inv.isEquipped ? 'Rimuovi' : 'Equip.'}
                </button>
              )}
            {showLocationButtons && (
              <>
                {inv.location === 'CARRY' && onMoveToHousing && (
                  <button
                    type="button"
                    onClick={() => onMoveToHousing(inv.id)}
                    className="px-2 py-1 rounded border border-[var(--accent-violet)] text-[10px] text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/10 transition-colors whitespace-nowrap"
                  >
                    Casa
                  </button>
                )}
                {inv.location === 'HOUSING' && onMoveToCarry && (
                  <button
                    type="button"
                    onClick={() => onMoveToCarry(inv.id)}
                    className="px-2 py-1 rounded border border-[var(--accent-gold)] text-[10px] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 transition-colors whitespace-nowrap"
                  >
                    Zaino
                  </button>
                )}
              </>
            )}
            {onSelect && (
              <button
                type="button"
                onClick={() => onSelect(inv)}
                className="px-2 py-1 rounded border border-[var(--border-color)] text-[10px] text-gray-400 hover:text-white transition-colors"
                title="Scheda oggetto"
              >
                <FontAwesomeIcon icon={icons.info} className="w-3 h-3" />
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(inv.id)}
                className="px-2 py-1 rounded border border-red-500/60 text-[10px] text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                title="Rimuovi"
              >
                <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
