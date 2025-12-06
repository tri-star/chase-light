import type { ActivityType } from "../../domain"

export type ActivityBodyTranslationResult = {
  translatedTitle: string | null
  summary: string | null
  translatedBody: string | null
}

export interface ActivityBodyTranslationPort {
  translateBody(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<ActivityBodyTranslationResult>
}
