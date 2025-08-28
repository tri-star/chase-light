import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { vol } from 'memfs'
import type { DesignTokens } from '../types'

// Mock fs module to use memfs
vi.mock('fs', async () => {
  const memfs = await import('memfs')
  return {
    ...memfs.fs,
    default: memfs.fs,
  }
})

// Mock path.join and path.dirname for memfs compatibility
vi.mock('path', async () => {
  const actualPath = await vi.importActual('path')
  return {
    ...actualPath,
    join: (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
    dirname: (path: string) => {
      const parts = path.split('/')
      return parts.slice(0, -1).join('/') || '/'
    },
  }
})

// Import DesignTokenConverter after mocking fs
const { DesignTokenConverter } = await import('../index')

describe('DesignTokenConverter', () => {
  const mockTokens: DesignTokens = {
    $schema:
      'https://design-tokens.github.io/community-group/format/tokens.json',
    color: {
      $type: 'color',
      primitive: {
        blue: {
          '500': { value: 'oklch(53.992% 0.19058 257.48)' },
        },
      },
      semantic: {
        light: {
          content: {
            default: {
              bg: { value: '{color.primitive.blue.500}' },
            },
          },
        },
        dark: {
          content: {
            default: {
              bg: { value: '{color.primitive.blue.500}' },
            },
          },
        },
      },
    },
    spacing: {
      $type: 'dimension',
      '4': { value: '1rem' },
    },
  }

  let converter: InstanceType<typeof DesignTokenConverter>
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset memfs volume and set up test files
    vol.reset()

    // Create test tokens file in memfs
    vol.fromJSON({
      './test-tokens.json': JSON.stringify(mockTokens),
    })

    converter = new DesignTokenConverter('./test-tokens.json', './test-output')
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    // Clean up memfs volume
    vol.reset()
    vi.clearAllMocks()
    consoleSpy.mockRestore()
  })

  describe('convert', () => {
    test('トークンの変換が正常に実行される', async () => {
      await converter.convert()

      // memfsに出力ファイルが作成されていることを確認
      const files = vol.toJSON()
      const cssPath = Object.keys(files).find((path) =>
        path.includes('tailwind.css')
      )
      expect(cssPath).toBeDefined()

      const cssContent = files[cssPath!]
      expect(cssContent).toContain('@import "tailwindcss"')
      expect(cssContent).toContain('@theme {')

      // コンソールログが出力されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚀 デザイントークン変換を開始します...'
      )
    })

    test('出力ディレクトリが存在しない場合に作成される', async () => {
      // memfsは自動的にディレクトリを作成する
      await converter.convert()

      // ファイル付きの出力ディレクトリが作成されることを確認
      const files = vol.toJSON()
      const cssPath = Object.keys(files).find((path) =>
        path.includes('tailwind.css')
      )
      expect(cssPath).toBeDefined()
    })

    test('デザイントークンを含むCSSが生成される', async () => {
      await converter.convert()

      const files = vol.toJSON()
      const cssPath = Object.keys(files).find((path) =>
        path.includes('tailwind.css')
      )
      const cssContent = files[cssPath!]
      expect(cssContent).toContain('@import "tailwindcss"')
      expect(cssContent).toContain('@theme {')
      expect(cssContent).toContain(
        '--color-primitive-blue-500: oklch(53.992% 0.19058 257.48)'
      )
    })

    test('リセット変数を含むCSSが生成される', async () => {
      await converter.convert()

      const files = vol.toJSON()
      const cssPath = Object.keys(files).find((path) =>
        path.includes('tailwind.css')
      )
      const cssContent = files[cssPath!]
      expect(cssContent).toContain('--color-*: initial;')
      expect(cssContent).toContain('--font-*: initial;')
      expect(cssContent).toContain('--spacing-*: initial;')
    })

    test('ファイル読み取りエラーが適切に処理される', async () => {
      // テストトークンファイルを削除してファイル不存在をシミュレート
      vol.reset()

      await expect(converter.convert()).rejects.toThrow(
        'デザイントークンファイルの読み込みに失敗しました'
      )
    })

    test('不正なJSONが適切に処理される', async () => {
      // 不正なJSONコンテンツを設定
      vol.reset()
      vol.fromJSON({
        './test-tokens.json': 'invalid json',
      })

      await expect(converter.convert()).rejects.toThrow()
    })
  })

  describe('constructor', () => {
    test('引数なしでデフォルトパスが使用される', () => {
      const defaultConverter = new DesignTokenConverter()

      // プライベートプロパティは直接テストできないが、動作をテストできる
      expect(defaultConverter).toBeInstanceOf(DesignTokenConverter)
    })

    test('指定されたパスが使用される', () => {
      const customConverter = new DesignTokenConverter(
        './custom.json',
        './custom-output'
      )

      expect(customConverter).toBeInstanceOf(DesignTokenConverter)
    })
  })

  describe('integration', () => {
    test('トークン参照が正しく解決される', async () => {
      await converter.convert()

      // 生成されたCSSでトークン参照が解決されていることを確認
      const files = vol.toJSON()
      const cssPath = Object.keys(files).find((path) =>
        path.includes('tailwind.css')
      )
      const cssContent = files[cssPath!]

      // セマンティックトークンが実際の値に解決されていることを確認
      expect(cssContent).toContain(
        '--background-color-content-default: oklch(53.992% 0.19058 257.48)'
      )
    })

    test('ネストした参照が正しく解決される', async () => {
      // ネストした参照を持つトークンセットを用意
      const nestedTokens: DesignTokens = {
        $schema:
          'https://design-tokens.github.io/community-group/format/tokens.json',
        color: {
          $type: 'color',
          primitive: { blue: { '500': { value: 'oklch(blue)' } } },
          alias: { primary: { value: '{color.primitive.blue.500}' } },
          semantic: {
            light: {
              primary: { bg: { value: '{color.alias.primary}' } },
            },
          },
        },
      }

      // テスト用のファイルを作成
      vol.reset()
      vol.fromJSON({
        './nested-test-tokens.json': JSON.stringify(nestedTokens),
      })

      const nestedConverter = new DesignTokenConverter(
        './nested-test-tokens.json',
        './nested-test-output'
      )

      await nestedConverter.convert()

      const files = vol.toJSON()
      const cssPath = Object.keys(files).find((path) =>
        path.includes('tailwind.css')
      )
      const cssContent = files[cssPath!]

      // ネストした参照が最終的に解決されていることを確認
      expect(cssContent).toContain('--color-primitive-blue-500: oklch(blue)')
      expect(cssContent).toContain('--color-alias-primary: oklch(blue)')
      expect(cssContent).toContain('--background-color-primary: oklch(blue)')
    })

    test('すべてのデザイントークンが処理される', async () => {
      await converter.convert()

      const files = vol.toJSON()
      const cssPath = Object.keys(files).find((path) =>
        path.includes('tailwind.css')
      )
      const cssContent = files[cssPath!]

      // すべてのトークンが存在することを確認
      expect(cssContent).toContain('--color-primitive-blue-500')
      expect(cssContent).toContain('--background-color-content-default')
      expect(cssContent).toContain('--spacing-4')
    })
  })
})
