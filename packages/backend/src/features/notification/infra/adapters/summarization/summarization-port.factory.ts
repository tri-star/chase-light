import type { SummarizationPort } from "../../../application/ports/summarization.port"
import { getOpenAiConfig } from "../../../../../core/config/open-ai"
import {
  EXTERNAL_AI_API_USE_STUB_ENV,
  SUMMARIZATION_DEFAULT_MAX_TOKENS,
  SUMMARIZATION_DEFAULT_MODEL,
  SUMMARIZATION_DEFAULT_TEMPERATURE,
} from "../../../constants/summarization"
import {
  createSummarizationAdapter,
  SummarizationAdapterOptions,
} from "./summarization.adapter"
import {
  StubSummarizationAdapter,
  createStubSummarizationAdapter,
} from "./stub-summarization.adapter"

let cachedPort: SummarizationPort | null = null

export async function createSummarizationPort(): Promise<SummarizationPort> {
  if (cachedPort) {
    return cachedPort
  }

  if (process.env[EXTERNAL_AI_API_USE_STUB_ENV] === "true") {
    cachedPort = createStubSummarizationAdapter()
    return cachedPort
  }

  const config = await getOpenAiConfig()
  const adapterOptions: SummarizationAdapterOptions = {
    model: SUMMARIZATION_DEFAULT_MODEL,
    maxTokens: SUMMARIZATION_DEFAULT_MAX_TOKENS,
    temperature: SUMMARIZATION_DEFAULT_TEMPERATURE,
  }
  cachedPort = createSummarizationAdapter(config.apiKey, adapterOptions)
  return cachedPort
}

export function resetSummarizationPort(): void {
  if (cachedPort instanceof StubSummarizationAdapter) {
    cachedPort.reset()
  }
  cachedPort = null
}
