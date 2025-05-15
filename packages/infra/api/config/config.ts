import dotenv from 'dotenv'
export const stages = ['dev', 'stg', 'prod'] as const
export type Stage = (typeof stages)[number]

let config:
  | {
      tz: string
      apiUrl: string
      databaseUrl: string | undefined
      auth0Domain: string | undefined
      openAiApiKey: string | undefined
      awsRegion: string
    }
  | undefined = undefined

export function loadConfig(stage: Stage) {
  if (!config) {
    dotenv.config()

    const baseConfig = {
      dev: {
        tz: 'Asia/Tokyo',
        apiUrl: 'http://localhost:3001',
        databaseUrl: process.env.DATABASE_URL,
        auth0Domain: process.env.AUTH0_DOMAIN,
        openAiApiKey: process.env.OPENAI_API_KEY,
        awsRegion: 'ap-northeast-1',
      },
      stg: {
        tz: 'Asia/Tokyo',
        apiUrl: 'http://localhost:3001',
        databaseUrl: process.env.DATABASE_URL,
        auth0Domain: process.env.AUTH0_DOMAIN,
        openAiApiKey: process.env.OPENAI_API_KEY,
        awsRegion: 'ap-northeast-1',
      },
      prod: {
        tz: 'Asia/Tokyo',
        apiUrl: 'http://localhost:3001',
        databaseUrl: process.env.DATABASE_URL,
        auth0Domain: process.env.AUTH0_DOMAIN,
        openAiApiKey: process.env.OPENAI_API_KEY,
        awsRegion: 'ap-northeast-1',
      },
    }

    config = baseConfig[stage]
  }

  return structuredClone(config)
}
