import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DesignTokenConverter } from '../index'
import type { DesignTokens } from '../types'

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(), 
  mkdirSync: vi.fn(),
  existsSync: vi.fn()
}))

// Import the mocked functions after the mock declaration
const { readFileSync, writeFileSync, mkdirSync, existsSync } = await import('fs')

const mockReadFileSync = vi.mocked(readFileSync)
const mockWriteFileSync = vi.mocked(writeFileSync)
const mockMkdirSync = vi.mocked(mkdirSync)
const mockExistsSync = vi.mocked(existsSync)

describe('DesignTokenConverter', () => {
  const mockTokens: DesignTokens = {
    $schema: 'https://design-tokens.github.io/community-group/format/tokens.json',
    color: {
      $type: 'color',
      primitive: {
        blue: {
          '500': { value: 'oklch(53.992% 0.19058 257.48)' }
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
      '4': { value: '1rem' }
    }
  }

  let converter: DesignTokenConverter
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    converter = new DesignTokenConverter('./test-tokens.json', './test-output')
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Mock file system
    mockReadFileSync.mockReturnValue(JSON.stringify(mockTokens))
    mockExistsSync.mockReturnValue(false)
    mockWriteFileSync.mockImplementation(() => {})
    mockMkdirSync.mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockRestore()
  })

  describe('convert', () => {
    it('should successfully convert tokens', async () => {
      await converter.convert()
      
      // Verify that files were read
      expect(mockReadFileSync).toHaveBeenCalledWith('./test-tokens.json', 'utf-8')
      
      // Verify that output directory was created
      expect(mockMkdirSync).toHaveBeenCalledWith('./test-output', { recursive: true })
      
      // Verify that all output files were written
      expect(mockWriteFileSync).toHaveBeenCalledTimes(5) // CSS, detailed CSS, config, HTML, manifest
      
      // Verify console logs
      expect(consoleSpy).toHaveBeenCalledWith('🚀 デザイントークン変換を開始します...')
      expect(consoleSpy).toHaveBeenCalledWith('🎉 すべての変換が完了しました!')
    })

    it('should create output directory if it does not exist', async () => {
      mockExistsSync.mockReturnValue(false)
      
      await converter.convert()
      
      expect(mockMkdirSync).toHaveBeenCalledWith('./test-output', { recursive: true })
    })

    it('should not create output directory if it already exists', async () => {
      mockExistsSync.mockReturnValue(true)
      
      await converter.convert()
      
      expect(mockMkdirSync).not.toHaveBeenCalled()
    })

    it('should generate CSS variables file', async () => {
      await converter.convert()
      
      const cssCall = (mockWriteFileSync as any).mock.calls.find((call: any) => 
        call[0].endsWith('design-tokens.css')
      )
      expect(cssCall).toBeDefined()
      expect(cssCall[1]).toContain(':root {')
      expect(cssCall[1]).toContain('--color-primitive-blue-500')
    })

    it('should generate detailed CSS file with comments', async () => {
      await converter.convert()
      
      const detailedCssCall = (mockWriteFileSync as any).mock.calls.find((call: any) => 
        call[0].endsWith('design-tokens-detailed.css')
      )
      expect(detailedCssCall).toBeDefined()
      expect(detailedCssCall[1]).toContain('/* COLOR */')
    })

    it('should generate Tailwind config file', async () => {
      await converter.convert()
      
      const configCall = (mockWriteFileSync as any).mock.calls.find((call: any) => 
        call[0].endsWith('tailwind.config.js')
      )
      expect(configCall).toBeDefined()
      expect(configCall[1]).toContain('export default {')
      expect(configCall[1]).toContain('theme: {')
    })

    it('should generate HTML documentation', async () => {
      await converter.convert()
      
      const htmlCall = (mockWriteFileSync as any).mock.calls.find((call: any) => 
        call[0].endsWith('design-tokens-documentation.html')
      )
      expect(htmlCall).toBeDefined()
      expect(htmlCall[1]).toContain('<!DOCTYPE html>')
      expect(htmlCall[1]).toContain('Chase Light Design Tokens')
    })

    it('should generate manifest file', async () => {
      await converter.convert()
      
      const manifestCall = (mockWriteFileSync as any).mock.calls.find((call: any) => 
        call[0].endsWith('manifest.json')
      )
      expect(manifestCall).toBeDefined()
      
      const manifest = JSON.parse(manifestCall[1])
      expect(manifest).toHaveProperty('generatedAt')
      expect(manifest).toHaveProperty('totalTokens')
      expect(manifest).toHaveProperty('categories')
      expect(manifest).toHaveProperty('files')
      expect(manifest.files).toContain('design-tokens.css')
      expect(manifest.files).toContain('design-tokens-documentation.html')
    })

    it('should handle file read errors', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })
      
      await expect(converter.convert()).rejects.toThrow('デザイントークンファイルの読み込みに失敗しました')
    })

    it('should handle invalid JSON', async () => {
      mockReadFileSync.mockReturnValue('invalid json')
      
      await expect(converter.convert()).rejects.toThrow()
    })
  })

  describe('constructor', () => {
    it('should use default paths when no arguments provided', () => {
      const defaultConverter = new DesignTokenConverter()
      
      // We can't directly test private properties, but we can test the behavior
      expect(defaultConverter).toBeInstanceOf(DesignTokenConverter)
    })

    it('should use provided paths', () => {
      const customConverter = new DesignTokenConverter('./custom.json', './custom-output')
      
      expect(customConverter).toBeInstanceOf(DesignTokenConverter)
    })
  })

  describe('integration', () => {
    it('should resolve token references correctly', async () => {
      await converter.convert()
      
      // Find the manifest and check that references were resolved
      const manifestCall = (mockWriteFileSync as any).mock.calls.find((call: any) => 
        call[0].endsWith('manifest.json')
      )
      const manifest = JSON.parse(manifestCall[1])
      
      // Find the semantic color token
      const colorCategory = manifest.categories.find((cat: any) => cat.name === 'color')
      const semanticToken = colorCategory.tokens.find((token: any) => 
        token.name === 'color.semantic.primary.default.bg'
      )
      
      expect(semanticToken.value).toBe('oklch(53.992% 0.19058 257.48)')
    })

    it('should count tokens correctly', async () => {
      await converter.convert()
      
      const manifestCall = (mockWriteFileSync as any).mock.calls.find((call: any) => 
        call[0].endsWith('manifest.json')
      )
      const manifest = JSON.parse(manifestCall[1])
      
      expect(manifest.totalTokens).toBe(3) // blue.500, primary.bg, spacing.4
    })
  })
})