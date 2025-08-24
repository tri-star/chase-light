import type { DesignTokens, TokenGroup, FlatToken, ParsedToken } from './types'

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
      cssVarName: `--${token.path.join('-')}`,
      originalPath: token.path,
      value: this.formatValue(token.value),
      type: token.type,
      description: token.description,
    }))
  }

  /**
   * トークン参照（{color.primitive.blue.500}など）を解決
   */
  static resolveReferences(tokens: ParsedToken[]): ParsedToken[] {
    const tokenMap = new Map<string, string>()

    // まず全トークンをマップに登録
    tokens.forEach((token) => {
      const key = token.originalPath.join('.')
      tokenMap.set(key, token.value)
    })

    // 参照を解決
    return tokens.map((token) => {
      let value = token.value

      // {xxx.yyy.zzz} 形式の参照を解決（不正な閉じ括弧 ) にも対応）
      const referencePattern = /\{([^}]+)[})]/g
      value = value.replace(referencePattern, (match, reference) => {
        const resolvedValue = tokenMap.get(reference)
        return resolvedValue || match
      })

      return {
        ...token,
        value,
      }
    })
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
