import { describe, it, expect } from 'bun:test'
import { normalizePath, getRelativePath, getPathKey } from '../utils/pathUtils'

describe('pathUtils', () => {
  it('normalizes Windows backslashes to forward slashes and lowercases drive letters', () => {
    expect(normalizePath('C:\\Users\\dwaip\\Notes\\My Note.md')).toBe('c:/Users/dwaip/Notes/My Note.md')
  })

  it('computes relative path within workspace correctly', () => {
    const ws = 'C:/Users/dwaip/workspace'
    const file = 'C:/Users/dwaip/workspace/Notes/Daily.md'
    expect(getRelativePath(file, ws)).toBe('Notes/Daily.md')
  })

  it('computes relative path case-insensitively on Windows', () => {
    const ws = 'c:/users/dwaip/workspace'
    const file = 'C:/Users/Dwaip/Workspace/Notes/Daily.md'
    expect(getRelativePath(file, ws)).toBe('Notes/Daily.md')
  })

  it('generates consistent lowercased path key', () => {
    expect(getPathKey('C:\\Users\\DWAIP\\Doc.md')).toBe('c:/users/dwaip/doc.md')
  })
})
