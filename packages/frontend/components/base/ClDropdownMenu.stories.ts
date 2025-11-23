/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StoryObj, Meta } from '@nuxtjs/storybook'
import ClDropdownMenu from './ClDropdownMenu.vue'
import ClMenuItem from './ClMenuItem.vue'

const meta: Meta<typeof ClDropdownMenu> = {
  title: 'Components/Base/ClDropdownMenu',
  component: ClDropdownMenu,
  parameters: {
    docs: {
      description: {
        component:
          '汎用的なドロップダウンメニューコンポーネントです。キーボードナビゲーション、ARIA属性、フォーカストラップをサポートしています。',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const BasicMenu: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu>
          <template #trigger="{ isOpen }">
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              {{ isOpen ? 'メニューを閉じる' : 'メニューを開く' }}
            </button>
          </template>
          <ClMenuItem>メニューアイテム 1</ClMenuItem>
          <ClMenuItem>メニューアイテム 2</ClMenuItem>
          <ClMenuItem>メニューアイテム 3</ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const WithIcons: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-8 flex justify-center">
        <ClDropdownMenu aria-label="アクションメニュー">
          <template #trigger>
            <button
              type="button"
              class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                hover:bg-interactive-hovered focus:outline-none focus:ring-2
                focus:ring-status-focus-default transition-colors"
            >
              アクション
            </button>
          </template>
          <ClMenuItem>
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </template>
            表示
          </ClMenuItem>
          <ClMenuItem>
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </template>
            編集
          </ClMenuItem>
          <ClMenuItem>
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </template>
            削除
          </ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const WithDisabledItems: Story = {
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
              オプション
            </button>
          </template>
          <ClMenuItem>有効なアイテム 1</ClMenuItem>
          <ClMenuItem :disabled="true">無効なアイテム</ClMenuItem>
          <ClMenuItem>有効なアイテム 2</ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const WithSelectedItem: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      setup() {
        const selected = ref('option2')
        return { selected }
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
              {{ selected === 'option1' ? 'オプション 1' : selected === 'option2' ? 'オプション 2' : 'オプション 3' }}
            </button>
          </template>
          <ClMenuItem
            :selected="selected === 'option1'"
            @click="selected = 'option1'"
          >
            オプション 1
          </ClMenuItem>
          <ClMenuItem
            :selected="selected === 'option2'"
            @click="selected = 'option2'"
          >
            オプション 2
          </ClMenuItem>
          <ClMenuItem
            :selected="selected === 'option3'"
            @click="selected = 'option3'"
          >
            オプション 3
          </ClMenuItem>
        </ClDropdownMenu>
      </div>
    `,
    }) as any,
}

export const Placements: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="p-16 space-y-12">
        <div class="flex items-center gap-8">
          <div class="w-32 text-sm text-content-default">Bottom Right:</div>
          <ClDropdownMenu placement="bottom-right">
            <template #trigger>
              <button
                type="button"
                class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                  hover:bg-interactive-hovered focus:outline-none focus:ring-2
                  focus:ring-status-focus-default transition-colors"
              >
                メニュー
              </button>
            </template>
            <ClMenuItem>アイテム 1</ClMenuItem>
            <ClMenuItem>アイテム 2</ClMenuItem>
            <ClMenuItem>アイテム 3</ClMenuItem>
          </ClDropdownMenu>
        </div>

        <div class="flex items-center gap-8">
          <div class="w-32 text-sm text-content-default">Bottom Left:</div>
          <ClDropdownMenu placement="bottom-left">
            <template #trigger>
              <button
                type="button"
                class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                  hover:bg-interactive-hovered focus:outline-none focus:ring-2
                  focus:ring-status-focus-default transition-colors"
              >
                メニュー
              </button>
            </template>
            <ClMenuItem>アイテム 1</ClMenuItem>
            <ClMenuItem>アイテム 2</ClMenuItem>
            <ClMenuItem>アイテム 3</ClMenuItem>
          </ClDropdownMenu>
        </div>
      </div>
    `,
    }) as any,
}

export const KeyboardInteractionDemo: Story = {
  render: () =>
    ({
      components: { ClDropdownMenu, ClMenuItem },
      template: `
      <div class="space-y-6">
        <div class="p-4 border rounded-lg">
          <h3 class="mb-4 text-lg font-medium text-content-default">キーボード操作方法</h3>
          <ul class="text-sm text-content-default space-y-2">
            <li>• <kbd class="px-2 py-1 bg-surface-secondary-default rounded">Enter</kbd> / <kbd class="px-2 py-1 bg-surface-secondary-default rounded">Space</kbd>: トリガーでメニューを開く</li>
            <li>• <kbd class="px-2 py-1 bg-surface-secondary-default rounded">↓</kbd>: 次のアイテムへ移動（メニュー内）</li>
            <li>• <kbd class="px-2 py-1 bg-surface-secondary-default rounded">↑</kbd>: 前のアイテムへ移動（メニュー内）</li>
            <li>• <kbd class="px-2 py-1 bg-surface-secondary-default rounded">Enter</kbd> / <kbd class="px-2 py-1 bg-surface-secondary-default rounded">Space</kbd>: アイテムを選択</li>
            <li>• <kbd class="px-2 py-1 bg-surface-secondary-default rounded">Esc</kbd>: メニューを閉じる</li>
            <li>• <kbd class="px-2 py-1 bg-surface-secondary-default rounded">Tab</kbd>: メニューを閉じてフォーカスを次の要素へ</li>
          </ul>
        </div>
        <div class="p-8 flex justify-center border rounded-lg">
          <ClDropdownMenu>
            <template #trigger>
              <button
                type="button"
                class="px-4 py-2 rounded-md bg-interactive-default text-interactive-default
                  hover:bg-interactive-hovered focus:outline-none focus:ring-2
                  focus:ring-status-focus-default transition-colors"
              >
                キーボードで操作してみてください
              </button>
            </template>
            <ClMenuItem>アイテム 1</ClMenuItem>
            <ClMenuItem>アイテム 2</ClMenuItem>
            <ClMenuItem :disabled="true">無効なアイテム（スキップされる）</ClMenuItem>
            <ClMenuItem>アイテム 3</ClMenuItem>
            <ClMenuItem>アイテム 4</ClMenuItem>
          </ClDropdownMenu>
        </div>
      </div>
    `,
    }) as any,
}
