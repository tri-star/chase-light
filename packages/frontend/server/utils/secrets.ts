type SecretsManagerGetResponse = {
  SecretString?: string
}

const EXTENSION_ENDPOINT =
  process.env.AWS_PARAMETERS_SECRETS_EXTENSION_ENDPOINT ??
  'http://localhost:2773'

const secretJsonCache = new Map<string, Record<string, string>>()

export type SecretsManagerKey =
  | 'AUTH0_DOMAIN'
  | 'AUTH0_CLIENT_ID'
  | 'AUTH0_CLIENT_SECRET'
  | 'AUTH0_AUDIENCE'
  | 'NUXT_SESSION_SECRET'
  | 'DATABASE_URL'
  | 'BACKEND_API_URL'
  | 'NODE_ENV'

export function getAppRuntimeConfig() {
  return useRuntimeConfig()
}

async function getSecretStringViaExtension(secretId: string): Promise<string> {
  if (typeof globalThis.fetch !== 'function') {
    throw new Error('fetch is not available')
  }

  const url = new URL(`${EXTENSION_ENDPOINT}/secretsmanager/get`)
  url.searchParams.set('secretId', secretId)

  const headers: Record<string, string> = {}
  if (process.env.AWS_SESSION_TOKEN) {
    headers['X-Aws-Parameters-Secrets-Token'] = process.env.AWS_SESSION_TOKEN
  }

  const response = await globalThis.fetch(url.toString(), { headers })
  if (!response.ok) {
    throw new Error(
      `Extension request failed: ${response.status} ${response.statusText}`
    )
  }

  const data = (await response.json()) as SecretsManagerGetResponse
  if (!data.SecretString) {
    throw new Error(`SecretString is missing for secretId: ${secretId}`)
  }

  return data.SecretString
}

async function getSecretsManagerJson(
  secretId: string
): Promise<Record<string, string>> {
  const cached = secretJsonCache.get(secretId)
  if (cached) return cached

  const secretString = await getSecretStringViaExtension(secretId)
  let parsed: unknown
  try {
    parsed = JSON.parse(secretString) as unknown
  } catch {
    throw new Error(
      `Failed to parse SecretString JSON for secretId: ${secretId}`
    )
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `SecretString JSON is not an object for secretId: ${secretId}`
    )
  }

  const record = parsed as Record<string, unknown>
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      normalized[key] = value
    }
  }

  secretJsonCache.set(secretId, normalized)
  return normalized
}

export async function getSecretValue(
  key: SecretsManagerKey
): Promise<string | undefined> {
  const config = getAppRuntimeConfig()
  const useAws = config.useAws === true

  if (!useAws) {
    return process.env[key]
  }

  const secretId = config.secretId || process.env.SECRET_ID
  if (!secretId) {
    throw new Error('SECRET_ID is required when runtimeConfig.useAws is true')
  }

  const json = await getSecretsManagerJson(secretId)
  return json[key]
}

export async function getRequiredSecretValue(
  key: SecretsManagerKey
): Promise<string> {
  const value = await getSecretValue(key)
  if (!value) {
    throw new Error(`Missing secret value: ${key}`)
  }
  return value
}
