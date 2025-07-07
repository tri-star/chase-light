import { defineConfig } from "vitest/config"
import { config } from "dotenv"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    setupFiles: ["./src/test/setup.ts"],
    // テストファイルを順次実行してデータベース競合状態を防ぐ
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    env: {
      // テスト実行時に.env.testingファイルを読み込み
      ...config({ path: ".env.testing" }).parsed,
    },
  },
})
