export interface TokenValue {
  value: string | number | string[] | boolean | Record<string, unknown>
}

export interface TokenGroup {
  $type?: string
  $description?: string
  [key: string]: TokenValue | TokenGroup | string | undefined
}

export interface DesignTokens {
  $schema?: string
  $description?: string
  color?: TokenGroup
  typography?: TokenGroup
  spacing?: TokenGroup
  size?: TokenGroup
  border?: TokenGroup
  radius?: TokenGroup
  shadow?: TokenGroup
  effect?: TokenGroup
  transition?: TokenGroup
}

export interface FlatToken {
  path: string[]
  value: string | number | string[] | boolean | Record<string, unknown>
  type?: string
  description?: string
}

export interface ParsedToken {
  cssVarName: string
  originalPath: string[]
  value: string
  type?: string
  description?: string
}
