import type { Meta, StoryObj } from '@nuxtjs/storybook'
import { ref } from 'vue'
import ClModalDialog from './ClModalDialog.vue'

const meta: Meta<typeof ClModalDialog> = {
  title: 'Components/Base/ClModalDialog',
  component: ClModalDialog,
  argTypes: {
    dismissible: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof ClModalDialog>

export const Playground: Story = {
  render: () => ({
    components: { ClModalDialog },
    setup() {
      const isOpen = ref(false)
      const open = () => {
        isOpen.value = true
      }
      const close = () => {
        isOpen.value = false
      }
      return { isOpen, open, close }
    },
    template: `
      <div class="min-h-[320px] bg-surface-secondary-default px-6 py-10">
        <button
          type="button"
          class="rounded-md bg-interactive-default px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-interactive-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
          @click="open"
        >
          モーダルを開く
        </button>

        <ClModalDialog
          v-model:open="isOpen"
          labelledby="sample-modal-title"
          describedby="sample-modal-description"
        >
          <template #header>
            <h2 id="sample-modal-title" class="text-lg font-semibold text-content-default">
              データソースを追加
            </h2>
          </template>

          <div id="sample-modal-description" class="space-y-4">
            <p>
              GitHub リポジトリの URL を入力して、監視対象に追加します。
            </p>
            <label class="flex flex-col gap-2 text-sm">
              <span>リポジトリ URL</span>
              <input
                class="rounded-md border border-content-default/30 bg-surface-primary-default px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
                placeholder="https://github.com/owner/repo"
              />
            </label>
          </div>

          <template #footer>
            <button
              type="button"
              class="rounded-md border border-content-default/30 px-4 py-2 text-sm font-medium text-content-default transition hover:bg-surface-secondary-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
              @click="close"
            >
              キャンセル
            </button>
            <button
              type="button"
              class="rounded-md bg-interactive-default px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-interactive-hovered focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-focus-default"
            >
              登録する
            </button>
          </template>
        </ClModalDialog>
      </div>
    `,
  }),
}
