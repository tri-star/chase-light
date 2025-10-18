import { DateTime } from "luxon"
import { DEFAULT_DIGEST_DELIVERY_TIMES } from "shared"
import {
  DEFAULT_DIGEST_TIMEZONE,
  resolveRecipientDigestSettings,
  type Recipient,
} from "../../domain"

export type NotificationScheduleParams = {
  recipient: Recipient
  activityCreatedAt: Date
  now?: Date
}

export type NotificationScheduleResult = {
  scheduledAt: Date
  scheduledSlot: string
  timezone: string
}

export function calculateNextDigestSchedule(
  params: NotificationScheduleParams,
): NotificationScheduleResult {
  const resolved = resolveRecipientDigestSettings(params.recipient)
  const timezone = resolved.timezone ?? DEFAULT_DIGEST_TIMEZONE
  const referenceSource =
    params.activityCreatedAt.getTime() > (params.now?.getTime() ?? 0)
      ? params.activityCreatedAt
      : (params.now ?? new Date())

  const referenceUtc = DateTime.fromJSDate(referenceSource, {
    zone: "utc",
  })
  const referenceLocal = referenceUtc.setZone(timezone)
  const slot = pickNextSlot(referenceLocal, resolved.times, timezone)

  return {
    scheduledAt: slot.toUTC().toJSDate(),
    scheduledSlot: slot.toFormat("HH:mm"),
    timezone,
  }
}

function pickNextSlot(
  reference: DateTime,
  candidateTimes: string[],
  timezone: string,
): DateTime {
  const slots =
    candidateTimes.length > 0
      ? candidateTimes
      : Array.from(DEFAULT_DIGEST_DELIVERY_TIMES)

  for (const slot of slots) {
    const candidate = buildDateTimeForSlot(reference, slot, timezone)
    if (candidate >= reference) {
      return candidate
    }
  }

  // すべてのスロットが過去であれば翌日の最初のスロットを使用
  const nextDayReference = reference.plus({ days: 1 }).startOf("day")
  return buildDateTimeForSlot(nextDayReference, slots[0], timezone)
}

function buildDateTimeForSlot(
  reference: DateTime,
  slot: string,
  timezone: string,
): DateTime {
  const [hour, minute] = slot.split(":").map((value) => Number(value))
  return DateTime.fromObject(
    {
      year: reference.year,
      month: reference.month,
      day: reference.day,
      hour,
      minute,
    },
    { zone: timezone },
  )
}
