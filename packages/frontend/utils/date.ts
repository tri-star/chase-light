export const formatRelativeDate = (d: Date | string): string => {
  const date = new Date(ensureDate(d))
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'たった今'
  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`

  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDate(
  date: Date | string,
  displayUnit: 'full' | 'minutes' | 'day'
) {
  const jstOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }

  const formatter = new Intl.DateTimeFormat('ja-JP', jstOptions)
  const parts = formatter.formatToParts(ensureDate(date))
  const obj = Object.fromEntries(parts.map((p) => [p.type, p.value]))

  if (displayUnit === 'day') {
    return `${obj.year}年${obj.month}月${obj.day}日(${obj.weekday})`
  }
  if (displayUnit === 'minutes') {
    return `${obj.year}年${obj.month}月${obj.day}日(${obj.weekday}) ${obj.hour}:${obj.minute}`
  }

  return `${obj.year}年${obj.month}月${obj.day}日(${obj.weekday}) ${obj.hour}:${obj.minute}:${obj.second}`
}

export function ensureDate(date: Date | string): Date {
  if (typeof date === 'string') {
    return new Date(date)
  }
  return date
}
