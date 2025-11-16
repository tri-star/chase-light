import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AddDataSourceModal from '../AddDataSourceModal.vue'

// toast ストアをモック
const createToastMock = vi.fn()
vi.mock('~/composables/use-toast', () => ({
  useToastStore: () => ({
    createToast: createToastMock,
  }),
}))

const factory = (props?: Partial<{ open: boolean; initialValues: object }>) =>
  mount(AddDataSourceModal, {
    props: {
      open: true,
      ...(props ?? {}),
    },
    // 子コンポーネントはスタブで十分
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        ClCheckbox: true,
      },
    },
  })

const flush = async () => {
  // 非同期のsubmitやwatchの反映待ち
  await Promise.resolve()
  await Promise.resolve()
}

describe('AddDataSourceModal', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    createToastMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('初期状態で既定値がセットされる', async () => {
    const wrapper = factory()
    await flush()

    const input = wrapper.find('#repository-url')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('')

    // リリース / Issue / PR の3つのチェックボックス領域が表示される
    const checkboxes = wrapper.findAll('cl-checkbox-stub')
    expect(checkboxes.length).toBe(3)
  })

  it('無効なURLの場合、バリデーションエラーを表示しAPIを呼び出さない', async () => {
    const wrapper = factory()

    const input = wrapper.find('#repository-url')
    await input.setValue('https://example.com/not-github')
    // onChange バリデーションを走らせる
    await input.trigger('blur')

    // エラーメッセージが表示される
    const error = wrapper.find('.text-status-alert-default')
    expect(error.exists()).toBe(true)
    expect(error.text()).toBe(
      'https://github.com/{owner}/{repo} の形式で入力してください。'
    )

    // 送信を試みてもAPIは呼ばれない
    await wrapper.find('form').trigger('submit.prevent')
    await flush()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('成功時にAPIを呼び出しトーストとイベントを発火する', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true })
    const wrapper = factory()

    const input = wrapper.find('#repository-url')
    await input.setValue(' https://github.com/owner/repo ')

    // 送信（ハンドラを直接呼び出し）
    await (
      wrapper.vm as unknown as { handleSubmit: () => Promise<void> }
    ).handleSubmit()
    await flush()

    // API 呼び出し
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/data-sources')
    expect(options.method).toBe('POST')
    expect(options.body).toMatchObject({
      repositoryUrl: 'https://github.com/owner/repo',
      notificationEnabled: true,
      watchReleases: true,
      watchIssues: true,
      watchPullRequests: true,
    })

    // トースト
    expect(createToastMock).toHaveBeenCalledWith({
      type: 'success',
      message: expect.stringContaining('https://github.com/owner/repo'),
    })

    // イベント
    const emitted = wrapper.emitted()
    expect(emitted.success?.length).toBe(1)
    expect(emitted['update:open']?.[0]).toEqual([false])
  })

  it('失敗時にエラートーストを表示する', async () => {
    const error = { data: { validationError: 'すでに登録済みです。' } }
    fetchMock.mockRejectedValueOnce(error)

    const wrapper = factory()

    const input = wrapper.find('#repository-url')
    await input.setValue('https://github.com/owner/repo')

    // console.error ノイズ抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await (
      wrapper.vm as unknown as { handleSubmit: () => Promise<void> }
    ).handleSubmit()
    await flush()

    // エラートースト
    expect(createToastMock).toHaveBeenCalledWith({
      type: 'alert',
      message: 'すでに登録済みです。',
    })

    // 画面にもエラーメッセージ表示
    const errorEl = wrapper.find('.text-status-alert-default')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.text()).toBe('すでに登録済みです。')

    // error イベント発火
    expect(wrapper.emitted().error?.[0]).toEqual(['すでに登録済みです。'])

    consoleSpy.mockRestore()
  })
})
