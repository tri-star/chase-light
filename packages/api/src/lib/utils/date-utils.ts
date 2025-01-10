import { format } from 'date-fns'

export const toDbDateTime = (
  date: Date | undefined | null,
  fallback: string | null = null,
): string | null => {
  if (!date) return fallback
  return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
}

export function ToDbDateTimeStrict(date: Date | undefined | null): string {
  if (!date) {
    throw new Error('Date cannot be null or undefined')
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided')
  }

  return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
}
