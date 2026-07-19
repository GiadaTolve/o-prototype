'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '@/lib/icons'
import type { InventoryItemRow } from './types'
import { categoryAccentClass, formatItemCategory, formatItemOrigin } from './labels'

type Props = {
  item: InventoryItemRow | null
  onClose: () => void
}

function IntegrityBar({
  current,
  max,
  isBroken,
}: {
  current: number | null
  max: number | null
  isBroken: boolean
}) {
  if (max == null || max <= 0) return null
  const value = current ?? max
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-500 font-display">
        <span>Integrità</span>
        <span className={isBroken ? 'text-red-400' : 'text-[var(--accent-violet-light)]'}>
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-black/60 border border-[var(--border-color)] overflow-hidden">
        <div
          className={`h-full transition-all duration-300 motion-reduce:transition-none ${
            isBroken ? 'bg-red-500/80' : 'bg-[var(--accent-violet)]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function InventoryItemDetailModal({ item, onClose }: Props) {
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, onClose])

  if (!item) return null

  const economy = item.economy
  const category = economy?.category ?? 'junk'
  const originLabel = formatItemOrigin(economy?.origin)

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 animate__animated animate__fadeIn motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-item-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)] shadow-[var(--shadow-gold)] animate__animated animate__slideInUp motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[var(--border-color)]/70 bg-black/50">
          <div className="min-w-0">
            <p
              id="inventory-item-detail-title"
              className="font-display text-[var(--accent-gold)] text-sm truncate"
            >
              {item.item.name}
              {item.quantity > 1 ? ` ×${item.quantity}` : ''}
            </p>
            {economy && (
              <span
                className={`inline-block mt-1 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${categoryAccentClass(category)}`}
              >
                {formatItemCategory(category)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded border border-[var(--border-color)] text-gray-400 hover:text-white hover:border-[var(--accent-gold)] transition-colors"
            aria-label="Chiudi"
          >
            <FontAwesomeIcon icon={icons.close} className="w-3.5 h-3.5" />
          </button>
        </header>

        <div className="px-4 py-4 space-y-4 text-sm">
          {item.item.description && (
            <p className="text-gray-400 text-xs leading-relaxed font-accent">{item.item.description}</p>
          )}

          {economy?.effectText && (
            <div className="rounded border border-[var(--accent-violet)]/30 bg-[var(--accent-violet)]/5 px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-[var(--accent-violet-light)] font-display mb-1">
                Effetto
              </p>
              <p className="text-xs text-white">{economy.effectText}</p>
            </div>
          )}

          {economy && (
            <IntegrityBar
              current={economy.integrityCurrent}
              max={economy.integrityMax}
              isBroken={economy.isBroken}
            />
          )}

          {/* Statistiche combattimento / mod equip */}
          {(item.item.damage != null ||
            item.item.resistance != null ||
            item.item.mitigationFlat != null ||
            (Array.isArray(item.item.skiruBonuses) && item.item.skiruBonuses.length > 0) ||
            (Array.isArray(item.item.skiruMaluses) && item.item.skiruMaluses.length > 0)) && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {item.item.damage != null && (
                  <div className="rounded border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5 px-2 py-1.5 text-center">
                    <p className="text-[8px] uppercase tracking-wider text-[var(--accent-gold)] font-display mb-0.5">
                      DMG
                    </p>
                    <p className="text-sm font-bold text-[var(--accent-gold)]">{item.item.damage}</p>
                  </div>
                )}
                {item.item.mitigationFlat != null && (
                  <div className="rounded border border-[var(--accent-violet)]/30 bg-[var(--accent-violet)]/5 px-2 py-1.5 text-center">
                    <p className="text-[8px] uppercase tracking-wider text-[var(--accent-violet-light)] font-display mb-0.5">
                      Mitigazione
                    </p>
                    <p className="text-sm font-bold text-[var(--accent-violet-light)]">
                      {item.item.mitigationFlat}%
                    </p>
                  </div>
                )}
                {item.item.resistance != null && (
                  <div className="rounded border border-[var(--border-color)] bg-black/30 px-2 py-1.5 text-center">
                    <p className="text-[8px] uppercase tracking-wider text-gray-400 font-display mb-0.5">
                      Scudo
                    </p>
                    <p className="text-sm font-bold text-white">{item.item.resistance}</p>
                  </div>
                )}
              </div>
              {Array.isArray(item.item.skiruBonuses) && item.item.skiruBonuses.length > 0 && (
                <ul className="text-[11px] text-[var(--accent-gold)] space-y-0.5">
                  {item.item.skiruBonuses.map((b) => (
                    <li key={`b-${b.skiruId}`}>
                      Bonus {b.skiruId} +{b.value}
                    </li>
                  ))}
                </ul>
              )}
              {Array.isArray(item.item.skiruMaluses) && item.item.skiruMaluses.length > 0 && (
                <ul className="text-[11px] text-[var(--accent-violet-light)] space-y-0.5">
                  {item.item.skiruMaluses.map((m) => (
                    <li key={`m-${m.skiruId}`}>
                      Malus {m.skiruId} −{Math.abs(m.value)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
            {originLabel && (
              <>
                <dt className="text-gray-500 uppercase tracking-wider text-[9px]">Origine</dt>
                <dd className="text-[var(--accent-violet-light)]">{originLabel}</dd>
              </>
            )}
            {economy?.craftedByName && (
              <>
                <dt className="text-gray-500 uppercase tracking-wider text-[9px]">Firmato da</dt>
                <dd className="text-[var(--accent-gold)]">{economy.craftedByName}</dd>
              </>
            )}
            {economy && (
              <>
                <dt className="text-gray-500 uppercase tracking-wider text-[9px]">Slot</dt>
                <dd className="text-white">{economy.inventorySlotCost}</dd>
              </>
            )}
            <dt className="text-gray-500 uppercase tracking-wider text-[9px]">Posizione</dt>
            <dd className="text-white">
              {item.location === 'CARRY' ? 'Zaino' : item.location === 'HOUSING' ? 'Casa' : 'Piazza'}
            </dd>
            {economy?.isBroken && (
              <>
                <dt className="text-gray-500 uppercase tracking-wider text-[9px]">Stato</dt>
                <dd className="text-red-400">Rotto</dd>
              </>
            )}
            {economy && !economy.isMarketable && (
              <>
                <dt className="text-gray-500 uppercase tracking-wider text-[9px]">Mercato</dt>
                <dd className="text-gray-400">Non vendibile</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>,
    document.body,
  )
}
