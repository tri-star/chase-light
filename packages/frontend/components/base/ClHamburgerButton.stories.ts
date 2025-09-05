import type { StoryObj, Meta } from '@nuxtjs/storybook'
import ClHamburgerButton from './ClHamburgerButton.vue'

const meta: Meta<typeof ClHamburgerButton> = {
  title: 'Components/Base/ClHamburgerButton',
  component: ClHamburgerButton,
  parameters: {
    docs: {
      description: {
        component:
          'ハンバーガーメニューの開閉を制御するボタンコンポーネントです。開いた状態ではXアイコン、閉じた状態ではハンバーガーアイコンを表示します。',
      },
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'メニューが開いているかどうか',
      defaultValue: false,
    },
    ariaLabel: {
      control: 'text',
      description: 'スクリーンリーダー用のラベル',
      defaultValue: 'メニューを開閉',
    },
    onClick: {
      action: 'clicked',
      description: 'ボタンがクリックされた時に発火するイベント',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isOpen: false,
    ariaLabel: 'メニューを開閉',
  },
}

export const Opened: Story = {
  args: {
    isOpen: true,
    ariaLabel: 'メニューを閉じる',
  },
}

export const CustomAriaLabel: Story = {
  args: {
    isOpen: false,
    ariaLabel: 'サイドメニューを開く',
  },
}

export const Interactive: Story = {
  render: (args) => ({
    components: { ClHamburgerButton },
    setup() {
      const isOpen = ref(args.isOpen || false)

      const handleClick = () => {
        isOpen.value = !isOpen.value
      }

      return {
        isOpen,
        handleClick,
        args,
      }
    },
    template: `
      <div class="space-y-4">
        <div class="p-4 border rounded-lg">
          <p class="mb-4 text-sm text-content-default">
            ボタンをクリックしてハンバーガー/×アイコンの切り替えを確認できます
          </p>
          <ClHamburgerButton
            :is-open="isOpen"
            :aria-label="isOpen ? 'メニューを閉じる' : 'メニューを開く'"
            @click="handleClick"
          />
          <p class="mt-4 text-sm text-gray-600">
            状態: {{ isOpen ? '開いている' : '閉じている' }}
          </p>
        </div>
      </div>
    `,
  }),
  args: {
    isOpen: false,
  },
}
