import type {
  DesignTokens,
  TokenGroup,
  FlatToken,
  ParsedToken,
  ThemedTokens,
} from './types'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TokenParser {
  /**
   * デザイントークンJSONをフラットな配列に変換
   */
  static flattenTokens(tokens: DesignTokens): FlatToken[] {
    const result: FlatToken[] = []

    function traverse(
      obj: TokenGroup | DesignTokens,
      path: string[] = []
    ): void {
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) continue

        const currentPath = [...path, key]

        if (value && typeof value === 'object' && 'value' in value) {
          result.push({
            path: currentPath,
            value: value.value,
            type: (obj as TokenGroup).$type,
            description:
              (value as { description?: string }).description ||
              (obj as TokenGroup).$description,
          })
        } else if (value && typeof value === 'object' && !('value' in value)) {
          traverse(value as TokenGroup, currentPath)
        }
      }
    }

    traverse(tokens)
    return result
  }

  /**
   * フラットトークンをCSS変数形式に変換
   */
  static toCSSVars(flatTokens: FlatToken[]): ParsedToken[] {
    return flatTokens.map((token) => ({
      cssVarName: this.generateSemanticCSSVarName(token.path),
      originalPath: token.path,
      value: this.formatValue(token.value),
      type: token.type,
      description: token.description,
    }))
  }

  /**
   * セマンティックなCSS変数名を生成
   * bg/text/border用途に応じて適切なプレフィックスを付与
   */
  private static generateSemanticCSSVarName(path: string[]): string {
    // color.primitive.* の場合はそのまま
    if (path[0] === 'color' && path[1] === 'primitive') {
      return `--${path.join('-')}`
    }

    // color.semantic.* の場合は用途別にマッピング
    if (path[0] === 'color' && path[1] === 'semantic') {
      const lastSegment = path[path.length - 1]
      const pathWithoutLast = path.slice(2, -1) // 'color', 'semantic' を除く、最後の要素も除く

      // color.semantic.common.* の特別なマッピング
      if (pathWithoutLast[0] === 'common') {
        const statusType = pathWithoutLast[1] // info, success, warn, alert
        const variant = pathWithoutLast[2] // default, subtle, inversed
        switch (lastSegment) {
          case 'bg':
            return `--background-color-status-${statusType}-${variant}`
          case 'text':
            return `--text-color-status-${statusType}-${variant}`
          case 'border':
            return `--border-color-status-${statusType}-${variant}`
          default:
            return `--${path.join('-')}`
        }
      }

      // その他のsemanticトークンは通常のマッピング
      switch (lastSegment) {
        case 'bg':
          return `--background-color-${pathWithoutLast.join('-')}`
        case 'text':
          return `--text-color-${pathWithoutLast.join('-')}`
        case 'border':
          return `--border-color-${pathWithoutLast.join('-')}`
        default:
          return `--${path.join('-')}`
      }
    }

    // その他のトークンはそのまま
    return `--${path.join('-')}`
  }

  /**
   * トークン参照（{color.primitive.blue.500}など）を解決
   */
  static resolveReferences(tokens: ParsedToken[]): ParsedToken[] {
    const tokenMap = new Map<string, ParsedToken>()
    tokens.forEach((token) => {
      tokenMap.set(token.originalPath.join('.'), token)
    })

    const resolvedCache = new Map<string, string>()

    const resolve = (token: ParsedToken, path: string[] = []): string => {
      const key = token.originalPath.join('.')
      if (resolvedCache.has(key)) {
        return resolvedCache.get(key)!
      }
      if (path.includes(key)) {
        throw new Error(
          `Circular reference detected: ${[...path, key].join(' -> ')}`
        )
      }

      const referencePattern = /\{([^}]+)\}/g
      const resolvedValue = token.value.replace(
        referencePattern,
        (_, reference) => {
          const referencedToken = tokenMap.get(reference)
          if (referencedToken) {
            return resolve(referencedToken, [...path, key])
          }
          return `{${reference}}`
        }
      )

      resolvedCache.set(key, resolvedValue)
      return resolvedValue
    }

    return tokens.map((token) => ({
      ...token,
      value: resolve(token),
    }))
  }

  /**
   * 値を適切な形式にフォーマット
   */
  private static formatValue(
    value: string | number | string[] | boolean | Record<string, unknown>
  ): string {
    if (typeof value === 'string') {
      return value
    }

    if (Array.isArray(value)) {
      return value
        .map((v) => (typeof v === 'string' && v.includes(' ') ? v : v))
        .join(', ')
    }

    if (typeof value === 'object' && value !== null) {
      // typography やshadowなどの複合値
      if ('fontFamily' in value) {
        return `${value.fontWeight || 400} ${value.fontSize}/${value.lineHeight} ${value.fontFamily}`
      }

      if ('offsetX' in value && 'offsetY' in value) {
        return `${value.offsetX} ${value.offsetY} ${value.blur || 0} ${value.spread || 0} ${value.color}`
      }

      // その他のオブジェクト
      return JSON.stringify(value)
    }

    return String(value)
  }

  /**
   * テーマ別にデザイントークンを解析
   */
  static parseThemedTokens(tokens: DesignTokens): ThemedTokens {
    const lightTokens: FlatToken[] = []
    const darkTokens: FlatToken[] = []

    // color.semantic.light と color.semantic.dark を分離して解析
    if (tokens.color?.semantic) {
      const semanticTokens = tokens.color.semantic as TokenGroup

      if (semanticTokens.light) {
        const lightFlat = this.flattenTokens({
          color: {
            semantic: semanticTokens.light as TokenGroup,
          },
        })
        lightTokens.push(...lightFlat)
      }

      if (semanticTokens.dark) {
        const darkFlat = this.flattenTokens({
          color: {
            semantic: semanticTokens.dark as TokenGroup,
          },
        })
        darkTokens.push(...darkFlat)
      }
    }

    // プリミティブトークンや他のカテゴリも両方のテーマに含める
    const otherTokens = this.flattenTokens({
      ...tokens,
      color: {
        ...tokens.color,
        semantic: undefined, // セマンティックトークンは除外
      },
    })

    const lightParsed = this.toCSSVars([...lightTokens, ...otherTokens]).map(
      (token) => ({
        ...token,
        theme: 'light' as const,
      })
    )

    const darkParsed = this.toCSSVars([...darkTokens, ...otherTokens]).map(
      (token) => ({
        ...token,
        theme: 'dark' as const,
      })
    )

    // 参照解決
    const resolvedLight = this.resolveReferences(lightParsed)
    const resolvedDark = this.resolveReferences(darkParsed)

    return {
      light: resolvedLight,
      dark: resolvedDark,
    }
  }

  /**
   * カテゴリ別にトークンをグループ化
   */
  static groupByCategory(tokens: ParsedToken[]): Record<string, ParsedToken[]> {
    const groups: Record<string, ParsedToken[]> = {}

    tokens.forEach((token) => {
      const category = token.originalPath[0] || 'other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(token)
    })

    return groups
  }
}
