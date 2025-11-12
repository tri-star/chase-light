import type { Meta, StoryObj } from '@nuxtjs/storybook'
import ToastContainer from './ToastContainer.vue'
import { useToast } from '~/composables/use-toast'

const meta: Meta<typeof ToastContainer> = {
  title: 'Components/Common/ToastContainer',
  component: ToastContainer,
}

export default meta

type Story = StoryObj<typeof ToastContainer>

export const Playground: Story = {
  render: () => ({
    components: { ToastContainer },
    setup() {
      const { showToast, clearToasts } = useToast()

      const triggerSuccess = () => {
        showToast({
          intent: 'success',
          title: '完了しました',
          message: 'ダッシュボードを更新しました。',
        })
      }

      const triggerError = () => {
        showToast({
          intent: 'alert',
          title: 'エラー',
          message: '通信に失敗しました。',
          duration: null,
        })
      }

      return { triggerSuccess, triggerError, clearToasts }
    },
    template: `
      <div class="min-h-[320px] bg-surface-secondary-default px-6 py-10">
        <div class="flex gap-4">
          <button
            type="button"
            class="rounded-md bg-interactive-default px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-interactive-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
            @click="triggerSuccess"
          >
            成功トーストを表示
          </button>
          <button
            type="button"
            class="rounded-md bg-status-alert-default px-4 py-2 text-sm font-medium text-white shadow transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
            @click="triggerError"
          >
            エラートーストを固定表示
          </button>
          <button
            type="button"
            class="rounded-md border border-content-default/30 px-4 py-2 text-sm font-medium text-content-default transition hover:bg-surface-secondary-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
            @click="clearToasts"
          >
            すべて閉じる
          </button>
        </div>
        <ToastContainer />
      </div>
    `,
  }),
}
