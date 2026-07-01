import { describe, expect, test } from 'bun:test'
import {
  beginTenkanAccumulation,
  createStoredChronoStackState,
  endTenkanAccumulation,
  processChronoChatMessage,
  processChronoEndOfTurn,
  processChronoHitTaken,
  toCombatChronoVitals,
} from './combat-chrono.ts'
import {
  createChronoStackState,
  overheatDamagePerTurn,
  resolveChronoStackEndOfTurn,
} from './chrono-stack.ts'
import {
  detectTenkanOffInChatMessage,
  detectTenkanOnInChatMessage,
  buildTenkanLaunchInsertLine,
  buildTenkanOffInsertLine,
  isChronoQualifyingAction,
  CHRONO_ACTION_MIN_CHARS,
} from './tenkan-chat.ts'

const chatOpts = {
  detectTenkanOn: detectTenkanOnInChatMessage,
  detectTenkanOff: detectTenkanOffInChatMessage,
  isQualifyingAction: isChronoQualifyingAction,
}

describe('tenkan-chat', () => {
  test('detects tenkan on/off tags', () => {
    expect(detectTenkanOnInChatMessage('Apro [tenkan]')).toBe(true)
    expect(detectTenkanOnInChatMessage('[Tenkan, la Corona]')).toBe(true)
    expect(detectTenkanOffInChatMessage('[tenkan:off]')).toBe(true)
    expect(detectTenkanOffInChatMessage('[Tenkan: Off]')).toBe(true)
    expect(detectTenkanOnInChatMessage('[tenkan:off]')).toBe(false)
  })

  test('qualifying action needs >= 500 chars and not pure dice', () => {
    expect(isChronoQualifyingAction(499, 'x')).toBe(false)
    expect(isChronoQualifyingAction(500, 'x'.repeat(500))).toBe(true)
    expect(isChronoQualifyingAction(500, '[🎲 14/20]')).toBe(false)
  })

  test('insert lines', () => {
    expect(buildTenkanLaunchInsertLine()).toBe('[tenkan] ')
    expect(buildTenkanOffInsertLine()).toBe('[tenkan:off] ')
  })

  test('CHRONO_ACTION_MIN_CHARS matches EXP threshold', () => {
    expect(CHRONO_ACTION_MIN_CHARS).toBe(500)
  })
})

describe('combat-chrono', () => {
  test('begin/end accumulation', () => {
    let s = createStoredChronoStackState(5)
    s = beginTenkanAccumulation(s)
    expect(s.accumulating).toBe(true)
    s = endTenkanAccumulation(s)
    expect(s.accumulating).toBe(false)
  })

  test('tenkan on + qualifying action grants +3 in one message', () => {
    const text = `[tenkan] ${'x'.repeat(500)}`
    const r = processChronoChatMessage(
      createStoredChronoStackState(0),
      text,
      text.length,
      { blockCsGain: false, bonusCsPerTurn: 0 },
      chatOpts,
    )
    expect(r.tenkanOpened).toBe(true)
    expect(r.turnApplied).toBe(true)
    expect(r.csGained).toBe(3)
    expect(r.state.accumulating).toBe(true)
    expect(r.state.current).toBe(3)
  })

  test('tenkan off closes without turn gain even if long', () => {
    const text = `[tenkan:off] ${'x'.repeat(600)}`
    const r = processChronoChatMessage(
      { ...createStoredChronoStackState(10), accumulating: true },
      text,
      text.length,
      { blockCsGain: false, bonusCsPerTurn: 0 },
      chatOpts,
    )
    expect(r.tenkanClosed).toBe(true)
    expect(r.turnApplied).toBe(false)
    expect(r.csGained).toBe(0)
    expect(r.state.accumulating).toBe(false)
    expect(r.state.current).toBe(10)
  })

  test('each qualifying action while accumulating adds +3', () => {
    const s = { ...createStoredChronoStackState(3), accumulating: true }
    const text = 'x'.repeat(500)
    const r = processChronoChatMessage(
      s,
      text,
      text.length,
      { blockCsGain: false, bonusCsPerTurn: 0 },
      chatOpts,
    )
    expect(r.turnApplied).toBe(true)
    expect(r.csGained).toBe(3)
    expect(r.state.current).toBe(6)
  })

  test('short message while accumulating does not tick', () => {
    const s = { ...createStoredChronoStackState(3), accumulating: true }
    const r = processChronoChatMessage(
      s,
      'breve',
      5,
      { blockCsGain: false, bonusCsPerTurn: 0 },
      chatOpts,
    )
    expect(r.changed).toBe(false)
    expect(r.csGained).toBe(0)
  })

  test('end of turn +3 with bonus status', () => {
    const s = { ...createStoredChronoStackState(10), accumulating: true }
    const r = processChronoEndOfTurn(s, { blockCsGain: false, bonusCsPerTurn: 1 })
    expect(r.csGained).toBe(4)
    expect(r.state.current).toBe(14)
  })

  test('hit taken +1 when accumulating', () => {
    const s = { ...createStoredChronoStackState(12), accumulating: true }
    const r = processChronoHitTaken(s, { blockCsGain: false })
    expect(r.csGained).toBe(1)
    expect(r.state.current).toBe(13)
  })

  test('vitals reflect overheat', () => {
    const v = toCombatChronoVitals({ ...createStoredChronoStackState(24), accumulating: true })
    expect(v.isOverheated).toBe(true)
    expect(v.overheatDamagePerTurn).toBe(8)
  })

  test('overheat HP: 4 stack over cap at 24 CS = 8 damage', () => {
    expect(overheatDamagePerTurn(24)).toBe(8)
    expect(overheatDamagePerTurn(20)).toBe(0)
  })

  test('defatigue after 3 consecutive overheat turns halves stacks', () => {
    let s = createChronoStackState(24)
    s = resolveChronoStackEndOfTurn(s)
    expect(s.current).toBe(24)
    expect(s.overheatTurns).toBe(1)
    s = resolveChronoStackEndOfTurn(s)
    expect(s.current).toBe(24)
    expect(s.overheatTurns).toBe(2)
    s = resolveChronoStackEndOfTurn(s)
    expect(s.current).toBe(12)
    expect(s.overheatTurns).toBe(0)
    expect(s.skipNextTurn).toBe(true)
  })
})
