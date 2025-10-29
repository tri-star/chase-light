import { config } from 'dotenv'
import { defineConfig } from 'orval'

// .env ファイルをロード
config()

export default defineConfig({
  backend: {
    input: {
      target: '../backend/openapi.json',
    },
    output: {
      target: './generated/api/backend.ts',
      client: 'fetch',
      schemas: './generated/api/schemas',
      mode: 'split',
      mock: {
        type: 'msw',
        delay: false,
      },
      override: {
        mutator: {
          path: './libs/orval/custom-fetch.ts',
          name: 'customFetch',
        },
      },
    },
  },
  backendZod: {
    input: {
      target: '../backend/openapi.json',
    },
    output: {
      target: './generated/api/zod',
      client: 'zod',
      fileExtension: '.zod.ts',
      mode: 'split',
    },
  },
})
