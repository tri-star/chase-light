import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"
import { URL } from "url"

type GetSsmParameterValueOptions = {
  withDecryption?: boolean
}

type SsmGetParameterResponse = {
  Parameter?: {
    Value?: string
  }
}

const EXTENSION_ENDPOINT =
  process.env.AWS_PARAMETERS_SECRETS_EXTENSION_ENDPOINT ??
  "http://localhost:2773"

async function getParameterViaExtension(
  name: string,
  withDecryption: boolean,
): Promise<string | null> {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("fetch is not available")
  }

  const url = new URL(`${EXTENSION_ENDPOINT}/systemsmanager/parameters/get`)
  url.searchParams.set("name", name)
  url.searchParams.set("withDecryption", String(withDecryption))

  const headers: Record<string, string> = {}
  if (process.env.AWS_SESSION_TOKEN) {
    headers["X-Aws-Parameters-Secrets-Token"] = process.env.AWS_SESSION_TOKEN
  }

  const response = await globalThis.fetch(url.toString(), { headers })
  if (!response.ok) {
    throw new Error(
      `Extension request failed: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as SsmGetParameterResponse
  return data.Parameter?.Value ?? null
}

async function getParameterViaSdk(
  name: string,
  withDecryption: boolean,
): Promise<string | null> {
  if (!process.env.AWS_REGION) {
    throw new Error("Missing environment variable: AWS_REGION")
  }

  const ssmClient = new SSMClient({
    region: process.env.AWS_REGION,
  })

  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: withDecryption,
  })

  const response = await ssmClient.send(command)
  return response.Parameter?.Value ?? null
}

/**
 * Lambda環境では AWS Parameters and Secrets Lambda Extension (localhost:2773) 経由で取得する。
 * Extension が利用できない環境（ローカル開発/テスト）では SSM API にフォールバックする。
 */
export async function getSsmParameterValue(
  name: string,
  options: GetSsmParameterValueOptions = {},
): Promise<string | null> {
  const withDecryption = options.withDecryption ?? false

  try {
    return await getParameterViaExtension(name, withDecryption)
  } catch {
    return await getParameterViaSdk(name, withDecryption)
  }
}
