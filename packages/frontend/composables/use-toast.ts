import { computed } from 'vue'
import { useState } from '#app'

type ToastIntent = 'success' | 'info' | 'warn' | 'alert'

type ToastId = string

export interface ToastOptions {
  id?: ToastId
  title?: string
  message: string
  intent: ToastIntent
  dismissible?: boolean
  duration?: number | null
}

export interface ToastItem {
  id: ToastId
  title?: string
  message: string
  intent: ToastIntent
  dismissible: boolean
  duration: number | null
  createdAt: number
}

const TOAST_STATE_KEY = 'cl:toast-items'
const DEFAULT_DURATION = 5000

const timers = new Map<ToastId, ReturnType<typeof setTimeout>>()

const generateToastId = (): ToastId => {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

const isClient = () => typeof window !== 'undefined'

export function useToast() {
  const toastsState = useState<ToastItem[]>(TOAST_STATE_KEY, () => [])

  const removeTimer = (id: ToastId) => {
    if (!isClient()) {
      return
    }

    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  const dismissToast = (id: ToastId) => {
    removeTimer(id)
    toastsState.value = toastsState.value.filter((toast) => toast.id !== id)
  }

  const clearToasts = () => {
    toastsState.value.forEach((toast) => {
      removeTimer(toast.id)
    })
    toastsState.value = []
  }

  const showToast = (options: ToastOptions): ToastId => {
    const id = options.id ?? generateToastId()
    const duration =
      options.duration === null
        ? null
        : options.duration !== undefined
          ? options.duration
          : DEFAULT_DURATION

    const toast: ToastItem = {
      id,
      title: options.title,
      message: options.message,
      intent: options.intent,
      dismissible: options.dismissible ?? true,
      duration,
      createdAt: Date.now(),
    }

    // 既存IDがあれば置き換え
    toastsState.value = [
      ...toastsState.value.filter((item) => item.id !== id),
      toast,
    ]

    if (duration !== null && duration > 0 && isClient()) {
      removeTimer(id)
      const timer = setTimeout(() => {
        dismissToast(id)
      }, duration)
      timers.set(id, timer)
    }

    return id
  }

  return {
    toasts: computed(() => toastsState.value),
    showToast,
    dismissToast,
    clearToasts,
  }
}
