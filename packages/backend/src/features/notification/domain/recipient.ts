import { DEFAULT_DIGEST_DELIVERY_TIMES } from "shared"

export const DEFAULT_DIGEST_TIMEZONE = "Asia/Tokyo" as const

export type RecipientDigestSettings = {
  enabled: boolean
  times: string[]
  timezone: string | null
}

export type Recipient = {
  id: string
  timezone: string | null
  digest: RecipientDigestSettings
  channels: string[]
}

export type ResolvedRecipientDigestSettings = {
  enabled: boolean
  times: string[]
  timezone: string
}

export function resolveRecipientDigestSettings(
  recipient: Recipient,
): ResolvedRecipientDigestSettings {
  const timezone =
    recipient.digest.timezone ?? recipient.timezone ?? DEFAULT_DIGEST_TIMEZONE

  const normalizedTimes = normalizeDigestTimes(recipient.digest.times)
  if (!recipient.digest.enabled) {
    return {
      enabled: false,
      times: [],
      timezone,
    }
  }

  return {
    enabled: true,
    times:
      normalizedTimes.length > 0
        ? normalizedTimes
        : Array.from(DEFAULT_DIGEST_DELIVERY_TIMES),
    timezone,
  }
}

function normalizeDigestTimes(times: string[]): string[] {
  const seen = new Set<string>()
  const filtered = times
    .map((time) => time.trim())
    .filter((time) => time !== "" && isValidTimeFormat(time))

  filtered.forEach((time) => seen.add(time))

  return Array.from(seen).sort()
}

function isValidTimeFormat(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
}
