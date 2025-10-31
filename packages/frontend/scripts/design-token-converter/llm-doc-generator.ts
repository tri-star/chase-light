import type { DesignTokens, TokenGroup } from './types'

type PrimitiveTokenEntry = {
  tailwindClasses: string[]
  description?: string
}

type SemanticTokenEntry = {
  tailwindClass: string
  description?: string
}

export interface TailwindUtilitiesDoc {
  color: {
    primitive: {
      description: string
      tokens: Record<string, PrimitiveTokenEntry>
    }
    semantic: {
      description: string
      tokens: Record<string, SemanticTokenEntry>
    }
  }
  typography: {
    description: string
    tokens: Record<string, { tailwindClass: string; description?: string }>
  }
  spacing: {
    description: string
    values: string[]
  }
  sizing: {
    description: string
    values: string[]
  }
  borders: {
    description: string
    width: { values: string[] }
    styles: { values: string[] }
  }
  radius: {
    description: string
    values: string[]
  }
  shadows: {
    description: string
    values: string[]
  }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LLMDocGenerator {
  static generateUtilitiesDoc(tokens: DesignTokens): TailwindUtilitiesDoc {
    const primitive = this.generatePrimitiveColors(tokens)
    const semantic = this.generateSemanticColors(tokens)
    const typography = this.generateTypography(tokens)
    const spacing = this.generateSpacing(tokens)
    const sizing = this.generateSizing(tokens)
    const borders = this.generateBorders(tokens)
    const radius = this.generateRadius(tokens)
    const shadows = this.generateShadows(tokens)

    return {
      color: { primitive, semantic },
      typography,
      spacing,
      sizing,
      borders,
      radius,
      shadows,
    }
  }

  private static isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null
  }

  private static listKeys(group?: TokenGroup): string[] {
    if (!group || !this.isRecord(group)) return []
    return Object.keys(group).filter((k) => !k.startsWith('$'))
  }

  private static generatePrimitiveColors(
    tokens: DesignTokens
  ): TailwindUtilitiesDoc['color']['primitive'] {
    const group = tokens.color?.primitive as TokenGroup | undefined
    const families = this.listKeys(group)
    const description = (group as TokenGroup | undefined)?.$description || ''
    const entries: Record<string, PrimitiveTokenEntry> = {}

    families.forEach((family) => {
      const node = (group![family] || {}) as TokenGroup
      // direct token (e.g., black/white)
      if (this.isRecord(node) && 'value' in node) {
        const tokenName = family
        const base = {
          tailwindClasses: [
            `bg-${family}`,
            `text-${family}`,
            `border-${family}`,
          ],
        } as PrimitiveTokenEntry
        const tokenDesc = node.$description as string | undefined
        entries[tokenName] = tokenDesc
          ? { ...base, description: tokenDesc }
          : base
        return
      }

      const shadesGroup = node
      const shades = this.listKeys(shadesGroup)
      shades.forEach((shade) => {
        const leaf = (shadesGroup[shade] || {}) as TokenGroup
        const suffix = `${family}-${shade}`
        const base = {
          tailwindClasses: [
            `bg-${suffix}`,
            `text-${suffix}`,
            `border-${suffix}`,
          ],
        } as PrimitiveTokenEntry
        const tokenDesc = leaf.$description as string | undefined
        const tokenName = `${family}.${shade}`
        entries[tokenName] = tokenDesc
          ? { ...base, description: tokenDesc }
          : base
      })
    })

    return { description, tokens: entries }
  }

  private static generateSemanticColors(
    tokens: DesignTokens
  ): TailwindUtilitiesDoc['color']['semantic'] {
    const semantic = (tokens.color?.semantic as TokenGroup | undefined) || {}
    // use light theme only (ignore dark)
    const light = (semantic.light || {}) as TokenGroup
    const description = (semantic.$description as string) || ''
    const out: Record<string, SemanticTokenEntry> = {}

    const walk = (obj: TokenGroup, path: string[] = []): void => {
      for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith('$')) continue
        if (key === 'children' && this.isRecord(val)) {
          walk(val as TokenGroup, path)
          continue
        }
        const current = [...path, key]
        if (this.isRecord(val) && 'value' in val) {
          // leaf token
          const tokenName = current.join('.')
          const last = current[current.length - 1]
          const prefix =
            last === 'text' ? 'text' : last === 'border' ? 'border' : 'bg'
          const bodyParts = current.slice(0, -1)

          // special mapping for common => status
          const mappedParts =
            bodyParts[0] === 'common'
              ? ['status', ...bodyParts.slice(1)]
              : bodyParts
          const className = `${prefix}-${mappedParts.join('-')}`

          const tokenDesc = (val as TokenGroup).$description as
            | string
            | undefined
          out[tokenName] = tokenDesc
            ? { tailwindClass: className, description: tokenDesc }
            : { tailwindClass: className }
        } else if (this.isRecord(val)) {
          walk(val as TokenGroup, current)
        }
      }
    }
    walk(light)
    return { description, tokens: out }
  }

  private static generateTypography(
    tokens: DesignTokens
  ): TailwindUtilitiesDoc['typography'] {
    const group = tokens.typography as TokenGroup | undefined
    const description = (group?.$description as string) || ''
    const tokensOut: Record<
      string,
      { tailwindClass: string; description?: string }
    > = {}

    // font-family
    const families = this.listKeys(group?.['font-family'] as TokenGroup)
    families.forEach((name) => {
      const tokenName = `font-family.${name}`
      const tailwindClass = name === 'mono' ? 'font-mono' : 'font-sans'
      tokensOut[tokenName] = { tailwindClass }
    })

    // scale
    const scales = this.listKeys(group?.scale as TokenGroup)
    scales.forEach((name) => {
      const tokenName = `scale.${name}`
      tokensOut[tokenName] = { tailwindClass: `font-scale-${name}` }
    })

    // semantic
    const semantics = this.listKeys(group?.semantic as TokenGroup)
    semantics.forEach((name) => {
      const tokenName = `semantic.${name}`
      tokensOut[tokenName] = { tailwindClass: `font-semantic-${name}` }
    })

    return { description, tokens: tokensOut }
  }

  private static generateSpacing(
    tokens: DesignTokens
  ): TailwindUtilitiesDoc['spacing'] {
    const group = tokens.spacing as TokenGroup | undefined
    const values = this.listKeys(group)
    return {
      description:
        'TailwindCSSで利用可能なp-*, m-*, gap-*などを利用可能。値は以下に挙げる値から選択',
      values,
    }
  }

  private static generateSizing(
    tokens: DesignTokens
  ): TailwindUtilitiesDoc['sizing'] {
    const group = tokens.size as TokenGroup | undefined
    const values = this.listKeys(group)
    return {
      description:
        'TailwindCSSで利用可能なw-*,h-*などを利用可能。値は以下に挙げる値から選択',
      values,
    }
  }

  private static generateBorders(
    tokens: DesignTokens
  ): TailwindUtilitiesDoc['borders'] {
    const group = tokens.border as TokenGroup | undefined
    const widthValues = this.listKeys(group?.width as TokenGroup)
    const styleValues = this.listKeys(group?.style as TokenGroup)
    return {
      description: (group?.$description as string) || '',
      width: { values: widthValues },
      styles: { values: styleValues },
    }
  }

  private static generateRadius(
    tokens: DesignTokens
  ): TailwindUtilitiesDoc['radius'] {
    const group = tokens.radius as TokenGroup | undefined
    const values = this.listKeys(group)
    return {
      description:
        'TailwindCSSで利用可能なrounded-*などを利用可能。値は以下に挙げる値から選択',
      values,
    }
  }

  private static generateShadows(
    tokens: DesignTokens
  ): TailwindUtilitiesDoc['shadows'] {
    const group = tokens.shadow as TokenGroup | undefined
    const values = this.listKeys(group)
    return {
      description:
        'TailwindCSSで利用可能なshadow-*などを利用可能。値は以下に挙げる値から選択',
      values,
    }
  }
}
