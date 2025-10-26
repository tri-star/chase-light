import { getOpenAiConfig } from "../../../../../core/config/open-ai"
import type { TranslationPort } from "../../../application/ports/translation.port"
import { TranslationAdapter } from "./translation.adapter"
import { NullTranslationAdapter } from "./null-translation.adapter"
import {
  createTranslationAdapterStub,
  TranslationAdapterStub,
} from "./translation-stub.adapter"

const EXTERNAL_AI_API_USE_STUB_ENV = "USE_EXTERNAL_AI_API_STUB"

let cachedPort: TranslationPort | null = null

export async function createTranslationPort(): Promise<TranslationPort> {
  if (cachedPort) {
    return cachedPort
  }

  if (process.env[EXTERNAL_AI_API_USE_STUB_ENV] === "true") {
    cachedPort = createTranslationAdapterStub()
    return cachedPort
  }

  try {
    const openAiConfig = await getOpenAiConfig()
    cachedPort = new TranslationAdapter(openAiConfig.apiKey)
    return cachedPort
  } catch (error) {
    if (isMissingOpenAiKeyError(error)) {
      console.warn(
        "OpenAI API key is not configured. Continuing without translation/summary.",
      )
      cachedPort = new NullTranslationAdapter()
      return cachedPort
    }
    throw error
  }
}

export function resetTranslationPort(): void {
  if (cachedPort instanceof TranslationAdapterStub) {
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
