import type { ActivityType } from "../../../domain"
import type {
  ActivityBodyTranslationPort,
  ActivityBodyTranslationResult,
} from "../../../application/ports/activity-body-translation.port"

export class NullActivityBodyTranslationAdapter
  implements ActivityBodyTranslationPort
{
  async translateBody(
    _activityType: ActivityType,
    _title: string,
    _body: string,
  ): Promise<ActivityBodyTranslationResult> {
    return {
      translatedTitle: null,
      summary: null,
      translatedBody: null,
    }
  }
}
