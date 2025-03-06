import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    include: ['./src/**/*.test.ts'],
    setupFiles: ['./src/lib/vitest/setup-test-db.ts'],
    hookTimeout: 100 * 1000,
    sequence: {
      hooks: 'list',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
      },
    },
    maxConcurrency: 1,
    env: {
      DATABASE_URL: 'postgresql://test_user:secret@localhost:10000/test_db',
      DIRECT_URL: 'postgresql://test_user:secret@localhost:10000/test_db',
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
