import { getOpenAiConfig } from "../../../../../core/config/open-ai"
import type { ActivityBodyTranslationPort } from "../../../application/ports/activity-body-translation.port"
import { NullActivityBodyTranslationAdapter } from "./null-translation.adapter"
import {
  ActivityBodyTranslationAdapter,
  type TranslationAdapterOptions,
} from "./translation.adapter"
import {
  ActivityBodyTranslationAdapterStub,
  createActivityBodyTranslationAdapterStub,
} from "./translation-stub.adapter"

const EXTERNAL_AI_API_USE_STUB_ENV = "USE_EXTERNAL_AI_API_STUB"

let cachedPort: ActivityBodyTranslationPort | null = null

export async function createActivityBodyTranslationPort(
  options: TranslationAdapterOptions = {},
): Promise<ActivityBodyTranslationPort> {
  if (cachedPort) {
    return cachedPort
  }

  if (process.env[EXTERNAL_AI_API_USE_STUB_ENV] === "true") {
    cachedPort = createActivityBodyTranslationAdapterStub()
    return cachedPort
  }

  try {
    const openAiConfig = await getOpenAiConfig()
    cachedPort = new ActivityBodyTranslationAdapter(
      openAiConfig.apiKey,
      options,
    )
    return cachedPort
  } catch (error) {
    if (isMissingOpenAiKeyError(error)) {
      console.warn(
        "OpenAI API key is not configured. Continuing without body translation.",
      )
      cachedPort = new NullActivityBodyTranslationAdapter()
      return cachedPort
    }
    throw error
  }
}

export function resetActivityBodyTranslationPort(): void {
  if (cachedPort instanceof ActivityBodyTranslationAdapterStub) {
    cachedPort.reset()
  }
  cachedPort = null
}

function isMissingOpenAiKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes("openai api key not found") ||
    message.includes("openai api key not configured")
  )
}
