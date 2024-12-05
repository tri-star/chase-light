export const SORT_DIRECTIONS = [
  {
    value: "asc",
    label: "昇順",
  },
  {
    value: "desc",
    label: "降順",
  },
] as const

type SortDirection = (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS]

type SortDirectionValueMap = {
  [K in (typeof SORT_DIRECTIONS)[number]["value"]]: Extract<
    (typeof SORT_DIRECTIONS)[number],
    { value: K }
  >["value"]
}

export const SORT_DIRECTION_MAP: SortDirectionValueMap = SORT_DIRECTIONS.reduce(
  (acc: any, cur) => {
    acc[cur.value] = cur
    return acc
  },
  {} as SortDirectionValueMap,
)

export const SORT_DIRECTION_VALUES = Object.values(SORT_DIRECTIONS).map(
  (direction) => direction["value"],
)
