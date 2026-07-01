import { describe, expect, it } from 'vitest'
import { mapDoMechanicsToWazaResolveFields, readDoMechanicsFromMeta, accumulateItoTensionInMeta, tickItoTensionInMeta } from './do-mechanics'

describe('do-mechanics → waza resolve', () => {
  it('espone lastReceivedHitTier e campi Hadō/Hensei', () => {
    const snap = readDoMechanicsFromMeta(
      { hadoPressure: 5, yuragiPhase: 'solido', lastReceivedHitTier: 3 },
      14,
    )
    expect(snap.lastReceivedHitTier).toBe(3)
    expect(snap.hado.metamorphosisReady).toBe(true)
    expect(mapDoMechanicsToWazaResolveFields(snap)).toEqual({
      currentCs: 14,
      atsuryokuPressure: 5,
      yuragiParityNext: true,
      lastReceivedHitTier: 3,
      itoIrBonus: 0,
      nagoriCollateralFrom: null,
    })
  })

  it('espone nagoriLastFrom per bonus collaterale', () => {
    const snap = readDoMechanicsFromMeta(
      { henseiNagori: { turnsLeft: 2, lastFrom: 'solido', lastTo: 'liquido' } },
      0,
    )
    expect(mapDoMechanicsToWazaResolveFields(snap).nagoriCollateralFrom).toBe('solido')
  })

  it('espone bonus IR Tensione Itō', () => {
    const snap = readDoMechanicsFromMeta({ itoTension: 4 }, 0)
    expect(mapDoMechanicsToWazaResolveFields(snap).itoIrBonus).toBe(4)
  })

  it('accumulo Itō segna filo usato e esubero Emorragia', () => {
    const acc = accumulateItoTensionInMeta({ itoTension: 8 }, 1)
    expect(acc.meta.itoTension).toBe(9)
    expect(acc.meta.itoUsedThisTurn).toBe(true)
    expect(acc.emorragiaStacks).toBe(1)
  })

  it('tick turno Itō decay e reset flag', () => {
    const tick = tickItoTensionInMeta({ itoTension: 4, itoUsedThisTurn: false })
    expect(tick.meta.itoTension).toBe(3)
    expect(tick.meta.itoUsedThisTurn).toBe(false)
    expect(tick.decayed).toBe(1)
  })

  it('ignora tier non valido', () => {
    const snap = readDoMechanicsFromMeta({ lastReceivedHitTier: 9 }, 0)
    expect(snap.lastReceivedHitTier).toBeNull()
  })
})
