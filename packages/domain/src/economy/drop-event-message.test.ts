import { describe, expect, it } from 'vitest'
import { parseDropEventMessage } from './drop-event-message'

describe('parseDropEventMessage', () => {
  it('parses ground spawn', () => {
    expect(parseDropEventMessage('📦 A terra compare: Lattine ×3')).toEqual({
      headline: 'Loot a terra',
      detail: 'Lattine ×3',
    })
  })

  it('parses pickup', () => {
    expect(parseDropEventMessage('📦 Botan Miyazaki raccoglie: Cartucce Pistola ×1')).toMatchObject({
      headline: 'Botan Miyazaki',
      detail: 'Cartucce Pistola ×1',
    })
  })
})
