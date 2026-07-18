import { describe, expect, it } from 'vitest'
import {
  DROP_ACTION_PREFIX,
  PRENDI_ACTION_PREFIX,
  encodeDropPanelRequest,
  encodePrendiPanelRequest,
  isDropPanelMessage,
  isPrendiPanelMessage,
  parseDropPanelRequest,
  parsePrendiPanelRequest,
} from './drop-panel-message'

describe('drop panel message', () => {
  it('encodes and parses direct ground drop', () => {
    const raw = encodeDropPanelRequest({
      kind: 'direct',
      target: 'ground',
      catalogKey: 'junk-flaconi',
      quantity: 3,
    })
    expect(raw.startsWith(DROP_ACTION_PREFIX)).toBe(true)
    expect(parseDropPanelRequest(raw)).toEqual({
      kind: 'direct',
      target: 'ground',
      catalogKey: 'junk-flaconi',
      quantity: 3,
    })
    expect(isDropPanelMessage(raw)).toBe(true)
  })

  it('encodes and parses direct drop to player', () => {
    const raw = encodeDropPanelRequest({
      kind: 'direct',
      target: 'player',
      targetCharacterId: 'char-1',
      catalogKey: 'junk-abiti',
      quantity: 2,
    })
    expect(parseDropPanelRequest(raw)).toMatchObject({
      kind: 'direct',
      target: 'player',
      targetCharacterId: 'char-1',
      catalogKey: 'junk-abiti',
      quantity: 2,
    })
  })

  it('encodes and parses table drop for group', () => {
    const raw = encodeDropPanelRequest({
      kind: 'table',
      target: 'group',
      tableId: 'rovine_urbane',
    })
    expect(parseDropPanelRequest(raw)).toEqual({
      kind: 'table',
      target: 'group',
      tableId: 'rovine_urbane',
    })
  })

  it('rejects invalid payloads', () => {
    expect(parseDropPanelRequest(`${DROP_ACTION_PREFIX}{}`)).toBeNull()
    expect(parseDropPanelRequest(`${DROP_ACTION_PREFIX}{"kind":"direct","target":"player","catalogKey":"x","quantity":1}`)).toBeNull()
  })
})

describe('prendi panel message', () => {
  it('encodes and parses catalog key', () => {
    const raw = encodePrendiPanelRequest('junk-abiti')
    expect(raw.startsWith(PRENDI_ACTION_PREFIX)).toBe(true)
    expect(parsePrendiPanelRequest(raw)).toEqual({ catalogKey: 'junk-abiti' })
    expect(isPrendiPanelMessage(raw)).toBe(true)
  })
})
