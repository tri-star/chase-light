/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StoryObj, Meta } from '@nuxtjs/storybook'
import ClMenuItem from './ClMenuItem.vue'
import ClDropdownMenu from './ClDropdownMenu.vue'

const meta: Meta<typeof ClMenuItem> = {
  title: 'Components/Base/ClMenuItem',
  component: ClMenuItem,
  parameters: {
    docs: {
      description: {
        component:
          'ドロップダウンメニュー内で使用するメニューアイテムコンポーネントです。ボタンとリンクの両方の形式をサポートしています。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const BasicButton: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu>
          <template #trigger>
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              メニューを開く
            </button>
          </template>
          <ClMenuItem>基本的なボタンアイテム</ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const AllStates: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu>
          <template #trigger>
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              すべての状態を表示
            </button>
          </template>
          <ClMenuItem>デフォルト状態</ClMenuItem>
          <ClMenuItem :selected="true">選択済み状態</ClMenuItem>
          <ClMenuItem :disabled="true">無効化状態</ClMenuItem>
          <ClMenuItem>ホバーしてください</ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const WithIcon: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu>
          <template #trigger>
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              アイコン付きメニュー
            </button>
          </template>
          <ClMenuItem>
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </template>
            ホーム
          </ClMenuItem>
          <ClMenuItem>
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </template>
            プロフィール
          </ClMenuItem>
          <ClMenuItem>
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </template>
            設定
          </ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const WithSuffix: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu>
          <template #trigger>
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              サフィックス付きメニュー
            </button>
          </template>
          <ClMenuItem>
            コピー
            <template #suffix>
              <kbd class="px-1.5 py-0.5 text-xs bg-surface-secondary-default rounded">⌘C</kbd>
            </template>
          </ClMenuItem>
          <ClMenuItem>
            貼り付け
            <template #suffix>
              <kbd class="px-1.5 py-0.5 text-xs bg-surface-secondary-default rounded">⌘V</kbd>
            </template>
          </ClMenuItem>
          <ClMenuItem>
            切り取り
            <template #suffix>
              <kbd class="px-1.5 py-0.5 text-xs bg-surface-secondary-default rounded">⌘X</kbd>
            </template>
          </ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const AsLink: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu>
          <template #trigger>
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              リンクメニュー
            </button>
          </template>
          <ClMenuItem type="link" to="/">ホーム</ClMenuItem>
          <ClMenuItem type="link" to="/profile">プロフィール</ClMenuItem>
          <ClMenuItem type="link" href="https://example.com">
            外部リンク
            <template #suffix>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </template>
          </ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const DisabledStates: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu>
          <template #trigger>
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              無効化状態のデモ
            </button>
          </template>
          <ClMenuItem>有効なアイテム</ClMenuItem>
          <ClMenuItem :disabled="true">無効なボタンアイテム</ClMenuItem>
          <ClMenuItem type="link" to="/profile" :disabled="true">無効なリンクアイテム</ClMenuItem>
          <ClMenuItem>有効なアイテム</ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const SelectedStates: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      setup() {
        const selectedLanguage = ref('ja')
        return { selectedLanguage }
      },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu>
          <template #trigger>
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              言語: {{ selectedLanguage === 'ja' ? '日本語' : selectedLanguage === 'en' ? 'English' : '中文' }}
            </button>
          </template>
          <ClMenuItem
            :selected="selectedLanguage === 'ja'"
            @click="selectedLanguage = 'ja'"
          >
            <template #suffix>
              <svg v-if="selectedLanguage === 'ja'" class="w-5 h-5 text-status-success-default" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </template>
            日本語
          </ClMenuItem>
          <ClMenuItem
            :selected="selectedLanguage === 'en'"
            @click="selectedLanguage = 'en'"
          >
            <template #suffix>
              <svg v-if="selectedLanguage === 'en'" class="w-5 h-5 text-status-success-default" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </template>
            English
          </ClMenuItem>
          <ClMenuItem
            :selected="selectedLanguage === 'zh'"
            @click="selectedLanguage = 'zh'"
          >
            <template #suffix>
              <svg v-if="selectedLanguage === 'zh'" class="w-5 h-5 text-status-success-default" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </template>
            中文
          </ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}
