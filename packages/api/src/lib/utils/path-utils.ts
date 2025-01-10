import path from 'path'
import { fileURLToPath } from 'url'

export function currentFilePath(importMetaUrl: string) {
  return fileURLToPath(importMetaUrl)
}

export function currentDirPath(importMetaUrl: string) {
  return path.dirname(currentFilePath(importMetaUrl))
}
