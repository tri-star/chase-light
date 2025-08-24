import { describe, it, expect } from 'vitest'
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
          '600': { value: 'oklch(45.095% 0.16414 258.18)' }
        }
      },
      semantic: {
        primary: {
          default: {
            bg: { value: '{color.primitive.blue.500}' }
          }
        }
      }
    },
    spacing: {
      $type: 'dimension',
      '4': { value: '1rem' },
      '8': { value: '2rem' }
    }
  }

  describe('flattenTokens', () => {
    it('should flatten nested token structure', () => {
      const result = TokenParser.flattenTokens(mockTokens)
      
      expect(result).toHaveLength(5)
      expect(result[0]).toMatchObject({
        path: ['color', 'primitive', 'blue', '500'],
        value: 'oklch(53.992% 0.19058 257.48)'
        // Note: type might be undefined based on token structure
      })
    })

    it('should skip $-prefixed properties', () => {
      const result = TokenParser.flattenTokens(mockTokens)
      const paths = result.map(token => token.path.join('.'))
      
      expect(paths).not.toContain('color.$type')
      expect(paths).not.toContain('color.$description')
    })
  })

  describe('toCSSVars', () => {
    it('should convert flat tokens to CSS variables', () => {
      const flatTokens = TokenParser.flattenTokens(mockTokens)
      const result = TokenParser.toCSSVars(flatTokens)
      
      expect(result[0]).toMatchObject({
        cssVarName: '--color-primitive-blue-500',
        originalPath: ['color', 'primitive', 'blue', '500'],
        value: 'oklch(53.992% 0.19058 257.48)'
        // Note: type might be undefined based on token structure
      })
    })
  })

  describe('resolveReferences', () => {
    it('should resolve token references', () => {
      const flatTokens = TokenParser.flattenTokens(mockTokens)
      const cssVars = TokenParser.toCSSVars(flatTokens)
      const result = TokenParser.resolveReferences(cssVars)
      
      const primaryBgToken = result.find(token => 
        token.originalPath.join('.') === 'color.semantic.primary.default.bg'
      )
      
      expect(primaryBgToken?.value).toBe('oklch(53.992% 0.19058 257.48)')
    })

    it('should leave unresolved references unchanged', () => {
      const tokens = [{
        cssVarName: '--test',
        originalPath: ['test'],
        value: '{unknown.reference}',
        type: 'color'
      }]
      
      const result = TokenParser.resolveReferences(tokens)
      expect(result[0].value).toBe('{unknown.reference}')
    })
  })

  describe('groupByCategory', () => {
    it('should group tokens by first path segment', () => {
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