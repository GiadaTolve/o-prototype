import { describe, expect, it } from 'vitest'
import { formatDropEventMessage, parseDropCommand, parsePrendiCommand, resolveCatalogKeyFromQuery } from './drop-commands'

describe('parseDropCommand', () => {
  it('parses direct drop to player by junk name', () => {
    const cmd = parseDropCommand('/drop @Kaede Abiti del vecchio mondo x2')
    expect(cmd).toEqual({
      kind: 'direct',
      target: 'player',
      targetName: 'Kaede',
      catalogKey: 'junk-abiti',
      quantity: 2,
    })
  })

  it('parses table drop for group', () => {
    const cmd = parseDropCommand('/drop @gruppo tabella:rovine_urbane')
    expect(cmd).toMatchObject({ kind: 'table', target: 'group', tableId: 'rovine_urbane' })
  })

  it('parses ground drop', () => {
    const cmd = parseDropCommand('/drop @aterra junk-flaconi x1')
    expect(cmd).toMatchObject({ kind: 'direct', target: 'ground', catalogKey: 'junk-flaconi' })
  })
})

describe('parsePrendiCommand', () => {
  it('parses prendi query', () => {
    expect(parsePrendiCommand('/prendi flaconi scaduti')).toEqual({ query: 'flaconi scaduti' })
  })
})

describe('resolveCatalogKeyFromQuery', () => {
  it('resolves by id', () => {
    expect(resolveCatalogKeyFromQuery('junk-abiti')).toBe('junk-abiti')
  })
})

describe('formatDropEventMessage', () => {
  it('formats loot line', () => {
    expect(
      formatDropEventMessage('Kaede', [{ name: 'Abiti del vecchio mondo', quantity: 2 }]),
    ).toBe('📦 Kaede trova: Abiti del vecchio mondo ×2')
  })
})
