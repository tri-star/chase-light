import { z } from '@hono/zod-openapi'

export function makeEnumFromArray<T extends string>(values: T[]) {
  const [firstValue, ...restValues] = values
  return z.enum([firstValue, ...restValues])
}

// https://github.com/colinhacks/zod/discussions/2790#discussioncomment-7096060
export function makeUnionFromArray<T extends string | number>(
  constants: readonly T[],
) {
  const literals = constants.map((x) => z.literal(x)) as unknown as readonly [
    z.ZodLiteral<T>,
    z.ZodLiteral<T>,
    ...z.ZodLiteral<T>[],
  ]
  return z.union(literals)
}
