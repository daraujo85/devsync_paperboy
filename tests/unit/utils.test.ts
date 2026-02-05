import { describe, it, expect } from 'vitest'
import { extractFilenameFromUrl } from '../../src/utils'

describe('Utils', () => {
  it('should extract filename from valid URL', () => {
    const url = 'http://localhost:3010/api/images/photo.png'
    expect(extractFilenameFromUrl(url)).toBe('photo.png')
  })

  it('should return null for invalid URL', () => {
    const url = 'http://localhost:3010/api/posts/123'
    expect(extractFilenameFromUrl(url)).toBe(null)
  })
})
