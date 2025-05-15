declare namespace NodeJS {
  interface ProcessEnv {
    readonly DATABASE_URL: string | undefined
    readonly AUTH0_DOMAIN: string | undefined

    readonly OPENAI_API_KEY: string | undefined
  }
}
