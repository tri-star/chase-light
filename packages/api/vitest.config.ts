import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    watch: false,
    include: ["./src/**/*.test.ts"],
    globalSetup: ["./src/lib/vitest/global-setup-test-db.ts"],
    setupFiles: ["./src/lib/vitest/setup-test-db.ts"],
    hookTimeout: 100 * 1000,
    sequence: {
      hooks: "list",
    },
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
      },
    },
    maxConcurrency: 1,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
})
