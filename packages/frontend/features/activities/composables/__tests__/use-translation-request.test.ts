import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTranslationRequest } from '../use-translation-request'
import { ActivityTranslationRepository } from '../../repositories/activity-translation-repository'
import type { TranslationState } from '../../domain/translation'

// ActivityTranslationRepository をモック
vi.mock('../../repositories/activity-translation-repository')

describe('use-translation-request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('翻訳リクエスト送信', () => {
    test.each([
      {
        translationStatus: 'completed',
        expectedStatus: 'completed',
        description: '翻訳が既に完了している場合、completedステータスになる',
      },
      {
        translationStatus: 'failed',
        expectedStatus: 'failed',
        description: '翻訳が失敗している場合、failedステータスになる',
      },
    ] as const)(
      '$description',
      async ({ translationStatus, expectedStatus }) => {
        const mockRequest = vi.fn().mockResolvedValue({
          translationStatus,
          statusDetail: null,
        } as TranslationState)

        vi.mocked(ActivityTranslationRepository).mockImplementation(() => ({
          request: mockRequest,
          getStatus: vi.fn(),
        }))

        const { status, requestTranslation } = useTranslationRequest('test-id')

        await requestTranslation()

        expect(status.value).toBe(expectedStatus)
      }
    )

    test('翻訳がqueuedの場合、ポーリングを開始する', async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        translationStatus: 'queued',
        statusDetail: null,
      } as TranslationState)

      const mockGetStatus = vi.fn()

      vi.mocked(ActivityTranslationRepository).mockImplementation(() => ({
        request: mockRequest,
        getStatus: mockGetStatus,
      }))

      const { status, isPolling, requestTranslation } =
        useTranslationRequest('test-id')

      await requestTranslation()

      expect(status.value).toBe('polling')
      expect(isPolling.value).toBe(true)
    })

    test('翻訳リクエスト送信に失敗した場合、failedステータスになる', async () => {
      const mockRequest = vi.fn().mockRejectedValue(new Error('Network error'))

      vi.mocked(ActivityTranslationRepository).mockImplementation(() => ({
        request: mockRequest,
        getStatus: vi.fn(),
      }))

      const { status, errorMessage, requestTranslation } =
        useTranslationRequest('test-id')

      await requestTranslation()

      expect(status.value).toBe('failed')
      expect(errorMessage.value).toBe('翻訳リクエストの送信に失敗しました')
    })
  })

  describe('ポーリング', () => {
    test('ポーリング中にcompletedステータスになった場合、ポーリングを停止する', async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        translationStatus: 'processing',
        statusDetail: null,
      } as TranslationState)

      const mockGetStatus = vi
        .fn()
        .mockResolvedValueOnce({
          translationStatus: 'processing',
          statusDetail: null,
        } as TranslationState)
        .mockResolvedValueOnce({
          translationStatus: 'completed',
          statusDetail: null,
        } as TranslationState)

      vi.mocked(ActivityTranslationRepository).mockImplementation(() => ({
        request: mockRequest,
        getStatus: mockGetStatus,
      }))

      const { status, isPolling, requestTranslation, onTranslationComplete } =
        useTranslationRequest('test-id')

      const completeMock = vi.fn()
      onTranslationComplete.value = completeMock

      await requestTranslation()

      // 1回目のポーリング
      await vi.advanceTimersByTimeAsync(3000)

      expect(status.value).toBe('polling')

      // 2回目のポーリング
      await vi.advanceTimersByTimeAsync(3000)

      expect(status.value).toBe('completed')
      expect(isPolling.value).toBe(false)
      expect(completeMock).toHaveBeenCalledOnce()
    })

    test('ポーリング中にfailedステータスになった場合、ポーリングを停止する', async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        translationStatus: 'processing',
        statusDetail: null,
      } as TranslationState)

      const mockGetStatus = vi.fn().mockResolvedValueOnce({
        translationStatus: 'failed',
        statusDetail: '翻訳処理エラー',
      } as TranslationState)

      vi.mocked(ActivityTranslationRepository).mockImplementation(() => ({
        request: mockRequest,
        getStatus: mockGetStatus,
      }))

      const { status, isPolling, errorMessage, requestTranslation } =
        useTranslationRequest('test-id')

      await requestTranslation()

      // 1回目のポーリング
      await vi.advanceTimersByTimeAsync(3000)

      expect(status.value).toBe('failed')
      expect(isPolling.value).toBe(false)
      expect(errorMessage.value).toBe('翻訳処理エラー')
    })

    test('ポーリング中にエラーが発生した場合、ポーリングを停止する', async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        translationStatus: 'processing',
        statusDetail: null,
      } as TranslationState)

      const mockGetStatus = vi
        .fn()
        .mockRejectedValue(new Error('Network error'))

      vi.mocked(ActivityTranslationRepository).mockImplementation(() => ({
        request: mockRequest,
        getStatus: mockGetStatus,
      }))

      const { status, isPolling, errorMessage, requestTranslation } =
        useTranslationRequest('test-id')

      await requestTranslation()

      // 1回目のポーリング
      await vi.advanceTimersByTimeAsync(3000)

      expect(status.value).toBe('failed')
      expect(isPolling.value).toBe(false)
      expect(errorMessage.value).toBe('ステータスの取得に失敗しました')
    })
  })

  describe('ポーリング停止', () => {
    test('stopPolling を呼び出すとポーリングが停止する', async () => {
      const mockRequest = vi.fn().mockResolvedValue({
        translationStatus: 'processing',
        statusDetail: null,
      } as TranslationState)

      const mockGetStatus = vi.fn().mockResolvedValue({
        translationStatus: 'processing',
        statusDetail: null,
      } as TranslationState)

      vi.mocked(ActivityTranslationRepository).mockImplementation(() => ({
        request: mockRequest,
        getStatus: mockGetStatus,
      }))

      const { isPolling, requestTranslation, stopPolling } =
        useTranslationRequest('test-id')

      await requestTranslation()

      expect(isPolling.value).toBe(true)

      stopPolling()

      expect(isPolling.value).toBe(false)
    })
  })
})
