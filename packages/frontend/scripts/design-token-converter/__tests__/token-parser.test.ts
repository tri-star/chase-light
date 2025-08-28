import { describe, test, expect } from 'vitest'
import { TokenParser } from '../token-parser'
import type { DesignTokens } from '../types'

describe('TokenParser', () => {
  const mockTokens: DesignTokens = {
    color: {
      $type: 'color',
      $description: 'Color tokens',
      primitive: {
        blue: {
          '500': { value: 'oklch(53.992% 0.19058 257.48)' },
          '600': { value: 'oklch(45.095% 0.16414 258.18)' },
        },
      },
      semantic: {
        primary: {
          default: {
            bg: { value: '{color.primitive.blue.500}' },
          },
        },
      },
    },
    spacing: {
      $type: 'dimension',
      '4': { value: '1rem' },
      '8': { value: '2rem' },
    },
  }

  describe('flattenTokens', () => {
    test('ネストしたトークン構造がフラット化される', () => {
      const result = TokenParser.flattenTokens(mockTokens)

      expect(result).toHaveLength(5)
      expect(result[0]).toMatchObject({
        path: ['color', 'primitive', 'blue', '500'],
        value: 'oklch(53.992% 0.19058 257.48)',
        // Note: type might be undefined based on token structure
      })
    })

    test('$で始まるプロパティがスキップされる', () => {
      const result = TokenParser.flattenTokens(mockTokens)
      const paths = result.map((token) => token.path.join('.'))

      expect(paths).not.toContain('color.$type')
      expect(paths).not.toContain('color.$description')
    })
  })

  describe('toCSSVars', () => {
    test('フラットトークンがCSS変数に変換される', () => {
      const flatTokens = TokenParser.flattenTokens(mockTokens)
      const result = TokenParser.toCSSVars(flatTokens)

      expect(result[0]).toMatchObject({
        cssVarName: '--color-primitive-blue-500',
        originalPath: ['color', 'primitive', 'blue', '500'],
        value: 'oklch(53.992% 0.19058 257.48)',
        // Note: type might be undefined based on token structure
      })
    })

    test('color.semantic.common.*が正しくマッピングされる', () => {
      const commonTokens: DesignTokens = {
        color: {
          $type: 'color',
          semantic: {
            common: {
              info: {
                default: {
                  bg: { value: 'oklch(info-bg)' },
                  text: { value: 'oklch(info-text)' },
                  border: { value: 'oklch(info-border)' },
                },
              },
              success: {
                default: {
                  bg: { value: 'oklch(success-bg)' },
                },
              },
              warn: {
                default: {
                  bg: { value: 'oklch(warn-bg)' },
                },
                subtle: {
                  bg: { value: 'oklch(warn-subtle-bg)' },
                },
              },
            },
          },
        },
      }

      const flatTokens = TokenParser.flattenTokens(commonTokens)
      const result = TokenParser.toCSSVars(flatTokens)

      // color.semantic.common.info.default.bg -> --background-color-status-info-default
      const infoBg = result.find(
        (token) =>
          token.originalPath.join('.') ===
          'color.semantic.common.info.default.bg'
      )
      expect(infoBg?.cssVarName).toBe('--background-color-status-info-default')

      // color.semantic.common.info.default.text -> --text-color-status-info-default
      const infoText = result.find(
        (token) =>
          token.originalPath.join('.') ===
          'color.semantic.common.info.default.text'
      )
      expect(infoText?.cssVarName).toBe('--text-color-status-info-default')

      // color.semantic.common.success.default.bg -> --background-color-status-success-default
      const successBg = result.find(
        (token) =>
          token.originalPath.join('.') ===
          'color.semantic.common.success.default.bg'
      )
      expect(successBg?.cssVarName).toBe(
        '--background-color-status-success-default'
      )

      // color.semantic.common.warn.subtle.bg -> --background-color-status-warn-subtle
      const warnSubtleBg = result.find(
        (token) =>
          token.originalPath.join('.') ===
          'color.semantic.common.warn.subtle.bg'
      )
      expect(warnSubtleBg?.cssVarName).toBe(
        '--background-color-status-warn-subtle'
      )
    })
  })

  describe('resolveReferences', () => {
    test('トークン参照が解決される', () => {
      const flatTokens = TokenParser.flattenTokens(mockTokens)
      const cssVars = TokenParser.toCSSVars(flatTokens)
      const result = TokenParser.resolveReferences(cssVars)

      const primaryBgToken = result.find(
        (token) =>
          token.originalPath.join('.') === 'color.semantic.primary.default.bg'
      )

      expect(primaryBgToken?.value).toBe('oklch(53.992% 0.19058 257.48)')
    })

    test('ネストした参照が解決される', () => {
      const nestedTokens: DesignTokens = {
        color: {
          $type: 'color',
          primitive: { blue: { '500': { value: 'oklch(blue)' } } },
          alias: { primary: { value: '{color.primitive.blue.500}' } },
          semantic: { primary: { bg: { value: '{color.alias.primary}' } } },
        },
      }

      const flatTokens = TokenParser.flattenTokens(nestedTokens)
      const cssVars = TokenParser.toCSSVars(flatTokens)
      const result = TokenParser.resolveReferences(cssVars)

      const semanticToken = result.find(
        (token) => token.originalPath.join('.') === 'color.semantic.primary.bg'
      )
      const aliasToken = result.find(
        (token) => token.originalPath.join('.') === 'color.alias.primary'
      )

      expect(semanticToken?.value).toBe('oklch(blue)')
      expect(aliasToken?.value).toBe('oklch(blue)')
    })

    test('循環参照を検出する', () => {
      const circularTokens = [
        {
          cssVarName: '--token-a',
          originalPath: ['token', 'a'],
          value: '{token.b}',
          type: 'color',
        },
        {
          cssVarName: '--token-b',
          originalPath: ['token', 'b'],
          value: '{token.a}',
          type: 'color',
        },
      ]

      expect(() => TokenParser.resolveReferences(circularTokens)).toThrow(
        'Circular reference detected'
      )
    })

    test('解決できない参照は変更されない', () => {
      const tokens = [
        {
          cssVarName: '--test',
          originalPath: ['test'],
          value: '{unknown.reference}',
          type: 'color',
        },
      ]

      const result = TokenParser.resolveReferences(tokens)
      expect(result[0].value).toBe('{unknown.reference}')
    })
  })

  describe('groupByCategory', () => {
    test('トークンが最初のパスセグメントごとにグループ化される', () => {
      const flatTokens = TokenParser.flattenTokens(mockTokens)
      const cssVars = TokenParser.toCSSVars(flatTokens)
      const result = TokenParser.groupByCategory(cssVars)

      expect(result).toHaveProperty('color')
      expect(result).toHaveProperty('spacing')
      expect(result.color).toHaveLength(3)
      expect(result.spacing).toHaveLength(2)
    })
  })
})
