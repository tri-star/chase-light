import { describe, it, expect } from 'vitest'
import { TailwindGenerator } from '../tailwind-generator'
import type { ParsedToken } from '../types'

describe('TailwindGenerator', () => {
  const mockTokens: ParsedToken[] = [
    {
      cssVarName: '--color-primitive-blue-500',
      originalPath: ['color', 'primitive', 'blue', '500'],
      value: 'oklch(53.992% 0.19058 257.48)',
      type: 'color'
    },
    {
      cssVarName: '--spacing-4',
      originalPath: ['spacing', '4'],
      value: '1rem',
      type: 'dimension'
    },
    {
      cssVarName: '--radius-default',
      originalPath: ['radius', 'default'],
      value: '0.25rem',
      type: 'dimension'
    }
  ]

  describe('generateTailwindCSS', () => {
    it('should generate Tailwind CSS with @theme inline format', () => {
      const result = TailwindGenerator.generateTailwindCSS(mockTokens)
      
      expect(result).toContain('@import "tailwindcss";')
      expect(result).toContain('@theme inline {')
      expect(result).toContain('--color-primitive-blue-500: oklch(53.992% 0.19058 257.48);')
      expect(result).toContain('--spacing-4: 1rem;')
      expect(result).toContain('}')
    })

    it('should include reset variables', () => {
      const result = TailwindGenerator.generateTailwindCSS(mockTokens)
      
      expect(result).toContain('--color-*: initial;')
      expect(result).toContain('--font-*: initial;')
      expect(result).toContain('--spacing-*: initial;')
    })
  })

  describe('generateTailwindTheme', () => {
    it('should create nested theme object', () => {
      const result = TailwindGenerator.generateTailwindTheme(mockTokens)
      
      expect(result).toHaveProperty('color')
      expect(result).toHaveProperty('spacing')
      expect(result).toHaveProperty('radius')
      expect(result.color.primitive.blue['500']).toBe('var(--color-primitive-blue-500)')
    })
  })

  describe('generateTailwindConfig', () => {
    it('should generate valid Tailwind config', () => {
      const result = TailwindGenerator.generateTailwindConfig(mockTokens)
      
      expect(result).toContain('/** @type {import(\'tailwindcss\').Config} */')
      expect(result).toContain('export default {')
      expect(result).toContain('content: [')
      expect(result).toContain('theme: {')
      expect(result).toContain('extend:')
    })

    it('should include common file patterns in content array', () => {
      const result = TailwindGenerator.generateTailwindConfig(mockTokens)
      
      expect(result).toContain('./components/**/*.{js,vue,ts}')
      expect(result).toContain('./pages/**/*.vue')
      expect(result).toContain('./app.vue')
    })
  })

  describe('generateDetailedCSS', () => {
    it('should generate CSS with category comments', () => {
      const result = TailwindGenerator.generateDetailedCSS(mockTokens)
      
      expect(result).toContain('/* COLOR */')
      expect(result).toContain('/* SPACING */')
      expect(result).toContain('/* RADIUS */')
    })
  })

  describe('generateUtilityMapping', () => {
    it('should generate utility class mappings', () => {
      const colorToken: ParsedToken = {
        cssVarName: '--color-primitive-blue-500',
        originalPath: ['color', 'primitive', 'blue', '500'],
        value: 'oklch(53.992% 0.19058 257.48)',
        type: 'color'
      }
      
      const result = TailwindGenerator.generateUtilityMapping([colorToken])
      
      expect(result).toHaveProperty('text-blue-500')
      expect(result).toHaveProperty('bg-blue-500')
      expect(result).toHaveProperty('border-blue-500')
      expect(result['text-blue-500']).toBe('var(--color-primitive-blue-500)')
    })

    it('should handle spacing tokens', () => {
      const spacingToken: ParsedToken = {
        cssVarName: '--spacing-4',
        originalPath: ['spacing', '4'],
        value: '1rem',
        type: 'dimension'
      }
      
      const result = TailwindGenerator.generateUtilityMapping([spacingToken])
      
      expect(result).toHaveProperty('p-4')
      expect(result).toHaveProperty('m-4')
    })

    it('should handle size tokens', () => {
      const sizeToken: ParsedToken = {
        cssVarName: '--size-full',
        originalPath: ['size', 'full'],
        value: '100%',
        type: 'dimension'
      }
      
      const result = TailwindGenerator.generateUtilityMapping([sizeToken])
      
      expect(result).toHaveProperty('w-full')
      expect(result).toHaveProperty('h-full')
    })
  })
})