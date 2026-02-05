
export function extractFilenameFromUrl(url: string): string | null {
  const parts = url.split('/api/images/')
  if (parts.length > 1) {
    return parts[1]
  }
  return null
}
