import { getOpenAiConfig } from "../../../../../core/config/open-ai"
import { BodyTranslationStubAdapter } from "./body-translation-stub.adapter"
import { BodyTranslationAdapter } from "./body-translation.adapter"

export async function createBodyTranslationPort() {
  if (process.env.USE_TRANSLATION_STUB === "true") {
    return new BodyTranslationStubAdapter()
  }
  try {
    const config = await getOpenAiConfig()
    return new BodyTranslationAdapter(config.apiKey)
  } catch (e: unknown) {
    console.warn("Failed to get OpenAI config, using stub adapter", e)
    return new BodyTranslationStubAdapter()
  }
}
