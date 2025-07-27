import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"

interface OpenAiConfig {
  apiKey: string
}

interface OpenAiConfigOptions {
  stage?: string
  useAws?: boolean
}

/**
 * OpenAI設定を環境に応じて取得する
 * - AWS環境: SSM Parameter Storeから取得
 * - ローカル環境: 環境変数から取得
 */
export async function getOpenAiConfig(
  options: OpenAiConfigOptions = {},
): Promise<OpenAiConfig> {
  const { stage = "dev", useAws = process.env.USE_AWS === "true" } = options

  try {
    if (useAws) {
      // AWS環境: SSM Parameter Storeから取得
      const ssmParameterName = `/${stage}/openai/api_key`
      const apiKey = await getApiKeyFromSSM(ssmParameterName)

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

/**
 * SSM Parameter StoreからAPIキーを取得
 */
async function getApiKeyFromSSM(parameterName: string): Promise<string | null> {
  try {
    const ssmClient = new SSMClient({
      region: process.env.AWS_REGION || "us-east-1",
    })

    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true, // 暗号化されたパラメータを復号化
    })

    const response = await ssmClient.send(command)
    return response.Parameter?.Value || null
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get parameter from SSM: ${error.message}`)
    }
    throw new Error("Failed to get parameter from SSM: Unknown error")
  }
}
