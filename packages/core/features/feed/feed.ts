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
