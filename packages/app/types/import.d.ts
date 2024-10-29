/// <reference types="vite/client" />

interface ImportMetaEnv {
  NUXT_PUBLIC_AUTH0_DOMAIN: string
  NUXT_PUBLIC_AUTH0_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
