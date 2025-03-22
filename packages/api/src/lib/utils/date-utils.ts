import dayjs from 'dayjs'

export const toDbDateTime = (
  date: Date | undefined | null,
  fallback: string | null = null,
): string | null => {
  if (!date) return fallback
  return dayjs(date).toISOString()
}

export function ToDbDateTimeStrict(date: Date | undefined | null): string {
  if (!date) {
    throw new Error('Date cannot be null or undefined')
  }

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided')
  }

  return dayjs(date).toISOString()
}

type DateToString<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<DateToString<U>>
    : T extends object
      ? { [K in keyof T]: DateToString<T[K]> }
      : T
export function convertDatesToISO8601<T>(obj: T): DateToString<T> {
  if (obj === null || obj === undefined) {
    return obj as DateToString<T>
  }

  if (obj instanceof Date) {
    return toDbDateTime(obj) as DateToString<T>
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDatesToISO8601) as DateToString<T>
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertDatesToISO8601(obj[key])
      }
    }

    return result as DateToString<T>
  }

  return obj as DateToString<T>
}
