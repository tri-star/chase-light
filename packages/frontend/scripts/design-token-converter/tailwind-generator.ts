import type { ParsedToken, ThemedTokens } from './types'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TailwindGenerator {
  /**
   * テーマ別Tailwind CSS生成
   */
  static generateThemedTailwindCSS(themedTokens: ThemedTokens): string {
    // デフォルトのリセット用変数を生成
    const resetVars = this.generateResetVariables()

    // ライトテーマ（デフォルト）のCSS変数
    const lightTokenVars = themedTokens.light
      .map((token) => `  ${token.cssVarName}: ${token.value};`)
      .join('\n')

    // ダークテーマで上書きするセマンティックトークンのみを抽出
    const darkOverrideTokens = themedTokens.dark.filter(
      (token) =>
        token.originalPath.length > 1 &&
        token.originalPath[0] === 'color' &&
        token.originalPath[1] === 'semantic'
    )

    // ダークテーマのCSS変数
    const darkTokenVars = darkOverrideTokens
      .map((token) => `  ${token.cssVarName}: ${token.value};`)
      .join('\n')

    return `@import "tailwindcss";

@theme {
${resetVars}

${lightTokenVars}
}

:root[data-theme="dark"] {
${darkTokenVars}
}`
  }

  /**
   * Storybook用のTailwind CSS生成（JIT無効化・静的生成）
   */
  static generateStorybookTailwindCSS(themedTokens: ThemedTokens): string {
    // デフォルトのリセット用変数を生成
    const resetVars = this.generateResetVariables()

    // ライトテーマ（デフォルト）のCSS変数
    const lightTokenVars = themedTokens.light
      .map((token) => `  ${token.cssVarName}: ${token.value};`)
      .join('\n')

    // ダークテーマで上書きするセマンティックトークンのみを抽出
    const darkOverrideTokens = themedTokens.dark.filter(
      (token) =>
        token.originalPath.length > 1 &&
        token.originalPath[0] === 'color' &&
        token.originalPath[1] === 'semantic'
    )

    // ダークテーマのCSS変数
    const darkTokenVars = darkOverrideTokens
      .map((token) => `  ${token.cssVarName}: ${token.value};`)
      .join('\n')

    return `@import "tailwindcss";

@theme static {
${resetVars}

${lightTokenVars}
}

.dark {
${darkTokenVars}
}`
  }

  /**
   * Tailwind CSS @theme形式でCSSを生成（後方互換性）
   */
  static generateTailwindCSS(tokens: ParsedToken[]): string {
    // デフォルトのリセット用変数を生成
    const resetVars = this.generateResetVariables()

    // デザイントークンをCSS変数に変換
    const tokenVars = tokens
      .map((token) => `  ${token.cssVarName}: ${token.value};`)
      .join('\n')

    return `@import "tailwindcss";

@theme {
${resetVars}

${tokenVars}
}`
  }

  /**
   * デフォルト値をリセットするCSS変数を生成
   */
  private static generateResetVariables(): string {
    // 名前空間別にリセット（Tailwind CSS v4のドキュメント通り）
    const resetVariables = [
      '  --color-*: initial;',
      '  --font-*: initial;',
      '  --text-*: initial;',
      '  --bg-*: initial;',
      '  --spacing-*: initial;',
      '  --size-*: initial;',
      '  --border-*: initial;',
      '  --radius-*: initial;',
      '  --shadow-*: initial;',
      '  --transition-*: initial;',
    ]

    return resetVariables.join('\n')
  }

  /**
   * Tailwind v4設定用のテーマオブジェクトを生成
   */
  static generateTailwindTheme(tokens: ParsedToken[]): Record<string, unknown> {
    const theme: Record<string, unknown> = {}

    tokens.forEach((token) => {
      const [category, ...path] = token.originalPath

      if (!theme[category]) {
        theme[category] = {}
      }

      this.setNestedValue(
        theme[category] as Record<string, unknown>,
        path,
        `var(${token.cssVarName})`
      )
    })

    return theme
  }

  /**
   * Tailwind設定ファイルのJavaScriptコードを生成
   */
  static generateTailwindConfig(tokens: ParsedToken[]): string {
    const theme = this.generateTailwindTheme(tokens)

    return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: ${JSON.stringify(theme, null, 6).replace(/"/g, '')}
  }
}`
  }

  /**
   * CSS変数とコメント付きの詳細版を生成
   */
  static generateDetailedCSS(tokens: ParsedToken[]): string {
    const groupedTokens = this.groupTokensByCategory(tokens)
    const sections: string[] = []

    Object.entries(groupedTokens).forEach(([category, categoryTokens]) => {
      const comment = `/* ${category.toUpperCase()} */`
      const vars = categoryTokens
        .map((token) => {
          const descComment = token.description
            ? `  /* ${token.description} */`
            : ''
          return `${descComment}\n  ${token.cssVarName}: ${token.value};`
        })
        .join('\n')

      sections.push(`${comment}\n${vars}`)
    })

    return `:root {
${sections.join('\n\n')}
}`
  }

  /**
   * Tailwind utility classesのマッピングを生成
   */
  static generateUtilityMapping(tokens: ParsedToken[]): Record<string, string> {
    const mapping: Record<string, string> = {}

    tokens.forEach((token) => {
      const [category, ...path] = token.originalPath

      // 一般的なTailwindクラス名のマッピング
      switch (category) {
        case 'color':
          if (path.includes('primitive')) {
            const colorName = path[path.length - 2]
            const shade = path[path.length - 1]
            mapping[`text-${colorName}-${shade}`] = `var(${token.cssVarName})`
            mapping[`bg-${colorName}-${shade}`] = `var(${token.cssVarName})`
            mapping[`border-${colorName}-${shade}`] = `var(${token.cssVarName})`
          }
          break
        case 'spacing':
          mapping[`p-${path.join('-')}`] = `var(${token.cssVarName})`
          mapping[`m-${path.join('-')}`] = `var(${token.cssVarName})`
          break
        case 'size':
          mapping[`w-${path.join('-')}`] = `var(${token.cssVarName})`
          mapping[`h-${path.join('-')}`] = `var(${token.cssVarName})`
          break
      }
    })

    return mapping
  }

  /**
   * ネストしたオブジェクトに値を設定
   */
  private static setNestedValue(
    obj: Record<string, unknown>,
    path: string[],
    value: string
  ): void {
    const [head, ...rest] = path

    if (rest.length === 0) {
      obj[head] = value
    } else {
      if (!obj[head]) {
        obj[head] = {}
      }
      this.setNestedValue(obj[head] as Record<string, unknown>, rest, value)
    }
  }

  /**
   * トークンをカテゴリ別にグループ化
   */
  private static groupTokensByCategory(
    tokens: ParsedToken[]
  ): Record<string, ParsedToken[]> {
    const groups: Record<string, ParsedToken[]> = {}

    tokens.forEach((token) => {
      const category = token.originalPath[0] || 'other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(token)
    })

    // カテゴリごとにソート
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => {
        return a.originalPath.join('.').localeCompare(b.originalPath.join('.'))
      })
    })

    return groups
  }
}
