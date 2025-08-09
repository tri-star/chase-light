import { config } from 'dotenv'
import { defineConfig } from 'orval'

// .env ファイルをロード
config()

export default defineConfig({
  backend: {
    input: {
      target: 'http://localhost:3001/doc',
    },
    output: {
      target: './generated/api/backend.ts',
      client: 'fetch',
      schemas: './generated/api/schemas',
      mode: 'split',
      baseUrl: process.env.BACKEND_API_URL || 'missing backend url',
      mock: {
        type: 'msw',
        delay: false,
      },
      override: {
        mutator: {
          path: './generated/api/mutator.ts',
          name: 'customFetch',
        },
      },
    },
  },
  backendZod: {
    input: {
      target: 'http://localhost:3001/doc',
    },
    output: {
      target: './generated/api/zod',
      client: 'zod',
      fileExtension: '.zod.ts',
      mode: 'split',
    },
  },
})
