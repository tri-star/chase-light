import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

type StateMap = Map<string, ReturnType<typeof ref<unknown>>>
const stateMap: StateMap = new Map()
const processStub = process as NodeJS.Process & {
  client?: boolean
  server?: boolean
}

vi.mock('#app', () => ({
  useState: <T>(key: string, init: () => T) => {
    if (!stateMap.has(key)) {
      stateMap.set(key, ref(init()))
    }

    return stateMap.get(key) as ReturnType<typeof ref<T>>
  },
}))

// eslint-disable-next-line import/first
import { useToast } from '../use-toast'

describe('useToast', () => {
  beforeEach(() => {
    stateMap.clear()
    vi.useFakeTimers()
    processStub.client = true
    processStub.server = false
  })

  it('shows a toast with defaults', () => {
    const { toasts, showToast } = useToast()

    const toastId = showToast({
      intent: 'info',
      message: '新しい通知があります',
      title: 'お知らせ',
    })

    expect(typeof toastId).toBe('string')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({
      id: toastId,
      intent: 'info',
      message: '新しい通知があります',
      title: 'お知らせ',
      dismissible: true,
    })
  })

  it('dismisses a toast manually', () => {
    const { toasts, showToast, dismissToast } = useToast()

    const toastId = showToast({ intent: 'success', message: '保存しました' })
    expect(toasts.value).toHaveLength(1)

    dismissToast(toastId)
    expect(toasts.value).toHaveLength(0)
  })

  it('auto dismisses a toast after duration', () => {
    const { toasts, showToast } = useToast()

    showToast({ intent: 'warn', message: '時間切れです', duration: 3000 })
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(3000)

    expect(toasts.value).toHaveLength(0)
  })

  it('respects null duration (no auto dismiss)', () => {
    const { toasts, showToast } = useToast()

    showToast({ intent: 'alert', message: '失敗しました', duration: null })
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(10_000)

    expect(toasts.value).toHaveLength(1)
  })

  it('clears all toasts', () => {
    const { toasts, showToast, clearToasts } = useToast()

    showToast({ intent: 'info', message: 'A' })
    showToast({ intent: 'success', message: 'B' })
    expect(toasts.value).toHaveLength(2)

    clearToasts()

    expect(toasts.value).toHaveLength(0)
  })
})
