import { describe, test, expect } from 'vitest'
import { TailwindGenerator } from '../tailwind-generator'
import type { ParsedToken, ThemedTokens } from '../types'

describe('TailwindGenerator', () => {
  const mockTokens: ParsedToken[] = [
    {
      cssVarName: '--color-primitive-blue-500',
      originalPath: ['color', 'primitive', 'blue', '500'],
      value: 'oklch(53.992% 0.19058 257.48)',
      type: 'color',
    },
    {
      cssVarName: '--spacing-4',
      originalPath: ['spacing', '4'],
      value: '1rem',
      type: 'dimension',
    },
    {
      cssVarName: '--radius-default',
      originalPath: ['radius', 'default'],
      value: '0.25rem',
      type: 'dimension',
    },
  ]

  const mockThemedTokens: ThemedTokens = {
    light: [
      {
        cssVarName: '--color-semantic-primary',
        originalPath: ['color', 'semantic', 'primary'],
        value: 'oklch(53.992% 0.19058 257.48)',
        type: 'color',
      },
      {
        cssVarName: '--typography-scale-base',
        originalPath: ['typography', 'scale', 'base'],
        value: '400 1rem/1.5 sans-serif',
        type: 'typography',
      },
    ],
    dark: [
      {
        cssVarName: '--color-semantic-primary',
        originalPath: ['color', 'semantic', 'primary'],
        value: 'oklch(73.111% 0.14618 248.34)',
        type: 'color',
      },
      {
        cssVarName: '--typography-scale-base',
        originalPath: ['typography', 'scale', 'base'],
        value: '400 1rem/1.5 sans-serif',
        type: 'typography',
      },
    ],
  }

  describe('generateThemedTailwindCSS', () => {
    test('@theme static形式でライトテーマのTailwind CSSが生成される', () => {
      const result =
        TailwindGenerator.generateThemedTailwindCSS(mockThemedTokens)

      expect(result).toContain('@import "tailwindcss";')
      expect(result).toContain('@theme static {')
      expect(result).toContain(
        '--color-semantic-primary: oklch(53.992% 0.19058 257.48);'
      )
      expect(result).toContain(
        '--typography-scale-base: 400 1rem/1.5 sans-serif;'
      )
    })

    test('ダークテーマでセマンティックトークンが上書きされる', () => {
      const result =
        TailwindGenerator.generateThemedTailwindCSS(mockThemedTokens)

      expect(result).toContain(':root[data-theme="dark"] {')
      expect(result).toContain(
        '--color-semantic-primary: oklch(73.111% 0.14618 248.34);'
      )
    })

    test('@utilityディレクティブが含まれる', () => {
      const result =
        TailwindGenerator.generateThemedTailwindCSS(mockThemedTokens)

      expect(result).toContain('@utility font-scale-* {')
      expect(result).toContain('font: --value(--typography-scale-*);')
      expect(result).toContain('@utility font-semantic-* {')
      expect(result).toContain('font: --value(--typography-semantic-*);')
    })

    test('リセット変数が含まれる', () => {
      const result =
        TailwindGenerator.generateThemedTailwindCSS(mockThemedTokens)

      expect(result).toContain('--color-*: initial;')
      expect(result).toContain('--font-*: initial;')
      expect(result).toContain('--spacing-*: initial;')
    })
  })

  describe('generateTailwindCSS', () => {
    test('@theme形式のTailwind CSSが生成される', () => {
      const result = TailwindGenerator.generateTailwindCSS(mockTokens)

      expect(result).toContain('@import "tailwindcss";')
      expect(result).toContain('@theme {')
      expect(result).toContain(
        '--color-primitive-blue-500: oklch(53.992% 0.19058 257.48);'
      )
      expect(result).toContain('--spacing-4: 1rem;')
      expect(result).toContain('}')
    })

    test('リセット変数が含まれる', () => {
      const result = TailwindGenerator.generateTailwindCSS(mockTokens)

      expect(result).toContain('--color-*: initial;')
      expect(result).toContain('--font-*: initial;')
      expect(result).toContain('--spacing-*: initial;')
    })
  })

  describe('generateTailwindTheme', () => {
    test('ネストしたテーマオブジェクトが作成される', () => {
      const result = TailwindGenerator.generateTailwindTheme(mockTokens)

      expect(result).toHaveProperty('color')
      expect(result).toHaveProperty('spacing')
      expect(result).toHaveProperty('radius')
      expect(
        (result.color as Record<string, Record<string, Record<string, string>>>)
          .primitive.blue['500']
      ).toBe('var(--color-primitive-blue-500)')
    })
  })

  describe('generateTailwindConfig', () => {
    test('有効なTailwind設定が生成される', () => {
      const result = TailwindGenerator.generateTailwindConfig(mockTokens)

      expect(result).toContain("/** @type {import('tailwindcss').Config} */")
      expect(result).toContain('export default {')
      expect(result).toContain('content: [')
      expect(result).toContain('theme: {')
      expect(result).toContain('extend:')
    })

    test('content配列に一般的なファイルパターンが含まれる', () => {
      const result = TailwindGenerator.generateTailwindConfig(mockTokens)

      expect(result).toContain('./components/**/*.{js,vue,ts}')
      expect(result).toContain('./pages/**/*.vue')
      expect(result).toContain('./app.vue')
    })
  })

  describe('generateDetailedCSS', () => {
    test('カテゴリコメント付きCSSが生成される', () => {
      const result = TailwindGenerator.generateDetailedCSS(mockTokens)

      expect(result).toContain('/* COLOR */')
      expect(result).toContain('/* SPACING */')
      expect(result).toContain('/* RADIUS */')
    })
  })

  describe('generateUtilityMapping', () => {
    test('ユーティリティクラスマッピングが生成される', () => {
      const colorToken: ParsedToken = {
        cssVarName: '--color-primitive-blue-500',
        originalPath: ['color', 'primitive', 'blue', '500'],
        value: 'oklch(53.992% 0.19058 257.48)',
        type: 'color',
      }

      const result = TailwindGenerator.generateUtilityMapping([colorToken])

      expect(result).toHaveProperty('text-blue-500')
      expect(result).toHaveProperty('bg-blue-500')
      expect(result).toHaveProperty('border-blue-500')
      expect(result['text-blue-500']).toBe('var(--color-primitive-blue-500)')
    })

    test('spacingトークンが処理される', () => {
      const spacingToken: ParsedToken = {
        cssVarName: '--spacing-4',
        originalPath: ['spacing', '4'],
        value: '1rem',
        type: 'dimension',
      }

      const result = TailwindGenerator.generateUtilityMapping([spacingToken])

      expect(result).toHaveProperty('p-4')
      expect(result).toHaveProperty('m-4')
    })

    test('sizeトークンが処理される', () => {
      const sizeToken: ParsedToken = {
        cssVarName: '--size-full',
        originalPath: ['size', 'full'],
        value: '100%',
        type: 'dimension',
      }

      const result = TailwindGenerator.generateUtilityMapping([sizeToken])

      expect(result).toHaveProperty('w-full')
      expect(result).toHaveProperty('h-full')
    })
  })
})
