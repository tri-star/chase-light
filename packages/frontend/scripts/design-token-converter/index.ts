import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { DesignTokens, ParsedToken } from './types'
import { TokenParser } from './token-parser'
import { TailwindGenerator } from './tailwind-generator'

const DESIGN_TOKENS_PATH = '../../design-tokens.json'
const OUTPUT_DIR = '../../assets/css'

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * デザイントークンを各種形式に変換するメインクラス
 */
export class DesignTokenConverter {
  private readonly tokensPath: string
  private readonly outputDir: string

  constructor(tokensPath?: string, outputDir?: string) {
    this.tokensPath = tokensPath || join(__dirname, DESIGN_TOKENS_PATH)
    this.outputDir = outputDir || join(__dirname, OUTPUT_DIR)
  }

  /**
   * デザイントークンを変換して出力
   */
  async convert(): Promise<void> {
    try {
      console.log('🚀 デザイントークン変換を開始します...')

      // デザイントークンを読み込み
      const tokens = this.loadDesignTokens()
      console.log('✅ デザイントークンを読み込みました')

      // パース処理
      const flatTokens = TokenParser.flattenTokens(tokens)
      const parsedTokens = TokenParser.toCSSVars(flatTokens)
      const resolvedTokens = TokenParser.resolveReferences(parsedTokens)
      console.log(`✅ ${resolvedTokens.length}個のトークンを処理しました`)

      // 出力ディレクトリを作成
      this.ensureOutputDirectory()

      // Tailwind CSS ファイルを生成
      await this.generateTailwindCSS(resolvedTokens)

      console.log('🎉 すべての変換が完了しました!')
      console.log(`📁 出力先: ${this.outputDir}`)
    } catch (error) {
      console.error('❌ 変換処理でエラーが発生しました:', error)
      throw error
    }
  }

  /**
   * デザイントークンJSONファイルを読み込み
   */
  private loadDesignTokens(): DesignTokens {
    try {
      const jsonContent = readFileSync(this.tokensPath, 'utf-8')
      return JSON.parse(jsonContent) as DesignTokens
    } catch (error) {
      throw new Error(
        `デザイントークンファイルの読み込みに失敗しました: ${this.tokensPath}\n${error}`
      )
    }
  }

  /**
   * 出力ディレクトリを確保
   */
  private ensureOutputDirectory(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }
  }

  /**
   * Tailwind CSS ファイルを生成
   */
  private async generateTailwindCSS(tokens: ParsedToken[]): Promise<void> {
    const tailwindCSS = TailwindGenerator.generateTailwindCSS(tokens)
    const cssPath = join(this.outputDir, 'tailwind.css')
    writeFileSync(cssPath, tailwindCSS, 'utf-8')
    console.log(`✅ Tailwind CSS を出力しました: ${cssPath}`)
  }
}

// CLIから直接実行された場合
// Note: ES modules don't have require.main, use import.meta instead
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  const converter = new DesignTokenConverter()
  converter.convert().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

// 型をエクスポート（テスト用）
export type { ParsedToken } from './types'
