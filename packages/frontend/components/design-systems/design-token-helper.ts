import { TokenParser } from '~/scripts/design-token-converter/token-parser'
import designTokens from '~/design-tokens.json'
import type {
  DesignTokens,
  ParsedToken,
  ThemedTokens,
} from '~/scripts/design-token-converter/types'

export interface PrimitiveColorInfo {
  name: string
  bgCssVar: string
  value: string
  textCssVar: string
  borderCssVar: string
  bgClass: string
  textClass: string
  borderClass: string
}

export interface SemanticColorInfo {
  name: string
  bgCssVar: string
  textCssVar: string
  borderCssVar: string
  category: string
  subcategory: string
  bgClass: string
  textClass: string
  borderClass: string
}

export interface TypographyFontInfo {
  name: string
  cssVar: string
  value: string
}

export interface TypographyScaleInfo {
  name: string
  cssVar: string
  value: string
}

export interface TypographySemanticInfo {
  name: string
  cssVar: string
  value: string
}

export interface SpacingInfo {
  name: string
  cssVar: string
  value: string
}

export interface SizeInfo {
  name: string
  cssVar: string
  value: string
}

export interface BorderWidthInfo {
  name: string
  cssVar: string
  value: string
}

export interface BorderStyleInfo {
  name: string
  cssVar: string
  value: string
}

export interface RadiusInfo {
  name: string
  cssVar: string
  value: string
}

export interface ShadowInfo {
  name: string
  cssVar: string
  value: string
}

export interface TransitionDurationInfo {
  name: string
  cssVar: string
  value: string
}

export interface TransitionEasingInfo {
  name: string
  cssVar: string
  value: string
}

export interface TransitionPropertyInfo {
  name: string
  cssVar: string
  value: string
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class DesignTokenHelper {
  private static themedTokens: ThemedTokens | null = null

  /**
   * デザイントークンを解析してテーマ別トークンを取得
   */
  private static getThemedTokens(): ThemedTokens {
    if (!this.themedTokens) {
      this.themedTokens = TokenParser.parseThemedTokens(
        designTokens as unknown as DesignTokens
      )
    }
    return this.themedTokens
  }

  /**
   * Primitive colorsの情報を取得
   */
  static getPrimitiveColors(): {
    grayColors: PrimitiveColorInfo[]
    blueColors: PrimitiveColorInfo[]
    greenColors: PrimitiveColorInfo[]
    otherColors: PrimitiveColorInfo[]
  } {
    const themedTokens = this.getThemedTokens()
    const lightTokens = themedTokens.light

    // primitive color tokensを抽出
    const primitiveTokens = lightTokens.filter(
      (token) =>
        token.originalPath[0] === 'color' &&
        token.originalPath[1] === 'primitive' &&
        token.originalPath.length === 4
    )

    const grayColors: PrimitiveColorInfo[] = []
    const blueColors: PrimitiveColorInfo[] = []
    const greenColors: PrimitiveColorInfo[] = []
    const otherColors: PrimitiveColorInfo[] = []

    primitiveTokens.forEach((token) => {
      const colorFamily = token.originalPath[2]
      const shade = token.originalPath[3]

      const colorInfo: PrimitiveColorInfo = {
        name: `${this.capitalizeFirst(colorFamily)} ${shade}`,
        bgCssVar: `--color-primitive-${colorFamily}-${shade}`,
        value: token.value,
        textCssVar: this.shouldUseWhiteText(colorFamily, shade)
          ? '--color-primitive-gray-50'
          : '--color-primitive-gray-900',
        borderCssVar: this.getBorderCssVar(colorFamily, shade),
        bgClass: `bg-primitive-${colorFamily}-${shade}`,
        textClass: this.shouldUseWhiteText(colorFamily, shade)
          ? 'text-white'
          : 'text-primitive-gray-900',
        borderClass: this.getBorderClass(colorFamily, shade),
      }

      switch (colorFamily) {
        case 'gray':
          grayColors.push(colorInfo)
          break
        case 'blue':
          blueColors.push(colorInfo)
          break
        case 'green':
          greenColors.push(colorInfo)
          break
        default:
          otherColors.push({
            ...colorInfo,
            name:
              this.capitalizeFirst(colorFamily) +
              (shade !== colorFamily ? ` ${shade}` : ''),
          })
      }
    })

    // 数値順でソート
    const sortByShade = (a: PrimitiveColorInfo, b: PrimitiveColorInfo) => {
      const getShadeNum = (name: string) => {
        const match = name.match(/\d+/)
        return match ? parseInt(match[0], 10) : 0
      }
      return getShadeNum(a.name) - getShadeNum(b.name)
    }

    return {
      grayColors: grayColors.sort(sortByShade),
      blueColors: blueColors.sort(sortByShade),
      greenColors: greenColors.sort(sortByShade),
      otherColors: otherColors,
    }
  }

  /**
   * Semantic colorsの情報を取得
   */
  static getSemanticColors(): {
    contentStates: SemanticColorInfo[]
    surfacePrimaryStates: SemanticColorInfo[]
    surfaceSecondaryStates: SemanticColorInfo[]
    surfaceOutlinedStates: SemanticColorInfo[]
    interactiveStates: SemanticColorInfo[]
    headerStates: SemanticColorInfo[]
    sidebarStates: SemanticColorInfo[]
    dialogStates: SemanticColorInfo[]
    statusColors: SemanticColorInfo[]
  } {
    const themedTokens = this.getThemedTokens()
    const lightTokens = themedTokens.light

    // semantic color tokensを抽出（bg, text, border）
    const semanticTokens = lightTokens.filter(
      (token) =>
        token.originalPath[0] === 'color' &&
        token.originalPath[1] === 'semantic' &&
        ['bg', 'text', 'border'].includes(
          token.originalPath[token.originalPath.length - 1]
        )
    )

    // カテゴリ別にグループ化
    const grouped = this.groupSemanticTokens(semanticTokens)

    return {
      contentStates: this.createSemanticColorInfos(grouped.content, 'content'),
      surfacePrimaryStates: this.createSemanticColorInfos(
        grouped['surface.primary'],
        'surface',
        'primary'
      ),
      surfaceSecondaryStates: this.createSemanticColorInfos(
        grouped['surface.secondary'],
        'surface',
        'secondary'
      ),
      surfaceOutlinedStates: this.createSemanticColorInfos(
        grouped['surface.outlined'],
        'surface',
        'outlined'
      ),
      interactiveStates: this.createSemanticColorInfos(
        grouped.interactive,
        'interactive'
      ),
      headerStates: this.createSemanticColorInfos(grouped.header, 'header'),
      sidebarStates: this.createSemanticColorInfos(grouped.sidebar, 'sidebar'),
      dialogStates: this.createSemanticColorInfos(grouped.dialog, 'dialog'),
      statusColors: this.createStatusColorInfos(grouped.status),
    }
  }

  /**
   * セマンティックトークンをカテゴリ別にグループ化
   */
  private static groupSemanticTokens(
    tokens: ParsedToken[]
  ): Record<string, Record<string, ParsedToken[]>> {
    const grouped: Record<string, Record<string, ParsedToken[]>> = {}

    tokens.forEach((token) => {
      const path = token.originalPath.slice(2) // color.semanticを除く
      const category = path[0]
      const _property = path[path.length - 1] // bg, text, border

      let groupKey: string
      let stateKey: string

      if (category === 'surface') {
        const subcategory = path[1]
        const state = path[2] || 'default'
        groupKey = `${category}.${subcategory}`
        stateKey = state
      } else if (category === 'common') {
        // common.info.default.bg -> groupKey='status', stateKey='info'にする
        const statusType = path[1] // info, success, warn, alert
        groupKey = 'status'
        stateKey = statusType
      } else {
        // content, interactive, header, sidebar, dialog など
        const state = path[1] || 'default'
        groupKey = category
        stateKey = state
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = {}
      }
      if (!grouped[groupKey][stateKey]) {
        grouped[groupKey][stateKey] = []
      }

      grouped[groupKey][stateKey].push(token)
    })

    return grouped
  }

  /**
   * SemanticColorInfo配列を作成
   */
  private static createSemanticColorInfos(
    stateGroups: Record<string, ParsedToken[]> = {},
    category: string,
    subcategory?: string
  ): SemanticColorInfo[] {
    const result: SemanticColorInfo[] = []

    Object.entries(stateGroups).forEach(([state, tokens]) => {
      const bgToken = tokens.find(
        (t) => t.originalPath[t.originalPath.length - 1] === 'bg'
      )
      const textToken = tokens.find(
        (t) => t.originalPath[t.originalPath.length - 1] === 'text'
      )
      const borderToken = tokens.find(
        (t) => t.originalPath[t.originalPath.length - 1] === 'border'
      )

      if (bgToken) {
        const _baseClass = subcategory
          ? `${category}-${subcategory}-${state}`
          : `${category}-${state}`

        result.push({
          name: this.formatStateName(state, subcategory),
          bgCssVar: bgToken.cssVarName,
          textCssVar:
            textToken?.cssVarName ||
            this.generateFallbackCssVar(bgToken.cssVarName, 'text'),
          borderCssVar:
            borderToken?.cssVarName ||
            this.generateFallbackCssVar(bgToken.cssVarName, 'border'),
          category,
          subcategory: subcategory || '',
          bgClass: this.cssVarToTailwindClass(bgToken.cssVarName, 'bg'),
          textClass: this.cssVarToTailwindClass(
            textToken?.cssVarName ||
              this.generateFallbackCssVar(bgToken.cssVarName, 'text'),
            'text'
          ),
          borderClass: this.cssVarToTailwindClass(
            borderToken?.cssVarName ||
              this.generateFallbackCssVar(bgToken.cssVarName, 'border'),
            'border'
          ),
        })
      }
    })

    return result
  }

  /**
   * ステータスカラーの情報を作成
   */
  private static createStatusColorInfos(
    statusGroups: Record<string, ParsedToken[]> = {}
  ): SemanticColorInfo[] {
    const result: SemanticColorInfo[] = []

    // status用の特別な処理 - 全ステータスタイプと全バリアントを処理
    Object.entries(statusGroups).forEach(([statusType, tokens]) => {
      // variant別にグループ化
      const variants = new Map<string, ParsedToken[]>()
      tokens.forEach((token) => {
        // color.semantic.common.info.default.bg -> variant = 'default'
        const variant = token.originalPath[4] // default, subtle, inversed
        if (!variants.has(variant)) {
          variants.set(variant, [])
        }
        variants.get(variant)!.push(token)
      })

      variants.forEach((variantTokens, variant) => {
        const bgToken = variantTokens.find(
          (t) => t.originalPath[t.originalPath.length - 1] === 'bg'
        )
        const textToken = variantTokens.find(
          (t) => t.originalPath[t.originalPath.length - 1] === 'text'
        )
        const borderToken = variantTokens.find(
          (t) => t.originalPath[t.originalPath.length - 1] === 'border'
        )

        if (bgToken) {
          const statusName = this.getStatusDisplayName(statusType)
          const variantName = this.capitalizeFirst(variant)
          result.push({
            name: `${statusName} ${variantName}`,
            bgCssVar: bgToken.cssVarName,
            textCssVar:
              textToken?.cssVarName ||
              this.generateFallbackCssVar(bgToken.cssVarName, 'text'),
            borderCssVar:
              borderToken?.cssVarName ||
              this.generateFallbackCssVar(bgToken.cssVarName, 'border'),
            category: 'status',
            subcategory: `${statusType}-${variant}`,
            bgClass: this.cssVarToTailwindClass(bgToken.cssVarName, 'bg'),
            textClass: this.cssVarToTailwindClass(
              textToken?.cssVarName ||
                this.generateFallbackCssVar(bgToken.cssVarName, 'text'),
              'text'
            ),
            borderClass: this.cssVarToTailwindClass(
              borderToken?.cssVarName ||
                this.generateFallbackCssVar(bgToken.cssVarName, 'border'),
              'border'
            ),
          })
        }
      })
    })

    return result
  }

  /**
   * ステート名をフォーマット
   */
  private static formatStateName(state: string, subcategory?: string): string {
    const formatted = this.capitalizeFirst(state)
    if (subcategory) {
      return `${formatted} ${this.capitalizeFirst(subcategory)}`
    }
    return `${formatted} ${this.capitalizeFirst('state')}`
  }

  /**
   * ステータス表示名を取得
   */
  private static getStatusDisplayName(statusType: string): string {
    const mapping: Record<string, string> = {
      info: 'Info',
      success: 'Success',
      warn: 'Warning',
      alert: 'Error',
    }
    return mapping[statusType] || this.capitalizeFirst(statusType)
  }

  /**
   * 文字列の最初の文字を大文字に
   */
  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * 白いテキストを使用すべきかどうかを判定
   */
  private static shouldUseWhiteText(
    colorFamily: string,
    shade: string
  ): boolean {
    const darkShades = ['400', '500', '600', '700', '800', '900']
    const specialCases = ['black']

    return darkShades.includes(shade) || specialCases.includes(colorFamily)
  }

  /**
   * ボーダーCSS変数を取得
   */
  private static getBorderCssVar(colorFamily: string, shade: string): string {
    // より濃い色をボーダーに使用
    const shadeNum = parseInt(shade, 10)
    if (!isNaN(shadeNum)) {
      const borderShade = Math.min(shadeNum + 100, 900)
      return `--color-primitive-${colorFamily}-${borderShade}`
    }

    if (colorFamily === 'black') {
      return '--color-primitive-gray-700'
    }

    return `--color-primitive-${colorFamily}-300`
  }

  /**
   * ボーダークラスを取得
   */
  private static getBorderClass(colorFamily: string, shade: string): string {
    // より濃い色をボーダーに使用
    const shadeNum = parseInt(shade, 10)
    if (!isNaN(shadeNum)) {
      const borderShade = Math.min(shadeNum + 100, 900)
      return `border border-primitive-${colorFamily}-${borderShade}`
    }

    if (colorFamily === 'black') {
      return 'border border-primitive-gray-700'
    }

    return `border border-primitive-${colorFamily}-300`
  }

  /**
   * CSS変数名からTailwindクラス名に変換
   */
  private static cssVarToTailwindClass(
    cssVar: string,
    type: 'bg' | 'text' | 'border'
  ): string {
    // --background-color-surface-primary-default -> bg-surface-primary-default
    // --text-color-content-default -> text-content-default
    // --border-color-interactive-focused -> border-interactive-focused

    let className = cssVar.replace(/^--/, '') // -- を除去

    // CSS変数名のプレフィックスをTailwindのプレフィックスに変換
    if (className.startsWith('background-color-')) {
      className = className.replace('background-color-', `${type}-`)
    } else if (className.startsWith('text-color-')) {
      className = className.replace('text-color-', `${type}-`)
    } else if (className.startsWith('border-color-')) {
      className = className.replace('border-color-', `${type}-`)
    } else if (className.startsWith('color-')) {
      className = className.replace('color-', `${type}-`)
    } else {
      // フォールバック: そのままプレフィックスを追加
      className = `${type}-${className}`
    }

    return className
  }

  /**
   * 背景色のCSS変数名から対応するtext/borderのCSS変数名を生成
   */
  private static generateFallbackCssVar(
    bgCssVar: string,
    type: 'text' | 'border'
  ): string {
    // --background-color-surface-primary-default -> --text-color-surface-primary-default
    return bgCssVar.replace('background-color', `${type}-color`)
  }

  /**
   * Typography: フォントファミリーの情報を取得
   */
  static getTypographyFonts(): TypographyFontInfo[] {
    const themedTokens = this.getThemedTokens()
    const lightTokens = themedTokens.light

    const fonts = lightTokens.filter(
      (t) =>
        t.originalPath[0] === 'typography' &&
        t.originalPath[1] === 'font-family' &&
        t.originalPath.length === 3
    )

    const order = ['sans', 'mono']
    const toInfo = (t: ParsedToken): TypographyFontInfo => ({
      name: t.originalPath[2],
      cssVar: t.cssVarName,
      value: t.value,
    })

    return fonts
      .map(toInfo)
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name))
  }

  /**
   * Typography: スケール（xs, sm, base, ...）の情報を取得
   */
  static getTypographyScales(): TypographyScaleInfo[] {
    const themedTokens = this.getThemedTokens()
    const lightTokens = themedTokens.light

    const scales = lightTokens.filter(
      (t) =>
        t.originalPath[0] === 'typography' &&
        t.originalPath[1] === 'scale' &&
        t.originalPath.length === 3
    )

    const order = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']
    const orderIndex = (n: string) => {
      const i = order.indexOf(n)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }

    return scales
      .map((t) => ({
        name: t.originalPath[2],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => orderIndex(a.name) - orderIndex(b.name))
  }

  /**
   * Typography: セマンティック（heading-x, body, caption, code など）の情報を取得
   */
  static getTypographySemantic(): TypographySemanticInfo[] {
    const themedTokens = this.getThemedTokens()
    const lightTokens = themedTokens.light

    const semantics = lightTokens.filter(
      (t) =>
        t.originalPath[0] === 'typography' &&
        t.originalPath[1] === 'semantic' &&
        t.originalPath.length === 3
    )

    const order = [
      'heading-1',
      'heading-2',
      'heading-3',
      'heading-4',
      'body',
      'body-sm',
      'caption',
      'code',
    ]
    const idx = (n: string) => {
      const i = order.indexOf(n)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }

    return semantics
      .map((t) => ({
        name: t.originalPath[2],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => idx(a.name) - idx(b.name))
  }

  /**
   * Spacing スケールを取得（0, px, 0.5, 1, 2, ...）
   */
  static getSpacingScale(): SpacingInfo[] {
    return this.getScale('spacing') as SpacingInfo[]
  }

  /**
   * Size スケールを取得（0, px, 0.5, 1, 2, ...）
   */
  static getSizeScale(): SizeInfo[] {
    return this.getScale('size') as SizeInfo[]
  }

  /**
   * 共通: spacing/size スケールの列挙
   */
  private static getScale(
    category: 'spacing' | 'size'
  ): Array<{ name: string; cssVar: string; value: string }> {
    const lightTokens = this.getThemedTokens().light
    const tokens = lightTokens.filter(
      (t) => t.originalPath[0] === category && t.originalPath.length === 2
    )

    const rank = (name: string): number => {
      if (name === 'px') return 0.25
      const n = Number(name)
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER
    }

    return tokens
      .map((t) => ({
        name: t.originalPath[1],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => rank(a.name) - rank(b.name))
  }

  /**
   * Border width tokens
   */
  static getBorderWidths(): BorderWidthInfo[] {
    const lightTokens = this.getThemedTokens().light
    const widths = lightTokens.filter(
      (t) =>
        t.originalPath[0] === 'border' &&
        t.originalPath[1] === 'width' &&
        t.originalPath.length === 3
    )
    const order = (n: string) => (Number.isFinite(Number(n)) ? Number(n) : 0)
    return widths
      .map((t) => ({
        name: t.originalPath[2],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => order(a.name) - order(b.name))
  }

  /**
   * Border style tokens
   */
  static getBorderStyles(): BorderStyleInfo[] {
    const lightTokens = this.getThemedTokens().light
    const styles = lightTokens.filter(
      (t) =>
        t.originalPath[0] === 'border' &&
        t.originalPath[1] === 'style' &&
        t.originalPath.length === 3
    )
    const priority = ['solid', 'dashed', 'dotted']
    const idx = (n: string) => {
      const i = priority.indexOf(n)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    return styles
      .map((t) => ({
        name: t.originalPath[2],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => idx(a.name) - idx(b.name))
  }

  /**
   * Radius tokens
   */
  static getRadii(): RadiusInfo[] {
    const lightTokens = this.getThemedTokens().light
    const radii = lightTokens.filter(
      (t) => t.originalPath[0] === 'radius' && t.originalPath.length === 2
    )
    const order = [
      'none',
      'sm',
      'default',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      'full',
    ]
    const idx = (n: string) => {
      const i = order.indexOf(n)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    return radii
      .map((t) => ({
        name: t.originalPath[1],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => idx(a.name) - idx(b.name))
  }

  /**
   * Shadow tokens
   */
  static getShadows(): ShadowInfo[] {
    const lightTokens = this.getThemedTokens().light
    const shadows = lightTokens.filter(
      (t) => t.originalPath[0] === 'shadow' && t.originalPath.length === 2
    )
    const order = ['sm', 'default', 'md', 'lg', 'xl']
    const idx = (n: string) => {
      const i = order.indexOf(n)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    return shadows
      .map((t) => ({
        name: t.originalPath[1],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => idx(a.name) - idx(b.name))
  }

  /**
   * Transition duration tokens
   */
  static getTransitionDurations(): TransitionDurationInfo[] {
    const lightTokens = this.getThemedTokens().light
    const durations = lightTokens.filter(
      (t) =>
        t.originalPath[0] === 'transition' &&
        t.originalPath[1] === 'duration' &&
        t.originalPath.length === 3
    )
    const order = (n: string) => (Number.isFinite(Number(n)) ? Number(n) : 0)
    return durations
      .map((t) => ({
        name: t.originalPath[2],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => order(a.name) - order(b.name))
  }

  /**
   * Transition easing tokens
   */
  static getTransitionEasings(): TransitionEasingInfo[] {
    const lightTokens = this.getThemedTokens().light
    const easings = lightTokens.filter(
      (t) =>
        t.originalPath[0] === 'transition' &&
        t.originalPath[1] === 'easing' &&
        t.originalPath.length === 3
    )
    const order = ['ease-in', 'ease-out', 'ease-in-out']
    const idx = (n: string) => {
      const i = order.indexOf(n)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    return easings
      .map((t) => ({
        name: t.originalPath[2],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => idx(a.name) - idx(b.name))
  }

  /**
   * Transition property tokens
   */
  static getTransitionProperties(): TransitionPropertyInfo[] {
    const lightTokens = this.getThemedTokens().light
    const props = lightTokens.filter(
      (t) =>
        t.originalPath[0] === 'transition' &&
        t.originalPath[1] === 'property' &&
        t.originalPath.length === 3
    )
    const order = [
      'none',
      'all',
      'default',
      'colors',
      'opacity',
      'shadow',
      'transform',
    ]
    const idx = (n: string) => {
      const i = order.indexOf(n)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    return props
      .map((t) => ({
        name: t.originalPath[2],
        cssVar: t.cssVarName,
        value: t.value,
      }))
      .sort((a, b) => idx(a.name) - idx(b.name))
  }
}
