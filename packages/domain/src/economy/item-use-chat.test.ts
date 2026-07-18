import { describe, expect, it } from 'vitest'
import {
  encodeItemUseRequest,
  parseItemUseRequest,
  encodeItemUseCard,
  extractItemUseCard,
  isItemUsePanelMessage,
  validateItemUseInChat,
  INTEGRITY_PER_CHAT_USE,
  ITEM_USE_PREFIX,
} from './item-use-chat'

describe('item use panel protocol', () => {
  it('encodes and parses request by inventory id', () => {
    const msg = encodeItemUseRequest('inv-abc')
    expect(msg.startsWith(ITEM_USE_PREFIX)).toBe(true)
    expect(parseItemUseRequest(msg)).toEqual({ inventoryId: 'inv-abc' })
    expect(isItemUsePanelMessage(msg)).toBe(true)
  })

  it('encodes and extracts card payload', () => {
    const card = encodeItemUseCard({
      itemName: 'Maschera di Mujina',
      category: 'equipaggiamento',
      integrityBefore: 2,
      integrityAfter: 1,
    })
    expect(extractItemUseCard(card)).toMatchObject({
      itemName: 'Maschera di Mujina',
      integrityBefore: 2,
      integrityAfter: 1,
    })
    expect(parseItemUseRequest(card)).toBeNull()
  })
})

describe('validateItemUseInChat', () => {
  it('requires equip for weapons', () => {
    const r = validateItemUseInChat({
      category: 'equipaggiamento',
      type: 'WEAPON',
      isEquipped: false,
      location: 'CARRY',
      integrityCurrent: 5,
      integrityMax: 5,
      quantity: 1,
    })
    expect(r.ok).toBe(false)
  })

  it('requires ammo when weapon has ammoKind', () => {
    const r = validateItemUseInChat({
      category: 'equipaggiamento',
      type: 'WEAPON',
      isEquipped: true,
      location: 'CARRY',
      integrityCurrent: 5,
      integrityMax: 5,
      quantity: 1,
      ammoKindRequired: 'pistola',
      ammoAvailable: 0,
    })
    expect(r.ok).toBe(false)
  })

  it('allows consumable in carry', () => {
    const r = validateItemUseInChat({
      category: 'consumabile',
      type: 'GENERIC',
      isEquipped: false,
      location: 'CARRY',
      integrityCurrent: null,
      integrityMax: null,
      quantity: 3,
    })
    expect(r.ok).toBe(true)
  })
})

describe('INTEGRITY_PER_CHAT_USE', () => {
  it('is 1', () => {
    expect(INTEGRITY_PER_CHAT_USE).toBe(1)
  })
})
