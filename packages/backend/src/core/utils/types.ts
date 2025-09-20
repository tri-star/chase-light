export type Brand<T, Identifier extends string> = T & {
  readonly __brand: Identifier
}
