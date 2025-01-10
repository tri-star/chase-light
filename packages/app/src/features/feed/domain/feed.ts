import { z } from 'zod'

import { makeEnumFromArray, makeUnionFromArray } from 'core/utils/zod-utils'
import { CYCLE_VALUES, SORT_ITEMS_VALUES } from 'core/features/feed/feed'
import { datasourceSchema } from '~/features/feed/domain/data-source'
import { SORT_DIRECTION_VALUES } from 'core/constants'

export const feedSchema = z.object({
  id: z.string(),
  name: z.string(),
  cycle: makeUnionFromArray(CYCLE_VALUES),
  dataSource: datasourceSchema,
  url: z.string(),
  // user: userSchema,
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type Feed = z.infer<typeof feedSchema>

export const createFeedFormSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().min(1),
  cycle: makeUnionFromArray(CYCLE_VALUES),
})
export type CreateFeedForm = z.infer<typeof createFeedFormSchema>

export const feedSearchFormSchema = z.object({
  keyword: z.string().optional(),
  sort: makeEnumFromArray(SORT_ITEMS_VALUES).optional(),
  sortDirection: makeEnumFromArray(SORT_DIRECTION_VALUES).optional(),
})
