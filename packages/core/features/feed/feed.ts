/**
 * 最大値
 */
export const MAX_FEED_NAME_LENGTH = 50
export const MAX_FEED_URL_LENGTH = 255

/**
 * 更新サイクル
 */
export const cycles = [
  {
    key: "DAILY",
    name: "日次",
    value: 1,
  },
  {
    key: "WEEKLY",
    name: "週次",
    value: 2,
  },
] as const

type CycleValueMap = {
  [K in (typeof cycles)[number]["key"]]: Extract<
    (typeof cycles)[number],
    { key: K }
  >["value"]
}

export const CYCLE_VALUE_MAP: CycleValueMap = cycles.reduce((acc: any, cur) => {
  acc[cur.key] = cur.value
  return acc
}, {} as CycleValueMap)

export type CycleValue = (typeof cycles)[number]["value"]
export const CYCLE_VALUES = Object.values(CYCLE_VALUE_MAP)

/**
 * ソート項目
 */
export const SORT_ITEMS = [
  {
    key: "createdAt",
    name: "作成日時",
  },
  {
    key: "updatedAt",
    name: "更新日時",
  },
] as const

type SortItemMap = {
  [K in (typeof SORT_ITEMS)[number]["key"]]: Extract<
    (typeof SORT_ITEMS)[number],
    { key: K }
  >["name"]
}

export const SORT_ITEM_MAP: SortItemMap = SORT_ITEMS.reduce((acc: any, cur) => {
  acc[cur.key] = cur.name
  return acc
}, {} as SortItemMap)

export type SortItem = (typeof SORT_ITEMS)[number]["key"]
export const SORT_ITEMS_VALUES = SORT_ITEMS.map((item) => item.key)
