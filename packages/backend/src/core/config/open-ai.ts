import { getSsmParameterValue } from "./ssm-parameter"

interface OpenAiConfig {
  apiKey: string
}

/**
 * OpenAI設定を環境に応じて取得する
 * - AWS環境: SSM Parameter Storeから取得
 * - ローカル環境: 環境変数から取得
 */
export async function getOpenAiConfig(): Promise<OpenAiConfig> {
  if (!process.env.APP_STAGE) {
    throw new Error("Missing environment variable: APP_STAGE")
  }

  const stage = process.env.APP_STAGE
  const useAws = process.env.USE_AWS === "true"

  try {
    if (useAws) {
      // AWS環境: SSM Parameter Storeから取得
      const ssmParameterName = `/${stage}-chase-light/openai/api_key`
      const apiKey = await getSsmParameterValue(ssmParameterName, {
        withDecryption: true,
      })

      if (!apiKey) {
        throw new Error(
          `OpenAI API key not found in SSM parameter: ${ssmParameterName}`,
        )
      }

      return { apiKey }
    } else {
      // ローカル環境: 環境変数から取得
      const apiKey = process.env.OPENAI_API_KEY

      if (!apiKey) {
        throw new Error(
          "OpenAI API key not found in environment variable OPENAI_API_KEY",
        )
      }

      return { apiKey }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get OpenAI configuration: ${error.message}`)
    }
    throw new Error("Failed to get OpenAI configuration: Unknown error")
  }
}
