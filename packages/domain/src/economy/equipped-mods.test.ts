import { describe, expect, it } from 'vitest'
import {
  aggregateEquippedItemMods,
  applyEquipmentModsToSheet,
  combineMitigationPercent,
} from './equipped-mods'

describe('aggregateEquippedItemMods', () => {
  it('sums only equipped CARRY items', () => {
    const mods = aggregateEquippedItemMods([
      {
        name: 'Sabimaru',
        isEquipped: true,
        location: 'CARRY',
        damage: 2,
        skiruBonuses: [{ skiruId: 'kairiki', value: 1 }],
      },
      {
        name: 'In armadio',
        isEquipped: true,
        location: 'HOUSING',
        damage: 99,
        skiruBonuses: [{ skiruId: 'kairiki', value: 5 }],
      },
      {
        name: 'Non equip',
        isEquipped: false,
        location: 'CARRY',
        damage: 5,
      },
    ])
    expect(mods.damageFlat).toBe(2)
    expect(mods.skiruDeltas.kairiki).toBe(1)
    expect(mods.lines.some((l) => l.includes('Sabimaru'))).toBe(true)
  })

  it('applies maluses as negative deltas', () => {
    const mods = aggregateEquippedItemMods([
      {
        name: 'Cappa',
        isEquipped: true,
        mitigationFlat: 3,
        skiruMaluses: [{ skiruId: 'hansha', value: 2 }],
        skiruBonuses: [{ skiruId: 'konjou', value: 1 }],
      },
    ])
    expect(mods.mitigationFlat).toBe(3)
    expect(mods.skiruDeltas.hansha).toBe(-2)
    expect(mods.skiruDeltas.konjou).toBe(1)
  })
})

describe('applyEquipmentModsToSheet', () => {
  it('overlays points for IR/CAC and floors at 0', () => {
    const sheet = applyEquipmentModsToSheet(
      { kairiki: 2, hansha: 1 },
      {
        damageFlat: 0,
        mitigationFlat: 0,
        skiruDeltas: { kairiki: 2, hansha: -5 },
        lines: [],
      },
    )
    expect(sheet.kairiki).toBe(4)
    expect(sheet.hansha).toBe(0)
  })
})

describe('combineMitigationPercent', () => {
  it('caps at 30', () => {
    expect(combineMitigationPercent(27, 10)).toBe(30)
  })
})
