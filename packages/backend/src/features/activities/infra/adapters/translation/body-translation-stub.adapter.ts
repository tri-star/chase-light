import type { BodyTranslationPort } from "../../../application/ports/body-translation.port"
import type { ActivityBodyTranslationTargetLanguage } from "shared/constants"

export class BodyTranslationStubAdapter implements BodyTranslationPort {
  constructor(private readonly suffix = "[translated]") {}

  async translate(
    body: string,
    _targetLanguage?: ActivityBodyTranslationTargetLanguage,
  ) {
    return { translatedBody: `${body} ${this.suffix}` }
  }
}
