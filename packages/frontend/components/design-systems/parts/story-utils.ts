export const mono = {
  fontFamily: 'monospace',
  cursor: 'pointer',
  padding: '1px 3px',
  borderRadius: '2px',
  backgroundColor: 'var(--color-primitive-gray-100)',
} as const

export const monoMd = { ...mono, padding: '2px 4px' } as const

export const selectText = (event: Event): void => {
  const target = event.target as HTMLElement | null
  if (!target) return
  const range = document.createRange()
  range.selectNodeContents(target)
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}
