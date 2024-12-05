import dayjs from "dayjs"

export function toDateTimeString(
  date: Date | string | undefined,
  fallback: string | undefined | null = "N/A",
): string | undefined | null {
  if (date == null) {
    return fallback
  }

  if (typeof date === "string") {
    if (!dayjs(date).isValid()) {
      return fallback
    }
    return dayjs(date).format("YYYY-MM-DD HH:mm:ss")
  }
}
