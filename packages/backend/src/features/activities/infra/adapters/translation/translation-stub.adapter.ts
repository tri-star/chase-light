import type { ActivityType } from "../../../domain"
import type {
  ActivityBodyTranslationPort,
  ActivityBodyTranslationResult,
} from "../../../application/ports/activity-body-translation.port"

type StubHandler = (payload: {
  activityType: ActivityType
  title: string
  body: string
}) => Promise<ActivityBodyTranslationResult> | ActivityBodyTranslationResult

export class ActivityBodyTranslationAdapterStub
  implements ActivityBodyTranslationPort
{
  private handler: StubHandler = async ({ title, body }) => ({
    translatedTitle: `[stub] ${title}`,
    summary: `[stub] ${body.slice(0, 50)}`,
    translatedBody: `[stub] ${body}`,
  })

  configure(handler: StubHandler) {
    this.handler = handler
  }

  reset() {
    this.handler = async ({ title, body }) => ({
      translatedTitle: `[stub] ${title}`,
      summary: `[stub] ${body.slice(0, 50)}`,
      translatedBody: `[stub] ${body}`,
    })
  }

  async translateBody(
    activityType: ActivityType,
    title: string,
    body: string,
  ): Promise<ActivityBodyTranslationResult> {
    return await this.handler({ activityType, title, body })
  }
}

export const createActivityBodyTranslationAdapterStub = () =>
  new ActivityBodyTranslationAdapterStub()
