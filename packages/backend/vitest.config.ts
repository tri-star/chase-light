import { defineConfig } from "vitest/config"
import { config } from "dotenv"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    setupFiles: ["./src/test/setup.ts"],
    env: {
      // テスト実行時に.env.testingファイルを読み込み
      ...config({ path: ".env.testing" }).parsed,
    },
  },
})
