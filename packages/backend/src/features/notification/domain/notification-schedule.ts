/**
 * Notification schedule calculation domain logic
 */

/**
 * Helper function to create a Date in specific timezone
 */
function createDateInTimezone(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  // Create an ISO string without timezone info
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`

  // Parse this string as if it were in the target timezone
  // by creating a temporary date and finding the UTC offset
  const tempDate = new Date(dateStr + "Z") // Treat as UTC first
  const formatted = tempDate.toLocaleString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  // Parse the formatted string back to get the offset
  const parts = formatted.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/)
  if (!parts) throw new Error("Invalid date format")

  const localYear = Number.parseInt(parts[3])
  const localMonth = Number.parseInt(parts[1])
  const localDay = Number.parseInt(parts[2])
  const localHour = Number.parseInt(parts[4])
  const localMinute = Number.parseInt(parts[5])

  // Calculate the difference
  const offset =
    (year - localYear) * 365 * 24 * 60 +
    (month - localMonth) * 30 * 24 * 60 +
    (day - localDay) * 24 * 60 +
    (hour - localHour) * 60 +
    (minute - localMinute)

  // Apply the offset to get the correct UTC time
  return new Date(tempDate.getTime() + offset * 60000)
}

/**
 * Calculate the next notification time based on user settings and current time
 *
 * @param digestTimes - User's configured notification times (e.g., ["18:00", "18:30"])
 * @param timezone - User's timezone (e.g., "Asia/Tokyo")
 * @param currentTime - Current time (default: new Date(), can be overridden for testing)
 * @returns Next scheduled notification time
 */
export function calculateNextNotificationTime(
  digestTimes: string[],
  timezone: string,
  currentTime: Date = new Date(),
): Date {
  // Use default time if digestTimes is empty
  const times = digestTimes.length > 0 ? digestTimes : ["18:00"]

  // Get current date/time in user's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const formatted = formatter.format(currentTime)
  const parts = formatted.match(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/)
  if (!parts) throw new Error("Invalid date format")

  const month = Number.parseInt(parts[1])
  const day = Number.parseInt(parts[2])
  const year = Number.parseInt(parts[3])
  const currentHour = Number.parseInt(parts[4])
  const currentMinute = Number.parseInt(parts[5])

  // Create candidate times for today
  const sortedTimes = times
    .map((time) => {
      const [hour, minute] = time.split(":").map(Number)
      return { hour, minute }
    })
    .sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour
      return a.minute - b.minute
    })

  // Find the next time today
  for (const time of sortedTimes) {
    if (
      time.hour > currentHour ||
      (time.hour === currentHour && time.minute > currentMinute)
    ) {
      return createDateInTimezone(
        year,
        month,
        day,
        time.hour,
        time.minute,
        timezone,
      )
    }
  }

  // No time left today, use first time tomorrow
  const nextDay = new Date(year, month - 1, day)
  nextDay.setDate(nextDay.getDate() + 1)

  return createDateInTimezone(
    nextDay.getFullYear(),
    nextDay.getMonth() + 1,
    nextDay.getDate(),
    sortedTimes[0].hour,
    sortedTimes[0].minute,
    timezone,
  )
}
