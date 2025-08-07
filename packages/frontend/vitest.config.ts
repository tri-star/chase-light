import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: [
      'tests/**/*.test.ts',
      '**/__tests__/**/*.test.ts',
      '**/*.nuxt.test.ts', // Nuxt環境用テストファイル
    ],
    globals: true,
    environment: 'nuxt', // デフォルトをNuxt環境に設定
  },
})
