declare namespace NodeJS {
  interface ProcessEnv {
    STAGE: string
    SERVERLESS_ACCESS_KEY: string
    DATABASE_URL: string
    DIRECT_URL: string
    AUTH0_DOMAIN: string
    AUTH0_AUDIENCE: string
    OPENAI_API_KEY: string

    ANALYZE_FEED_LOG_QUEUE_URL: string
  }
}
