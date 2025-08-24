#!/usr/bin/env tsx

/**
 * デザイントークン変換スクリプト
 *
 * Usage:
 *   pnpm tsx scripts/design-token-converter/convert.ts
 *
 * または、引数でパスを指定:
 *   pnpm tsx scripts/design-token-converter/convert.ts ./custom-tokens.json ./custom-output
 */

import { DesignTokenConverter } from './index'

const main = async (): Promise<void> => {
  const [, , tokensPath, outputDir] = process.argv

  try {
    const converter = new DesignTokenConverter(tokensPath, outputDir)
    await converter.convert()
  } catch (error) {
    console.error('❌ 変換処理が失敗しました:')
    console.error(error)
    process.exit(1)
  }
}

main()
