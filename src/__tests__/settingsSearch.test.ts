import { describe, it, expect } from 'bun:test'
import {
  isItemMatching,
  getTabSearchCounts,
  SETTINGS_SEARCH_REGISTRY
} from '../components/settings/searchRegistry'

describe('Settings Search Registry & Scoring', () => {
  it('returns true when search query is empty or whitespace', () => {
    const item = SETTINGS_SEARCH_REGISTRY[0]
    expect(isItemMatching(item, '')).toBe(true)
    expect(isItemMatching(item, '   ')).toBe(true)
  })

  it('matches item by title, description, and keywords case-insensitively', () => {
    const undoItem = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'undo-history')!
    expect(isItemMatching(undoItem, 'undo')).toBe(true)
    expect(isItemMatching(undoItem, 'UNDO')).toBe(true)
    expect(isItemMatching(undoItem, 'snapshots')).toBe(true)
    expect(isItemMatching(undoItem, 'ctrl z')).toBe(true)
    expect(isItemMatching(undoItem, 'completelyunrelatedphrase')).toBe(false)
  })

  it('correctly aggregates match counts across tabs', () => {
    const tabCounts = getTabSearchCounts('indent')
    expect(tabCounts.editor).toBeGreaterThan(0)

    const saveCounts = getTabSearchCounts('save')
    expect(saveCounts.general).toBeGreaterThan(0)

    const cacheCounts = getTabSearchCounts('cache')
    expect(cacheCounts.files).toBeGreaterThan(0)
  })

  it('returns 0 for all tabs on non-matching query', () => {
    const counts = getTabSearchCounts('xyzabc999nonexistent')
    expect(counts.general).toBe(0)
    expect(counts.editor).toBe(0)
    expect(counts.files).toBe(0)
  })
})
