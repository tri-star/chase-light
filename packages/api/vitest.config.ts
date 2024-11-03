import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    watch: false,
    include: ["./src/**/*.test.ts"],
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    setupFiles: ["./src/lib/vitest/setup-test-db.ts"],
    hookTimeout: 100 * 1000,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
})
