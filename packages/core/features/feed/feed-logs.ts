/**
 * フィードログの状態
 */
export const feedLogStatuses = [
  {
    key: 'WAIT',
    name: '待機中',
    value: 'wait',
  },
  {
    key: 'IN_PROGRESS',
    name: '処理中',
    value: 'in_progress',
  },
  {
    key: 'ERROR',
    name: 'エラー',
    value: 'error',
  },
  {
    key: 'failed',
    name: '失敗',
    value: 'failed',
  },
  {
    key: 'DONE',
    name: '完了',
    value: 'done',
  },
] as const

type FeedLogStatusValueMap = {
  [K in (typeof feedLogStatuses)[number]['key']]: Extract<
    (typeof feedLogStatuses)[number],
    { key: K }
  >['value']
}

export const FEED_LOG_STATUS_VALUE_MAP: FeedLogStatusValueMap =
  feedLogStatuses.reduce((acc: any, cur) => {
    acc[cur.key] = cur.value
    return acc
  }, {} as FeedLogStatusValueMap)

export type FeedLogStatus = (typeof feedLogStatuses)[number]['value']
export const FEED_LOG_STATUS_VALUES = Object.values(FEED_LOG_STATUS_VALUE_MAP)
