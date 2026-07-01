import { describe, expect, test } from 'bun:test'
import {
  migrateGugenkaToGenkaiInSheet,
  resolveGenkaiPointsFromSheet,
  GENKAI_SKIRU_ID,
} from './genkai.ts'

describe('genkai', () => {
  test('resolveGenkaiPointsFromSheet prefers genkai', () => {
    expect(resolveGenkaiPointsFromSheet({ genkai: 5, gugenka: 8 })).toBe(5)
  })

  test('resolveGenkaiPointsFromSheet falls back to legacy gugenka', () => {
    expect(resolveGenkaiPointsFromSheet({ gugenka: 7 })).toBe(7)
  })

  test('migrateGugenkaToGenkaiInSheet moves points', () => {
    const next = migrateGugenkaToGenkaiInSheet({ gugenka: 4, tenkan: 2 })
    expect(next[GENKAI_SKIRU_ID]).toBe(4)
    expect(next.gugenka).toBeUndefined()
    expect(next.tenkan).toBe(2)
  })
})
