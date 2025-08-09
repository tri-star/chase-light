import { defineConfig } from 'orval'

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
      mock: {
        type: 'msw',
        output: './generated/api/mocks',
        delay: false,
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
    override: {
      mutator: {
        path: './generated/api/mutator.ts',
        name: 'customFetch',
      },
    },
  },
})
