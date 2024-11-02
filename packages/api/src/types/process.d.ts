declare namespace NodeJS {
  interface ProcessEnv {
    SERVERLESS_ACCESS_KEY: string
    DATABASE_URL: string
    DIRECT_URL: string
    AUTH0_DOMAIN: string
    OPENAI_API_KEY: string
  }
}
